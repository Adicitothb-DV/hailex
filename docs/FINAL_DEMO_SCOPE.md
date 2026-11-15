# HaiLex — estado real de la demo de monitoreo

Prototipo local de hackathon; no es un servicio de producción ni un diagnóstico agronómico.
Actualización: 15 de noviembre de 2026. El documento maestro exterior conserva requisitos
no terminados; este archivo describe lo efectivamente implementado.

## Flujo implementado

1. Dashboard y Earth Explorer conservan ubicación y contexto.
2. Parcel Monitoring usa Terra Draw y MapLibre para dibujar, seleccionar, mover vértices
   y borrar un polígono. El GeoJSON se guarda en localStorage, no es linde legal.
3. FastAPI valida estructura, autointersección, 500 vértices y máximo 500 ha; área y
   perímetro se calculan geodésicamente WGS84. No se verifica pertenencia municipal.
4. Earth Search STAC v1, colección `sentinel-2-l2a`, selecciona hasta 20 escenas de la
   primera página con filtro de nubes y assets requeridos. Acceso público sin credenciales;
   puede fallar o carecer de imágenes. No se aceptan URLs de assets del usuario.
5. Rasterio lee COG públicos por ventanas, limita dimensiones y tiempo HTTP, y remuestrea
   al grid geográfico del AOI. Se conservan clases SCL 4, 5, 6; nubes y otros son transparentes.
   RGB usa B04/B03/B02. NDVI = (B08−B04)/(B08+B04), bandas nativas 10 m; NDMI =
   (B08−B11)/(B08+B11), B11 20 m y salida de tamaño aproximado 20 m. Celdas sin datos,
   denominador cero y nubes no cuentan. Cobertura <70 %: `insufficient_data`.
6. NDVI describe verdor relativo; NDMI es un proxy del agua en vegetación, no humedad
   de suelo. La capa permite orientar una inspección, no identificar automáticamente causas.
7. El reporte local muestra estadísticas y permite descargar JSON y consultar NASA POWER
   para el centro aproximado y los 30 días previos. POWER es contexto regional; escala,
   unidades, faltantes y fecha son informados. La consulta de clima puede fallar.
8. Agricultural Context lee el libro local y mantiene ciclo, modalidad y las columnas
   `Preciomediorural`, `Precio` y cociente valor/volumen separadas. No se confirma la
   procedencia original ni el diccionario monetario. Sin pronóstico confiable.

## Prueba real y evidencia

- Escena `S2B_14QLH_20261114_0_L2A`, adquisición 2026-11-14 17:28:13 UTC,
  nubes a nivel de escena 15.988789 %. Prueba interactiva de polígono de demostración,
  no propiedad identificada: 196 píxeles NDVI y 49 NDMI, 100 % de cobertura válida
  en ambos; medianas 0.119 y -0.041 respectivamente. Son valores de este AOI/escena,
  no recomendaciones generales. NASA POWER respondió durante la prueba.
- Capturas: `frontend/evidence/monitoring-ndmi.png` y `frontend/evidence/agriculture.png`.
- Libro: 155 filas, 2015–2020 ausentes, 2 registros de pérdida; SHA-256
  `14ab095a9c5f0661bbd1d569c4dac968918425626fe5836d87c6645dffd9fc6f`.
- El punto denominado Villas del Marqués es el nombre indicado por el equipo. Las fuentes
  previas identificaron las mismas coordenadas con La Cañada; discrepancia no resuelta.

## Limitaciones abiertas

- No hay comparación temporal, segmentación/vectorización de zonas o lista geográfica
  automatizada de inspección. No hay gráficos SIAP ni filtro de año; tabla descriptiva.
- Cache local sin TTL ni limpieza automática; siempre requiere STAC antes de reutilizar
  un análisis y no hay selector de resultados históricos desconectado. Un solo worker.
- Sin paginación STAC, sin CDSE OAuth, GIBS, SMAP ni sequía. Servicio externo best-effort.
- Hay incertidumbre conocida en metadatos de escala/offset Earth Search; se aceptan solo
  escenas con `earthsearch:boa_offset_applied=true`, se usa escala publicada y offset 0.
  No se ha validado independientemente con un segundo proveedor.
- No se ha completado una auditoría formal de accesibilidad, precisión cartográfica,
  rendimientos bajo carga, ni validación agronómica. No se predicen rendimientos/precios.

## Ejecución

En terminal 1, PowerShell:

```powershell
Set-Location 'C:\Users\Alex\Downloads\hailex\backend'
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.lock
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

En terminal 2, con Node 24 compatible:

```powershell
Set-Location 'C:\Users\Alex\Downloads\hailex\frontend'
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Abrir `http://127.0.0.1:5173`. El Excel original debe permanecer en
`backend/data/raw/siap/Consolidado_El_Marques_Colon_Cultivos.xlsx`; si falta se informa
`source_file_missing`. No se necesitan credenciales para Sentinel-2 o POWER.

Pruebas: `python -m pytest -q`, `python -m ruff check .` desde backend; `npm.cmd run
typecheck`, `lint`, `format:check`, `build`, `test:ui` y `test:monitoring` desde frontend.
Las pruebas de navegador necesitan ambos servidores y Chrome/Edge; `test:monitoring`
depende de proveedores reales y no debe confundirse con pruebas unitarias offline.