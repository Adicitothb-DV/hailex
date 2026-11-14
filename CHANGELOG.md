# CHANGELOG.md

## INT-01 - 2026-11-14 15:28 (America/Mexico_City)
- **Cambio:** contrato canónico V1 completo en `docs/API_CONTRACT.md`; archivo raíz `API_CONTRACT.md` únicamente de referencia; actualización mínima de `PROJECT_STATUS.md` y de las dos rutas anteriores en `PROJECT_CONTEXT.md` para evitar instrucciones contradictorias.
- **Decisiones:** rutas canónicas, sobres, procedencia por variable, ausencia→null, catálogo con evidencia, eligibility separado de assessment_status, comparabilidad/empates, snapshots 30 minutos dependientes del proceso y único worker.
- **Pendientes:** verificación de unidades/productos NASA, reglas/umbrales agronómicos, agregados de dashboard y capacidad/TTL de caché de respuestas. Ninguna regla científica se declara validada.
- **Validación:** JSON estricto y consistencia documental; sin ejecutar/crear endpoints, modelos o pruebas de negocio. Solo archivos Markdown; no dependencias ni frontend.
- **Git:** inicio limpio en `feature/backend-core`, base `dad906e`; main remoto consultado coincide. Cambios quedan sin commit/push para revisión.

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
