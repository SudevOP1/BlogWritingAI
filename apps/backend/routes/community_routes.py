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

        blog_like_doc = {
            "blog_id": ObjectId(blog_id),
            "user_id": ObjectId(current_user["id"]),
        }

        existing_blog_like = await db.blog_likes.find_one(blog_like_doc)

        if existing_blog_like:
            await db.blog_likes.delete_one({"_id": existing_blog_like["_id"]})
            await db.blogs.update_one(
                {"_id": ObjectId(blog_id)}, {"$inc": {"num_likes": -1}}
            )
            return {"success": True, "liked": False}
        else:
            await db.blog_likes.insert_one(blog_like_doc)
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


@community_router.get("/blogs/{blog_id}/is_liked")
async def check_blog_liked(
    blog_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        existing_blog_like = await db.blog_likes.find_one(
            {"blog_id": ObjectId(blog_id), "user_id": ObjectId(current_user["id"])}
        )
        return {"success": True, "liked": existing_blog_like is not None}

    except Exception as e:
        debug.error(
            f"500 GET /community/blogs/{blog_id}/is_liked",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@community_router.get("/blogs/{blog_id}/comments")
async def get_comments(
    blog_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    try:
        comment_docs_format = {
            "blog_id": ObjectId(blog_id),
            "parent_id": None,
        }
        cursor = db.comments.find(comment_docs_format).sort("created_at", 1)
        comments = await cursor.to_list(length=100)

        for c in comments:
            username = await db.users.find_one({"_id": c["user_id"]}, {"username": 1})
            username = username.get("username") if username else None

            num_likes = await db.comment_likes.count_documents({"comment_id": c["_id"]})
            num_replies = await db.comments.count_documents({"parent_id": c["_id"]})

            liked = False
            if current_user:
                existing_like = await db.comment_likes.find_one(
                    {"comment_id": c["_id"], "user_id": ObjectId(current_user["id"])}
                )
                liked = existing_like is not None

            c["id"] = str(c["_id"])
            del c["_id"]

            c["blog_id"] = str(c["blog_id"])
            c["user_id"] = str(c["user_id"])
            c["username"] = username
            c["parent_id"] = str(c.get("parent_id", None))
            c["created_at"] = c.get("created_at", None)
            c["content"] = c.get("content", "")
            c["num_likes"] = num_likes
            c["num_replies"] = num_replies
            c["liked"] = liked

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
async def get_replies(
    comment_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    try:
        reply_docs_format = {"parent_id": ObjectId(comment_id)}
        cursor = db.comments.find(reply_docs_format).sort("created_at", 1)
        comments = await cursor.to_list(length=100)

        for c in comments:
            username = await db.users.find_one({"_id": c["user_id"]}, {"username": 1})
            username = username.get("username") if username else None

            num_likes = await db.comment_likes.count_documents({"comment_id": c["_id"]})
            num_replies = await db.comments.count_documents({"parent_id": c["_id"]})

            liked = False
            if current_user:
                existing_like = await db.comment_likes.find_one(
                    {"comment_id": c["_id"], "user_id": ObjectId(current_user["id"])}
                )
                liked = existing_like is not None

            c["id"] = str(c["_id"])
            del c["_id"]

            c["blog_id"] = str(c["blog_id"])
            c["user_id"] = str(c["user_id"])
            c["username"] = username
            c["parent_id"] = str(c.get("parent_id", None))
            c["created_at"] = c.get("created_at", None)
            c["content"] = c.get("content", "")
            c["num_likes"] = num_likes
            c["num_replies"] = num_replies
            c["liked"] = liked

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

        parent_id = ObjectId(body.parent_id) if body.parent_id is not None else None

        comment_doc = {
            "blog_id": ObjectId(blog_id),
            "user_id": ObjectId(current_user["id"]),
            "parent_id": parent_id,
            "content": body.content,
            "created_at": datetime.utcnow(),
        }
        result = await db.comments.insert_one(comment_doc)
        await db.blogs.update_one(
            {"_id": ObjectId(blog_id)}, {"$inc": {"num_comments": 1}}
        )

        return {
            "success": True,
            "comment": {
                "id": str(result.inserted_id),
                "blog_id": blog_id,
                "user_id": str(current_user["id"]),
                "username": current_user.get("username"),
                "parent_id": str(parent_id) if parent_id else None,
                "content": body.content,
                "created_at": comment_doc["created_at"],
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
    comment_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        comment_like_docs_format = {
            "comment_id": ObjectId(comment_id),
            "user_id": ObjectId(current_user["id"]),
        }

        existing_like = await db.comment_likes.find_one(comment_like_docs_format)

        if existing_like:
            await db.comment_likes.delete_one({"_id": existing_like["_id"]})
            return {"success": True, "liked": False}
        else:
            await db.comment_likes.insert_one(comment_like_docs_format)
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


@community_router.post("/{user_id}/follow")
async def toggle_follow(user_id: str, current_user: dict = Depends(get_current_user)):
    try:
        target_user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not target_user:
            return {
                "success": False,
                "error": f"user not found: {user_id}",
                "status_code": 404,
            }

        follow_doc = {
            "follower_id": ObjectId(current_user["id"]),
            "following_id": ObjectId(user_id),
        }

        existing_follow = await db.follows.find_one(follow_doc)

        if existing_follow:
            await db.follows.delete_one({"_id": existing_follow["_id"]})
            return {"success": True, "user_id": user_id, "following": False}
        else:
            await db.follows.insert_one(follow_doc)
            return {"success": True, "user_id": user_id, "following": True}

    except Exception as e:
        debug.error(
            f"500 POST /community/{user_id}/follow",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@community_router.get("/{user_id}/following")
async def check_following(user_id: str, limit: int = 10, offset: int = 0):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {
                "success": False,
                "error": f"user not found: {user_id}",
                "status_code": 404,
            }

        pipeline = [
            {"$match": {"follower_id": ObjectId(user_id)}},
            {"$skip": offset},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "following_id",
                    "foreignField": "_id",
                    "as": "user_info",
                }
            },
            {"$unwind": "$user_info"},
            {
                "$project": {
                    "_id": {"$toString": "$_id"},
                    "follower_id": {"$toString": "$follower_id"},
                    "following_id": {"$toString": "$following_id"},
                    "username": "$user_info.username",
                    "display_name": "$user_info.display_name",
                }
            },
        ]
        following_list = await db.follows.aggregate(pipeline).to_list(length=limit)

        return {"success": True, "following": following_list}

    except Exception as e:
        debug.error(
            f"500 GET /community/{user_id}/following",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@community_router.get("/{user_id}/followers")
async def check_followers(user_id: str, limit: int = 10, offset: int = 0):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {
                "success": False,
                "error": f"user not found: {user_id}",
                "status_code": 404,
            }

        pipeline = [
            {"$match": {"following_id": ObjectId(user_id)}},
            {"$skip": offset},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "follower_id",
                    "foreignField": "_id",
                    "as": "user_info",
                }
            },
            {"$unwind": "$user_info"},
            {
                "$project": {
                    "_id": {"$toString": "$_id"},
                    "follower_id": {"$toString": "$follower_id"},
                    "following_id": {"$toString": "$following_id"},
                    "username": "$user_info.username",
                    "display_name": "$user_info.display_name",
                }
            },
        ]
        followers_list = await db.follows.aggregate(pipeline).to_list(length=limit)

        return {"success": True, "followers": followers_list}

    except Exception as e:
        debug.error(
            f"500 GET /community/{user_id}/followers",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }
