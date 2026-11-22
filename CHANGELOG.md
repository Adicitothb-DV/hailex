# CHANGELOG.md

## Lex: modelos alternativos — 2026-11-15

- Respaldo de modelos Groq, búsqueda separada con respaldo, ocultamiento del monitor en la
  navegación, animaciones accesibles y avance parcial de traducción del asesor de rotación.

## Monitor fitosanitario ilustrativo — 2026-11-15

- Nueva vista, API y simulador para Colón y El Marqués, con NASA POWER, mapa y CSV;
  índices, perfiles y geometrías sectoriales señalados como ilustrativos y no validados.

## Lex: acceso a fuentes web — 2026-11-15

- Aprovecha páginas abiertas por Browser Search con trazabilidad y controles conservadores de
  precio; los resultados siguen requiriendo revisión, sin prometer verificación automática.

## Lex sincronizado — 2026-11-15

- Se difiere la presentación del texto hasta que la voz está preparada, con salida segura ante
  fallos, límite de espera y reintento manual; Fish Audio usa baja latencia. Se amplían textos
  bilingües en perfil, clima y procedencia; la migración global sigue incompleta.

## Lex: voz por idioma — 2026-11-15

- Selección de voces Fish Audio por locale, búsqueda en inglés, reintento manual de audio
  bloqueado y localización de controles Lex y Earth Explorer; traducción global sigue parcial.

## Preferencias de idioma y tema — avance parcial — 2026-11-15

- Añadidos catálogos i18next iniciales, controles persistentes, navegación y dashboard
  parcialmente localizados, tokens oscuros iniciales y locale por turno para Lex.
- La traducción integral, compatibilidad visual oscura, pruebas visuales y voz real siguen pendientes.

## Lex: búsqueda y voz automáticas

- La búsqueda web se activa inicialmente y cada respuesta nueva intenta leerse con Fish Audio;
  ambas funciones se pueden desactivar. Las referencias siguen sin verificación de precios.

## Lex voz — 2026-11-15

- Activación de escucha opcional por «Lex», detener y pausar/reanudar audio; configuración
  pública sin claves. Streaming y verificación profunda siguen pendientes.

## Lex global parcial — 2026-11-15

- Reutilizado el asesor en panel global con historial de sesión, dictado manual y Fish Audio
  REST; Browser Search separado y referencias sin verificación. Ver limitaciones en estado.

## Asesor conversacional — 2026-11-15

- Añadida continuidad acotada del chat, nueva conversación y formato de lectura por mensajes;
  el asesor vuelve a preparar los datos seleccionados en cada consulta.

## Asesor Groq — ajuste de validación

- Limita las preguntas y listas devueltas al máximo permitido antes de validar la respuesta.

## Entorno Python local — 2026-11-15

- Reparada la referencia del intérprete en el entorno virtual local y configurado VS Code
  para resolver importaciones del backend; verificadas pruebas y dependencias.

## Asesor Groq — 2026-11-15

- Integrado chat Groq server-side con prompt versionado, salida validada y contexto opcional
  del perfil, SIAP, NASA POWER y análisis satelital; sin cambiar el motor determinista.
- Sin pronóstico numérico validado ni búsqueda web. API key solo en configuración backend.

## Rotación limitada — 2026-11-15

- Añadido comparador determinista de familias y formulario Asesor Agrícola en lugar de la
  tabla SIAP; se conserva la API SIAP y el perfil local. Contexto satelital archivado opcional.
- Sin predicciones, asesor conversacional ni evaluación de aptitud: consultar PROJECT_STATUS.md.

## Perfil agrícola local — 2026-11-15

- Añadido formulario opcional de perfil en Agricultural Context, guardado local versionado,
  eliminación confirmada y prueba de navegador para guardar, recargar, editar y eliminar.
- Sin integración de modelos ni asesor conversacional; ver limitaciones en PROJECT_STATUS.md.
- Comprobados build, lint y prueba aislada del perfil; el entorno Python no está operativo.

## AgroAlert NASA — trabajo en curso — 2026-11-15

- Importada la colección municipal fuente y añadida la generación de grilla recortada
  con pruebas geoespaciales. La integración completa permanece pendiente.
- Añadidas funciones puras de percentiles y agregación por fuente con pruebas.
- Incorporados cliente POWER con respaldo, API municipal/puntual/regional y sincronizador
  local de límites con escritura atómica; falta interfaz y validación integral.
- Montado el módulo en Parcel Monitoring con controles, mapa, GIBS visual, tablas, CSV y
  gráficas; sincronizados límites OSM. Permanecen pendientes funciones y validación integral.

## Inspección de campo — 2026-11-15

- Añadidos puntos orientativos relativos a la distribución NDVI y controles de calidad;
  coordenadas y marcadores para facilitar inspección sin prescribir ni diagnosticar.
- Añadido selector de análisis históricos locales y apertura sin consulta a STAC.
- Pruebas unitarias y de navegador del flujo satelital y la recuperación local.

## Demo de monitoreo — 2026-11-15

- Dibujo con Terra Draw, validación AOI, búsqueda Earth Search Sentinel-2 L2A, lectura
  COG por ventanas, RGB/NDVI/NDMI, SCL, estadísticas y reporte local JSON.
- Consulta explícita de NASA POWER para contexto del AOI y vista de historial agrícola
  del libro proporcionado sin mezclar precios ni inventar años ausentes.
- Prueba real con escena del 14 de noviembre y evidencia en `frontend/evidence/`;
  pruebas automatizadas y limitaciones descritas en `docs/FINAL_DEMO_SCOPE.md`.

## Frontend — catálogo y perfil
- Catálogo real con detalle y fuentes; perfil en memoria y contexto climático descriptivo.
- Estados de carga, errores y faltantes; pruebas de navegador con backend local.

## Fase 7 — catálogo y perfil de parcela
- Catálogo local con evidencia por cultivo y endpoint `/api/v1/crops`.
- Esquema de parcela con procedencia, validación y campos desconocidos explícitos.

## Fase 7C — clima histórico y panel agrícola
- POWER histórico por punto y agregados por ventanas nacionales aproximadas SIAP.
- Unión sin expansión de filas y trazabilidad del contexto histórico.

## Fase 7B — pipeline SIAP offline
- Lectura XLSX con hash, observaciones normalizadas, controles y agregados provisionales.
- Precios originales separados; siniestros preservados; sin interpolación ni modelos.
- Dependencia de lectura XLSX openpyxl y pruebas sintéticas sin red.

## Identidad visual — 2026-11-14
- Logo PNG del equipo en Dashboard y la pestaña; hoja original en el menú. Cursor de
  hoja ampliado con punto activo en la punta; hover sutil y respaldo nativo. PNG intactos.

## Frontend V2 — 2026-11-14 (America/Mexico_City)

- Diseño de tokens, drawer accesible y cinco vistas; estado compartido de ubicación.
- Integración health, sources y series climáticas con procedencia, faltantes y errores.
- MapLibre/OpenFreeMap con atribución y fallback; Recharts, Lucide y cálculo solar UTC.
- Rotaciones y análisis permanecen en preparación, sin resultados simulados.
- Validaciones y limitaciones registradas en `PROJECT_STATUS.md` y `docs/TESTING.md`.

## UI-01 — 2026-11-14 (America/Mexico_City; hora no registrada)

- Shell frontend V1: tema claro, navegación verde bosque, header y cinco pantallas con estados honestos.
- Rutas por fragmento, enlaces activos, historial, recuperación de ruta y gestión de foco.
- Menú móvil con diálogo nativo, Escape, ciclo Tab/Shift+Tab y cierre al pasar a desktop.
- SVG propios y controles HTML; no se añadieron dependencias ni se modificó el lockfile.
- Prueba reproducible Node/Chrome sin librerías nuevas; primer fallo de foco corregido.
- PASS finales: typecheck, lint, format:check, build y suite de navegador en dev y preview.
- Archivos: App, layout/navegación, componentes, hook, cinco features, estilos, prueba y script;
  README, PROJECT_STATUS y CHANGELOG actualizados. Eliminado un encabezado FE-02 duplicado.
- Sin backend, API, datos simulados ni cálculo agronómico. Limitaciones visuales/manuales documentadas.
- Commit de preservaci?n `c194c23`; base `cae89d8`. Resultados finales registrados en PROJECT_STATUS.

## Integración backend en frontend — 2026-11-14 (America/Mexico_City; hora no registrada)

- Merge de `origin/main` (`dad906e`, PR #1) en `feature/frontend-shell`, sin reescribir historial ni modificar `main`.
- Conservados FE-02 y BE-02; conflictos documentales integrados semánticamente.
- Documento maestro idéntico en ambas ramas, conservado sin cambios.
- Archivos incorporados: README, pyproject y requirements.lock del backend; frontend intacto.
- Validaciones previa y posterior: typecheck, lint, format:check y build correctos; sin reinstalación.
- Commit: este commit de merge; padres previstos `ea630b4` y `dad906e`.
- Las entradas del mismo día sin hora no implican un orden temporal verificado.

## FE-02 - 2026-11-14 (America/Mexico_City; hora no registrada)

- Configuración incremental del frontend existente: React/Vite, TypeScript estricto,
  Tailwind vía plugin Vite, ESLint flat config y Prettier.
- Añadidos punto de entrada, pantalla mínima honesta, estilos y scripts; sin lógica de negocio.
- Dependencias directas fijadas y package-lock para instalación reproducible con npm ci.
- README del frontend actualizado con instalación, comandos, decisiones y limitaciones.
- Archivos afectados: configuración y arranque en frontend, README, PROJECT_STATUS y CHANGELOG.
- Pruebas PASS: npm ci, build/typecheck, lint, formato, HTTP 200 y montaje React en Chrome headless.
- Aviso abierto: siete hallazgos moderados de npm audit en herramientas de desarrollo;
  cero en producción. Sin cambios forzados de dependencias. Revisión visual manual pendiente.
- Commit: `ea630b4`; base `79403f6`, rama `feature/frontend-shell`.


## Fase 6 - 2026-11-14 (America/Mexico_City)
- Cliente HTTPX asíncrono, normalizador POWER AG/UTC, rutas climática y fuentes, errores sanitizados, caché y snapshots en memoria con único worker.
- Respaldo histórico real solo para coordenadas y periodo exactos, con aviso y fecha original; sin modificar payloads ni crear datos simulados.
- Consultas reales a ambos municipios, pruebas offline y regresión documentadas en `docs/TESTING.md`. Se conserva La Cañada para El Marqués por confirmación del usuario.
- Siguiente: Fase 7, catálogo/perfil de suelo y fuentes gubernamentales; motor sigue pendiente.

## Fase 4 - 2026-11-14 (America/Mexico_City)
- **Investigación:** dos municipios oficiales y cuatro cultivos; referencias municipales INEGI, fuentes SIAP en fichas estatales, contexto agronómico y secuencias pendientes de revisión local.
- **NASA:** dos consultas independientes de 2025, HTTP 200; dos payloads históricos originales y manifiestos; sin cliente, endpoint ni normalizador de producción. Se documentan unidades, resolución, sentinel y limitaciones.
- **Pendiente:** datum específico y prueba poligonal de puntos, desglose SIAP por ciclo/régimen, revisión agronómica, metadatos y archivos gubernamentales del equipo; siguiente Fase 6.

## Fase 5 - 2026-11-14 17:29 (America/Mexico_City)
- **Cambio:** aplicación FastAPI con factoría, GET /api/v1/health, modelos de sobre/error, configuración Pydantic Settings, CORS local, request ID UUID y logging sanitizado; 24 pruebas sin red.
- **Archivos:** nuevos módulos en `backend/app/api/`, `backend/app/core/`, `backend/app/schemas/`, `backend/app/main.py` y `backend/tests/`; documentación actualizada en backend/README, README, PROJECT_CONTEXT/STATUS, ARCHITECTURE, TESTING y KNOWN_LIMITATIONS.
- **Validación:** Pytest 24 passed; Ruff check/format correctos; pip check sin conflictos. Uvicorn real responde health, Swagger y OpenAPI por HTTP; proceso temporal detenido. Sin nuevas dependencias ni cambios frontend, contrato, datos o entorno versionado.
- **Seguridad:** errores HTTP/validación/500 con sobre contractual, X-Request-ID y logs sin cuerpos/headers/queries/mensajes de excepción. Destino de acceso Uvicorn redactado. CORS sin wildcard/credenciales.
- **Git:** contrato anterior preservado en commit independiente `2d40f11`; este bloque pertenece a `feat: create FastAPI service foundation`. Publicación normal pendiente de ejecución/verificación al redactar; GitHub CLI no disponible. No merge a main.
- **Pendientes:** Fase 4 investigación/fixtures, Fase 6 POWER, Fase 7 catálogo, Fase 8 reglas/motor; no están implementados por foundation.

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
