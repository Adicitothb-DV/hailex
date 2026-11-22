# HaiLex — Contrato API V1

## Lex: modelos alternativos — 2026-11-15

- `POST /api/v1/advisor/chat` intenta, en orden, GPT-OSS 120B, GPT-OSS 20B,
  Llama 3.3 70B y Llama 3.1 8B si hay cuota, permisos por modelo, indisponibilidad o
  timeout. En 401 se detiene. `model` indica el modelo que realmente contestó.
  GPT-OSS usa esquema JSON estricto; Llama usa JSON y validación Pydantic posterior.
- La búsqueda web sigue siendo una operación separada compartida por todos los modelos de
  respuesta; intenta GPT-OSS 120B y 20B, pero puede fallar por cuota o disponibilidad.
  El filtro de precios y sus limitaciones permanecen: no hay garantía de acceso o verificación.

## Monitor fitosanitario ilustrativo — 2026-11-15

- `GET /api/v1/agroalert/pests/sectors?municipality=...` devuelve localidades y cultivos
  ilustrativos y celdas Voronoi recortadas al límite local existente, no lindes oficiales.
- `GET /api/v1/agroalert/pests/weather?municipality=...` consulta T2M, RH2M, PRECTOTCORR
  y GWETTOP de NASA POWER por punto; lluvia solo si hay siete días completos, y valores
  faltantes quedan nulos. GWETTOP se expresa como porcentaje del índice, no humedad volumétrica.
- `POST /api/v1/agroalert/pests/evaluate` recibe municipio, filtro de cultivo y clima por ID;
  devuelve puntuaciones `data_type=simulation`, no validadas ni probabilidades. Cualquier
  variable requerida ausente produce `not_assessable`; el índice general requiere todas las
  plagas evaluables. Las fuentes no certifican cultivos ni presencia de plagas.

## Lex: investigación de fuentes — 2026-11-15

- `web_research.status=source_material_accessed` indica que Groq Browser Search devolvió
  trazas de páginas encontradas y abiertas; incluye hasta cuatro extractos acotados con URL.
  No certifica veracidad ni la independencia de afirmaciones. Se trata el texto externo como
  datos no confiables. HaiLex no accede directamente a URLs proporcionadas por el modelo.
- `price_independently_corroborated` es un filtro conservador que exige dos dominios y el mismo
  importe/unidad textual; no verifica producto, mercado, fecha ni propiedad de los dominios.
  El modelo debe cotejar esos campos y reconocer incertidumbre. La expresión no cubre todos
  los formatos y no proporciona una garantía de verificación: revisión humana imprescindible.
- El clasificador de intención puede omitir consultas; una cuota o fallo del proveedor produce
  error o información insuficiente. Errores `web_price_unverified` rechazan algunas cifras
  monetarias no corroboradas; el filtro no cubre todas las formas de expresar precios.

## Voz por idioma — 2026-11-15

- `POST /api/v1/advisor/tts` admite `locale` opcional (`es-MX` o `en-US`); si se omite
  conserva `es-MX`. Selecciona la voz configurada por idioma y envía el modelo configurado
  a Fish Audio. El idioma del turno se mantiene aunque cambie la interfaz durante la consulta.

## Preferencia de idioma de Lex — 2026-11-15

- `POST /api/v1/advisor/chat` acepta `locale` opcional, `es-MX` o `en-US`; clientes
  anteriores conservan `es-MX`. El locale guía la respuesta nueva, no modifica el historial
  ni los datos fuente. La salida real del modelo y Fish Audio no se han verificado en vivo.

## Lex parcial — 2026-11-15

- `POST /api/v1/advisor/chat` acepta `include_web` opcional. Para intención actual, una
  llamada independiente solicita Browser Search; conserva enlaces recibidos,
  marcadas `search_result_only`. La extracción de precios y verificación no están implementadas;
  no se envían afirmaciones no verificadas al modelo como hechos.
- `POST /api/v1/advisor/tts`: texto de hasta 1800 caracteres; Fish Audio REST devuelve MP3
  o errores tipados. API key solo backend. Sin WebSocket, streaming ni ASR de servidor.
- `GET /api/v1/advisor/config` informa capacidades y estado booleano de configuración sin
  exponer credenciales. Wake word depende del navegador y consentimiento del usuario.

## Asesor Groq — 2026-11-15

- `POST /api/v1/advisor/chat`: mensaje de hasta 4000 caracteres, región y cultivo opcionales,
  modalidad, ID satelital opcional, perfil declarado sin nombre y banderas por fuente.
  Responde con interpretación estructurada, contexto preparado, versión de prompt y modelo.
- `history` opcional conserva hasta dos intercambios completos (`user`/`assistant`), con
  límite total de 12000 caracteres; se trata como contexto no verificado. Cada turno vuelve
  a preparar las fuentes seleccionadas, sujeto a la caché y disponibilidad de cada servicio.
- NASA POWER consulta los 30 días anteriores al día UTC actual para puntos municipales; el
  consolidado SIAP filtra municipio/cultivo y conserva ciclo/modalidad por separado. La
  humedad SMAP/MERRA mantiene variable y unidad; Sentinel-2 no equivale a humedad del suelo.
- No hay previsión numérica validada, citas web actuales, herramientas de escritura ni
  fallback automático de modelo. Contexto y texto se envían a Groq; no usar en despliegue
  público multiusuario sin autenticación y controles adicionales.
- Errores tipados incluyen `groq_api_key_missing`, `groq_rate_limited`, `groq_auth_error`,
  `groq_timeout`, `groq_model_unavailable`, `groq_provider_error` y `groq_invalid_response`.

## Comparación limitada de familias — 2026-11-15

- `POST /api/v1/rotation-workspace/compare`: acepta `previous_crop` (ID de catálogo o
  null), `prioritize_family_change` (booleano), `region` (ID piloto o null),
  `water_regime` (`unknown`, `rainfed`, `irrigated`) y `analysis_id` (ID de análisis
  archivado o null). Devuelve opciones, factores, fuentes, limitaciones y contexto
  satelital opcional; no retorna forecast numérico. Ordena exclusivamente según cambio
  de familia cuando lo pide el usuario y el cultivo anterior es conocido. No evalúa
  aptitud, agua, clima, rentabilidad ni compatibilidad agronómica.

## AgroAlert NASA — integración parcial — 2026-11-15

- `GET /api/v1/agroalert/municipalities`: colección local de 18 municipios y localidades.
- `GET /api/v1/agroalert/moisture`: `municipality`, `end_date`, `history_days` (1–730);
  celdas recortadas, lecturas, agregados por fuente, conteo de fallos y fecha de consulta.
- `GET /api/v1/agroalert/point`: `latitude`, `longitude`, `start_date`, `end_date`.
- `GET /api/v1/agroalert/regional`: bbox, parámetro permitido y rango de hasta 366 días;
  devuelve grilla regional separada del flujo municipal, con su fuente y unidad.
- El formato sigue el sobre V1. La sincronización de límites está disponible solo para
  un operador local mediante `python -m scripts.sync_agroalert_boundaries`; no hay
  endpoint de escritura público ni botón de sincronización autorizado todavía.
- Las geometrías OSM sincronizadas no se presentan como linderos legales; se conserva
  una copia local anterior y solo se sustituyen los dos municipios seleccionados.

## Extensión implementada para demo — 2026-11-15

- `POST /api/v1/fields/validate`: `{geometry}`; devuelve área, perímetro y bbox.
- `POST /api/v1/fields/scenes` y `/fields/analyses`: `{geometry,start_date,end_date,
  max_cloud,name,municipality,crop,item_id}`; `item_id` opcional. La búsqueda y análisis
  usan Earth Search sin aceptar URL del cliente. El análisis puede responder `no_clear_scene`
  o `insufficient_data`; errores de proveedor se entregan en el sobre de error V1.
- `GET /api/v1/fields/analyses/{id}`, `/report` y `/layers/{true-color|ndvi|ndmi}`;
  capas PNG locales; ID hexadecimal validado. Persistencia local sin garantía de retención.
- `GET /api/v1/fields/analyses` lista hasta 100 resultados locales con capas presentes.
  Los nuevos análisis incluyen `inspection` con estado, puntos y reglas operativas NDVI;
  los análisis históricos pueden no contener este campo. No son diagnósticos.
- `GET /api/v1/agriculture/series` admite `region`, `crop`, `cycle`, `mode` y devuelve
  filas y cobertura. `GET /api/v1/agriculture/coverage` devuelve cobertura global.
  `source_file_missing` representa ausencia del libro; precios originales permanecen
  separados y el cociente requiere producción positiva. No hay forecast numérico.
- El texto posterior es el contrato histórico de rotaciones previsto y no significa
  que el endpoint de comparación esté implementado. Véase `docs/FINAL_DEMO_SCOPE.md`.

**Versión:** 1.0.0. **Estado:** documentación redactada para revisión final humana.
Este documento es canónico. API_CONTRACT.md en la raíz es solo una referencia.
No implica endpoints, esquemas ejecutables, integración NASA ni motor implementados.

## 1. Propósito y alcance

Contrato común React/TypeScript y FastAPI para las cinco pantallas de HaiLex.
Backend es autoridad de datos, normalización, evaluación y explicaciones; frontend
recoge entradas y presenta resultados sin duplicar cálculos científicos.
Sin autenticación, base de datos, persistencia de parcelas, Redis, colas o LLM runtime.
No ofrece recomendaciones agronómicas científicamente validadas.

## 2. Convenciones generales

- Prefijo /api/v1; base local http://localhost:8000. JSON UTF-8, snake_case.
- Fechas YYYY-MM-DD; periodos inclusivos. Timestamps ISO-8601 UTC con Z.
- WGS84/EPSG:4326. Punto solicitado no equivale a parcela/polígono medido.
- Éxito: `data: T`, `warnings: string[]`. Error: sección 13.
- Respuestas: campos descritos siempre presentes; desconocidos null, listas vacías [].
- Solicitudes: campos obligatorios salvo indicación expresa; null no equivale a omitido.
- Rechazar claves desconocidas, booleanos como números y NaN/Infinity.
- IDs 1..100 caracteres; nombres 1..200; notas hasta 2000 (topes operativos HaiLex).
- Contrato, servicio, catálogo, reglas y normalizador tienen versiones independientes.
- Los ejemplos son SIMULADOS, no evidencia de funcionalidad o datos reales.
- Rutas previas GET /health y GET /api/v1/climate son antecedentes documentales;
  no son rutas canónicas ni alias V1. No se implementan alias en esta tarea.

## 3. Endpoints canónicos

| Método | Ruta | Función |
|---|---|---|
| GET | /api/v1/health | Vida del proceso, sin consulta NASA |
| GET | /api/v1/climate/series | Serie diaria, metadatos y snapshot |
| GET | /api/v1/crops | Catálogo versionado con evidencia |
| GET | /api/v1/sources | Productos/referencias y estado de integración |
| POST | /api/v1/rotations/compare | Comparación explicable |

Todos los éxitos son 200. GET no lleva cuerpo; solo climate tiene query obligatoria.
No hay endpoints de persistencia o de recuperación de análisis históricos.

## 4. Metadatos y procedencia

Separación obligatoria:
- `source`: institución/producto/referencia, no modo de recuperación.
- `retrieval_mode`: upstream | cache | historical_fixture | demo_fixture.
- `data_type`: observation | estimate | model | derived | cartographic_reference |
  user_input | documented_reference | simulation | unknown.

Upstream significa consultado al proveedor, no observado hoy ni medido directamente.
Cache/fixture real conserva retrieved_at original. served_at es entrega por HaiLex.
Un fixture histórico real no se convierte en simulation por estar archivado.
Demo exige simulation y display_label SIMULADO. Demás respuestas: display_label null.

SourceRecord: id, organization, product, endpoint:string|null,
product_version:string|null, reference:string|null, status, limitations:string[].
Reference contiene URL o referencia bibliográfica recuperable. Cartografía identifica
serie/fecha/cobertura/escala verificadas en reference/limitations; no presumir escala INEGI.
Status: implemented | partial | planned | unavailable, describe integración, no una consulta.

ClimateVariable: id, source_id, unit:string|null, data_type,
spatial_resolution:string|null, temporal_resolution:daily,
valid_count:int, missing_count:int, limitations:string[].
Resolución se registra según producto/parámetro; no representa precisión de parcela.
Metadata no verificada queda null/unknown con advertencia. No publicar números físicos
sin unidad verificada. source_id debe resolver al source de la respuesta o /sources.

## 5. NASA POWER y reglas de ausencia

Daily Point, community=AG, time-standard=UTC, format=JSON, parámetros fijos:
T2M, PRECTOTCORR, ALLSKY_SFC_SW_DWN. Cliente no elige URLs/comunidades arbitrarias.
Plantilla documental; NO ejecutada ni asociada a parcela real:

```text
https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN&community=AG&latitude=<LATITUDE>&longitude=<LONGITUDE>&start=<YYYYMMDD>&end=<YYYYMMDD>&format=JSON&time-standard=UTC
```

Antes de implementar/publicar valores:
1. Consultar Daily, diccionario de parámetros y Data Access Viewer para AG/daily.
2. Verificar disponibilidad, significado y unidad por parámetro; guardar referencia/fecha.
3. Contrastar con parameters/cabecera de respuesta real y metadatos oficiales vigentes.
4. Verificar producto original, versión, resolución, periodo y naturaleza del dato.
5. Conservar unidad de origen en V1; conversiones requieren transformación versionada.
6. Contradicciones o metadatos no verificables impiden usar esa variable para puntuar;
   estructura externa no normalizable produce 502, no valores inventados.

No se fijan unidades, resoluciones numéricas ni clasificación científica sin verificar.
UTC se solicita explícitamente porque Daily usa LST por defecto. No clasificar todos
los datos NASA como observación directa. Latencia/cobertura varían con producto.
Celdas regionales no son mediciones de lote; los históricos son contexto descriptivo.

Fuentes oficiales para verificar (no afirmar que ya se probó la integración):
- https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- https://power.larc.nasa.gov/docs/methodology/communities/
- https://power.larc.nasa.gov/docs/faqs/data/
- Diccionario vigente enlazado desde Communities/FAQ y metadatos de respuesta real.

Ausencias:
- Leer sentinel declarado por respuesta/producto (por ejemplo -999 cuando corresponda).
  No usar -999 universalmente ni descartar temperaturas negativas legítimas.
- Sentinel verificado, fecha/parámetro ausente y null se normalizan a null, nunca cero.
- No interpolar, extrapolar o arrastrar último valor en V1; preservar cero real.
- No finitos inesperados: null con advertencia. Tipos/estructura corrupta: 502.
- Una fila diaria ordenada sin duplicados; valid_count+missing_count = días por variable.
- Frontend muestra huecos, no los interpola como datos conocidos.
- Sin resumen agregado público en V1. Backend calculará indicadores solo con unidades,
  métodos y cobertura documentados. Agregados de dashboard requieren definición antes
  de añadir campos; frontend no los sustituye por cálculos propios.
- Falta científica: not_assessable. Ningún umbral de cobertura agronómica se inventa aquí.

## 6. GET /api/v1/health

Sin parámetros. Solo vida del proceso; no promete catálogo, motor o NASA operativos.
Respuesta 200 completa SIMULADA (versión/estado ilustrativos):

```json
{"data":{"status":"ok","service":"hailex-api","version":"0.1.0","contract_version":"1.0.0"},"warnings":[]}
```

Health no lleva data_type porque no contiene datos agrícolas/ambientales.

## 7. GET /api/v1/climate/series

Query requerida: latitude:number, longitude:number, start_date:date, end_date:date.
Sin coordenadas/fechas por defecto. Ejemplo de solicitud SIMULADA, punto no verificado:

```http
GET /api/v1/climate/series?latitude=20&longitude=-100&start_date=2025-01-01&end_date=2025-01-02
```

Respuesta 200 completa SIMULADA; no atribuye unidades ni números a NASA:

```json
{
  "data": {
    "snapshot_id": "demo-climate-001",
    "snapshot_expires_at": "2026-11-14T19:30:00Z",
    "location": {"latitude":20.0,"longitude":-100.0},
    "period": {"start_date":"2025-01-01","end_date":"2025-01-02"},
    "community":"AG", "time_standard":"UTC", "normalizer_version":"demo-1",
    "source":{"id":"demo-climate","organization":"HaiLex","product":"Fixture SIMULADO","endpoint":null,"product_version":null,"reference":null,"status":"implemented","limitations":["Solo ejemplo de contrato."]},
    "retrieval":{"retrieval_mode":"demo_fixture","retrieved_at":null,"served_at":"2026-11-14T19:00:00Z","display_label":"SIMULADO"},
    "variables":[
      {"id":"T2M","source_id":"demo-climate","unit":null,"data_type":"simulation","spatial_resolution":null,"temporal_resolution":"daily","valid_count":0,"missing_count":2,"limitations":["Sin valores ni unidad asignada en este ejemplo."]},
      {"id":"PRECTOTCORR","source_id":"demo-climate","unit":null,"data_type":"simulation","spatial_resolution":null,"temporal_resolution":"daily","valid_count":0,"missing_count":2,"limitations":["Sin valores ni unidad asignada en este ejemplo."]},
      {"id":"ALLSKY_SFC_SW_DWN","source_id":"demo-climate","unit":null,"data_type":"simulation","spatial_resolution":null,"temporal_resolution":"daily","valid_count":0,"missing_count":2,"limitations":["Sin valores ni unidad asignada en este ejemplo."]}
    ],
    "series":[
      {"date":"2025-01-01","T2M":null,"PRECTOTCORR":null,"ALLSKY_SFC_SW_DWN":null},
      {"date":"2025-01-02","T2M":null,"PRECTOTCORR":null,"ALLSKY_SFC_SW_DWN":null}
    ]
  },
  "warnings":["SIMULADO: no son observaciones NASA.","Una celda regional no describe con exactitud una parcela."]
}
```

Location son coordenadas solicitadas, no centro de celda. Se conservan tres columnas;
variable no disponible queda null y se advierte. Source identifica distribución; para
producto original diferente, source_id de variable resuelve en /sources.
Upstream válido sin valores utilizables: 200 con null/contadores/warnings; no convertir
una respuesta externa inválida en ese éxito. Nunca fixture de otra ubicación/periodo.

## 8. Snapshots, caché y fallos externos

Snapshots inmutables en memoria durante **30 minutos desde creación**, no último acceso.
Incluyen serie normalizada y procedencia completa. Son dependientes del proceso, se
pueden perder en reinicio/reload y no se comparten entre múltiples workers.
**Despliegue MVP: un único worker** mientras se utilice este almacenamiento.
No son credenciales, parcelas guardadas ni historial persistente.

snapshot_expires_at informa vencimiento. Cache hit puede crear otro snapshot, nunca
cambia retrieved_at original. Snapshot desconocido/perdido/vencido devuelve 409
CLIMATE_SNAPSHOT_EXPIRED. Compare no sustituye el dataset automáticamente: frontend
consulta clima nuevamente, muestra procedencia y solicita comparar de nuevo.

Timeout explícito según configuración (inicial prevista: 15 s), sin reintentos infinitos.
Caché acotada por coordenadas solicitadas, periodo, parámetros, AG y UTC. Tamaño/TTL de
respuestas y máximo de snapshots activos son decisiones operativas pendientes,
independientes de los 30 min ya fijados para cada snapshot.
Ante fallo: caché vigente aplicable, luego fixture histórico REAL exacto si existe,
si no error 502/504. Advertir motivo y fecha original. No usar demo como fallback
automático de datos reales. Modo demo explícito, separado, sin nuevo endpoint V1.

## 9. GET /api/v1/crops

Catálogo único en backend, versionado. Datos reales: documented_reference; demo:
simulation + SIMULADO, sin mezclar registros demo en catálogo real del MVP.
EvidenceStatus: verified_local | documented_general | provisional | unknown.
No equivale a validar científicamente todo el sistema.

Crop: id, common_name, scientific_name:string|null, botanical_family:string|null,
attributes:CropAttribute[], identity_source_refs:Record<string,string[]>,
evidence_status, limitations:string[]. Identity refs usa claves common_name,
scientific_name, botanical_family y resuelve en sources de esta respuesta.
CropAttribute: name:string, value:string|number|boolean|null, unit:string|null,
source_refs:string[], evidence_status, limitations:string[]. No any.
Cada atributo no desconocido requiere evidencia verificable, nunca una cita genérica
para justificar todos los números. Solo atributos/vocabulario aprobados son procesables
por el motor; texto libre no se transforma en reglas. Requerimientos complejos requieren
definición tipada con agronomía antes de puntuar. Booleano desconocido es null, no false.

Respuesta completa 200 SIMULADA:

```json
{
 "data":{
  "catalog_version":"demo-1","data_type":"simulation","display_label":"SIMULADO",
  "crops":[
   {"id":"crop-a","common_name":"Cultivo A SIMULADO","scientific_name":null,"botanical_family":null,"attributes":[],"identity_source_refs":{},"evidence_status":"unknown","limitations":["Cultivo ficticio."]},
   {"id":"crop-b","common_name":"Cultivo B SIMULADO","scientific_name":null,"botanical_family":null,"attributes":[],"identity_source_refs":{},"evidence_status":"unknown","limitations":["Cultivo ficticio."]}
  ],"sources":[]
 },"warnings":["SIMULADO: no son recomendaciones agrícolas."]
}
```

sources es SourceRecord[]. Catálogo conocido vacío: 200 con crops [], versión y warning;
catálogo ilegible/configuración inválida: error 500, no vacío engañoso.

Implementado: catálogo local `backend/app/data/crop_catalog.json`, versión 1.0.0,
cuatro cultivos y fuentes por identidad/atributo. El consolidado SIAP aportado conserva
procedencia provisional; requerimientos y fechas locales son null/unknown. No se consulta
NASA al solicitar el catálogo. Su contexto se obtiene por `/api/v1/climate/series` con
periodo, coordenadas, unidad, procedencia y fecha de recuperación independientes.

Esquema ejecutable de perfil independiente: `app.schemas.crops.ParcelProfile`. Contiene
location con fuente y validación; municipality, current_crop, soil_classification y
soil_texture con value/source/source_ref/validation_status; water_regime con origen y
validación; restrictions con origen. No hay persistencia ni endpoint de parcela. Este
esquema no sustituye todavía el cuerpo previsto para el endpoint compare no implementado.
Cartografía requiere referencia; no es medición de campo ni análisis de laboratorio.

## 10. GET /api/v1/sources

Registro de productos y referencias de datos/reglas; SourceRecord más parameters:string[].
Status es integración, no éxito de la última llamada. Suelo declarado por usuario no se
atribuye a INEGI. Metadata de cada consulta climática está en climate/series.
Respuesta completa 200 SIMULADA (no afirma integración NASA):

```json
{"data":{"sources":[{"id":"nasa-power-daily","organization":"NASA POWER","product":"Daily Point API","endpoint":"https://power.larc.nasa.gov/api/temporal/daily/point","product_version":null,"reference":"https://power.larc.nasa.gov/docs/services/api/temporal/daily/","status":"planned","limitations":["Metadata por parámetro pendiente de verificar."],"parameters":["T2M","PRECTOTCORR","ALLSKY_SFC_SW_DWN"]}]},"warnings":["SIMULADO: estado ilustrativo."]}
```

## 11. POST /api/v1/rotations/compare — solicitud

No acepta climate_summary ni puntuaciones del navegador. Recibe el ID del snapshot
inmutable. Location debe coincidir numéricamente con snapshot, sin redondeo silencioso.
Sin registro de parcelas, location es obligatoria: un ID solo no se puede resolver.

ParcelProfile: location, region:string|null, current_crop_id:string|null,
soil_classification:SoilClassification|null, soil_texture:SoilTexture|null,
water_regime:rainfed|irrigated|unknown, crop_history:CropHistoryEntry[].
Suelo conocido incluye value, source:user_input|cartographic_reference,
source_ref:string|null; clasificación además system:string|null. Textura no se deduce
de clasificación. Cartografía requiere SourceRecord resoluble en /sources.
Region, cultivo actual, historial y régimen de agua son entradas de usuario, no NASA.
Historial: crop_id, start_date:date|null, end_date:date|null. No se asume que [] prueba
ausencia de cultivos previos; solo que no se aportaron registros.

Cycles comunes ordenados: id, start_date, end_date (ambas fechas conocidas o null).
Una entrada por ciclo en cada secuencia; un cultivo por ciclo. Sin policultivos o
barbecho codificados con IDs inventados. No fechas conocidas implica no evaluables los
criterios que las necesiten. Adaptar históricos al ciclo futuro requiere regla revisada.

Weights: seis claves candidatas fijas: water_fit, climate_fit, soil_fit,
diversification, rotation_practice, farmer_preferences. Su presencia no demuestra
que exista regla aprobada. Valores finitos >=0, suma finita >0; backend normaliza.
Constraints: excluded_crop_ids, preferred_crop_ids, notes:string|null.
Exclusiones son restricciones duras; preferencias solo puntúan con regla documentada.
Notes es texto informativo, nunca interpretado automáticamente por LLM o como regla.

Solicitud completa SIMULADA, con IDs ficticios del catálogo anterior:

```json
{
  "parcel":{"location":{"latitude":20.0,"longitude":-100.0},"region":null,"current_crop_id":null,"soil_classification":null,"soil_texture":null,"water_regime":"unknown","crop_history":[]},
  "climate_snapshot_id":"demo-climate-001",
  "cycles":[{"id":"cycle-1","start_date":null,"end_date":null},{"id":"cycle-2","start_date":null,"end_date":null}],
  "weights":{"water_fit":1,"climate_fit":1,"soil_fit":1,"diversification":1,"rotation_practice":1,"farmer_preferences":0},
  "constraints":{"excluded_crop_ids":[],"preferred_crop_ids":[],"notes":null},
  "scenarios":[
    {"id":"A","name":"Escenario A SIMULADO","sequence":[{"cycle_id":"cycle-1","crop_id":"crop-a"},{"cycle_id":"cycle-2","crop_id":"crop-b"}]},
    {"id":"B","name":"Escenario B SIMULADO","sequence":[{"cycle_id":"cycle-1","crop_id":"crop-b"},{"cycle_id":"cycle-2","crop_id":"crop-a"}]},
    {"id":"C","name":"Escenario C SIMULADO","sequence":[{"cycle_id":"cycle-1","crop_id":"crop-b"},{"cycle_id":"cycle-2","crop_id":"crop-b"}]}
  ]
}
```

### 11.1 Estados y transiciones independientes

Eligibility (restricciones, no calidad de evidencia):
- eligible: todas las restricciones estructuradas aportadas se cumplen; sin ellas,
  cumplimiento vacuo, no aptitud agronómica comprobada.
- excluded: al menos una restricción explícita incumplida; prevalece sobre desconocidos.
- undetermined: no hay incumplimiento probado pero falta dato para decidir una
  restricción soportada. No se infiere de notas. Con solo listas válidas, no se espera
  este estado; queda definido para datos requeridos por restricciones soportadas.

AssessmentStatus (solo criterios con peso positivo):
- assessed: todos son evaluables.
- partial: al menos uno, pero no todos, es evaluable.
- not_assessable: ninguno es evaluable.

Ambos ejes se recalculan para cada solicitud; no hay actualización persistida.
Completar restricciones puede mover undetermined a eligible/excluded; cambiarlas o
retirarlas puede cambiar eligibility en una nueva evaluación. Añadir evidencia puede
mover not_assessable → partial → assessed; perderla puede invertir el recorrido.
Ni pasar tiempo ni presentar una puntuación valida científicamente un escenario.
Un excluded puede estar assessed: se explica, pero nunca participa entre los mejores.

### 11.2 Criterios, pesos y explicabilidad

Siempre retornar seis CriterionResult, incluso con peso cero. Campos:
criterion, status:assessed|not_assessable, score:number|null,
normalized_weight:number, effective_weight:number|null, contribution:number|null,
explanation:string, source_refs:string[], missing_fields:string[].

- Not_assessable: score/effective_weight/contribution null; explanation justifica qué
  dato/regla falta. Nunca asignar cero por desconocimiento.
- Assessed: score en [0,1] con escala/transformación agronómica documentada.
- Assessed con peso cero: effective_weight y contribution cero, no dato faltante.
- explanation identifica método, entradas y regla. source_refs resuelve SourceRecord
  en sources de respuesta. input_refs (rutas de entrada) puede expresarse en explanation;
  no requiere copiar todos los valores a cada criterio.

Mecánica matemática, no fórmula agronómica: normalizar pesos dividiendo por su suma.
assessable_weight_ratio es suma de pesos normalizados positivos de criterios assessed.
Si es cero, score total null. Si es positivo, effective_weight de criterio positivo
assessed = normalized_weight / assessable_weight_ratio; contribution = score del
criterio × effective_weight; total = suma de contribuciones calculables.
Explicar renormalización y criterios omitidos. Definir cada indicador y su cobertura
con agronomía antes de calcularlo; este contrato no aporta umbrales ni defaults calibrados.

### 11.3 Comparabilidad y empates

Para comparison_status comparable se requieren al menos dos eligible con score no null
y el mismo conjunto de criterios assessed con peso positivo entre TODOS los eligible.
Si no, not_comparable y best_evaluated_scenario_ids []. No elegir ganador excluyendo
silenciosamente escenarios con evidencia escasa. Excluded/undetermined no participan.
Entre comparables, devolver todos los mejores empatados, en orden de solicitud.
Empate técnico: comparar total redondeado decimal a seis posiciones, mitad al par;
es precisión operativa de presentación/selección, no certeza científica. No usar
orden alfabético ni primer elemento como desempate. Conservar contribuciones sin
redondeo de UI. Un único eligible no es una comparación suficiente para declarar mejor.

Determinismo: mismos datos del snapshot, entradas, catálogo, reglas y normalizador
producen cálculos, estados y explicaciones iguales; analysis_id y calculated_at varían.
Validation_status se mantiene provisional hasta revisión; no afirma validación local.

## 12. Respuesta de comparación y esquemas conceptuales

CompareResponse.data contiene:
- analysis_id:string, calculated_at:timestamp, rules_version:string,
  catalog_version:string, normalizer_version:string, validation_status:provisional.
- data_type:derived|simulation, display_label:string|null.
- climate_snapshot_id:string, climate_context (Location, DateRange, source_id,
  retrieval_mode, retrieved_at:timestamp|null, time_standard:UTC).
- input_snapshot:CompareRequest (solicitud validada completa para trazabilidad).
- normalized_weights:Weights, comparison_status:comparable|not_comparable,
  best_evaluated_scenario_ids:string[], scenarios:ScenarioResult[].
- sources:SourceRecord[] con toda referencia de datos/reglas/catálogo usada,
  disclaimer:string (no predice rendimientos ni sustituye asesoría local).

ScenarioResult: id, eligibility, eligibility_reasons:string[], assessment_status,
score:number|null, assessable_weight_ratio:number [0,1], criteria:CriterionResult[],
strengths:string[], limitations:string[], warnings:string[]. Secuencia/nombre se
encuentran por ID en input_snapshot; no se duplican en cada resultado.

No se retorna otra vez la serie completa en compare. Snapshot contiene serie y metadata;
input_snapshot + climate_context + sources + explicaciones permiten rastrear cálculo.
No se promete reproducibilidad tras reiniciar sin preservar los insumos originales.
Cualquier insumo simulation propaga simulation/SIMULADO. Catálogo/snapshot de modos
demo y real incompatibles se rechazan, no se mezclan silenciosamente.

Respuesta completa 200 SIMULADA sin evidencia; todos los criterios presentes y null:

```json
{
  "data": {
    "analysis_id": "demo-analysis-001",
    "calculated_at": "2026-11-14T19:05:00Z",
    "rules_version": "demo-1",
    "catalog_version": "demo-1",
    "normalizer_version": "demo-1",
    "validation_status": "provisional",
    "data_type": "simulation",
    "display_label": "SIMULADO",
    "climate_snapshot_id": "demo-climate-001",
    "climate_context": {
      "location": {
        "latitude": 20.0,
        "longitude": -100.0
      },
      "period": {
        "start_date": "2025-01-01",
        "end_date": "2025-01-02"
      },
      "source_id": "demo-climate",
      "retrieval_mode": "demo_fixture",
      "retrieved_at": null,
      "time_standard": "UTC"
    },
    "input_snapshot": {
      "parcel": {
        "location": {
          "latitude": 20.0,
          "longitude": -100.0
        },
        "region": null,
        "current_crop_id": null,
        "soil_classification": null,
        "soil_texture": null,
        "water_regime": "unknown",
        "crop_history": []
      },
      "climate_snapshot_id": "demo-climate-001",
      "cycles": [
        {
          "id": "cycle-1",
          "start_date": null,
          "end_date": null
        },
        {
          "id": "cycle-2",
          "start_date": null,
          "end_date": null
        }
      ],
      "weights": {
        "water_fit": 1,
        "climate_fit": 1,
        "soil_fit": 1,
        "diversification": 1,
        "rotation_practice": 1,
        "farmer_preferences": 0
      },
      "constraints": {
        "excluded_crop_ids": [],
        "preferred_crop_ids": [],
        "notes": null
      },
      "scenarios": [
        {
          "id": "A",
          "name": "Escenario A SIMULADO",
          "sequence": [
            {
              "cycle_id": "cycle-1",
              "crop_id": "crop-a"
            },
            {
              "cycle_id": "cycle-2",
              "crop_id": "crop-b"
            }
          ]
        },
        {
          "id": "B",
          "name": "Escenario B SIMULADO",
          "sequence": [
            {
              "cycle_id": "cycle-1",
              "crop_id": "crop-b"
            },
            {
              "cycle_id": "cycle-2",
              "crop_id": "crop-a"
            }
          ]
        },
        {
          "id": "C",
          "name": "Escenario C SIMULADO",
          "sequence": [
            {
              "cycle_id": "cycle-1",
              "crop_id": "crop-b"
            },
            {
              "cycle_id": "cycle-2",
              "crop_id": "crop-b"
            }
          ]
        }
      ]
    },
    "normalized_weights": {
      "water_fit": 0.2,
      "climate_fit": 0.2,
      "soil_fit": 0.2,
      "diversification": 0.2,
      "rotation_practice": 0.2,
      "farmer_preferences": 0.0
    },
    "comparison_status": "not_comparable",
    "best_evaluated_scenario_ids": [],
    "scenarios": [
      {
        "id": "A",
        "eligibility": "eligible",
        "eligibility_reasons": [],
        "assessment_status": "not_assessable",
        "score": null,
        "assessable_weight_ratio": 0,
        "criteria": [
          {
            "criterion": "water_fit",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.water_fit"
            ]
          },
          {
            "criterion": "climate_fit",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.climate_fit"
            ]
          },
          {
            "criterion": "soil_fit",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.soil_fit"
            ]
          },
          {
            "criterion": "diversification",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.diversification"
            ]
          },
          {
            "criterion": "rotation_practice",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.rotation_practice"
            ]
          },
          {
            "criterion": "farmer_preferences",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.0,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.farmer_preferences"
            ]
          }
        ],
        "strengths": [],
        "limitations": [
          "SIMULADO: no hay evaluaci?n agr?cola v?lida."
        ],
        "warnings": []
      },
      {
        "id": "B",
        "eligibility": "eligible",
        "eligibility_reasons": [],
        "assessment_status": "not_assessable",
        "score": null,
        "assessable_weight_ratio": 0,
        "criteria": [
          {
            "criterion": "water_fit",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.water_fit"
            ]
          },
          {
            "criterion": "climate_fit",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.climate_fit"
            ]
          },
          {
            "criterion": "soil_fit",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.soil_fit"
            ]
          },
          {
            "criterion": "diversification",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.diversification"
            ]
          },
          {
            "criterion": "rotation_practice",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.rotation_practice"
            ]
          },
          {
            "criterion": "farmer_preferences",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.0,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.farmer_preferences"
            ]
          }
        ],
        "strengths": [],
        "limitations": [
          "SIMULADO: no hay evaluaci?n agr?cola v?lida."
        ],
        "warnings": []
      },
      {
        "id": "C",
        "eligibility": "eligible",
        "eligibility_reasons": [],
        "assessment_status": "not_assessable",
        "score": null,
        "assessable_weight_ratio": 0,
        "criteria": [
          {
            "criterion": "water_fit",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.water_fit"
            ]
          },
          {
            "criterion": "climate_fit",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.climate_fit"
            ]
          },
          {
            "criterion": "soil_fit",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.soil_fit"
            ]
          },
          {
            "criterion": "diversification",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.diversification"
            ]
          },
          {
            "criterion": "rotation_practice",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.2,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.rotation_practice"
            ]
          },
          {
            "criterion": "farmer_preferences",
            "status": "not_assessable",
            "score": null,
            "normalized_weight": 0.0,
            "effective_weight": null,
            "contribution": null,
            "explanation": "SIMULADO: regla y evidencia requieren revisi?n agron?mica.",
            "source_refs": [],
            "missing_fields": [
              "rules.farmer_preferences"
            ]
          }
        ],
        "strengths": [],
        "limitations": [
          "SIMULADO: no hay evaluaci?n agr?cola v?lida."
        ],
        "warnings": []
      }
    ],
    "sources": [
      {
        "id": "demo-climate",
        "organization": "HaiLex",
        "product": "Fixture SIMULADO",
        "endpoint": null,
        "product_version": null,
        "reference": null,
        "status": "implemented",
        "limitations": [
          "Solo ejemplo de contrato."
        ]
      }
    ],
    "disclaimer": "Evaluaci?n exploratoria; no predice rendimientos ni sustituye asesor?a agron?mica local."
  },
  "warnings": [
    "SIMULADO: sin evidencia suficiente; no se declara ganador."
  ]
}
```

## 13. Errores HTTP y validación

ErrorResponse: error:{code:string,message:string,request_id:string,fields:FieldError[]}.
FieldError: field:string (ruta/index), message:string. Backend genera request_id seguro,
fields [] para fallos no atribuibles a campo. No traceback, secretos o respuesta externa
cruda. Homogeneizar también errores automáticos Pydantic/FastAPI y 404/405.

| HTTP | code | Caso |
|---|---|---|
| 400 | INVALID_JSON | JSON sintácticamente inválido |
| 404 | NOT_FOUND | Ruta/recurso inexistente |
| 405 | METHOD_NOT_ALLOWED | Método no admitido |
| 409 | CLIMATE_SNAPSHOT_EXPIRED | Snapshot desconocido, vencido o perdido |
| 422 | VALIDATION_ERROR | Tipos, rango, campos faltantes/desconocidos |
| 422 | INVALID_WEIGHTS | Negativos, no finitos, suma cero/no finita |
| 422 | UNKNOWN_CROP | ID no presente en catálogo |
| 422 | INVALID_SCENARIO | Ciclos/secuencias inconsistentes |
| 422 | CLIMATE_LOCATION_MISMATCH | Punto distinto a snapshot |
| 422 | DATA_MODE_MISMATCH | Demo/real incompatibles |
| 502 | NASA_RESPONSE_ERROR | Proveedor falla/respuesta no normalizable |
| 504 | NASA_TIMEOUT | Timeout sin respaldo aplicable |
| 503 | SERVICE_UNAVAILABLE | Capacidad temporalmente indisponible |
| 500 | INTERNAL_ERROR | Error interno sanitizado |

NASA 429 puede mapear a 503 con mensaje seguro. Insuficiencia científica válida devuelve
200 con not_assessable, no un fallo técnico oculto ni una recomendación falsa.
Error 422 completo SIMULADO:

```json
{"error":{"code":"VALIDATION_ERROR","message":"Latitud fuera de rango.","request_id":"req-demo-001","fields":[{"field":"latitude","message":"Debe estar entre -90 y 90."}]}}
```

Validaciones:
- Coordenadas obligatorias finitas; lat [-90,90], lon [-180,180].
- Clima: fechas reales, inicio <= fin, fin no futuro según UTC; máximo 366 días
  inclusivos (límite operativo HaiLex, no NASA).
- Snapshot del mismo proceso/modo y ubicación, vigente. No recargarlo durante compare.
- Scenarios 3..10; cycles 1..12; IDs únicos; una entrada por ciclo en mismo orden,
  cultivo conocido. Topes operativos, no reglas científicas.
- Ciclos/historial: ambas fechas null o ambas presentes; inicio <= fin; fechas conocidas
  de ciclos en orden, sin solapar (fin < inicio siguiente). Historia no futura ni
  solapada donde sea comprobable. Desconocidos limitan criterios, no se infieren.
- Current_crop_id null o catálogo; historial no se agrega como ciclos futuros.
- Suelo null u objeto con value no vacío; clasificación/texture distintas; referencia
  cartográfica resoluble. System desconocido null con limitación, no etiqueta inventada.
- Pesos exactamente seis claves; suma finita positiva. Listas de restricciones sin
  repetidos ni intersección; IDs conocidos. Notas libres nunca puntuadas.
- Todos los campos de CompareRequest son requeridos excepto constraints.notes,
  omitible con default null. Region/current_crop/suelo son anulables; listas admiten [].
- Error estructural de un escenario rechaza solicitud completa 422, no la reduce a dos.

## 14. CORS y responsabilidades

Orígenes locales: http://localhost:5173 y http://127.0.0.1:5173. Permitir GET/POST,
atender preflight OPTIONS; header Content-Type; sin credenciales ni wildcard.
Acceso LAN/u otro puerto requiere autorización explícita. CORS no es autenticación.
La plantilla CORS_ORIGINS requiere parser futuro: no está activa solo por existir.

| Área | Frontend | Backend |
|---|---|---|
| Perfil/ciclos | Recoger, orientar formato | Revalidar y preservar origen |
| NASA/faltantes | Presentar unidades, metadata, huecos | Consultar, verificar, normalizar |
| Catálogo | Mostrar IDs/evidencia | Fuente única y versionado |
| Restricciones | Recoger explícitamente | Eligibility separado de evidencia |
| Evaluación | Mostrar sin recalcular | Pesos, criterios, contribuciones, empates |
| Errores/snapshot | Mostrar y repetir consulta explícita | Fallos seguros/TTL/caché |
| Demo | Etiqueta persistente SIMULADO | Propagar data_type y etiqueta |

## 15. Correspondencia conceptual Pydantic / TypeScript

No son modelos ejecutables; implementación posterior debe respetar nombres wire:

| Concepto | Pydantic v2 | TypeScript |
|---|---|---|
| Sobre | SuccessResponse[T], ErrorResponse, FieldError | SuccessResponse<T>, ErrorResponse, FieldError |
| Comunes | Location, DateRange, SourceRecord, RetrievalMetadata | Tipos homónimos |
| Clima | ClimateQuery, ClimateVariable, ClimatePoint, ClimateSeries | Tipos homónimos |
| Catálogo | CropAttribute, Crop, CropCatalog | Tipos homónimos |
| Perfil | SoilClassification, SoilTexture, CropHistoryEntry, ParcelProfile | Tipos homónimos |
| Petición | Cycle, ScenarioStep, Scenario, Weights, Constraints, CompareRequest | Tipos homónimos |
| Respuesta | CriterionResult, ScenarioResult, CompareResponse | Tipos homónimos |

str→string; números finitos→number; listas→T[]; dict tipado→Record<K,V>;
date/datetime→string con formato documentado; T|None→T|null. Null requerido no usa ?;
solo fields opcionales documentados (notes) usan ?. Enums Literal/unión literal.
CropAttribute.value es unión escalar cerrada, no any. CriterionResult puede ser unión
discriminada por status para score/contribution null frente a número.
Pydantic valida rangos, relaciones y extra forbid; TS no garantiza invariantes runtime.
Query GET se parsea desde strings HTTP; no aplicar strict global que impida fechas o
coordenadas válidas. No duplicar algoritmos en tipos/validación del frontend.

## 16. Decisiones pendientes

Revisión agronómica antes de puntuar cada criterio:
- Unidades/resolución/tipo/producto por parámetro AG/daily; evidencia oficial fechada.
- Región/cultivos/calendario, referencias específicas de cada atributo.
- Vocabulario tipado de requerimientos y reglas matemáticas/agronómicas, escalas,
  prioridades iniciales, cobertura mínima y relación histórico/ciclo futuro.
- Preferencias, grupos/familias, restricciones de suelo y disponibilidad de agua.
- Agregados de dashboard y su cobertura/unidad antes de extender respuesta de clima.

Operación: TTL/tamaño de caché de respuestas, límite de snapshots activos, selección
explícita del modo demo. No son el TTL de snapshot ya fijado en 30 min.
Ninguna decisión pendiente autoriza defaults engañosos, cero por faltantes o claims
de asesoría validada. Estos pendientes no modifican las cinco rutas canónicas.

## 17. Criterios de aceptación y handoff

Checklist de implementación futura; no evidencia de pruebas de servicio aprobadas:
- [ ] Ambas estaciones usan las cinco rutas y el mismo sobre/campos/enums.
- [ ] Health no llama a NASA ni certifica módulos no implementados.
- [ ] POWER AG/UTC/JSON y tres parámetros; metadata por variable verificada.
- [ ] Sentinel declarado→null, cero real preservado; fechas y contadores consistentes.
- [ ] Referencias resolubles, snapshot y punto/periodo exactos, fechas conservadas.
- [ ] Snapshot 30 min, reinicio/expiración→409; único worker.
- [ ] Histórico exacto etiquetado; demo no sustituye reales silenciosamente.
- [ ] Catálogo con evidencia por atributo; clasificación/textura separadas.
- [ ] Eligibility y assessment_status son independientes y recalculados.
- [ ] Seis criterios incluso desconocidos; contribuciones null coherentes.
- [ ] Pesos/renormalización/cobertura explícitos; reglas no inventadas.
- [ ] Comparabilidad equivalente; sin ganador arbitrario en empate o insuficiencia.
- [ ] Mismos datos/versiones producen mismos cálculos/explicaciones.
- [ ] Errores uniformes, CORS local, sin secretos.
- [ ] SIMULADO visible; no predicciones/afirmaciones agronómicas no validadas.
- [ ] Ejemplos JSON válidos; revisión humana antes de implementar esquemas/endpoints.

Integrante 1 custodia contrato; 2 verifica NASA; 3 alinea tipos/UI en su rama; 4 revisa
fuentes y reglas. Próxima tarea, tras revisión: esquemas y base health/errores/pruebas,
sin mezclar implementación del motor. No hacer commits/push como parte de INT-01.
