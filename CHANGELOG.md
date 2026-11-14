# CHANGELOG.md

## BE-02 - 2026-11-14 13:52 (America/Mexico_City)
- **Cambio:** entorno backend creado con CPython 3.13.17 x64; dependencias directas fijadas en grupos de `pyproject.toml`, snapshot transitivo `requirements.lock`, configuración de Ruff/Pytest e instrucciones PowerShell.
- **Motivo:** preparar una base reproducible con venv/pip, sin regenerar estructura ni implementar endpoints o motor.
- **Archivos afectados:** `backend/pyproject.toml`, `backend/requirements.lock`, `backend/README.md` y `PROJECT_STATUS.md`; `.venv` solo local, ignorado por Git.
- **Validación:** importaciones/ubicación de nueve dependencias correctas; pip check sin conflictos; Uvicorn/Pytest/Ruff disponibles; Ruff check/format correctos; Pytest sin pruebas (código 5). Smoke en memoria correcto; TestClient advierte deprecación de HTTPX en Starlette. Lock comprobado por dry-run en entorno actual, no en segunda instalación limpia.
- **Commit:** pendiente; base `79403f6`. Selección de intérprete en interfaz VS Code no comprobable desde las herramientas usadas.

## [0.1.0] - 2026-11-14 (America/Mexico_City)
### Inicializado
- Creación de la estructura oficial del repositorio `hailex` conforme al Documento Maestro del Hackatón.
- Añadidos `.clinerules`, `AGENTS.md`, `README.md`, `PROJECT_CONTEXT.md`, `PROJECT_STATUS.md`, `.gitignore`, `.editorconfig` y plantillas en `docs/`.
- **Archivos afectados:** Estructura raíz, `docs/`, `backend/`, `frontend/`.
