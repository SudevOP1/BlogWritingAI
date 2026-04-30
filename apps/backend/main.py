from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from utils import debug
from utils.db import create_collections_if_not_exists
from utils.settings import get_settings
from routes.auth_routes import auth_router
from routes.blog_routes import blog_router
from routes.community_routes import community_router
from routes.user_routes import user_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):

    # startup

    await create_collections_if_not_exists()
    debug.create_log_file_if_not_exists()

    yield

    # shutdown


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origins=[
        "http://localhost:5173",
    ],
)


app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(blog_router, prefix="/api/blogs", tags=["Blog"])
app.include_router(community_router, prefix="/api", tags=["Community"])
app.include_router(user_router, prefix="/api/users", tags=["User"])

@app.get("/status")
async def status() -> JSONResponse:
    return JSONResponse(status_code=200, content={"success": True})
