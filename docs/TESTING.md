# TESTING.md — Plan y Registro de Pruebas

- Backend: `pytest` y `ruff check .`
- Frontend: `npm run build` y `npm run lint`
- End-to-End: Selección de punto -> Consulta clima -> Comparación 3 escenarios -> Cambio de pesos.

## Registro Fase 5 — 14 de noviembre de 2026, 17:29 America/Mexico_City

Laptop backend, CPython 3.13.17 x64. Desde `C:\Users\Alex\Downloads\hailex\backend`:

```powershell
& '.\.venv\Scripts\python.exe' -m pytest -q
& '.\.venv\Scripts\python.exe' -m ruff check app tests
& '.\.venv\Scripts\python.exe' -m ruff format --check app tests
& '.\.venv\Scripts\python.exe' -m pip check
```

Resultados: **24 passed** (0.42 s en ejecución registrada); Ruff check correcto,
13 archivos con formato correcto, pip check sin requisitos rotos. Sin paquetes nuevos.
Las pruebas usan HTTPX ASGITransport + asyncio: sin internet, sin TestClient deprecado,
sin snapshots/datos científicos inventados. Rutas test-only viven solo en apps de fixture.

Cobertura funcional: health exacto incl. contract_version; OpenAPI/Swagger; alias ausente;
UUID único y no confiado al caller; HTTP/validación/JSON inválido/500 sin secretos;
CORS en errores, preflight aceptado/rechazado; métodos/headers no autorizados; entorno
CSV/.env y configuración inválida; redacción del log de acceso Uvicorn.

Smoke real: subprocess Uvicorn en puerto loopback efímero 53874; health, /docs y
/openapi.json devolvieron HTTP 200; X-Request-ID presente. Proceso temporal detenido.
No se hizo llamada NASA ni prueba end-to-end del producto completo.

Primeras iteraciones detectaron nombre reservado de fixture `request` y una aserción
que confundía formato de caplog con atributo request_id. Se corrigieron y repitió suite.
No se cuenta ningún resultado fallido inicial como aprobado.
