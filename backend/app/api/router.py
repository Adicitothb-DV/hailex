from fastapi import APIRouter

from app.api.routes.agriculture import router as agriculture_router
from app.api.routes.agroalert import router as agroalert_router
from app.api.routes.climate import router as climate_router
from app.api.routes.crops import router as crops_router
from app.api.routes.fields import router as fields_router
from app.api.routes.health import router as health_router

router = APIRouter(prefix="/api/v1")
router.include_router(health_router)
router.include_router(climate_router)
router.include_router(crops_router)
router.include_router(agriculture_router)
router.include_router(fields_router)
router.include_router(agroalert_router)
