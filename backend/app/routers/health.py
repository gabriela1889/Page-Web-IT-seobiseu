from fastapi import APIRouter

from app.core.config import get_settings
from app.database.connection import pool
from app.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    settings = get_settings()
    if settings.use_supabase:
        db_status = "supabase"
    elif settings.use_sqlite:
        db_status = "sqlite"
    elif pool is not None:
        db_status = "configured"
    else:
        db_status = "not_configured"

    return HealthResponse(
        status="ok",
        database=db_status,
    )

