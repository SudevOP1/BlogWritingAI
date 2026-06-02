from fastapi import APIRouter, Depends
from bson import ObjectId
import traceback

from utils.auth import get_current_user, get_current_user_optional
from utils.db import db
from utils import debug

user_router = APIRouter()


@user_router.get("/me/blogs")
async def get_my_blogs(current_user: dict = Depends(get_current_user)):
    try:
        cursor = db.blogs.find({"author_id": ObjectId(current_user["id"])}).sort(
            "created_at", -1
        )
        blogs = await cursor.to_list(length=100)

        for b in blogs:
            b["id"] = str(b["_id"])
            b["author_id"] = str(b.get("author_id", None))
            b["created_at"] = b.get("created_at", None).isoformat()

            del b["_id"]

        return {"success": True, "blogs": blogs}

    except Exception as e:
        debug.error(
            f"500 GET /users/me/blogs",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@user_router.post("/bookmarks/{blog_id}")
async def add_bookmark(blog_id: str, current_user: dict = Depends(get_current_user)):
    try:
        user_id = ObjectId(current_user["id"])
        blog_obj_id = ObjectId(blog_id)

        blog = await db.blogs.find_one({"_id": blog_obj_id})
        if not blog:
            return {
                "success": False,
                "error": f"blog not found: {blog_id}",
                "status_code": 404,
            }

        await db.users.update_one(
            {"_id": user_id}, {"$addToSet": {"bookmarks": blog_obj_id}}
        )
        return {"success": True, "message": "Bookmark added"}

    except Exception as e:
        debug.error(
            f"500 POST /users/bookmarks/{blog_id}",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@user_router.delete("/bookmarks/{blog_id}")
async def remove_bookmark(blog_id: str, current_user: dict = Depends(get_current_user)):
    try:
        user_id = ObjectId(current_user["id"])
        blog_obj_id = ObjectId(blog_id)

        await db.users.update_one(
            {"_id": user_id}, {"$pull": {"bookmarks": blog_obj_id}}
        )
        return {"success": True, "message": "Bookmark removed"}

    except Exception as e:
        debug.error(
            f"500 DELETE /users/bookmarks/{blog_id}",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@user_router.get("/bookmarks")
async def get_bookmarks(current_user: dict = Depends(get_current_user)):
    try:
        user_id = ObjectId(current_user["id"])
        user = await db.users.find_one({"_id": user_id})

        bookmark_ids = user.get("bookmarks", [])
        if not bookmark_ids:
            return {"success": True, "blogs": []}

        cursor = db.blogs.find({"_id": {"$in": bookmark_ids}})
        blogs = await cursor.to_list(length=100)

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
            f"500 GET /users/bookmarks",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@user_router.get("/search")
async def search_users(q: str = ""):
    try:
        if not q:
            return {"success": True, "users": []}

        cursor = db.users.find(
            {"username": {"$regex": q, "$options": "i"}}, {"username": 1, "_id": 1}
        ).limit(20)

        users = []
        async for user in cursor:
            users.append({"id": str(user["_id"]), "username": user["username"]})

        return {"success": True, "users": users}
    except Exception as e:
        debug.error(
            f"500 GET /users/search",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@user_router.get("/{user_id}")
async def get_user_details(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {
                "success": False,
                "error": "user not found",
                "status_code": 404,
            }

        num_followers = await db.follows.count_documents(
            {"following_id": ObjectId(user_id)}
        )
        num_following = await db.follows.count_documents(
            {"follower_id": ObjectId(user_id)}
        )
        num_blogs = await db.blogs.count_documents(
            {"author_id": ObjectId(user_id), "status": "completed"}
        )

        return {
            "success": True,
            "user": {
                "id": str(user_id),
                "username": user["username"],
                "display_name": user["display_name"],
                "num_followers": num_followers,
                "num_following": num_following,
                "num_blogs": num_blogs,
            },
        }
    except Exception as e:
        debug.error(
            f"500 GET /users/{user_id}",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }


@user_router.get("/{user_id}/blogs")
async def get_user_blogs(
    user_id: str,
    limit: int = 10,
    skip=0,
    current_user: dict = Depends(get_current_user_optional),
):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {
                "success": False,
                "error": "user not found",
                "status_code": 404,
            }

        blogs_list = (
            db.blogs.find({"author_id": ObjectId(user_id), "status": "completed"})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )

        blogs_list = await blogs_list.to_list(length=limit)

        blogs = []

        for blog in blogs_list:

            is_liked = (
                await db.blog_likes.find_one(
                    {
                        "user_id": (
                            ObjectId(current_user["id"]) if current_user else None
                        ),
                        "blog_id": blog["_id"],
                    }
                )
                is not None
            )
            is_bookmarked = False

            new_blog = {
                "id": str(blog["_id"]),
                "author_id": str(blog.get("author_id", None)),
                "created_at": blog.get("created_at", None).isoformat(),
                "status": blog.get("status"),
                "title": blog.get("title"),
                "topic": blog.get("topic"),
                "num_comments": blog.get("num_comments"),
                "num_likes": blog.get("num_likes"),
                "is_liked": is_liked,
                "is_bookmarked": is_bookmarked,
            }

            blogs.append(new_blog)

        return {"success": True, "blogs": blogs}

    except Exception as e:
        debug.error(
            f"500 GET /users/{user_id}/blogs",
            traceback.format_exc(),
            api_route=True,
        )
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }
