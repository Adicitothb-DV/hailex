# HaiLex — ejecución local

Esta guía contiene los comandos para instalar y ejecutar HaiLex desde cualquier PC con Windows, macOS o Linux. Los comandos suponen que ya clonaste el repositorio y ejecutas las instrucciones desde la carpeta raíz `hailex/`.

## Requisitos

- Git.
- Python **3.13** (backend; compatible con las dependencias nativas geoespaciales incluidas).
- Node.js **24.x** y npm **11.x**; los rangos están definidos en `frontend/package.json`.
- Conexión a internet para instalar dependencias y consultar servicios externos/mapas.

Comprueba las versiones:

```bash
git --version
python --version
node --version
npm --version
```

En Windows, si `python` no está en PATH, usa `py -3.13` en los comandos Python. En macOS/Linux quizá debas usar `python3.13`.

## 1. Obtener el proyecto

Si todavía no tienes una copia local:

```bash
git clone https://github.com/Adicitothb-DV/hailex.git
cd hailex
```

Si ya lo clonaste, entra a esa carpeta y actualiza la rama:

```bash
git pull
```

## 2. Instalar el backend

Crea el entorno virtual desde la carpeta raíz:

```bash
python -m venv backend/.venv
```

Actívalo según tu sistema operativo:

**Windows PowerShell:**

```powershell
.\backend\.venv\Scripts\Activate.ps1
```

Si PowerShell impide activar scripts, no hace falta cambiar la política: usa directamente `backend\.venv\Scripts\python.exe` en lugar de `python` en los comandos siguientes.

**Windows CMD:**

```bat
backend\.venv\Scripts\activate.bat
```

**macOS / Linux (bash/zsh):**

```bash
source backend/.venv/bin/activate
```

Instala las dependencias fijadas por el proyecto:

```bash
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.lock
```

El archivo `backend/pyproject.toml` define los grupos de dependencias, pero el proyecto aún no se instala como paquete editable; no uses `pip install -e .`.

## 3. Instalar el frontend

Abre una segunda terminal en la raíz del proyecto y ejecuta:

```bash
cd frontend
npm ci
```

`npm ci` instala las versiones del `package-lock.json`. Si el lockfile no está presente o necesitas regenerar dependencias localmente, usa `npm install`.

## 4. (Opcional) Configurar integraciones

El backend puede iniciarse sin archivo `.env`. NASA POWER y algunas funciones de mapa usan servicios públicos. Para habilitar integraciones que requieren credenciales, crea `backend/.env` (no lo subas a Git) y añade solo las claves que tengas:

```dotenv
GROQ_API_KEY=tu_clave_de_groq
FISH_AUDIO_API_KEY=tu_clave_de_fish_audio
```

- `GROQ_API_KEY`: habilita el asesor conversacional.
- `FISH_AUDIO_API_KEY`: habilita síntesis de voz.
- La URL de la API que usa el frontend puede cambiarse creando `frontend/.env.local` con `VITE_API_BASE_URL=http://127.0.0.1:8000`.

Por defecto, el frontend ya apunta a `http://127.0.0.1:8000`. El backend acepta por defecto los orígenes locales `http://localhost:5173` y `http://127.0.0.1:5173`. Si cambias el origen de Vite, configura `CORS_ORIGINS` en `backend/.env` con una lista separada por comas de orígenes completos, sin rutas ni comodines.

## 5. Ejecutar HaiLex

Se necesitan **dos terminales**. En ambas, parte de la raíz del repositorio.

### Terminal 1 — backend

```bash
cd backend
```

Activa el entorno virtual si aún no está activo:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
source .venv/bin/activate
```

Inicia FastAPI:

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Sin activar el entorno también puedes invocar el intérprete directamente:

```powershell
# Windows PowerShell / CMD
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```bash
# macOS / Linux
.venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Terminal 2 — frontend

```bash
cd frontend
npm run dev
```

Abre la URL que muestre Vite; normalmente es `http://localhost:5173`. También se puede usar `http://127.0.0.1:5173`.

La documentación interactiva de la API está en `http://127.0.0.1:8000/docs`; OpenAPI, en `http://127.0.0.1:8000/openapi.json`. `GET /api/v1/health` comprueba que la API responde, pero no verifica la disponibilidad de NASA u otros proveedores.

## 6. Pruebas y verificaciones opcionales

### Backend

Ejecuta desde la raíz con el entorno virtual activo:

```bash
python -m pytest -q
ruff check backend
```

O entra a `backend/` y ejecuta:

```bash
cd backend
python -m pytest -q
ruff check .
```

### Frontend

Desde `frontend/`:

```bash
npm run typecheck
npm run lint
npm run build
npm run format:check
npm run test:i18n
```

Las pruebas de navegador automatizadas requieren Google Chrome o Microsoft Edge instalado, además de tener backend y frontend ejecutándose en las direcciones predeterminadas. Configura `CHROME_PATH` si el navegador no se encuentra automáticamente.

```bash
npm run test:ui
npm run test:monitoring
npm run test:preferences
```

`npm run test:ui:v1` ejecuta la prueba heredada del shell anterior. Las pruebas de navegador pueden consultar APIs externas y no son equivalentes a las pruebas unitarias.

## 7. Herramientas de datos opcionales

Estos comandos regeneran archivos versionados/locales; no son necesarios para iniciar la aplicación. Ejecútalos desde `backend/` con el entorno virtual activo:

```bash
# Procesar el workbook SIAP local y generar tablas e informes
python -m scripts.data_pipeline.run_siap_pipeline

# Construir las tablas climáticas históricas y el panel combinado
python -m scripts.data_pipeline.run_climate_pipeline

# Sincronizar límites municipales validados desde OpenStreetMap
python -m scripts.sync_agroalert_boundaries
```

El pipeline climático puede depender de snapshots disponibles y/o de conectividad a NASA POWER. El script de límites conserva los datos locales si no logra obtener una geometría válida. Revisa los informes y advertencias generados antes de usar los datos como evidencia agronómica.

## Solución de problemas

- **Puerto ocupado:** cambia el puerto de Uvicorn y actualiza `VITE_API_BASE_URL`; para el frontend, ejecuta `npm run dev -- --port 5174` y añade el origen correspondiente a `CORS_ORIGINS`.
- **No conecta el frontend con la API:** confirma que ambos procesos sigan ejecutándose, que la URL de API sea correcta y que CORS incluya el origen exacto del navegador.
- **No se encuentra Python o Node:** instala las versiones requeridas y reinicia la terminal para refrescar PATH. En Windows, prueba `py -3.13`.
- **Instalación geoespacial falla:** confirma que estás usando Python 3.13 y un entorno virtual limpio; luego repite la instalación con `python -m pip install -r backend/requirements.lock`.
- **Funciones de IA no disponibles:** configura las claves opcionales en `backend/.env` y reinicia Uvicorn. El resto de la aplicación puede iniciarse sin ellas.
- **Datos externos no disponibles:** clima, escenas, teselas de mapa y voz dependen de conectividad y proveedores externos; revisa las advertencias en pantalla.
