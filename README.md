# HaiLex

**Plataforma de apoyo a decisiones agrícolas basada en observaciones terrestres de NASA e información agronómica local.**

Desarrollado para **NASA Space Apps Challenge 2026 (Sede Querétaro)** — Reto: *Field Shift: Adapting Farms with NASA Data*.

---

## Problema y Solución
Los agricultores toman decisiones de siembra y rotación bajo condiciones climáticas y de suelo cambiantes, con información dispersa y difícil de comparar. **HaiLex** integra datos climáticos históricos/recientes de **NASA POWER** con perfiles locales de parcela, catálogo documentado de cultivos y prioridades del agricultor para evaluar y explicar tres escenarios de rotación de manera transparente.

## Módulos Principales
1. **Dashboard:** Resumen de ubicación seleccionada, disponibilidad de datos y estado de análisis.
2. **Earth Explorer:** Mapa interactivo (MapLibre GL JS) para seleccionar punto de estudio y coordenadas.
3. **Climate Intelligence:** Series temporales de temperatura, precipitación y radiación solar (NASA POWER) con unidades, fechas y procedencia.
4. **Rotation Studio:** Configuración de perfil de parcela, cultivo actual, tres escenarios de rotación y pesos de prioridades.
5. **Analysis & Insights:** Comparación determinista por criterios, desglose de contribuciones, factores favorables, limitaciones y datos faltantes.

## Stack Tecnológico
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui, MapLibre GL JS, Recharts, Motion.
- **Backend:** Python 3.11+, FastAPI, Pydantic, HTTPX, Pandas, NumPy, Uvicorn, Pytest, Ruff.
- **Datos:** JSON/CSV versionados + API pública NASA POWER Daily Point.

## Estructura del Repositorio
```text
hailex/
├── frontend/       # Aplicación web React + TypeScript
├── backend/        # API REST FastAPI + motor de rotación + cliente NASA POWER
├── docs/           # Arquitectura, contratos API, fuentes NASA, reglas agronómicas y guías
├── AGENTS.md       # Instrucciones para agentes de desarrollo
├── PROJECT_CONTEXT.md
├── PROJECT_STATUS.md
└── CHANGELOG.md
```

## Ejecución Local (se actualizará tras Fase 5 y Fase 9)
### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Datos Reales vs. Datos Demostrativos
- **Datos reales:** Consultas a NASA POWER Daily Point API con metadatos de producto, coordenadas, periodo y fecha de recuperación.
- **Datos ilustrativos / provisionales:** Cualquier fixture de respaldo o parámetro agronómico no validado localmente se etiqueta explícitamente como `DEMO DATA`, `SIMULADO` o `provisional`.
- HaiLex es una herramienta exploratoria de apoyo y **no sustituye asesoría agronómica local**.
