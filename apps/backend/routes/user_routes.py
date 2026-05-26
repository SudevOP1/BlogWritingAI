from fastapi import APIRouter, Depends
from bson import ObjectId
import traceback

from utils.auth import get_current_user
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
        user = await db.users.find_one(
            {"_id": ObjectId(user_id)}, {"username": 1, "_id": 1}
        )
        if not user:
            return {
                "success": False,
                "error": "user not found",
                "status_code": 404,
            }

        return {
            "success": True,
            "user": {"id": str(user["_id"]), "username": user["username"]},
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
