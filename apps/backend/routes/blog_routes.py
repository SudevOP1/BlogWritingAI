from fastapi import (
    APIRouter,
    Depends,
    Query,
    BackgroundTasks,
    WebSocket,
    WebSocketDisconnect,
)
from bson import ObjectId
from datetime import datetime
import asyncio
import traceback

from utils.auth import get_current_user
from utils.db import db
from blog_generator.graph.blog_graph import build_app
from utils.models import BlogStatusUpdate
from utils import debug

blog_router = APIRouter()

# instantiate the langgraph app
graph_app = build_app()


async def run_generation(blog_id: str, topic: str):
    initial_state = {"topic": topic}
    try:
        async for event in graph_app.astream(initial_state):
            node_name = list(event.keys())[0]
            node_data = event[node_name]

            # update status to show current progress
            await db.blogs.update_one(
                {"_id": ObjectId(blog_id)},
                {"$set": {"status": f"processing: {node_name}"}},
            )

            # if plan is generated, update the title and save preview for real-time UI updates
            if node_name == "orchestrator" and "plan" in node_data:
                plan = node_data["plan"]
                title = getattr(plan, "blog_title", "")

                # make a preview using section headers
                tasks = getattr(plan, "tasks", []) or []
                preview = (
                    f"# {title}\n\n"
                    + "\n\n".join([f"## {getattr(t, 'title', str(t))}" for t in tasks])
                    if title
                    else ""
                )

                update_fields = {}
                if title:
                    update_fields["title"] = title
                if preview:
                    update_fields["content"] = preview

                if update_fields:
                    await db.blogs.update_one(
                        {"_id": ObjectId(blog_id)}, {"$set": update_fields}
                    )

            # if finished, update the DB
            if node_name == "reducer" and "final" in node_data:
                final_content = node_data["final"]
                await db.blogs.update_one(
                    {"_id": ObjectId(blog_id)},
                    {
                        "$set": {
                            "content": final_content,
                            "status": "completed",
                        }
                    },
                )

    except ValueError as e:
        error_str = str(e)

        # invalid topic error
        if "INVALID_TOPIC" in error_str:
            await db.blogs.update_one(
                {"_id": ObjectId(blog_id)},
                {
                    "$set": {
                        "status": "failed",
                        "error_message": "Invalid topic",
                    }
                },
            )

        # generation errors
        else:
            debug.error(
                f"Blog generation error for blog_id={blog_id}",
                traceback.format_exc(),
                api_route=True,
            )
            await db.blogs.update_one(
                {"_id": ObjectId(blog_id)},
                {
                    "$set": {
                        "status": "failed",
                        "error_message": error_str,
                    }
                },
            )

    # unexpected errors
    except Exception as e:
        debug.error(
            f"500 error during generation for blog_id={blog_id}",
            traceback.format_exc(),
            api_route=True,
        )
        await db.blogs.update_one(
            {"_id": ObjectId(blog_id)},
            {
                "$set": {
                    "status": "failed",
                    "error_message": str(e),
                }
            },
        )


@blog_router.post("/generate")
async def generate_blog(
    background_tasks: BackgroundTasks,
    topic: str = Query(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        # create blog
        blog_doc = {
            "author_id": ObjectId(current_user["id"]),
            "topic": topic,
            "title": "",
            "content": "",
            "status": "draft",
            "num_likes": 0,
            "num_comments": 0,
            "created_at": datetime.utcnow(),
        }
        result = await db.blogs.insert_one(blog_doc)
        blog_id = str(result.inserted_id)

        # start generation in background
        background_tasks.add_task(run_generation, blog_id, topic)

        return {"success": True, "blog_id": blog_id}

    except Exception as e:
        debug.error(
            f"500 POST /blogs/generate",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@blog_router.put("/{blog_id}")
async def update_blog_status(
    blog_id: str, body: BlogStatusUpdate, current_user: dict = Depends(get_current_user)
):
    try:
        blog = await db.blogs.find_one({"_id": ObjectId(blog_id)})
        if not blog or str(blog.get("author_id")) != str(current_user["id"]):
            return {
                "success": False,
                "error": f"blog not found: {blog_id}",
                "status_code": 404,
            }

        if body.status not in ["draft", "published"]:
            return {"success": False, "error": "invalid status", "status_code": 400}

        await db.blogs.update_one(
            {"_id": ObjectId(blog_id)}, {"$set": {"status": body.status}}
        )

        return {"success": True, "message": f"Blog status updated to {body.status}"}

    except Exception as e:
        debug.error(
            f"500 PUT /blogs/{blog_id}",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@blog_router.get("")
async def get_public_blogs(skip: int = 0, limit: int = 10):
    try:
        cursor = (
            db.blogs.find({"status": "published"})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        blogs = await cursor.to_list(length=limit)

        for b in blogs:
            b["id"] = str(b["_id"])
            del b["_id"]
            b["author_id"] = str(b["author_id"]) if b.get("author_id") else None
            b["created_at"] = (
                b.get("created_at").isoformat() if b.get("created_at") else None
            )

        return {"success": True, "blogs": blogs}

    except Exception as e:
        debug.error(
            f"500 GET /blogs",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@blog_router.websocket("/{blog_id}")
async def blog_websocket(websocket: WebSocket, blog_id: str):
    await websocket.accept()
    try:
        if not ObjectId.is_valid(blog_id):
            await websocket.send_json({"type": "error", "error": "Blog not found"})
            await websocket.close()
            return

        while True:
            blog = await db.blogs.find_one({"_id": ObjectId(blog_id)})
            if not blog:
                await websocket.send_json({"type": "error", "error": "Blog not found"})
                break

            blog["id"] = str(blog.pop("_id"))
            blog["author_id"] = (
                str(blog["author_id"]) if blog.get("author_id") else None
            )
            blog["created_at"] = (
                blog.get("created_at").isoformat() if blog.get("created_at") else None
            )
            blog["num_likes"] = await db.blog_likes.count_documents(
                {"blog_id": ObjectId(blog_id)}
            )
            blog["num_comments"] = await db.comments.count_documents(
                {"blog_id": ObjectId(blog_id)}
            )

            await websocket.send_json({"type": "blog", "blog": blog})

            if blog.get("status", "") in ["completed", "failed"]:
                break

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        pass  # already disconnected
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "error": str(e)})
        except Exception:
            debug.error(
                f"500 WS /blogs/{blog_id}",
                traceback.format_exc(),
                api_route=True,
            )
            pass  # cannot send error
    finally:
        try:
            await websocket.close()
        except RuntimeError:
            pass  # already disconnected
