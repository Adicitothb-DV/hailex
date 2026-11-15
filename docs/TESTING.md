# TESTING.md — Plan y Registro de Pruebas

## Precios Fase 7D — parcial

Pruebas sintéticas de deflación, agregación ponderada, separación por año, benchmarks
y métricas; no se evaluaron modelos con los datos reales. Comando desde backend:
`python -m pytest -q`. Se conserva el bloqueo documental de datos críticos.
Validación local: 79 pruebas aprobadas, Ruff check y formato correctos, `pip check`
sin conflictos. No se probaron entrenamiento, intervalos ni escenarios de precio.

## Clima Fase 7C

La suite agrega pruebas offline de UTC, unidades, periodos transanuales, alfalfa,
faltantes, umbrales, escenarios, unión y reproducibilidad con entradas sintéticas.
Los datos POWER reales se adquirieron en dos solicitudes, no en la suite de pruebas.
Validación local: 75 pruebas aprobadas, Ruff check y formato correctos, `pip check`
sin conflictos; panel real de 155 filas a partir de 155 observaciones.

## SIAP Fase 7B

Pruebas sin internet con libros XLSX sintéticos: lectura y hash, categorías, ceros,
precios separados y derivados, ponderación por producción, duplicados, anomalías,
faltantes y reproducibilidad. Ejecutar desde `C:\Users\Alex\Downloads\hailex\backend`:
`python -m pytest -q` y `python -m ruff check .`. El libro real se procesa por separado;
el manifiesto registra la huella y los CSV se regeneran sin modificar el original.
Validación local: 69 pruebas aprobadas, Ruff check correcto y `pip check` sin conflictos.

## Frontend V2 — 14 de noviembre de 2026, hora de México

- `npm.cmd run typecheck`, lint y build: correctos; build avisa del tamaño del módulo de mapa.
- `python -m pytest -q` con dependencias del lockfile en venv temporal: **55 passed**.
- `npm.cmd run test:ui` contra Vite y Uvicorn reales: cinco rutas sin desbordamiento a
  320/768/1024/1366 px, foco de ruta, drawer, Escape, ambas consultas 2025 y procedencia;
  intervalo 2026-10-01..07 con radiación sin valores; mapa listo y fallback al bloquear
  proveedor; backend desconectado y reintento; movimiento reducido; sin excepciones JS.
- Cinco capturas generadas en carpeta temporal de navegador, no incluidas en Git. La prueba
  no sustituye revisión manual de contraste, lector de pantalla o zoom al 200 %.

## Registro Fase 6 — 14 de noviembre de 2026

Suite sin red con HTTPX MockTransport y ASGITransport: cliente, errores, normalización,
validación, concurrencia, TTL, snapshots, fixtures y regresión. Validación final mediante
`python -m pytest -q`, `ruff check app tests`, `ruff format --check app tests` y `pip check`.

Smoke real con Uvicorn y un worker: health, `/docs`, `/openapi.json`, `/api/v1/sources`
y `/api/v1/climate/series` devolvieron HTTP 200. El 2026-11-15T01:41Z se consultaron
ambos puntos para 2025: 365 válidos por variable, cero faltantes y series idénticas a
sus respectivos fixtures; repeticiones desde caché. Para 2026-10-01..07, ambos puntos:
7 valores válidos temperatura y precipitación, 0 válidos/7 faltantes de radiación,
advertidos; recuperación upstream. El proceso temporal se detuvo. La prueba de fase 5
que enumeraba solo health se actualizó para incluir exactamente las nuevas rutas.

## Registro Fase 4 — 14 de noviembre de 2026

Desde el backend: Pytest **24 passed**, Ruff check correcto y formato correcto en
13 archivos. Verificación independiente de los dos payloads y manifiestos: JSON estricto
sin claves duplicadas ni NaN/Infinity, SHA-256 de payload, parámetros y unidades del
proveedor, fecha diaria UTC ordenada y única del 1 de enero al 31 de diciembre de 2025,
365 valores por serie, sentinel y conteos, coordenadas de solicitud y geometría devuelta.
Ambas regiones HTTP 200, sin faltantes. La comprobación geográfica se basa en cabeceras
identificadas por fichas oficiales, no en intersección con polígonos.

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
