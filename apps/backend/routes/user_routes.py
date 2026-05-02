from fastapi import APIRouter, Depends
from bson import ObjectId

from utils.auth import get_current_user
from utils.db import db

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
            b["_id"] = str(b["_id"])
            b["author_id"] = str(b["author_id"]) if b.get("author_id") else None
            b["created_at"] = (
                b.get("created_at").isoformat() if b.get("created_at") else None
            )

        return {"success": True, "blogs": blogs}

    except Exception as e:
        return {
            "success": False,
            "error": f"something went wrong: {str(e)}",
            "status_code": 500,
        }
