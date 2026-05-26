from typing import Optional
from fastapi import APIRouter, Depends
from bson import ObjectId
from datetime import datetime
import traceback

from utils.auth import get_current_user, get_current_user_optional
from utils.db import db
from utils.models import CommentRequest
from utils import debug

community_router = APIRouter()


@community_router.get("/blogs/{blog_id}/likes")
async def get_blog_likes(
    blog_id: str, current_user: Optional[dict] = Depends(get_current_user_optional)
):
    try:
        blog = await db.blogs.find_one({"_id": ObjectId(blog_id)})
        if not blog or not blog.get("status", "") in ["completed", "failed"]:
            return {
                "success": False,
                "error": f"blog not found: {blog_id}",
                "status_code": 404,
            }
        num_likes = await db.blog_likes.count_documents({"blog_id": ObjectId(blog_id)})
        if current_user:
            liked = await db.blog_likes.find_one(
                {"blog_id": ObjectId(blog_id), "user_id": ObjectId(current_user["id"])}
            )
            return {
                "success": True,
                "num_likes": int(num_likes),
                "liked": bool(liked),
            }
        return {
            "success": True,
            "num_likes": int(num_likes),
        }
    except Exception as e:
        debug.error(
            f"500 GET /community/blogs/{blog_id}/likes",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@community_router.post("/blogs/{blog_id}/like")
async def toggle_blog_like(
    blog_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        blog = await db.blogs.find_one({"_id": ObjectId(blog_id)})
        if not blog or not blog.get("status", "") in ["completed", "failed"]:
            return {
                "success": False,
                "error": f"blog not found: {blog_id}",
                "status_code": 404,
            }

        num_likes = blog.get("num_likes", 0)
        if isinstance(num_likes, str):
            try:
                num_likes = int(num_likes)
            except ValueError:
                num_likes = 0
            await db.blogs.update_one(
                {"_id": ObjectId(blog_id)}, {"$set": {"num_likes": num_likes}}
            )

        existing_like = await db.blog_likes.find_one(
            {"blog_id": ObjectId(blog_id), "user_id": ObjectId(current_user["id"])}
        )

        if existing_like:
            await db.blog_likes.delete_one({"_id": existing_like["_id"]})
            await db.blogs.update_one(
                {"_id": ObjectId(blog_id)}, {"$inc": {"num_likes": -1}}
            )
            return {"success": True, "liked": False}
        else:
            await db.blog_likes.insert_one(
                {
                    "blog_id": ObjectId(blog_id),
                    "user_id": ObjectId(current_user["id"]),
                }
            )
            await db.blogs.update_one(
                {"_id": ObjectId(blog_id)}, {"$inc": {"num_likes": 1}}
            )
            return {"success": True, "liked": True}

    except Exception as e:
        debug.error(
            f"500 POST /community/blogs/{blog_id}/like",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@community_router.get("/blogs/{blog_id}/comments")
async def get_comments(blog_id: str):
    try:
        cursor = db.comments.find(
            {
                "blog_id": ObjectId(blog_id),
                "parent_id": None,
            }
        ).sort("created_at", 1)
        comments = await cursor.to_list(length=100)

        for c in comments:

            username = await db.users.find_one({"_id": c["user_id"]}, {"username": 1})
            username = username.get("username") if username else None

            c["id"] = str(c["_id"])
            del c["_id"]

            c["blog_id"] = str(c["blog_id"])
            c["user_id"] = str(c["user_id"])
            c["username"] = username
            c["parent_id"] = str(c.get("parent_id", None))
            c["created_at"] = c.get("created_at", None)
            c["content"] = c.get("content", "")
            c["num_likes"] = c.get("num_likes", 0)
            c["num_replies"] = c.get("num_replies", 0)

        return {"success": True, "comments": comments}

    except Exception as e:
        debug.error(
            f"500 GET /community/blogs/{blog_id}/comments",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@community_router.get("/comments/{comment_id}/replies")
async def get_replies(comment_id: str):
    try:
        cursor = db.comments.find({"parent_id": ObjectId(comment_id)}).sort(
            "created_at", 1
        )
        comments = await cursor.to_list(length=100)

        for c in comments:
            c["id"] = str(c["_id"])
            del c["_id"]
            c["blog_id"] = str(c["blog_id"])
            c["user_id"] = str(c["user_id"])
            c["parent_id"] = str(c.get("parent_id", None))
            c["created_at"] = c.get("created_at", None)

        return {"success": True, "comments": comments}

    except Exception as e:
        debug.error(
            f"500 GET /community/comments/{comment_id}/replies",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@community_router.post("/blogs/{blog_id}/comment")
async def add_comment(
    blog_id: str,
    body: CommentRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        blog = await db.blogs.find_one({"_id": ObjectId(blog_id)})
        if not blog or not blog.get("status", "") in ["completed", "failed"]:
            return {
                "success": False,
                "error": f"blog not found: {blog_id}",
                "status_code": 404,
            }

        parent_id_obj = ObjectId(body.parent_id) if body.parent_id is not None else None

        comment_doc = {
            "blog_id": ObjectId(blog_id),
            "user_id": ObjectId(current_user["id"]),
            "parent_id": parent_id_obj,
            "content": body.content,
            "created_at": datetime.utcnow(),
            "num_likes": 0,
            "num_replies": 0,
        }
        result = await db.comments.insert_one(comment_doc)

        await db.blogs.update_one(
            {"_id": ObjectId(blog_id)}, {"$inc": {"num_comments": 1}}
        )

        if parent_id_obj is not None:
            await db.comments.update_one(
                {"_id": parent_id_obj}, {"$inc": {"num_replies": 1}}
            )

        return {
            "success": True,
            "comment": {
                "id": str(result.inserted_id),
                "blog_id": blog_id,
                "user_id": str(current_user["id"]),
                "username": current_user.get("username"),
                "parent_id": str(parent_id_obj) if parent_id_obj else None,
                "content": body.content,
                "created_at": comment_doc["created_at"],
                "num_likes": 0,
                "num_replies": 0,
            },
        }

    except Exception as e:
        debug.error(
            f"500 POST /community/blogs/{blog_id}/comment",
            traceback.format_exc(),
            api_route=True,
        )
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
                }
            )
            return {"success": True, "liked": True}

    except Exception as e:
        debug.error(
            f"500 POST /community/comments/{comment_id}/like",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }
