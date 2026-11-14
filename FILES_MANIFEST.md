# FILES_MANIFEST.md — Paquete Base HaiLex (`hailex-baseline.zip`)

Este archivo contiene la estructura inicial limpia del repositorio `hailex` lista para subir a GitHub y trabajar en VS Code con Cline.

## Archivos Incluidos
- `.clinerules`: Reglas compactas automáticas para Cline (ahorro de tokens y prevención de alucinaciones).
- `AGENTS.md`: Instrucciones operativas para agentes de programación.
- `README.md`, `PROJECT_CONTEXT.md`, `PROJECT_STATUS.md`, `CHANGELOG.md`: Documentación raíz viva.
- `.gitignore`, `.editorconfig`: Configuración estándar de Git y formato.
- `docs/API_CONTRACT.md`: Contrato congelado Frontend <-> Backend (`/api/v1`).
- `docs/*.md`: Plantillas de arquitectura, fuentes de datos, reglas agronómicas, pruebas, flujo Git, demo y seguridad.
- `backend/`: Estructura de carpetas + `.env.example` + `README.md`.
- `frontend/`: Estructura de carpetas + `README.md`.

## Exclusiones Verificadas
- Sin `node_modules/`, `.venv/`, `__pycache__/`, `dist/`, `build/` ni secretos.
