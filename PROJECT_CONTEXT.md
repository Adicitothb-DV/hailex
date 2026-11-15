# PROJECT_CONTEXT.md — Contexto Vivo de HaiLex

- **Proyecto:** HaiLex
- **Evento:** NASA Space Apps Challenge 2026 — Sede Querétaro (14–15 de noviembre de 2026)
- **Reto:** *Field Shift: Adapting Farms with NASA Data*
- **Equipo:** 4 integrantes | 2 laptops confirmadas:
  - **Laptop 1 (Backend + Datos NASA):** Integrante 1 (Líder técnico, API, integración, Git) + Integrante 2 (NASA POWER, normalización, fixtures).
  - **Laptop 2 (Frontend + Agronomía/QA):** Integrante 3 (React, MapLibre, Recharts, UI) + Integrante 4 (Catálogo cultivos/suelos Querétaro-Bajío, reglas, validación, pitch).
- **Módulos:** Dashboard, Earth Explorer, Climate Intelligence, Rotation Studio, Analysis & Insights + Procedencia transversal.
- **Endpoints canónicos V1:** implementados `GET /api/v1/health`, `GET /api/v1/climate/series`, `GET /api/v1/sources`; pendientes `GET /api/v1/crops` y `POST /api/v1/rotations/compare`. Fuente de verdad: `docs/API_CONTRACT.md`.
- **Fase 5:** base FastAPI ejecutable, Swagger/OpenAPI, configuración Pydantic Settings, CORS local, errores uniformes, X-Request-ID/logging y pruebas. Sin integración frontend todavía.
- **Pilotos y datos:** El Marqués (La Cañada) y Colón (Colón), puntos municipales independientes; catálogo limitado a maíz forrajero, alfalfa, cebada y sorgo. POWER histórico 2025 recuperado por separado, no en vivo; ver `docs/DATA_SOURCES.md` y `docs/AGRONOMIC_RULES.md`. Información gubernamental del equipo pendiente de incorporación.
- **Fase 6:** clima y fuentes implementados con POWER AG/UTC, normalización, caché y snapshots en memoria; fixtures históricos exactos solo como respaldo informado. Un worker; no hay comparación ni catálogo funcional.
- **Principio Rector:** Explicabilidad, determinismo, procedencia verificable y honestidad científica.
