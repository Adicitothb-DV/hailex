# AGENTS.md — Instrucciones para Agentes de IA en HaiLex

## 1. Resumen del Proyecto
HaiLex es una plataforma web de apoyo a decisiones agrícolas que integra observaciones terrestres de NASA (NASA POWER) con información local de suelo, cultivos y prioridades del agricultor para comparar escenarios de rotación de cultivos de forma transparente y explicable.

## 2. Arquitectura y Comandos
- **Backend** (`/backend`): FastAPI + Pydantic + HTTPX + Pandas + NumPy.
  - Ejecutar dev: `uvicorn app.main:app --reload --port 8000`
  - Pruebas: `pytest`
  - Lint: `ruff check .`
- **Frontend** (`/frontend`): React + Vite + TypeScript + Tailwind + MapLibre GL JS + Recharts.
  - Ejecutar dev: `npm run dev`
  - Build/Typecheck: `npm run build`
  - Lint: `npm run lint`

## 3. Contratos y Fuentes de Verdad
- Contrato HTTP/JSON: `docs/API_CONTRACT.md`
- Fuentes NASA e INEGI: `docs/DATA_SOURCES.md`
- Reglas matemáticas y agronómicas: `docs/AGRONOMIC_RULES.md`
- Estado actual del repo: `PROJECT_STATUS.md`

## 4. Qué NO Hacer
- No usar el nombre `AgroShift`.
- No inventar datos científicos, coordenadas de parcelas reales sin verificar ni predicciones de rendimiento.
- No llamar a APIs de LLM dentro de HaiLex en tiempo de ejecución.
- No añadir dependencias sin justificar necesidad y compatibilidad.
- No modificar archivos fuera del alcance asignado (Laptop 1 = `backend/`, Laptop 2 = `frontend/`).

## 5. Git y Seguridad
- Nunca subir `.env`, API keys ni credenciales.
- Mantener `main` siempre ejecutable; trabajar en ramas cortas (`feature/...`, `fix/...`).
- Actualizar `PROJECT_STATUS.md` y `CHANGELOG.md` antes de cada commit.
