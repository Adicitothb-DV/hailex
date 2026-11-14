"""Process liveness only; no providers or agricultural data are checked."""

from fastapi import APIRouter, Request

from app.core.config import CONTRACT_VERSION
from app.schemas.common import HealthData, SuccessResponse

router = APIRouter()


@router.get("/health", response_model=SuccessResponse[HealthData], tags=["health"])
async def health(request: Request) -> SuccessResponse[HealthData]:
    return SuccessResponse(
        data=HealthData(version=request.app.version, contract_version=CONTRACT_VERSION)
    )
