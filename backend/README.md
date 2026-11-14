# HaiLex Backend (FastAPI)

## Estado

BE-02 prepara únicamente el entorno y las herramientas. No existen todavía la aplicación
FastAPI, endpoints, cliente NASA, catálogo ni motor de rotaciones. No se incluyen datos demo.
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
Desarrollo: Pytest y Ruff. Se preparan ahora; su presencia no implica funciones implementadas.

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

**Por ahora Pytest no encuentra pruebas y devuelve código 5**: no representa pruebas
aprobadas. Ruff puede no encontrar archivos Python; eso tampoco valida funcionalidad.
La comprobación de FastAPI es el comando de importación/versión anterior, no `fastapi --version`.

La comprobación adicional en memoria con `TestClient` funcionó, pero Starlette 1.10.0
advierte que su integración con HTTPX está deprecada. No se añadió `httpx2`: queda
registrado para decidir el enfoque de pruebas HTTP al implementar la aplicación.
No es un fallo de importación ni de `pip check`.

Cuando una fase posterior implemente `app.main:app`, el comando de desarrollo será:

```powershell
Set-Location 'C:\Users\Alex\Downloads\hailex\backend'
& '.\.venv\Scripts\python.exe' -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**No ejecutarlo todavía:** `app.main` aún no existe.

## Variables de entorno y seguridad

`C:\Users\Alex\Downloads\hailex\backend\.env.example` documenta las variables previstas.
Todavía no hay cargador de configuración: instalar Pydantic Settings no activa esa plantilla.
No se ha creado `.env`, ni se garantiza que Uvicorn lea `APP_PORT` automáticamente.
En una fase posterior se validarán timeout, CORS y configuración NASA.

`.venv`, `.env` y cachés están excluidos por las reglas Git del repositorio.
Versionar `pyproject.toml` y `requirements.lock`, nunca el entorno ni credenciales.
