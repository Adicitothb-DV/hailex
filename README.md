# HaiLex

HaiLex es una aplicación web de monitoreo y análisis agrícola para explorar una ubicación o parcela, consultar datos climáticos y satelitales, y revisar indicadores de apoyo a decisiones. Combina una interfaz React con una API FastAPI y presenta advertencias cuando los datos o los métodos son aproximados, simulados o no validados.

El proyecto fue desarrollado para NASA Space Apps Challenge 2026, sede Querétaro, en el reto *Field Shift: Adapting Farms with NASA Data*.

> **Alcance y limitaciones:** HaiLex es una herramienta exploratoria. Sus índices y recomendaciones no sustituyen una visita de campo ni asesoría agronómica local. Los límites municipales y los polígonos dibujados por usuarios no deben interpretarse como linderos legales. Los indicadores de plagas son simulaciones, no probabilidades ni diagnósticos.

## Funcionalidades implementadas

- **Dashboard:** resume la ubicación activa, el estado de conexión con la API, los datos climáticos disponibles, las fuentes y el estado del análisis de parcela.
- **Earth Explorer:** muestra un mapa interactivo con MapLibre; permite seleccionar un punto en el mapa o ingresar coordenadas. El mapa proporciona contexto geográfico, no capas científicas.
- **Climate Intelligence:** consulta series diarias de temperatura, precipitación y radiación solar mediante NASA POWER. Presenta unidades, fechas, metadatos de variables, valores faltantes y procedencia.
- **Monitoreo de parcela:** permite validar un polígono, buscar escenas Sentinel-2 L2A, procesar imágenes y consultar capas de color verdadero, NDVI y NDMI. Los análisis se archivan localmente en el backend.
- **AgroAlert:** ofrece consultas de humedad estimada de suelo para los municipios admitidos, datos meteorológicos por sector, límites municipales y evaluación ilustrativa de indicadores de plagas.
- **Rotation Studio:** compara transiciones de familias de cultivos mediante reglas deterministas locales. No usa los índices satelitales para ordenar cultivos ni diagnosticar causas.
- **Analysis & Insights:** presenta contexto agrícola y permite consultar al asesor HaiLex. La respuesta de IA requiere una clave de Groq; la voz y la investigación web dependen de su configuración correspondiente.
- **Pest Monitor:** interfaz de monitoreo con mapas y resultados ilustrativos. La interpretación debe respetar las advertencias de datos y limitaciones mostradas por la aplicación.
- **Interfaz bilingüe:** traducciones para español de México e inglés de Estados Unidos.

## Arquitectura

```text
hailex/
├── backend/
│   ├── app/
│   │   ├── analysis/       # Cálculos de rotación, geometría e indicadores de plagas
│   │   ├── api/routes/     # Endpoints de health, clima, campos, AgroAlert y asesoría
│   │   ├── core/           # Configuración, errores, logging y middleware
│   │   ├── data/           # Catálogo de cultivos y geometrías locales
│   │   ├── schemas/         # Modelos y contratos de entrada/salida
│   │   └── services/       # NASA POWER, Sentinel-2, clima, agricultura y asesoría
│   ├── data/
│   │   ├── raw/             # Fuentes de datos originales para pipelines
│   │   └── processed/       # Datos derivados, informes y resultados locales
│   ├── scripts/             # Pipelines de datos y sincronización de límites
│   ├── tests/               # Pruebas de API, servicios y pipelines
│   └── pyproject.toml       # Dependencias y configuración de pytest/Ruff
└── frontend/
    ├── public/              # Imágenes y recursos estáticos
    ├── src/
    │   ├── app/             # Contexto, navegación y layout
    │   ├── components/      # Componentes compartidos
    │   ├── features/        # Pantallas y módulos de producto
    │   ├── i18n/            # Traducciones es-MX y en-US
    │   ├── services/        # Cliente HTTP de la API
    │   ├── styles/          # Estilos globales y de la interfaz
    │   └── test/            # Pruebas de interfaz ejecutables con Node
    └── package.json         # Scripts y dependencias de Vite
```

### Flujo de datos

La interfaz inicia en `frontend/src/main.tsx`, monta `App` y utiliza `AppContext` para compartir la ubicación y el estado de las consultas. `App.tsx` carga las pantallas de `features/` según la navegación. Las solicitudes pasan por `frontend/src/services/api.ts` o, para AgroAlert, por su cliente específico.

La API se crea en `backend/app/main.py`; `backend/app/api/router.py` registra las rutas bajo `/api/v1`. Los endpoints delegan el trabajo a servicios y módulos de análisis. Algunas funciones consultan proveedores externos; otras calculan resultados localmente o leen datos versionados. Las respuestas pueden incluir advertencias para hacer explícitas las limitaciones.

## Fuentes de datos y límites

- **NASA POWER:** series climáticas diarias por punto y estimaciones de humedad de suelo basadas en grilla. No son mediciones directas de la parcela.
- **Sentinel-2 L2A:** escenas encontradas mediante Earth Search y assets COG para generar visualizaciones e índices NDVI y NDMI. NDMI es un proxy de agua en vegetación; no representa humedad directa del suelo.
- **Datos SIAP y archivos procesados:** el repositorio incluye datos agrícolas originales y derivados, además de scripts de carga, normalización, agregación y validación. Su presencia no implica que todos esos archivos alimenten las pantallas en tiempo real.
- **Límites municipales:** hay geometrías locales para AgroAlert y un script de sincronización con OpenStreetMap. Son límites de referencia y pueden requerir actualización.
- **Indicadores de plagas:** son ilustrativos y no constituyen una predicción validada.
- **Asesoría con IA, voz e investigación web:** son integraciones opcionales configurables; su disponibilidad depende de credenciales y servicios externos.

## Requisitos

- **Backend:** Python 3.13; las dependencias de ejecución y desarrollo se declaran en `backend/pyproject.toml`. El repositorio también incluye `backend/requirements.lock`.
- **Frontend:** Node.js `>=24.12.0 <25` y npm `>=11.6.2 <12`, según `frontend/package.json`.
- Acceso a internet para consultar los proveedores externos y cargar los recursos del mapa.

## Ejecución local

Abre dos terminales desde la raíz del repositorio.

### Backend — PowerShell

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.lock
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

La documentación interactiva de FastAPI queda disponible en `http://127.0.0.1:8000/docs`. El endpoint `/api/v1/health` comprueba la disponibilidad del proceso; no verifica los proveedores externos.

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Abre la dirección que indique Vite en la terminal (por defecto, `http://localhost:5173`). Para apuntar la interfaz a otra URL de API, configura `VITE_API_BASE_URL`; si no se define, el cliente usa `http://127.0.0.1:8000`.

El backend permite por defecto los orígenes locales `http://localhost:5173` y `http://127.0.0.1:5173`. Ajusta `CORS_ORIGINS` si ejecutas el frontend desde otro origen.

### Integraciones opcionales

La API lee la configuración desde variables de entorno y desde `backend/.env` cuando ese archivo existe. No se requiere una clave para iniciar la aplicación, pero algunas integraciones sí la necesitan:

- `GROQ_API_KEY`: chat del asesor.
- `FISH_AUDIO_API_KEY`: síntesis de voz.
- `VITE_API_BASE_URL`: URL base del backend para el frontend.

Consulta `backend/app/core/config.py` para las opciones y valores predeterminados. No subas claves ni secretos al repositorio.

## Pruebas y verificaciones

### Backend

Desde `backend/`, con el entorno virtual activo:

```bash
python -m pytest -q
ruff check .
```

### Frontend

Desde `frontend/`:

```bash
npm run typecheck
npm run lint
npm run build
npm run test:ui
npm run test:monitoring
npm run test:i18n
npm run test:preferences
```

También existen `npm run test:ui:v1` y pruebas específicas en `frontend/src/test/`. Revisa cada script antes de asumir que cubre la interfaz actual.

## Archivos de datos y elementos de mantenimiento

- `backend/data/raw/` conserva fuentes originales; `backend/data/processed/` contiene salidas de pipelines e informes de calidad. Los scripts relacionados están en `backend/scripts/data_pipeline/`.
- `backend/app/data/queretaro_municipios.geojson` es el archivo local de límites; `queretaro_municipios.backup.geojson` es una copia de respaldo, no la fuente primaria usada por las rutas.
- Los archivos `.gitkeep` son marcadores vacíos para mantener directorios en Git; no implementan funcionalidad.
- `COMANDS.md` contiene instrucciones de ejecución con rutas locales de Windows. Es una nota específica de un entorno y puede requerir ajustes; las instrucciones generales están en este README.
- Las pruebas con nombres como `shell.browser.mjs` o `test:ui:v1` se mantienen como pruebas separadas. Su nombre por sí solo no confirma que sean código muerto.

## Desarrollo responsable

Al cambiar una función, documenta qué datos consume, si consulta un proveedor o usa datos locales, qué devuelve y cuáles son sus limitaciones. Mantén sincronizadas las advertencias entre API e interfaz; distingue explícitamente datos reales, simulados, provisionales y archivados.
