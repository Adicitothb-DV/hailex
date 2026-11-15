# DATA_SOURCES.md — Fuentes y procedencia de HaiLex

Investigación consultada el **14 de noviembre de 2026** (hora de México). `planned`
significa sin integración de producto; una consulta o fixture no implementa un servicio.
El usuario confirmó en Fase 6 conservar La Cañada como referencia municipal de El Marqués.

## Puntos oficiales independientes

| Región | ID de punto | Lugar | Latitud, longitud en grados decimales | Estado |
|---|---|---|---|---|
| `el_marques_queretaro` | `el_marques_reference_point` | La Cañada, cabecera de El Marqués | 20.60656972, -100.33109667 | verificado como cabecera |
| `colon_queretaro` | `colon_reference_point` | Colón, cabecera de Colón | 20.78832639, -100.04543056 | verificado como cabecera |

Tipo: `municipal_reference_point`; país México, estado Querétaro. Gobierno de
Querétaro/SEDESU, fichas municipales de El Marqués y Colón de octubre 2024 [1, 2],
consultadas 2026-11-14. Atribuyen coordenadas al Catálogo Único de INEGI, consultado
por la ficha el 2022-08-25. Dan respectivamente 20°36′23.651″N, 100°19′51.948″O y 20°47′17.975″N,
100°02′43.550″O; conversión aritmética a grados decimales, redondeada a 8 decimales.
Referencia adicional para La Cañada: INEGI, Archivo Histórico de Localidades, sin fecha
del recurso, consultado 2026-11-14:
https://www.inegi.org.mx/app/geo2/ahl/hacerPDF.do?cveGeo=220110001
El sistema es coordenadas geográficas latitud/longitud en grados; **datum específico de
las coordenadas de esta publicación: no verificado**. Se pasaron a POWER sin transformación;
no se afirma precisión geodésica ni transformación a EPSG:4326. La identificación oficial
como cabecera justifica cada punto dentro de su municipio, sin prueba poligonal independiente.
Ninguno es parcela agrícola ni caracteriza automáticamente todo el municipio.

## NASA POWER Daily Point: datos históricos reales, no en vivo

Integración de cliente, endpoint y normalizador: `implemented` (Fase 6). Fuente: NASA POWER,
Daily API, sin fecha de recurso; consultada 2026-11-14:
https://power.larc.nasa.gov/docs/services/api/temporal/daily/ ; tutorial:
https://power.larc.nasa.gov/docs/tutorials/service-data-request/api/ ; metodología:
https://power.larc.nasa.gov/docs/methodology/ ; meteorología y corrección de precipitación:
https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/ . Aplicabilidad:
cuadrículas que cubren ambos puntos, **no** mediciones locales de parcelas.

Solicitudes independientes a `https://power.larc.nasa.gov/api/temporal/daily/point`,
`community=AG`, `time-standard=UTC`, `format=JSON`, inicio `20250101`, fin `20251231`,
parámetros `T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN`. Cada manifiesto conserva la URL
completa, coordenadas enviadas, geometría devuelta, cabecera, respuesta HTTP, fecha UTC,
SHA-256 y conteos. La disponibilidad AG/daily y unidades se verificaron además en ambas
respuestas originales; los 365 días solicitados aparecen para cada parámetro.

| Parámetro AG diario | Descripción oficial | Unidad literal | Resolución nativa latitud × longitud | Naturaleza para estos payloads |
|---|---|---|---|---|
| `T2M` | Temperatura a 2 metros | `C` | 0.5° × 0.625° | `model`: reanálisis MERRA-2, asimila observaciones |
| `PRECTOTCORR` | Precipitación corregida | `mm/day` | 0.5° × 0.625° | `model`: forzamiento de precipitación MERRA-2 corregido con observaciones |
| `ALLSKY_SFC_SW_DWN` | Irradiancia solar de onda corta descendente en superficie, cielo total | `MJ/m^2/day` | 1° × 1° | `estimate`: SYN1DEG; modelo radiativo y observaciones satelitales |

Las resoluciones son de los productos, no precisión en el sitio. La respuesta identifica
fuentes `MERRA2` y `SYN1DEG`, sin asignación explícita por campo; la asignación anterior
se basa en la metodología NASA y queda sujeta a revisión del diccionario de parámetros.
`C` expresa grados Celsius. `MJ/m^2/day` es unidad de exposición diaria indicada por
el proveedor, no una medición directa. POWER puede actualizar datos históricos.

| Municipio | HTTP | Recuperado UTC | Devuelto | Válidos/faltantes por cada variable |
|---|---:|---|---|---|
| El Marqués | 200 | 2026-11-15T01:18:21.538798Z | 2025-01-01 a 2025-12-31 | 365/0 |
| Colón | 200 | 2026-11-15T01:18:22.165131Z | 2025-01-01 a 2025-12-31 | 365/0 |

En ambos payloads `header.fill_value` es `-999.0`; cero no es faltante. Sin advertencias
ni errores de proveedor observados. Las respuestas difieren en geometría; al comparar
series hay 362 fechas de temperatura y 268 de precipitación con valores distintos, y
cero fechas solares distintas. Esto es compatible con resolución espacial, no prueba
por sí solo qué celdas fueron seleccionadas. Directorios:
`backend/app/data/fixtures/nasa_power/el_marques_queretaro/` y
`backend/app/data/fixtures/nasa_power/colon_queretaro/`; cada `payload.json` es el cuerpo
original sin transformación, y `manifest.json` contiene procedencia. No son SIMULADOS.
Los datos originales pueden incluir el sentinel: no se modifica el payload.

Para Fase 6: conservar cero; convertir a null solo sentinel confirmado en cada respuesta,
verificar `-999` por producto; no tratar todos los números negativos como ausentes;
rechazar NaN/Infinity, ordenar y comprobar unicidad de fechas y contar válidos/faltantes
por parámetro. Implementado en Fase 6; la caché y los fixtures conservan recuperación original.

El 2026-11-15 UTC se consultaron ambos puntos mediante el servicio para 2025: las tres
series coincidieron con cada fixture correspondiente. Para 2026-10-01 a 2026-10-07,
ambos puntos devolvieron temperatura y precipitación completas y radiación sin valores
válidos; se muestran siete null y aviso, no se rellenan. No implica un fallo del proveedor.
La geometría POWER de los fixtures expresa el punto devuelto redondeado, no identifica
inequívocamente el polígono de la celda solar. Coincidencia de las 365 cifras solares y
resolución 1° son hechos comprobados; celda compartida es posible, no demostrada.

## Referencias territoriales, agrícolas y cartográficas

Todas consultadas 2026-11-14. Las cifras completas y su escala están en
`docs/AGRONOMIC_RULES.md`.

1. Gobierno de Querétaro/SEDESU, *El Marqués*, ficha de octubre 2024 (incluye avance
   SIAP 2024 y datos del Censo Agropecuario 2022 INEGI), municipio El Marqués:
   https://queretaro.gob.mx/documents/828910/1043660/El-Marques-octubre-2024.pdf/d4265ed8-cae2-42bb-dc66-37d349c587d1?t=1737666210805
2. Gobierno de Querétaro/SEDESU, *Colón*, ficha de octubre 2024 (incluye cierre 2023
   SIAP y Censo Agropecuario 2022), exclusivamente Colón:
   https://queretaro.gob.mx/documents/828910/1043660/Colon-Octubre-2024.pdf/0f050498-030c-8b98-60bd-a72bb467617d?t=1737666209701
3. SIAP, *Anuario Estadístico de la Producción Agrícola*, fecha no indicada, selección
   por municipio/cultivo/ciclo/régimen: https://nube.agricultura.gob.mx/cierre_agricola/ .
   SIAP, *Calendario agrícola*, fecha no indicada: https://nube.agricultura.gob.mx/calendario_agricola/ .
   Son fuentes de consulta, no datasets importados; falta extraer desgloses específicos.
4. Municipio de Colón, *Programa de Ordenamiento Ecológico Local*, documento técnico,
   noviembre 2017, aplicabilidad municipal:
   https://www.colon.gob.mx/include/pdf/informacion%20publica/articulo%2067/VI/PROGRAMAS/EL%20PROGRAMA%20DE%20ORDENAMIENTO%20ECOL%C3%93GICO%20LOCAL%20DE%20COL%C3%93N/Programa%20de%20Ordenamiento%20Ecol%C3%B3gico%20Local%20M.T..pdf
5. INEGI, *Edafología*, fecha no indicada, cobertura cartográfica nacional:
   https://www.inegi.org.mx/temas/edafologia/ . No se ha identificado serie, escala,
   fecha o clase edáfica aplicable a una parcela en El Marqués; no sustituye laboratorio.
6. CIMMYT/INIFAP, *Visita a la plataforma de investigación en INIFAP-Querétaro*, 2017,
   evidencia de plataforma en San Juan del Río, no municipal piloto:
   https://www.cimmyt.org/es/noticias/visita-a-la-plataforma-de-investigacion-en-inifap-queretaro/ .
7. FAO, *Crop water needs*, fecha no indicada, referencia general no local:
   https://www.fao.org/4/s2022e/s2022e02.htm ; taxonomía general:
   https://www.fao.org/4/s4314e/s4314e0x.htm .

## Fuentes gubernamentales locales identificadas — integración pendiente

El equipo informa que encontró información gubernamental local para una fase posterior;
sus archivos, títulos y metadatos aún deben incorporarse y verificarse con el equipo.
Inventario del repositorio: no se encontraron archivos gubernamentales locales PDF,
CSV, Excel, GeoJSON o SHP; `backend/app/data/fixtures/` contenía solo `.gitkeep` antes
de esta fase. Referencias externas anteriores son investigación, no conjuntos del equipo
integrados. Sin copia, transformación, ingestión ni cambios de API; estado `planned`.
