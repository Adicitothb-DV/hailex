# CHANGELOG.md

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
- Commit pendiente; base `cae89d8`. Resultados finales registrados en PROJECT_STATUS.

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

## BE-02 - 2026-11-14 13:52 (America/Mexico_City)
- **Cambio:** entorno backend creado con CPython 3.13.17 x64; dependencias directas fijadas en grupos de `pyproject.toml`, snapshot transitivo `requirements.lock`, configuración de Ruff/Pytest e instrucciones PowerShell.
- **Motivo:** preparar una base reproducible con venv/pip, sin regenerar estructura ni implementar endpoints o motor.
- **Archivos afectados:** `backend/pyproject.toml`, `backend/requirements.lock`, `backend/README.md` y `PROJECT_STATUS.md`; `.venv` solo local, ignorado por Git.
- **Validación:** importaciones/ubicación de nueve dependencias correctas; pip check sin conflictos; Uvicorn/Pytest/Ruff disponibles; Ruff check/format correctos; Pytest sin pruebas (código 5). Smoke en memoria correcto; TestClient advierte deprecación de HTTPX en Starlette. Lock comprobado por dry-run en entorno actual, no en segunda instalación limpia.
- **Commit:** `e57f254`, integrado en main mediante PR #1 (`dad906e`); base `79403f6`. Selección de intérprete en interfaz VS Code no comprobable desde las herramientas usadas.

## [0.1.0] - 2026-11-14 (America/Mexico_City)
### Inicializado
- Creación de la estructura oficial del repositorio `hailex` conforme al Documento Maestro del Hackatón.
- Añadidos `.clinerules`, `AGENTS.md`, `README.md`, `PROJECT_CONTEXT.md`, `PROJECT_STATUS.md`, `.gitignore`, `.editorconfig` y plantillas en `docs/`.
- **Archivos afectados:** Estructura raíz, `docs/`, `backend/`, `frontend/`.
