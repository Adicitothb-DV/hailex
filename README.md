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
- **Backend:** CPython 3.13 x64, FastAPI, Pydantic, HTTPX, Pandas, NumPy, Uvicorn, Pytest, Ruff.
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

## Ejecución Local
### Backend
Fase 5 implementa solo infraestructura y `GET /api/v1/health`; los módulos de negocio
descritos arriba son alcance previsto, no funciones terminadas. Instalación detallada:
`C:\Users\Alex\Downloads\hailex\backend\README.md`.

```powershell
Set-Location 'C:\Users\Alex\Downloads\hailex\backend'
# Si el entorno no existe: python -m venv .venv (usando CPython 3.13 x64).
& '.\.venv\Scripts\python.exe' -m pip install -r 'C:\Users\Alex\Downloads\hailex\backend\requirements.lock'
& '.\.venv\Scripts\python.exe' -m uvicorn app.main:app --reload
```

Swagger `/docs`, OpenAPI `/openapi.json`, health `/api/v1/health` en localhost:8000.
Sin `.env` obligatorio; CORS local configurable. Pruebas: `python -m pytest -q` desde
backend usando `.venv`. No utilizar `pip install -e .`: no hay distribución empaquetada.

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
