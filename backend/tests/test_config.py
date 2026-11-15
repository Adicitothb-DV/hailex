import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.main import create_app


def test_environment_csv(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:4173, http://127.0.0.1:4173")
    settings = Settings(_env_file=None)
    assert settings.cors_origins == ["http://localhost:4173", "http://127.0.0.1:4173"]
    assert create_app(settings).state.settings is settings


@pytest.mark.parametrize(
    "value", ["*", "http://localhost:5173/route", "null", "", "http://user:pass@host"]
)
def test_invalid_cors_rejected(value):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, cors_origins=value)


def test_invalid_port_rejected():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, app_port=0)


def test_dotenv_loading(tmp_path, monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    env_file = tmp_path / ".env"
    env_file.write_text("CORS_ORIGINS=http://localhost:4173\n", encoding="utf-8")
    assert Settings(_env_file=env_file).cors_origins == ["http://localhost:4173"]
