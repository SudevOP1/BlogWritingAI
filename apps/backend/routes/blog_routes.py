from fastapi import (
    APIRouter,
    Depends,
    Query,
    BackgroundTasks,
    WebSocket,
    WebSocketDisconnect,
    Request,
)
from bson import ObjectId
from datetime import datetime
import asyncio
import traceback
from typing import Optional

from utils.auth import get_current_user, verify_token
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


async def get_feed_user_optional(request: Request) -> Optional[dict]:
    auth_header = request.headers.get("authorization")
    if not auth_header:
        return None
    try:
        if not auth_header.startswith("Bearer "):
            return None
        token = auth_header.split(" ")[1]
        if token == "null" or token == "undefined" or not token:
            return None
        payload_ok, payload = verify_token(token)
        if not payload_ok:
            return None
        username = payload.get("username")
        if not username:
            return None
        user = await db.users.find_one({"username": username})
        if not user:
            return None
        return {"username": username, "id": user.get("_id")}
    except Exception:
        return None


@blog_router.get("/feed")
async def get_blog_feed(
    sort: str = "hot",
    topic: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
    current_user: Optional[dict] = Depends(get_feed_user_optional),
):
    try:
        pipeline = []

        # 1. Match completed/published blogs (completed = finished generation, published = explicitly shared)
        match_stage = {"status": {"$in": ["completed", "published"]}}
        if topic and topic.lower() != "all" and topic.strip() != "":
            match_stage["topic"] = {"$regex": f"^{topic.strip()}$", "$options": "i"}

        if sort == "following":
            if not current_user:
                return {"success": True, "blogs": []}
            # Find users followed by current user
            following_docs = await db.follows.find(
                {"follower_id": ObjectId(current_user["id"])}
            ).to_list(length=1000)
            following_ids = [doc["following_id"] for doc in following_docs]
            match_stage["author_id"] = {"$in": following_ids}

        pipeline.append({"$match": match_stage})

        # 2. Lookups for joins
        pipeline.extend(
            [
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "author_id",
                        "foreignField": "_id",
                        "as": "author_info",
                    }
                },
                {
                    "$lookup": {
                        "from": "blog_likes",
                        "localField": "_id",
                        "foreignField": "blog_id",
                        "as": "likes_info",
                    }
                },
                {
                    "$lookup": {
                        "from": "comments",
                        "localField": "_id",
                        "foreignField": "blog_id",
                        "as": "comments_info",
                    }
                },
            ]
        )

        # 3. Projection
        pipeline.append(
            {
                "$project": {
                    "_id": 1,
                    "title": 1,
                    "topic": 1,
                    "content": 1,
                    "created_at": 1,
                    "status": 1,
                    "author_id": 1,
                    "author_username": {"$arrayElemAt": ["$author_info.username", 0]},
                    "num_likes": {"$size": "$likes_info"},
                    "num_comments": {"$size": "$comments_info"},
                    "liked_by_users": "$likes_info.user_id",
                }
            }
        )

        cursor = db.blogs.aggregate(pipeline)
        blogs = await cursor.to_list(length=1000)

        # Get bookmarks of current user if logged in
        user_bookmarks = []
        if current_user:
            user_doc = await db.users.find_one(
                {"_id": ObjectId(current_user["id"])}, {"bookmarks": 1}
            )
            if user_doc:
                user_bookmarks = [str(bid) for bid in user_doc.get("bookmarks", [])]

        processed_blogs = []
        current_user_obj_id = ObjectId(current_user["id"]) if current_user else None

        for b in blogs:
            blog_id_str = str(b["_id"])
            created_at_dt = b.get("created_at")

            # Extract a teaser/excerpt of content
            content = b.get("content", "")
            # Remove Markdown headers, links, styling for excerpt
            import re

            clean_content = re.sub(r"[#*`_\-]", "", content)  # basic markdown cleanup
            clean_content = re.sub(
                r"\[([^\]]+)\]\([^)]+\)", r"\1", clean_content
            )  # remove links
            clean_content = re.sub(
                r"\s+", " ", clean_content
            ).strip()  # normalize whitespace
            excerpt = (
                clean_content[:240] + "..."
                if len(clean_content) > 240
                else clean_content
            )

            processed = {
                "id": blog_id_str,
                "title": b.get("title", "") or "Untitled",
                "topic": b.get("topic", "") or "General",
                "excerpt": excerpt,
                "created_at": created_at_dt.isoformat() if created_at_dt else None,
                "status": b.get("status", ""),
                "author_id": str(b.get("author_id", "")),
                "author_username": b.get("author_username", "anonymous"),
                "num_likes": b.get("num_likes", 0),
                "num_comments": b.get("num_comments", 0),
                "is_liked": current_user_obj_id in b.get("liked_by_users", [])
                if current_user_obj_id
                else False,
                "is_bookmarked": blog_id_str in user_bookmarks,
            }
            processed_blogs.append(processed)

        # Sort blogs
        if sort == "top":
            processed_blogs.sort(key=lambda x: x["num_likes"], reverse=True)
        else:  # "new" or "following"
            processed_blogs.sort(key=lambda x: x["created_at"] or "", reverse=True)

        paginated_blogs = processed_blogs[skip : skip + limit]

        return {
            "success": True,
            "blogs": paginated_blogs,
            "total": len(processed_blogs),
        }

    except Exception as e:
        debug.error(
            f"500 GET /blogs/feed",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@blog_router.get("/topics")
async def get_blog_topics():
    try:
        # Get distinct topics from completed/published blogs
        topics = await db.blogs.distinct("topic", {"status": {"$in": ["completed"]}})
        topics = [t.strip() for t in topics if t and t.strip()]
        # Unique and sorted list of topics
        unique_topics = sorted(list(set(topics)))
        return {"success": True, "topics": unique_topics}
    except Exception as e:
        debug.error(
            f"500 GET /blogs/topics",
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
