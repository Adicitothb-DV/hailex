# PROJECT_STATUS.md — Estado Actual del Proyecto

- **Última actualización:** 2026-11-14 15:28 (America/Mexico_City)
- **Fase actual:** INT-01 — Contrato API V1 documentado para revisión final; sin implementación.
- **Commit base verificado:** `dad906e` en `feature/backend-core`; contiene `origin/main` y coincide con main remoto consultado antes de editar. Cambios INT-01 sin commit/push.
- **Estado por módulo:**
  - Contrato canónico V1: `docs/API_CONTRACT.md`, redactado; raíz `API_CONTRACT.md` solo referencia. Revisión final humana pendiente.
  - Backend FastAPI: `partial` — CPython 3.13.17 x64, `.venv`, dependencias y herramientas listas; aplicación/endpoints pendientes (Fase 5).
  - Cliente NASA POWER: `planned` (Fase 6)
  - Catálogo agrícola y reglas: `planned` (Fase 4 / Fase 7)
  - Motor de comparación: `planned` (Fase 8)
  - Frontend React + 5 módulos: `planned` (Fases 9–13)
- **Verificaciones BE-02:** importaciones y ubicaciones de las nueve dependencias directas correctas dentro de `.venv`; `pip check` sin conflictos; Uvicorn/Pytest/Ruff ejecutables; Ruff check/format correctos; Pytest recolecta 0 pruebas (código 5, no suite aprobada). Smoke en memoria de FastAPI/OpenAPI, Pydantic Settings, HTTPX, Pandas y NumPy correcto; sin endpoints del proyecto.
- **Reproducibilidad:** grupos `runtime`/`dev` en `backend/pyproject.toml`; snapshot de 30 paquetes en `backend/requirements.lock`, sin hashes, validado con instalación dry-run sobre el entorno actual (no segunda instalación limpia).
- **Limitaciones BE-02:** terminal conserva PATH anterior; se usa ejecutable absoluto de `.venv`. Selección visual del intérprete en VS Code pendiente de confirmar por el desarrollador. Starlette TestClient emite deprecación al usar HTTPX; no se añadió otro cliente.
- **Git BE-02:** `.venv` ignorado y sin archivos rastreados; no se modificó frontend, contratos ni `.env.example`.
- **INT-01:** cinco rutas canónicas bajo `/api/v1`; sobres uniformes, procedencia, faltantes, estados independientes eligibility/assessment_status, snapshots en memoria 30 minutos y único worker documentados. Unidades/reglas agronómicas pendientes de verificación, no inventadas.
- **Validación INT-01:** revisión documental y parseo estricto de ejemplos JSON; no pruebas de servidor ni nuevos modelos ejecutables. Ver informe final de la tarea para resultados.
- **Próxima tarea exacta:** revisión humana de contrato y handoff a frontend antes de autorizar esquemas/base FastAPI con health y pruebas. No hay endpoints implementados.
