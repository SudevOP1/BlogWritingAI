import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

# get the path to the .env file
BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)
ENV_FILEPATH = os.path.join(BASE_DIR, ".env")


class Settings(BaseSettings):
    MODEL: str
    TAVILY_API_KEY: str
    MONGO_DB_URI: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    model_config = SettingsConfigDict(env_file=ENV_FILEPATH, env_file_encoding="utf-8")


@lru_cache()
def get_settings():
    return Settings()
