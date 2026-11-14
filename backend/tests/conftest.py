import asyncio
from collections.abc import Callable
from typing import Any

import httpx
import pytest
from fastapi import FastAPI

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def app() -> FastAPI:
    return create_app(
        Settings(
            _env_file=None,
            app_env="test",
            cors_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        )
    )


@pytest.fixture
def api_request(app: FastAPI) -> Callable[..., httpx.Response]:
    def send(method: str, path: str, **kwargs: Any) -> httpx.Response:
        async def run() -> httpx.Response:
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                return await client.request(method, path, **kwargs)

        return asyncio.run(run())

    return send
