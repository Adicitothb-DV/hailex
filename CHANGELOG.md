# CHANGELOG.md

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
- Commit: pendiente; base `79403f6`, rama `feature/frontend-shell`.

## [0.1.0] - 2026-11-14 (America/Mexico_City)
### Inicializado
- Creación de la estructura oficial del repositorio `hailex` conforme al Documento Maestro del Hackatón.
- Añadidos `.clinerules`, `AGENTS.md`, `README.md`, `PROJECT_CONTEXT.md`, `PROJECT_STATUS.md`, `.gitignore`, `.editorconfig` y plantillas en `docs/`.
- **Archivos afectados:** Estructura raíz, `docs/`, `backend/`, `frontend/`.
