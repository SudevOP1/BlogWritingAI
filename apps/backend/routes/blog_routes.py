import json
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from bson import ObjectId
from datetime import datetime

from utils.auth import get_current_user
from utils.db import db
from blog_generator.graph.blog_graph import build_app
from utils.models import BlogStatusUpdate

blog_router = APIRouter()

# Instantiate the langgraph app
graph_app = build_app()


@blog_router.get("/generate")
async def generate_blog(
    request: Request,
    topic: str = Query(...),
    current_user: dict = Depends(get_current_user),
):

    # Create draft blog
    blog_doc = {
        "author_id": ObjectId(current_user["id"]),
        "topic": topic,
        "title": "",
        "content": "",
        "status": "draft",
        "created_at": datetime.utcnow(),
    }
    result = await db.blogs.insert_one(blog_doc)
    blog_id = str(result.inserted_id)

    async def event_generator():
        yield f"data: {json.dumps({'type': 'init', 'blog_id': blog_id})}\n\n"

        initial_state = {"topic": topic}

        try:
            async for event in graph_app.astream(initial_state):
                # Request disconnected
                if await request.is_disconnected():
                    break

                node_name = list(event.keys())[0]
                node_data = event[node_name]

                # Yield progress
                yield f"data: {json.dumps({'type': 'progress', 'node': node_name})}\n\n"

                # If plan is generated, update the title
                if node_name == "orchestrator" and "plan" in node_data:
                    plan = node_data["plan"]
                    title = getattr(plan, "blog_title", "")
                    if title:
                        await db.blogs.update_one(
                            {"_id": ObjectId(blog_id)}, {"$set": {"title": title}}
                        )

                # If finished, update the DB
                if node_name == "reducer" and "final" in node_data:
                    final_content = node_data["final"]
                    await db.blogs.update_one(
                        {"_id": ObjectId(blog_id)}, {"$set": {"content": final_content}}
                    )

                    yield f"data: {json.dumps({'type': 'complete', 'content': final_content})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@blog_router.put("/{blog_id}")
async def update_blog_status(
    blog_id: str, body: BlogStatusUpdate, current_user: dict = Depends(get_current_user)
):
    blog = await db.blogs.find_one({"_id": ObjectId(blog_id)})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    if str(blog.get("author_id")) != str(current_user["id"]):
        raise HTTPException(
            status_code=403, detail="Not authorized to update this blog"
        )

    if body.status not in ["draft", "published"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    await db.blogs.update_one(
        {"_id": ObjectId(blog_id)}, {"$set": {"status": body.status}}
    )

    return {"success": True, "message": f"Blog status updated to {body.status}"}


@blog_router.get("")
async def get_public_blogs(skip: int = 0, limit: int = 10):
    cursor = (
        db.blogs.find({"status": "published"})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    blogs = await cursor.to_list(length=limit)

    for b in blogs:
        b["id"] = str(b["_id"])
        b["_id"] = str(b["_id"])
        b["author_id"] = str(b["author_id"]) if b.get("author_id") else None
        b["created_at"] = (
            b.get("created_at").isoformat() if b.get("created_at") else None
        )

    return {"success": True, "blogs": blogs}


@blog_router.get("/{blog_id}")
async def get_blog(blog_id: str):
    blog = await db.blogs.find_one({"_id": ObjectId(blog_id)})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    if blog.get("status") != "published":
        raise HTTPException(status_code=403, detail="Blog is not published")

    blog["id"] = str(blog["_id"])
    blog["_id"] = str(blog["_id"])
    blog["author_id"] = str(blog["author_id"]) if blog.get("author_id") else None
    blog["created_at"] = (
        blog.get("created_at").isoformat() if blog.get("created_at") else None
    )

    return {"success": True, "blog": blog}
