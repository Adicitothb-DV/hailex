# HaiLex Backend (FastAPI)

## Pipeline SIAP offline — Fase 7B

Colocar el XLSX original sin modificar en
`C:\Users\Alex\Downloads\hailex\backend\data\raw\siap\Consolidado_El_Marques_Colon_Cultivos.xlsx`.
La hoja requerida es `Consolidado`. Instalar el lock descrito abajo: incorpora openpyxl
para leer XLSX (y su dependencia et-xmlfile). Ejecutar desde backend:

```powershell
Set-Location 'C:\Users\Alex\Downloads\hailex\backend'
& '.\.venv\Scripts\python.exe' -m pip install -r '.\requirements.lock'
& '.\.venv\Scripts\python.exe' -m scripts.data_pipeline.run_siap_pipeline
& '.\.venv\Scripts\python.exe' -m pytest -q
& '.\.venv\Scripts\python.exe' -m ruff check .
```

Resultados regenerables en `C:\Users\Alex\Downloads\hailex\backend\data\processed\siap`:
observaciones, resumen por ciclo/modalidad, serie colapsada, reporte y manifiesto.
El origen se lee sin escribirlo y su SHA-256 está en el manifiesto. Las filas
rechazadas siguen en observaciones; los grupos afectados se suprimen en agregados.
`accepted` significa sin alertas automáticas, no validación oficial. `warning` requiere
revisión; `rejected` indica clave, categoría o medida inválida y no borra la fila.

`Preciomediorural` se conserva separado de `Precio`; `official_pmr` identifica solo el
nombre del campo, no certifica el consolidado. `workbook_price_unverified` no implica
PMR oficial. La diferencia absoluta mayor a 0.005 requiere revisión; con producción cero
el precio analítico es nulo. Un agregado de precio es suma de valores dividida entre suma
de volúmenes, no promedio simple. La tabla colapsada mezcla explícitamente ciclo y
modalidad y es provisional: pueden existir solapamientos; no usarla como dato validado.
Unidades monetarias, equivalencia oficial, calendarios y procedencia original pendientes;
2015–2020 no se imputan. CSV y reporte son deterministas; el manifiesto registra hora de
ejecución, por lo que cambia al regenerar. No se consulta NASA ni se crean endpoints.

## Estado

Fase 6 incorpora cliente NASA POWER, clima, fuentes, caché y snapshots en memoria,
además de health, OpenAPI/Swagger, configuración, CORS, errores uniformes y logging.
Catálogo y motor de rotaciones no están implementados. No se incluyen datos demo.
El contrato compartido está en `C:\Users\Alex\Downloads\hailex\docs\API_CONTRACT.md`.

## Requisitos y decisiones

- CPython **3.13 x64**; entorno inicial validado con **3.13.17** en Windows.
- `pip >= 25.1` para instalar grupos de dependencias; entorno inicial con `pip 26.2.2`.
- Un único flujo: `venv` + `pip`; sin uv, Poetry ni Conda.
- `pyproject.toml` declara dependencias directas y configura Pytest/Ruff. No declara un
  paquete instalable: usar `--group`, no `pip install .`.
- `requirements.lock` es la instantánea generada con `pip freeze` del entorno de desarrollo
  completo (directas y transitivas), para CPython 3.13 en Windows x64. No es otro gestor ni
  un archivo que deba editarse manualmente; no incluye hashes de los artefactos.
- No se instalan extras `standard`: no necesitamos plantillas, formularios, correo,
  integración cloud ni una CLI adicional de FastAPI en esta fase.

Dependencias de ejecución: FastAPI y Uvicorn (API/ASGI), Pydantic v2 y Pydantic Settings
(validación/configuración), HTTPX (NASA), Pandas y NumPy (series y cálculos del MVP).
Desarrollo: Pytest y Ruff. HTTPX consulta POWER; Pandas/NumPy están disponibles para
fases posteriores y su presencia no implica reglas agronómicas implementadas.

## Preparación en PowerShell

Las rutas siguientes corresponden a esta laptop; adaptar la raíz al clonar en otra máquina.
No es necesario activar el entorno ni cambiar la política de ejecución de PowerShell.

```powershell
Set-Location 'C:\Users\Alex\Downloads\hailex\backend'
# Ejecutar solo si .venv no existe. Comprobar primero la ruta del Python instalado.
& 'C:\Users\Alex\AppData\Local\Programs\Python\Python313\python.exe' -m venv 'C:\Users\Alex\Downloads\hailex\backend\.venv'

# Reproducir el entorno validado:
& '.\.venv\Scripts\python.exe' -m pip install -r 'C:\Users\Alex\Downloads\hailex\backend\requirements.lock'
& '.\.venv\Scripts\python.exe' -m pip check
```

Para resolver de nuevo desde las declaraciones (solo al actualizar dependencias, revisar el diff):

```powershell
Set-Location 'C:\Users\Alex\Downloads\hailex\backend'
& '.\.venv\Scripts\python.exe' -m pip install --group dev
# Solo ejecución, sin herramientas de desarrollo: --group runtime
```

Tras una actualización deliberada, validar y regenerar `requirements.lock` con `pip freeze`
desde un entorno limpio, usando UTF-8. No congelar paquetes de una instalación global.

## Intérprete en VS Code

En **Python: Select Interpreter → Enter interpreter path**, seleccionar:
`C:\Users\Alex\Downloads\hailex\backend\.venv\Scripts\python.exe`.
La selección visual del editor es independiente del intérprete usado por estos comandos.
Si la terminal conserva el PATH previo a instalar Python, abrir una terminal nueva o seguir
usando las rutas explícitas; no es necesario modificar PATH para este proyecto.

## Verificaciones y comandos

Ejecutar desde `C:\Users\Alex\Downloads\hailex\backend`:

```powershell
& '.\.venv\Scripts\python.exe' -c 'import sys; print(sys.executable); print(sys.version); assert sys.prefix != sys.base_prefix'
& '.\.venv\Scripts\python.exe' -c 'import fastapi, uvicorn, pydantic, pydantic_settings, httpx, pandas, numpy; print(fastapi.__version__)'
& '.\.venv\Scripts\python.exe' -m uvicorn --version
& '.\.venv\Scripts\python.exe' -m pytest --version
& '.\.venv\Scripts\python.exe' -m ruff --version
& '.\.venv\Scripts\python.exe' -m pip check
& '.\.venv\Scripts\python.exe' -m ruff check --no-cache .
& '.\.venv\Scripts\python.exe' -m ruff format --check --no-cache .
& '.\.venv\Scripts\python.exe' -B -m pytest -p no:cacheprovider
```

La suite incluye regresión foundation y pruebas climáticas sin servicios externos. Utiliza
HTTPX ASGITransport y asyncio, no TestClient ni paquetes nuevos. Validación obligatoria:

```powershell
Set-Location 'C:\Users\Alex\Downloads\hailex\backend'
& '.\.venv\Scripts\python.exe' -m pytest -q
& '.\.venv\Scripts\python.exe' -m ruff check app tests
& '.\.venv\Scripts\python.exe' -m ruff format --check app tests
& '.\.venv\Scripts\python.exe' -m pip check
```

## Iniciar servidor y consultar Swagger

Sin activar el entorno (recomendado si PowerShell bloquea scripts):

```powershell
Set-Location 'C:\Users\Alex\Downloads\hailex\backend'
& '.\.venv\Scripts\python.exe' -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1
```

También puede activar el entorno en una terminal autorizada:

```powershell
Set-Location 'C:\Users\Alex\Downloads\hailex\backend'
& 'C:\Users\Alex\Downloads\hailex\backend\.venv\Scripts\Activate.ps1'
python -m uvicorn app.main:app --reload
```

No se cambia la política de ejecución del sistema. Si la activación está bloqueada,
use el ejecutable explícito del ejemplo anterior.

- Health: `http://127.0.0.1:8000/api/v1/health`.
- Swagger: `http://127.0.0.1:8000/docs`.
- OpenAPI: `http://127.0.0.1:8000/openapi.json`.
- Versión del servicio `0.1.0`, contrato `1.0.0`; health solo comprueba la aplicación.
- Clima: `http://127.0.0.1:8000/api/v1/climate/series?latitude=20.60656972&longitude=-100.33109667&start_date=2025-01-01&end_date=2025-12-31`.
- Fuentes: `http://127.0.0.1:8000/api/v1/sources`. No hay alias `/health`; crops y compare aún devuelven 404.

## Variables de entorno y seguridad

`C:\Users\Alex\Downloads\hailex\backend\.env.example` documenta las variables previstas.
Settings carga opcionalmente `.env` desde la carpeta backend, en UTF-8; las variables
de entorno prevalecen. No se creó `.env` ni se necesita para ejecutar valores locales.

| Variable | Estado en Fase 5 |
|---|---|
| APP_ENV | development/test/production, desarrollo por defecto; debug HTTP siempre desactivado. |
| APP_PORT | Entero 1..65535, default 8000; validado pero Uvicorn CLI requiere `--port` explícito para cambiarlo. |
| CORS_ORIGINS | CSV de orígenes HTTP(S) sin ruta, credenciales ni wildcard; default localhost:5173 y 127.0.0.1:5173. |
| NASA_POWER_BASE_URL | Solo endpoint HTTPS oficial Daily Point; por defecto la URL oficial. |
| NASA_POWER_TIMEOUT_SECONDS | Timeout HTTPX positivo; default 15 segundos. |
| CLIMATE_CACHE_TTL_SECONDS | TTL de caché por defecto 1800 segundos, independiente del snapshot. |
| CLIMATE_CACHE_MAX_ENTRIES | Límite de entradas de caché, por defecto 128. |
| CLIMATE_SNAPSHOT_MAX_ENTRIES | Máximo de snapshots activos, por defecto 1024; saturación devuelve 503. |

CORS permite GET/POST y preflight OPTIONS, Content-Type, sin credenciales. Expone
X-Request-ID para lectura por frontend. Nuevos orígenes requieren configuración explícita;
un origen rechazado no recibe Access-Control-Allow-Origin (CORS no bloquea clientes no navegador).

Errores: `error: {code, message, request_id, fields}`; 400 para JSON inválido, 422 para
validación, 404/405 para rutas/métodos y 500 seguro para fallos inesperados.
Cada petición genera UUID propio en X-Request-ID y request.state, sin confiar en el ID
enviado por cliente. Los logs de aplicación incluyen método, ruta de plantilla, estado,
duración y request ID; no cuerpos, headers, queries ni mensajes de excepción sensibles.
Los fallos internos registran tipo y ubicaciones de frames, sin variables locales.
El log de acceso estándar Uvicorn tiene su destino redactado para no filtrar queries.

Arquitectura real: `app/main.py` compone configuración, router, handlers y middleware;
`app/api/routes/health.py` solo liveness; `app/schemas/common.py` modelos de wire;
`app/core/` configuración, errores, contexto/logging y CORS. Véase documentación de
arquitectura y pruebas en `C:\Users\Alex\Downloads\hailex\docs`.

`.venv`, `.env` y cachés están excluidos por las reglas Git del repositorio.
Versionar `pyproject.toml` y `requirements.lock`, nunca el entorno ni credenciales.

## Clima, procedencia y almacenamiento temporal

La ruta acepta cualquier latitud/longitud válida y fechas ISO no futuras hasta 366 días
inclusivos. Solicita `T2M` (`C`), `PRECTOTCORR` (`mm/day`) y `ALLSKY_SFC_SW_DWN`
(`MJ/m^2/day`), AG y UTC. Normaliza sentinel declarado y fechas ausentes a null,
conserva ceros y negativos válidos y devuelve conteos y límites por variable. La resolución
meteorológica es 0.5° × 0.625°; radiación 1° × 1°. Son productos regionales modelados o
estimados, no mediciones de parcela.

Cada respuesta crea snapshot inmutable de 30 minutos; se pierde al reiniciar. Cache hit
crea otro ID y conserva `retrieved_at`. Sin Redis, base de datos ni workers múltiples.
Si falla NASA, se usa un fixture real únicamente para las coordenadas y el año 2025
exactos de los dos puntos archivados; se identifica `historical_fixture` y se advierte
el fallo. No hay sustitución automática por datos simulados ni fixture para otros rangos.
No se necesita API key. Los timestamps se expresan en UTC.
