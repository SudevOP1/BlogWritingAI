from fastapi import APIRouter, Depends
from bson import ObjectId
from datetime import datetime

from utils.auth import get_current_user
from utils.db import db
from utils.models import CommentRequest

community_router = APIRouter()


@community_router.post("/blogs/{blog_id}/comments")
async def add_comment(
    blog_id: str, body: CommentRequest, current_user: dict = Depends(get_current_user)
):
    try:
        blog = await db.blogs.find_one({"_id": ObjectId(blog_id)})
        if not blog or blog.get("status") != "published":
            return {
                "success": False,
                "error": f"blog not found: {blog_id}",
                "status_code": 404,
            }

        comment_doc = {
            "blog_id": ObjectId(blog_id),
            "user_id": ObjectId(current_user["id"]),
            "parent_id": ObjectId(body.parent_id) if body.parent_id else None,
            "content": body.content,
            "created_at": datetime.utcnow(),
        }

        result = await db.comments.insert_one(comment_doc)
        return {"success": True, "comment_id": str(result.inserted_id)}

    except Exception as e:
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@community_router.get("/blogs/{blog_id}/comments")
async def get_comments(blog_id: str):
    try:
        cursor = db.comments.find({"blog_id": ObjectId(blog_id)}).sort("created_at", 1)
        comments = await cursor.to_list(length=100)

        for c in comments:
            c["id"] = str(c["_id"])
            del c["_id"]
            c["blog_id"] = str(c["blog_id"])
            c["user_id"] = str(c["user_id"])
            c["parent_id"] = str(c["parent_id"]) if c.get("parent_id") else None
            c["created_at"] = (
                c.get("created_at").isoformat() if c.get("created_at") else None
            )

        return {"success": True, "comments": comments}

    except Exception as e:
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@community_router.post("/blogs/{blog_id}/like")
async def toggle_blog_like(
    blog_id: str, current_user: dict = Depends(get_current_user)
):
    try:
        existing_like = await db.blog_likes.find_one(
            {"blog_id": ObjectId(blog_id), "user_id": ObjectId(current_user["id"])}
        )

        if existing_like:
            await db.blog_likes.delete_one({"_id": existing_like["_id"]})
            return {"success": True, "liked": False}
        else:
            await db.blog_likes.insert_one(
                {
                    "blog_id": ObjectId(blog_id),
                    "user_id": ObjectId(current_user["id"]),
                    "created_at": datetime.utcnow(),
                }
            )
            return {"success": True, "liked": True}

    except Exception as e:
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@community_router.post("/comments/{comment_id}/like")
async def toggle_comment_like(
    comment_id: str, current_user: dict = Depends(get_current_user)
):
    try:
        existing_like = await db.comment_likes.find_one(
            {
                "comment_id": ObjectId(comment_id),
                "user_id": ObjectId(current_user["id"]),
            }
        )

        if existing_like:
            await db.comment_likes.delete_one({"_id": existing_like["_id"]})
            return {"success": True, "liked": False}
        else:
            await db.comment_likes.insert_one(
                {
                    "comment_id": ObjectId(comment_id),
                    "user_id": ObjectId(current_user["id"]),
                    "created_at": datetime.utcnow(),
                }
            )
            return {"success": True, "liked": True}

    except Exception as e:
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }
