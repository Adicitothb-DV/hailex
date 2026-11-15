# PROJECT_STATUS.md — Estado Actual del Proyecto

## Asesor Groq — 2026-11-15

- Integrado chat server-side con `openai/gpt-oss-120b`, contexto opcional de perfil local,
  consolidado SIAP, clima y humedad NASA POWER, y análisis Sentinel-2 seleccionado. El motor
  de rotación sigue determinista. El texto se procesa fuera del equipo con consentimiento.
- Respuesta JSON validada, errores tipados y sin fallback automático. No hay búsqueda web ni
  forecast numérico validado; el modelo puede equivocarse y no sustituye revisión de campo.
- Comprobados 133 tests backend, Ruff, build/typecheck/lint frontend y navegador con estado
  de clave ausente. Groq real no probado: no había clave configurada en este entorno.

## Rotación limitada — 2026-11-15

- Asesor Agrícola conserva el perfil local, sustituye la tabla SIAP por formulario y consulta
  `/api/v1/rotation-workspace/compare`; compara cuatro cultivos por familia cuando el usuario
  solicita el criterio y declara cultivo anterior. No es evaluación agronómica integral.
- Permite escoger un análisis satelital archivado como contexto descriptivo, sin usar índices
  para decidir cultivos. Municipio y modalidad son declarados; suelo, clima, calendario,
  requerimientos hídricos y economía permanecen no evaluables. No hay predicción numérica.
- En esta fase anterior el perfil no se enviaba al motor; la integración Groq posterior se
  describe arriba. INEGI es una referencia de índices, no precios por producto.
- Verificación: 117 pruebas backend y Ruff; build, typecheck y lint frontend; prueba de
  navegador del perfil y comparador con backend real.

## Perfil agrícola local — 2026-11-15

- Agricultural Context incluye un perfil opcional editable y versionado en localStorage,
  con eliminación confirmada y sin modificar geometrías ni análisis existentes.
- No existe asesor conversacional, endpoint Groq, investigación de precios ni conexión del
  perfil con otras fuentes. AGENTS.md prohíbe llamadas a LLM en ejecución. Los resultados
  satelitales archivados son análisis, no un registro estable de múltiples parcelas.
- Verificados build/typecheck y lint frontend, formato de los archivos modificados y prueba
  aislada de navegador (guardar, recargar, editar y eliminar). El formato global señala
  `src/test/agroalert.browser.mjs` preexistente; pytest/Ruff no ejecutaron: el `.venv`
  apunta a un Python inexistente de otro usuario y Python local carece de dependencias.

## AgroAlert NASA — integración en curso — 2026-11-15

- Se importó la colección GeoJSON original y se inició el cálculo de celdas recortadas.
- Se añadieron reglas independientes para faltantes, percentiles, estado y agregación por fuente.
- El módulo está montado en Parcel Monitoring con filtros, mapa, capas base, GIBS visual,
  indicadores, tablas, CSV y gráficas separadas por fuente. La implementación aún es parcial.
- Sincronización real OSM validada con respaldo y reemplazo atómico: El Marqués 1157
  vértices y Colón 878; OSM no equivale por sí solo a un límite legal verificado.
- Consulta real POWER del 6–10 de octubre de 2026 tras sincronizar: 15/15 celdas de
  El Marqués y 14/14 de Colón, con MERRA-2 identificado como índice.
- Verificaciones: 112 pruebas backend, Ruff, build/lint frontend; una prueba de navegador
  aprobó ambos municipios y controles antes de la sincronización. La repetición posterior
  agotó el tiempo de DevTools, así que no se afirma verificación integral final.
- Pendientes: operación de sincronización autorizada desde UI, helper visual de mapa
  regional, revisión de todos los detalles de la especificación y prueba integral final.
  Avisos: TestClient deprecado, chunk MapLibre grande y espacio libre de disco bajo.

## Mejora de inspección — 2026-11-15

- El reporte prioriza hasta tres centros de píxel NDVI del 20 % inferior, separados
  al menos 30 m, solo con cobertura mínima y variabilidad; no diagnostica causas.
- Resultados archivados pueden recuperarse localmente sin consultar STAC. Análisis
  antiguos no incluyen puntos nuevos; necesitan reprocesarse para obtenerlos.
- Prueba real E2E de dibujo, análisis, puntos, clima NASA POWER, SIAP e historial; 88 pruebas
  backend y verificaciones frontend aprobadas. Comparación temporal sigue pendiente.

## Demo de monitoreo — 2026-11-15 (estado actual)

- Prototipo local con dibujo/edición de polígono en Parcel Monitoring, validación geodésica,
  búsqueda STAC, RGB/NDVI/NDMI, máscara SCL y reporte JSON; Climate Intelligence conserva
  NASA POWER y el reporte permite solicitar contexto para los 30 días previos a la escena.
- Prueba real: `S2B_14QLH_20261114_0_L2A`, 2026-11-14; polígono de prueba
  no identificado como propiedad. En navegador: NDVI 196 píxeles y NDMI 49, cobertura
  válida 100 % para ambos; nubes de escena 15.99 %. Datos y capas no son mediciones de campo.
- Agricultural Context consulta el libro local: 155 filas, 2 pérdidas totales, brecha
  2015–2020; precios y procedencias permanecen separados, sin pronóstico confiable.
- Pruebas: 86 backend, Ruff, typecheck, lint, formato, build y navegador V2/monitoreo.
- Limitaciones importantes: no hay comparación temporal, polígonos automáticos de zonas,
  cache con limpieza/TTL, proveedor CDSE ni auditoría
  formal de accesibilidad. Las anomalías de offset de Earth Search requieren cautela.
- Los apartados siguientes registran fases anteriores y no sustituyen este estado.

## Frontend — catálogo y parcela

- Rotation Studio consume el catálogo, muestra evidencia y permite declarar un perfil
  temporal; presenta el contexto de la última consulta NASA con sus límites.
- Build, lint y pruebas de navegador correctos; el perfil no se persiste ni se envía.

## Fase 7 — catálogo y perfil

- `GET /api/v1/crops` sirve el catálogo local con fuentes y estado provisional; el
  esquema de parcela conserva origen y validación. No se persisten parcelas.
- INEGI es contexto cartográfico, no laboratorio; NASA POWER aporta contexto climático.

## Fase 7C — panel climático histórico

- POWER 2003–2024 para ambos puntos y fixtures 2025; 16 802 filas diarias, 151 ventanas
  agrícolas y 155 observaciones SIAP unidas sin expansión. 143 ventanas completas y 8
  incompletas. Ventanas nacionales aproximadas, sin fases fenológicas locales.
- Sin anomalías 1991–2020; las estadísticas históricas son contexto descriptivo.

## Fase 7B — pipeline SIAP offline

- Código de ingesta, calidad, normalización y agregación en `backend/scripts/data_pipeline/`.
- Libro de entrada conservado; 155 filas, 153 sin alertas automáticas y 2 con advertencia
  por producción cero, sin rechazos. Brecha 2015–2020; precio de siniestros indefinido.
- Agregados colapsados provisionales; diccionario, unidades monetarias y procedencia
  de `Precio` aún no verificados. No modelos, consulta NASA ni nuevos endpoints.

- Identidad visual: logo PNG aportado por el equipo en Dashboard y favicon; menú con hoja
  original; cursor de hoja a 64 × 64 con punto activo en la punta y alternativa nativa. Los PNG originales
  se conservan en `frontend/public/`. Revisión visual manual adicional recomendada.

## Frontend V2 — 2026-11-14 (hora de México)

- Base UI-01 preservada en `c194c23`; merge del backend `9e481ab` en `cc213eb`.
- Cinco rutas, drawer, estado compartido, mapa vectorial y conexión health/sources/clima;
  presentación de faltantes y procedencia. Perfil, catálogo y motor siguen pendientes.
- Typecheck, lint y build correctos; 55 pruebas backend aprobadas en venv temporal.
- Navegador: cinco rutas en 320/768/1024/1366 px, drawer/Escape, ambos municipios 2025,
  faltantes de radiación, mapa cargado y fallido, backend desconectado y movimiento reducido.
- Capturas en carpeta temporal local, no versionadas. Pendiente auditoría de contraste,
  lector de pantalla, zoom 200 % y revisión agronómica. MapLibre produce chunk grande.
- Sin geolocalización automática, persistencia, puntuaciones ni resultados agronómicos.
- Próximo paso: integrar catálogo/perfil en Fase 7 y motor determinista en Fase 8, después
  de acordar y verificar el contrato; no se declaran completadas esas fases.

- **Última actualización:** 2026-11-14 (America/Mexico_City)
- **Fase actual:** Fase 6 — NASA POWER Service implementado; revisión agronómica local pendiente según `docs/AGRONOMIC_RULES.md`.
- **Checkpoint documental:** `2d40f11` (`docs: define API and data contracts`), sobre base `dad906e`, conservó los cinco documentos de INT-01. Commit funcional: `feat: create FastAPI service foundation` (consultar git log tras su creación).
- **Estado por módulo:**
  - Contrato canónico V1: `docs/API_CONTRACT.md`, aprobado para implementar; raíz `API_CONTRACT.md` solo referencia, sin cambios en esta fase.
  - Backend foundation: `implemented` — FastAPI, health canónico, Swagger/OpenAPI, configuración, CORS, errores y logging/request ID. No equivale a backend de negocio completo.
  - Cliente NASA POWER, clima y sources: `implemented` (Fase 6)
  - Catálogo agrícola y reglas: `planned` (Fase 4 / Fase 7)
  - Motor de comparación: `planned` (Fase 8)
  - Frontend React + 5 módulos: `planned` (Fases 9–13)
- **Verificaciones BE-02:** importaciones y ubicaciones de las nueve dependencias directas correctas dentro de `.venv`; `pip check` sin conflictos; Uvicorn/Pytest/Ruff ejecutables; Ruff check/format correctos; Pytest recolecta 0 pruebas (código 5, no suite aprobada). Smoke en memoria de FastAPI/OpenAPI, Pydantic Settings, HTTPX, Pandas y NumPy correcto; sin endpoints del proyecto.
- **Reproducibilidad:** grupos `runtime`/`dev` en `backend/pyproject.toml`; snapshot de 30 paquetes en `backend/requirements.lock`, sin hashes, validado con instalación dry-run sobre el entorno actual (no segunda instalación limpia).
- **Limitaciones BE-02:** terminal conserva PATH anterior; se usa ejecutable absoluto de `.venv`. Selección visual del intérprete en VS Code pendiente de confirmar por el desarrollador. Starlette TestClient emite deprecación al usar HTTPX; no se añadió otro cliente.
- **Git BE-02:** `.venv` ignorado y sin archivos rastreados; no se modificó frontend, contratos ni `.env.example`.
- **INT-01:** cinco rutas canónicas bajo `/api/v1`; sobres uniformes, procedencia, faltantes, estados independientes eligibility/assessment_status, snapshots en memoria 30 minutos y único worker documentados. Reglas agronómicas pendientes de validación; unidades POWER verificadas en respuestas históricas.
- **Validación INT-01:** revisión documental y parseo estricto de ejemplos JSON; no pruebas de servidor ni nuevos modelos ejecutables. Ver informe final de la tarea para resultados.
- **Validación Fase 5:** 24 pruebas Pytest aprobadas; Ruff check y format correctos (13 archivos); pip check sin conflictos. Smoke Uvicorn real con health/Swagger/OpenAPI HTTP 200 y X-Request-ID; proceso temporal detenido. Véase `docs/TESTING.md`.
- **Configuración Fase 5:** CPython/venv/dependencias conservados. Settings lee `.env` opcional y CSV CORS; orígenes locales explícitos, sin credenciales ni wildcard. APP_PORT validado pero cambio de puerto requiere CLI --port; variables NASA siguen reservadas.
- **Límites:** health, clima y sources implementados; catálogo, motor, DB/auth y frontend integrado pendientes. Caché y snapshots son memoria de un proceso; sin persistencia.
- **Fase 4:** referencias municipales La Cañada, El Marqués y Colón, Colón; dos respuestas POWER 2025 HTTP 200 archivadas por separado, 365 valores válidos por variable y municipio. Ver manifiestos y `docs/DATA_SOURCES.md`. Datum específico de la fuente de coordenadas no verificado; verificación poligonal y revisión del diccionario de parámetros pendientes.
- **Agronomía:** exactamente maíz forrajero, alfalfa, cebada y sorgo; SIAP en fichas estatales: avance octubre 2024 para El Marqués y cierre 2023 para Colón, no comparables automáticamente; secuencias sin evaluación local definitiva. Ciclos, riego y calendarios locales pendientes de desglose y revisión agronómica.
- **Fuentes locales del equipo:** comunicadas, archivos y metadatos pendientes, no implementadas ni integradas.
- **Fase 6:** cliente HTTPX, normalizador, errores seguros, caché de 30 minutos y snapshots de 30 minutos; respaldo histórico exacto informado. Consultas reales independientes 2025 y 2026; registro en `docs/TESTING.md`. La Cañada se conserva como referencia de El Marqués por confirmación del usuario.
- **Próxima tarea exacta:** Fase 7 — catálogo agrícola, perfil de suelo e integración de fuentes gubernamentales locales; motor pendiente de Fase 8.

## Historial de frontend (estado de cada momento)

## UI-01 — 2026-11-14 (America/Mexico_City; hora no registrada)

- Rama `feature/frontend-shell`; base `cae89d8`. Implementación local pendiente de revisión/commit.
- Shell `implemented`: tema claro/verde bosque, sidebar, header, menú móvil nativo y cinco rutas por fragmento.
- Pantallas `partial`: contenido de orientación y estados vacíos honestos; mapa, clima, perfil,
  escenarios, comparación y conexión API siguen `planned`.
- Sin cifras o fixtures ficticios, sin HTTP ni lógica agronómica; backend y contrato sin cambios.
- Sin nuevas dependencias. Se añade script `test:ui` con Node y Chrome/Edge local.
- Prueba de navegador PASS: cinco rutas a 320/768/1024/1366 px, foco, enlaces activos,
  historial/recarga, menú, Escape y movimiento reducido; se corrigió un fallo inicial de foco.
- Verificación final ampliada PASS: Shift+Tab, cierre al pasar a desktop y ausencia de errores
  de consola capturados; suite repetida correctamente sobre desarrollo y build con preview.
- Repetición final PASS: typecheck, lint, format:check y build.
- Límites: pendiente revisión visual manual, zoom 200 %, contraste y lector de pantalla.
- Aviso previo de seguridad de herramientas FE-02 conservado; no se repitió npm audit.
- Próxima tarea: revisar UI-01 antes de fixtures, estado compartido o integración de datos.
- El merge anterior `cae89d8` está registrado en la rama; su bloque siguiente es histórico.

## Estado integrado — 2026-11-14 (America/Mexico_City; hora no registrada)

- Rama: `feature/frontend-shell`. Integración de `origin/main` (`dad906e`, PR #1) sobre FE-02 (`ea630b4`).
- Commit de integración: este merge; consultar `git log -1` para su identificador final.
- Frontend base `implemented`; cinco módulos funcionales `planned`.
- Backend `partial`: dependencias/configuración versionadas; aplicación y endpoints pendientes.
- Maestro idéntico en ambos padres; no modificado. Código frontend y archivos backend conservados sin edición manual.
- Referencia previa: typecheck, lint, format:check y build PASS en esta laptop.
- Validación posterior: typecheck, lint, format:check y build PASS en esta laptop; sin reinstalar dependencias.
- Comprobado: frontend idéntico a `ea630b4`, backend idéntico a `dad906e`, maestro idéntico a ambos.
- Publicación: pendiente al preparar este commit; verificar la referencia remota tras el push.
- Las verificaciones BE-02 siguientes proceden de la laptop backend; no se afirman ejecutadas aquí.
- Próximas tareas: revisión FE-02/seguridad y shell/navegación; revisión BE-02, intérprete y base FastAPI.

## Registro FE-02 — 2026-11-14

- Rama: `feature/frontend-shell`; commit base: `79403f6`. FE-02 guardado en `ea630b4`.
- Frontend base: `implemented` (React, Vite, TypeScript estricto, Tailwind, ESLint y Prettier).
- Los cinco módulos funcionales permanecen `planned`; no hay API ni lógica de negocio en cliente.
- Se conservan los 14 placeholders y todos los directorios existentes.
- PASS: instalación con `npm.cmd ci`, build/typecheck, lint, formato y arranque dev.
- PASS: HTTP 200 y montaje React en Chrome headless; Tailwind genera estilos.
- Limitación: revisión visual manual/responsive y consola pendientes.
- Seguridad: npm audit completo reporta siete hallazgos moderados en dependencias de desarrollo
  de typescript-eslint/minimatch; producción (`--omit=dev`): cero. No se aplicó fix forzado.
- Próxima tarea: revisar FE-02 y el aviso de seguridad antes de implementar shell/navegación.
- Backend y contrato API no modificados durante FE-02.

## Registro BE-02 — informe de la laptop backend

- **Última actualización:** 2026-11-14 13:52 (America/Mexico_City)
- **Fase actual:** BE-02 — Entorno y dependencias backend configurados; sin lógica de negocio.
- **Commit base verificado:** `79403f6`; BE-02 guardado en `e57f254`, integrado por PR #1 (`dad906e`).
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

## Histórico inicial — 2026-11-14 10:00 (America/Mexico_City)

Este bloque conserva el estado anterior a FE-02 y BE-02; no describe el estado actual.

- **Fase:** Fase 0 / Fase 2 — Estructura base y línea base Git inicializadas.
- **Commit:** entonces pendiente; línea base registrada posteriormente como `79403f6`.
- **Estado por módulo:** documentación y contratos `initialized`; backend FastAPI, NASA POWER,
  catálogo agrícola/reglas, motor y frontend React con cinco módulos `planned`.
- **Pruebas:** ninguna aún en ese momento (estructura recién creada).
- **Próxima tarea de entonces:** subir estructura a GitHub, agregar colaboradores, congelar
  contrato e iniciar backend (Laptop 1) y frontend (Laptop 2) en paralelo.
