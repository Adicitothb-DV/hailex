# ARCHITECTURE.md — Arquitectura del Sistema

Consultar `docs/API_CONTRACT.md` y la sección 8 del Documento Maestro.
- Frontend: `frontend/` (React + Vite + TS + Tailwind + MapLibre + Recharts).
- Backend: `backend/` (FastAPI + Pydantic + HTTPX + Pandas + NumPy).

## Fases 5 y 6 — implementación real

Raíz local: `C:\Users\Alex\Downloads\hailex\backend`.

```text
app/main.py                  create_app(settings) y app ASGI, OpenAPI/Swagger
app/api/router.py            prefijo /api/v1, routers health, climate y sources
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

GET /api/v1/health, /api/v1/climate/series y /api/v1/sources implementados; contrato
1.0.0. Rutas delgadas delegan en `app/services/power.py` (HTTPX y errores),
`app/services/normalizer.py` (fechas, unidades, sentinel y conteos) y
`app/services/climate.py` (caché, snapshots y respaldo histórico). Los modelos de wire
viven en `app/schemas/climate.py`. No hay DB, autenticación ni evaluación agrícola.

Snapshots inmutables durante 30 minutos desde creación, con serie, procedencia y avisos;
desaparecen al reiniciar. Caché de proveedor independiente, TTL inicial 30 minutos y
capacidad acotada configurable. Una exclusión mutua agrupa solicitudes idénticas, pero
también serializa solicitudes distintas; es una limitación operativa. Se requiere un
solo worker. Ante error upstream, fixture histórico exacto con aviso o error seguro;
no fallback demo. No se exponen endpoints para snapshots ni comparación en esta fase.
