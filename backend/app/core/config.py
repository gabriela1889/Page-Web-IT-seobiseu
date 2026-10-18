from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    development_jwt_secret: str = "development-only-change-this-secret-key"
    app_name: str = "IT seobiseu API"
    app_env: str = "development"
    api_prefix: str = "/api/v1"
    frontend_origins: str = "http://localhost:5500,http://127.0.0.1:5500"
    supabase_url: str = "https://shtpanowiryhadccuhty.supabase.co"
    supabase_key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodHBhbm93aXJ5aGFkY2N1aHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMTU1MzcsImV4cCI6MjEwNzc5MTUzN30.fvfUNYbRWllRymledB6PCySncBjFfnxXprlvdjp4ww4"
    supabase_db_url: str = "postgresql+pg8000://postgres.shtpanowiryhadccuhty:ItSeobiseu2026!Db@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    database_mode: str = "supabase"
    jwt_secret_key: str = Field(default=development_jwt_secret, min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.app_env.lower() != "production":
            return self
        if not self.supabase_db_url and not (self.supabase_url and self.supabase_key):
            raise ValueError("SUPABASE_DB_URL o SUPABASE_URL/SUPABASE_KEY son obligatorios en producción.")
        if self.jwt_secret_key == self.development_jwt_secret:
            raise ValueError("JWT_SECRET_KEY debe cambiarse en producción.")
        if not self.origins or any(origin.startswith("http://") for origin in self.origins):
            raise ValueError("FRONTEND_ORIGINS debe usar HTTPS en producción.")
        return self

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]

    @property
    def use_supabase(self) -> bool:
        return True


@lru_cache
def get_settings() -> Settings:
    return Settings()
