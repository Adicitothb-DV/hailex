"""Pure ASGI middleware keeps request identity across errors and CORS."""

from time import perf_counter
from uuid import uuid4

from starlette.datastructures import Headers, MutableHeaders
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import Response
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.errors import error_response, internal_error_response
from app.core.logging import logger, request_id_context


class RequestContextMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        request_id = str(uuid4())  # Never trust a caller-supplied identity.
        token = request_id_context.set(request_id)
        scope.setdefault("state", {})["request_id"] = request_id
        started = perf_counter()
        status = 500

        async def send_with_id(message: Message) -> None:
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
                MutableHeaders(scope=message)["X-Request-ID"] = request_id
            await send(message)

        try:
            await self.app(scope, receive, send_with_id)
        finally:
            route = scope.get("route")
            logger.info(
                "method=%s route=%s status=%s elapsed_ms=%.2f",
                scope["method"],
                getattr(route, "path", "<unmatched>"),
                status,
                (perf_counter() - started) * 1000,
            )
            request_id_context.reset(token)


class ContractCORSMiddleware(CORSMiddleware):
    def preflight_response(self, request_headers: Headers) -> Response:
        response = super().preflight_response(request_headers)
        if response.status_code == 400:
            headers = dict(response.headers)
            headers.pop("content-length", None)
            headers.pop("content-type", None)
            return error_response(
                400, "INVALID_REQUEST", "Preflight CORS no permitido.", headers=headers
            )
        return response


class ErrorBoundaryMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        response_started = False

        async def track_start(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, receive, track_start)
        except Exception as exc:
            if response_started:
                # A streamed response cannot safely be replaced with a second response.
                raise
            await internal_error_response(exc)(scope, receive, send)
