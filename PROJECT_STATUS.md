# PROJECT_STATUS.md — Estado Actual del Proyecto

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
