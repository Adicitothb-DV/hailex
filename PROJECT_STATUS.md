# PROJECT_STATUS.md — Estado Actual del Proyecto

- **Última actualización:** 2026-11-14 13:52 (America/Mexico_City)
- **Fase actual:** BE-02 — Entorno y dependencias backend configurados; sin lógica de negocio.
- **Commit base verificado:** `79403f6`; cambios BE-02 pendientes de revisión/commit.
- **Estado por módulo:**
  - Documentación y contratos base: `initialized`
  - Backend FastAPI: `partial` — CPython 3.13.17 x64, `.venv`, dependencias y herramientas listas; aplicación/endpoints pendientes (Fase 5).
  - Cliente NASA POWER: `planned` (Fase 6)
  - Catálogo agrícola y reglas: `planned` (Fase 4 / Fase 7)
  - Motor de comparación: `planned` (Fase 8)
  - Frontend React + 5 módulos: `planned` (Fases 9–13)
- **Verificaciones BE-02:** importaciones y ubicaciones de las nueve dependencias directas correctas dentro de `.venv`; `pip check` sin conflictos; Uvicorn/Pytest/Ruff ejecutables; Ruff check/format correctos; Pytest recolecta 0 pruebas (código 5, no suite aprobada). Smoke en memoria de FastAPI/OpenAPI, Pydantic Settings, HTTPX, Pandas y NumPy correcto; sin endpoints del proyecto.
- **Reproducibilidad:** grupos `runtime`/`dev` en `backend/pyproject.toml`; snapshot de 30 paquetes en `backend/requirements.lock`, sin hashes, validado con instalación dry-run sobre el entorno actual (no segunda instalación limpia).
- **Limitaciones BE-02:** terminal conserva PATH anterior; se usa ejecutable absoluto de `.venv`. Selección visual del intérprete en VS Code pendiente de confirmar por el desarrollador. Starlette TestClient emite deprecación al usar HTTPX; no se añadió otro cliente.
- **Git BE-02:** `.venv` ignorado y sin archivos rastreados; no se modificó frontend, contratos ni `.env.example`.
- **Próxima tarea exacta:** revisar BE-02, seleccionar `.venv` en VS Code y coordinar contrato antes de implementar la base FastAPI con health y pruebas. No hay servidor implementado todavía.
