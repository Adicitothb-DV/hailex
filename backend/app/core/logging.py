"""Application-only logging; never serialize bodies, headers or query values."""

import logging
from contextvars import ContextVar

request_id_context: ContextVar[str] = ContextVar("request_id", default="-")
logger = logging.getLogger("hailex")


class RequestIDFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_context.get()
        return True


class AccessLogFilter(logging.Filter):
    """Uvicorn's default access log otherwise includes raw query strings."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.args, tuple) and len(record.args) == 5:
            client, method, _target, protocol, status = record.args
            record.args = (client, method, "<redacted>", protocol, status)
        return True


def configure_logging() -> None:
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.addFilter(RequestIDFilter())
        handler.setFormatter(
            logging.Formatter("%(levelname)s hailex request_id=%(request_id)s %(message)s")
        )
        logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    access_logger = logging.getLogger("uvicorn.access")
    if not any(isinstance(item, AccessLogFilter) for item in access_logger.filters):
        access_logger.addFilter(AccessLogFilter())
