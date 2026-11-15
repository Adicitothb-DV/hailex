from fastapi import APIRouter

from app.api.routes.climate import router as climate_router
from app.api.routes.health import router as health_router

router = APIRouter(prefix="/api/v1")
router.include_router(health_router)
router.include_router(climate_router)
