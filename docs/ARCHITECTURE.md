# ARCHITECTURE.md — Arquitectura del Sistema

Consultar `docs/API_CONTRACT.md` y la sección 8 del Documento Maestro.
- Frontend: `frontend/` (React + Vite + TS + Tailwind + MapLibre + Recharts).
- Backend: `backend/` (FastAPI + Pydantic + HTTPX + Pandas + NumPy).

## Fase 5 — implementación real

Raíz local: `C:\Users\Alex\Downloads\hailex\backend`.

```text
app/main.py                  create_app(settings) y app ASGI, OpenAPI/Swagger
app/api/router.py            prefijo /api/v1, solo router health
app/api/routes/health.py     liveness, sin consultas externas
app/schemas/common.py        sobres, HealthData y modelos de error
app/core/config.py           Settings, .env opcional, CSV CORS validado
app/core/errors.py           HTTP/validación/500 sanitizados
app/core/logging.py          contexto request ID, logging y redacción de acceso Uvicorn
app/core/middleware.py       request ID, CORS contractual y captura de excepciones
tests/conftest.py            app aislada y HTTPX ASGITransport sin plugins nuevos
tests/test_health.py         contrato, OpenAPI/Swagger, ausencia de alias, UUID
tests/test_errors.py         400/403/404/405/422/500, logs y privacidad
tests/test_cors.py           orígenes/preflight/métodos/headers
tests/test_config.py         entorno, .env y validación de configuración
```

Orden middleware HTTP: contexto/request ID → CORS → boundary de errores → rutas.
Esto conserva CORS e ID en errores de endpoint, incluidos 500 antes de comenzar respuesta.
Handlers transforman HTTPException y RequestValidationError; el boundary registra
ubicaciones y tipo de errores inesperados sin exponer mensajes sensibles o stack al cliente.
Una respuesta que ya empezó (streaming futuro) no puede reemplazarse con otro JSON.

Solo GET /api/v1/health implementado, servicio 0.1.0, contrato 1.0.0. Docs/OpenAPI son
rutas técnicas. No se crean rutas para provocar errores fuera de fixtures de pruebas.
No se ejecutan NASA, Pandas/NumPy ni evaluación agrícola en runtime de esta fase.
Services/analysis/data permanecen reservados para fases posteriores. No DB/auth/snapshots.
