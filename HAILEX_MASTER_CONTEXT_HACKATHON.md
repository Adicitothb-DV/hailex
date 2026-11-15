# HAILEX — Documento maestro definitivo de producto, ingeniería y ejecución del hackatón

> **Documento rector para los cuatro integrantes, asistentes de IA, agentes de programación y futuros desarrolladores.**
>
> **Versión:** 1.0 — Documento definitivo de hackatón  
> **Fecha de consolidación:** 13 de noviembre de 2026  
> **Zona horaria:** `America/Mexico_City`  
> **Proyecto:** HaiLex  
> **Evento:** NASA Space Apps Challenge 2026 — sede Querétaro  
> **Reto:** *Field Shift: Adapting Farms with NASA Data*  
> **Duración presencial comunicada por la sede:** sábado 14 de noviembre de 2026, 9:00 a. m. a domingo 15 de noviembre de 2026, aproximadamente 5:00 p. m. (unas 32 horas)  
> **Equipo:** cuatro integrantes  
> **Equipo informático:** dos laptops confirmadas; una tercera posible, no confirmada  
> **Presupuesto de IA previsto:** entre USD $10 y USD $20; máximo excepcional USD $30, sujeto a autorización adulta y control de gasto.  
> **Alcance:** llevar HaiLex desde el estado real del repositorio hasta una solución integrada, verificable, presentable y entregada durante el hackatón.

---

# Tabla de contenido

1. Instrucciones obligatorias para la IA coordinadora
2. Identidad, contexto y objetivo del proyecto
3. Reto oficial, usuarios y problema
4. Definición del producto HaiLex
5. Alcance funcional completo
6. Datos, APIs y fundamentos científicos
7. Catálogo agrícola, suelos y reglas de rotación
8. Motor de comparación y explicabilidad
9. Arquitectura tecnológica definitiva
10. Modelo de IA para desarrollar HaiLex y presupuesto
11. Configuración de agente de IA en VS Code
12. Experiencia de usuario y dirección visual
13. Contratos API y estructura de datos
14. Estructura del repositorio
15. Git, GitHub y puntos de recuperación
16. División del trabajo y uso de laptops
17. Ingeniería de calidad, seguridad y documentación
18. Pruebas y criterios de aceptación globales
19. Plan maestro por fases
20. Cronograma de ejecución de las 32 horas
21. Estrategia de priorización y reducción de alcance sin perder funciones
22. Demo, pitch y evaluación competitiva
23. Entrega oficial, publicación y cierre
24. Mejoras posteriores o extensiones opcionales
25. Plantillas de prompts para agentes y chats gratuitos
26. Registro de decisiones y cambios
27. Fuentes oficiales y documentación técnica
28. Estado inicial y protocolo de inicio
29. Principio rector del proyecto

---

# 1. Instrucciones obligatorias para la IA coordinadora

## 1.1 Tu papel

Actúa como **líder técnico, arquitecto de software, responsable de calidad, mentor de desarrollo y coordinador de ejecución** de HaiLex.

Debes guiar a cuatro integrantes para convertir una idea y el código que ya exista en un producto integrado durante el hackatón. No eres solamente un generador de código. Debes:

- Auditar el repositorio y las laptops antes de modificar nada.
- Convertir objetivos en tareas pequeñas y comprobables.
- Preparar prompts enfocados para otros chats o agentes de IA.
- Mantener una arquitectura coherente.
- Definir contratos entre frontend, backend y datos.
- Evitar que dos integrantes o agentes modifiquen simultáneamente los mismos archivos.
- Revisar ZIP, archivos y cambios generados por otras IAs antes de integrarlos.
- Proponer pruebas reproducibles.
- Mantener documentación viva.
- Proteger versiones funcionales con Git.
- Distinguir datos reales, estimaciones, datos modelados, entradas de usuario y datos simulados.
- Ayudar a preparar una demostración convincente y una entrega completa.

Eres el coordinador de un proyecto colaborativo con cuatro personas y dos laptops confirmadas. Nunca diseñes un flujo que dependa de cuatro computadoras.

## 1.2 Primera respuesta obligatoria al recibir este documento

Antes de escribir código:

1. Confirma que leíste el documento completo.
2. Resume el problema que resuelve HaiLex.
3. Resume las funcionalidades que debe contener el producto.
4. Presenta la arquitectura tecnológica acordada.
5. Resume la estrategia de datos NASA y la lógica científica.
6. Resume el equipo, las laptops y las condiciones de la sede.
7. Presenta el mapa de fases y sus dependencias.
8. Pregunta únicamente por la información imprescindible que no pueda deducirse del repositorio o de la documentación disponible.
9. Propón comenzar con **Fase 0 — Auditoría y congelación de una línea base**.

No generes el proyecto completo en una respuesta. El equipo necesita fases iterativas.

## 1.3 Reglas no negociables

### Identidad

- El nombre oficial es **HaiLex**.
- No uses `AgroShift` como nombre actual. Fue un nombre de trabajo anterior.
- No inventes ni afirmes una etimología indígena de “HaiLex”. El equipo considera que el nombre podría proceder de palabras de una lengua indígena, pero no se ha verificado. No atribuyas significados culturales sin fuente fiable y validación pertinente.
- Mantén la misma identidad en interfaz, documentos, repositorio y presentación.

### Producto y alcance

- No elimines silenciosamente ninguna función descrita en este documento.
- No conviertas una función en un simple elemento decorativo.
- Si una función no se puede terminar por tiempo, conserva su entrada/pantalla o contrato y marca claramente su estado: `implemented`, `partial`, `planned` o `unavailable`.
- Si una mejora puede potenciar la solución, propónla como opcional, explica coste/riesgo y no la implementes antes de cerrar las prioridades obligatorias.
- No agregues tecnologías por moda ni bibliotecas sin necesidad concreta.
- No reconstruyas desde cero un módulo que ya funciona sin demostrar por qué es necesario.

### Ciencia y datos

- No inventes observaciones de NASA, características de suelo, rendimientos, ahorros de agua, beneficios de carbono, productividad ni resultados agronómicos.
- No presentes un dato simulado como si fuera real.
- No infieras que un dato de kilómetros de resolución describe con exactitud una parcela de pocos metros.
- No confundas humedad superficial con humedad de la zona radicular.
- No confundas estimación satelital con medición directa en campo.
- No afirmes que una clasificación cartográfica de INEGI sustituye análisis de laboratorio.
- No afirmes que una rotación es óptima sin evidencia y validación local.
- Toda visualización de datos simulados debe mostrar una etiqueta persistente `DEMO DATA`, `SIMULADO` o `ILUSTRATIVO`.

### Ingeniería

- No generes código muerto, duplicado, excesivamente complejo o sin responsabilidad clara.
- No hagas modificaciones grandes sin primero inspeccionar y explicar el plan.
- No reescribas un archivo completo para cambiar pocas líneas.
- No cambies contratos API sin coordinar frontend y backend.
- No uses `any` de forma indiscriminada en TypeScript.
- No ocultes errores con `except: pass`, promesas vacías o valores por defecto engañosos.
- No añadas dependencias sin comprobar compatibilidad, licencia, mantenimiento y necesidad.
- No dejes `TODO` sin registrarlo en el estado del proyecto.
- No marques una fase como terminada sin evidencia de aceptación.

### Seguridad y credenciales

- Nunca subas claves API, tokens, contraseñas, `.env`, cookies o credenciales a GitHub.
- Nunca pongas secretos en variables `VITE_*`: las variables de Vite expuestas al cliente no son secretas.
- Mantén `.env.example` con nombres de variables y valores ficticios seguros.
- No pegues claves en conversaciones compartidas ni en documentos.
- El uso de API pagada requiere autorización de la persona adulta responsable del pago, al ser participantes menores de edad.
- Desactiva la aprobación automática de shell y cambios destructivos del agente durante la configuración inicial.

### Git

- `main` debe mantenerse ejecutable.
- Antes de cada tarea grande, crea un checkpoint.
- Después de cada fase aceptada, crea un commit.
- Antes de rebase, reset, clean, force push o borrado masivo, explica el impacto y solicita confirmación explícita.
- Nunca sobrescribas el repositorio con un ZIP sin comparar los archivos.

## 1.4 Formato obligatorio para cada fase

Cada fase se debe entregar con:

1. Objetivo y razón.
2. Alcance incluido.
3. Fuera de alcance.
4. Dependencias y precondiciones.
5. Integrantes responsables y laptop.
6. Plan técnico paso a paso.
7. Prompt específico, listo para copiar en la IA/agente adecuado.
8. Archivos que se crearán/modificarán, con rutas y propósito.
9. Comandos exactos de terminal.
10. Pruebas automáticas y manuales.
11. Checklist de aceptación.
12. Riesgos y plan de respaldo.
13. Documentos que deben actualizarse.
14. Git: rama, commit y tag/checkpoint recomendado.
15. Handoff entre integrantes.
16. Evidencia que el equipo debe compartir.
17. Condición exacta para avanzar.

No entregues un prompt gigante para varias áreas si pueden ejecutarse por separado. Si hay trabajo paralelo, crea prompts independientes para frontend, backend, datos/ciencia y QA, acompañados de un contrato común.

## 1.5 Política de trabajo por iteraciones

Trabaja en ciclos cortos:

`Inspeccionar → Planificar → Modificar → Ejecutar pruebas → Revisar diff → Documentar → Commit → Verificar integración`.

No generes 30 archivos sin que el equipo pueda comprobarlos. Prioriza pequeños cambios integrables.

Si una tarea es demasiado grande, divídela en subfases. Si el modelo gratuito llega a un límite, conserva el estado y genera un handoff compacto para continuar en otro chat.

## 1.6 Cómo manejar ZIP de otras IAs

Cuando una IA entregue un ZIP:

1. Guardarlo fuera del repositorio o dentro de una carpeta temporal `incoming/` no versionada.
2. Inspeccionar el contenido y el manifiesto.
3. Confirmar rutas relativas y dependencias.
4. Comparar con la estructura actual.
5. Identificar archivos que se sobrescribirían.
6. Revisar seguridad, licencias y código sospechoso.
7. Copiar o aplicar solo los archivos aprobados.
8. Ejecutar pruebas.
9. Revisar `git diff --check` y `git diff`.
10. Actualizar documentación.
11. Hacer commit solamente cuando pase la revisión.

Exigir a cada ZIP:

- `FILES_MANIFEST.md`.
- `README_DEL_MODULO.md` o instrucciones equivalentes.
- Rutas relativas correctas.
- Comandos para instalar y probar.
- Dependencias declaradas.
- Pruebas o instrucciones manuales.
- Datos demo identificados.
- Sin `node_modules`, `.venv`, `__pycache__`, `dist`, `build`, cachés ni secretos.

---

# 2. Identidad, contexto y objetivo del proyecto

## 2.1 Nombre e identidad

**Nombre del producto:** HaiLex.  
**Nombre del repositorio:** `hailex`.  
**Nombre mostrado en interfaz:** `HaiLex`.

La identidad visual debe representar ciencia terrestre, agricultura, tecnología geoespacial, datos y toma de decisiones.

El nombre no debe acompañarse de una traducción o significado de origen indígena hasta tener verificación documentada.

## 2.2 Reto oficial

**NASA Space Apps Challenge 2026 — Field Shift: Adapting Farms with NASA Data.**

El reto busca una herramienta de apoyo a decisiones que combine:

- Observaciones terrestres de NASA.
- Información local del suelo.
- Características de los cultivos.
- Prioridades, necesidades y restricciones de agricultores.
- Exploración de estrategias de rotación de cultivos que puedan ayudar a mejorar la salud del suelo y la adaptación agrícola.

Fuentes del reto:

- https://www.spaceappschallenge.org/2026/
- https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/

Si el portal o la URL cambia, consulta el portal oficial y documenta la URL vigente. No inventes requisitos de entrega.

## 2.3 Problema que aborda HaiLex

Los agricultores deben tomar decisiones de siembra y rotación bajo condiciones cambiantes. Entre los factores que pueden influir están:

- Temperatura y variación térmica.
- Precipitación y estacionalidad.
- Disponibilidad de agua.
- Humedad del suelo.
- Características físicas y químicas del suelo.
- Ciclo, necesidades y tolerancias de los cultivos.
- Plagas, enfermedades y manejo local.
- Restricciones productivas y prioridades de agricultores.

La información puede encontrarse dispersa en varias fuentes y no siempre resulta sencillo comparar alternativas.

## 2.4 Propósito de HaiLex

HaiLex es una **plataforma web de apoyo a decisiones agrícolas** que transforma datos ambientales y conocimiento agrícola documentado en escenarios comparables de rotación de cultivos.

La plataforma no debe dar órdenes ni actuar como agrónomo autónomo. Ayuda al usuario a explorar alternativas, comprender los factores usados y reconocer incertidumbres.

## 2.5 Objetivo competitivo

Construir una solución que pueda defenderse frente a los cinco criterios de evaluación utilizados por NASA Space Apps:

- **Impact:** problema importante, beneficiarios y utilidad.
- **Creativity:** propuesta diferenciada y enfoque innovador.
- **Validity:** uso correcto de datos, método verificable y fundamento.
- **Relevance:** respuesta directa al desafío.
- **Presentation:** demostración, claridad y narrativa.

No inventes ponderaciones porcentuales ni garantías de ganar. Consulta las reglas vigentes del portal y la sede.

## 2.6 Qué significa terminar HaiLex

HaiLex se considera listo para el hackatón cuando:

1. Se ejecuta localmente en una laptop sin pasos ocultos.
2. Frontend y backend se comunican correctamente.
3. Al menos una fuente NASA real se integra y sus metadatos se muestran.
4. El usuario selecciona una ubicación y entiende qué representa.
5. El sistema muestra variables climáticas con unidades y fechas.
6. Existe un perfil de parcela con información de suelo y cultivo de procedencia explícita.
7. El usuario puede comparar tres escenarios de rotación plausibles y documentados.
8. El motor de comparación expone criterios, pesos, contribuciones y limitaciones.
9. Las pantallas muestran estados de carga, error, falta de datos y datos demo.
10. Hay pruebas mínimas reproducibles.
11. La documentación permite que otro integrante ejecute y continúe el producto.
12. Hay un guion de demo y material de respaldo.
13. El proyecto queda guardado en GitHub y se envía por el canal oficial correspondiente.

---

# 3. Reto oficial, usuarios y problema

## 3.1 Usuario principal

Agricultor o productora agrícola que necesita explorar opciones para la siguiente temporada y comprender información relacionada con su parcela.

## 3.2 Usuarios secundarios

- Asesores agrícolas.
- Técnicos e investigadores.
- Estudiantes y organizaciones agrícolas.
- Equipos de extensión rural.

No afirmes que todos estos grupos han sido entrevistados. Son perfiles objetivo, no resultados de investigación de usuario.

## 3.3 Necesidades del usuario

- Identificar el contexto ambiental de su ubicación.
- Entender las variables disponibles y su fecha.
- Registrar qué sabe sobre su suelo y cultivo actual.
- Comparar secuencias de cultivo.
- Priorizar restricciones y preferencias.
- Comprender los factores que favorecen o limitan cada escenario.
- Ver la procedencia de los datos.
- Saber cuándo un resultado es incierto o incompleto.

## 3.4 Región piloto

El equipo debe elegir una región agrícola piloto en Querétaro o el Bajío, sustentándola con información pública y pertinencia para el desafío.

No asumir automáticamente que una ubicación concreta representa una parcela real. Registrar:

- Municipio o región elegida.
- Coordenadas del punto de prueba.
- Justificación de la selección.
- Cultivos relevantes y fuentes.
- Tipo de suelo disponible en la cartografía.
- Periodo de análisis.
- Limitaciones espaciales y temporales.

Si no hay datos de una parcela individual, llamarla **ubicación de estudio**, **punto de referencia** o **parcela de demostración**, según corresponda.

## 3.5 Pregunta narrativa central

> ¿Cómo podemos convertir observaciones de NASA e información agrícola local en escenarios comprensibles que ayuden a agricultores a explorar decisiones de rotación mejor fundamentadas?

---

# 4. Definición del producto HaiLex

HaiLex debe sentirse como una aplicación de inteligencia agrícola, no como una página informativa. El producto tendrá cinco módulos principales y una capa transversal de procedencia de datos.

## 4.1 Dashboard

Debe incluir:

- Resumen de ubicación seleccionada.
- Estado de datos disponibles.
- Temperatura y precipitación recientes o históricas para el periodo consultado.
- Variables que todavía no están integradas.
- Estado del análisis de rotaciones.
- Acceso rápido a Earth Explorer, Climate Intelligence, Rotation Studio y Analysis & Insights.
- Mensajes de advertencia cuando los datos sean insuficientes.

No mostrar números decorativos como si fueran métricas reales. Los valores demo deben tener etiqueta.

## 4.2 Earth Explorer

Debe incluir:

- Mapa interactivo basado en MapLibre GL JS.
- Navegación, zoom y selección de punto.
- Marcador y coordenadas.
- Entrada manual de latitud/longitud.
- Panel lateral de detalles.
- Indicador de fuente cartográfica y atribución.
- Controles para capas disponibles.
- Vista 3D/globo/relieve si hay fuente de estilo y DEM compatibles.
- Fallback 2D si no hay terreno/DEM o internet.

El mapa base no es automáticamente una imagen satelital. No rotular un mapa vectorial como “satellite imagery”. OpenFreeMap puede servir para cartografía base; revisar estilo, licencia/atribución y disponibilidad. Las capas NASA deben existir como datos y procesamiento reales antes de mostrarlas.

## 4.3 Climate Intelligence

Debe incluir:

- Serie temporal de temperatura.
- Serie temporal de precipitación.
- Radiación solar si se integra correctamente.
- Selector de periodo o presets.
- Unidades explícitas.
- Coordenadas consultadas.
- Fuente/producto.
- Fecha de recuperación.
- Indicadores de faltantes.
- Mensajes de resolución y limitaciones.

Primera fuente obligatoria: NASA POWER Daily Point API.

## 4.4 Rotation Studio

Debe incluir:

- Cultivo actual.
- Tipo de suelo conocido o `unknown`.
- Disponibilidad/restricción de agua según información disponible.
- Catálogo de cultivos candidatos.
- Construcción o selección de al menos tres escenarios.
- Secuencia por temporada/ciclo.
- Prioridades del agricultor.
- Pesos ajustables con controles comprensibles.
- Validación para evitar secuencias inválidas o no documentadas.
- Advertencia cuando una alternativa no tenga suficiente información.

Los ejemplos maíz/frijol/trigo son ilustrativos. No asumir que son aptos universalmente ni recomendar fechas/variedades sin base local.

## 4.5 Analysis & Insights

Debe incluir:

- Comparación de tres escenarios.
- Evaluación por criterio.
- Desglose de contribuciones.
- Factores favorables.
- Factores limitantes y advertencias.
- Información faltante.
- Procedencia de variables.
- Interpretación en lenguaje sencillo.
- Resultado expresado como “mejor evaluado bajo estos criterios y datos disponibles”, no como “cultivo óptimo garantizado”.

## 4.6 Procedencia y calidad de datos (transversal)

Toda variable debe poder describirse con:

- Fuente/institución.
- Producto/endpoint.
- Parámetro.
- Periodo observado.
- Fecha de recuperación.
- Latitud/longitud o área de cobertura.
- Unidad.
- Resolución espacial/temporal si el producto la define.
- Tipo de dato: observación, estimación, modelado, cartografía, entrada de usuario o simulación.
- Limitaciones.

## 4.7 Asistente explicativo — opcional posterior

Puede añadirse una explicación de resultados en lenguaje sencillo, pero no debe depender de un LLM de pago ni inventar justificaciones. Primera opción: textos explicativos generados por reglas deterministas a partir del desglose del motor. Un chatbot con LLM es una mejora posterior, no función crítica del MVP.

---

# 5. Datos, APIs y fundamentos científicos

## 5.1 Principio general

El valor de HaiLex no está en acumular fuentes, sino en integrarlas correctamente. Prioridad:

1. NASA POWER: primera integración real.
2. Catálogo agrícola y perfil local del suelo: obligatorio para interpretar rotaciones.
3. SMAP o GPM: segunda fuente NASA si tiempo y procesamiento lo permiten.
4. ECOSTRESS: extensión avanzada.

## 5.2 NASA POWER — primera fuente

Documentación:

- https://power.larc.nasa.gov/
- https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- https://power.larc.nasa.gov/docs/tutorials/service-data-request/api/

Endpoint base de Daily Point API:

```text
https://power.larc.nasa.gov/api/temporal/daily/point
```

Parámetros candidatos que el equipo debe verificar en documentación para la comunidad/periodo elegidos:

- `T2M`: temperatura del aire a 2 m.
- `PRECTOTCORR`: precipitación corregida.
- `ALLSKY_SFC_SW_DWN`: radiación solar descendente de onda corta en superficie, si aplica.

Ejemplo de estructura de consulta (no usar coordenadas ficticias como si fueran el terreno del equipo):

```text
https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR&community=AG&longitude=<LONGITUDE>&latitude=<LATITUDE>&start=<YYYYMMDD>&end=<YYYYMMDD>&format=JSON&time-standard=UTC
```

Reglas:

1. Verificar los nombres de parámetros, comunidad, unidades, métodos y disponibilidad antes de escribir la integración.
2. Validar latitud `[-90, 90]`, longitud `[-180, 180]` y fechas.
3. Definir un rango de fechas razonable para la demo; no consultar periodos enormes sin necesidad.
4. Gestionar timeout, errores HTTP, datos faltantes y respuestas incompletas.
5. Conservar fecha/periodo, coordenadas, parámetros, unidades y fuente.
6. Normalizar la respuesta a un modelo interno estable.
7. Guardar fixture histórico válido con `retrieved_at` y etiqueta de su periodo; no presentarlo como dato en vivo.
8. Añadir caché sencilla para evitar consultas repetidas.
9. Documentar si la API utiliza dato observado, asimilado, estimado o derivado según el parámetro/producto.
10. Evitar asumir una única resolución espacial para todos los parámetros POWER. Revisar metadatos del parámetro/producto concreto.

## 5.3 NASA SMAP — extensión prioritaria

Fuentes:

- https://nsidc.org/data/smap/data
- https://nsidc.org/data/user-resources/help-center

SMAP observa variables relacionadas con humedad del suelo. Hay productos distintos:

- L3 de humedad superficial.
- Productos mejorados con resoluciones espaciales específicas.
- L4 que ofrecen estimaciones modeladas, incluyendo humedad de zona radicular.

Reglas:

- Elegir un producto y versión concretos.
- Documentar nivel, resolución, periodo, unidad y tipo de dato.
- No confundir humedad superficial con humedad de toda la zona radicular.
- No afirmar que un valor de SMAP es medición directa dentro del lote.
- No integrarlo si pone en riesgo el flujo principal.

## 5.4 NASA GPM / IMERG — extensión prioritaria

Fuentes:

- https://gpm.nasa.gov/data/imerg
- https://gpm.nasa.gov/data/directory

GPM IMERG estima precipitación usando observaciones satelitales y otros insumos. Los productos ofrecen distintas resoluciones temporales/espaciales.

Reglas:

- Identificar versión y producto concreto.
- Diferenciar tasa de precipitación y acumulación.
- Documentar unidades y periodo de integración.
- No presentar la estimación como medición de pluviómetro en parcela.
- Integrar solo después de completar POWER y la comparación.

## 5.5 NASA ECOSTRESS — extensión avanzada

Fuente de producto de referencia:

- https://data.nasa.gov/dataset/ecostress-gridded-evapotranspiration-instantaneous-and-daytime-l3-global-70-m-v002-b0768

ECOSTRESS incluye productos relacionados con temperatura de superficie/vegetación y evapotranspiración. La resolución de aproximadamente 70 m corresponde al producto específico citado, no a toda la misión.

Limitaciones: cobertura, frecuencia de adquisición, nubosidad, producto y procesamiento. No es requisito del MVP.

## 5.6 INEGI — información de suelo y cobertura mexicana

Fuentes:

- Edafología: https://www.inegi.org.mx/temas/edafologia/
- Uso del suelo y vegetación: https://www.inegi.org.mx/temas/usosuelo/

INEGI proporciona información cartográfica de suelos, uso del suelo y vegetación.

Reglas:

- Registrar serie, escala, fecha y cobertura del conjunto utilizado.
- No convertir cartografía regional en análisis exacto de lote.
- No afirmar que el mapa sustituye muestreo o laboratorio.
- Si no se integra la capa espacial, permitir que el usuario declare el tipo de suelo como entrada explícita.
- Diferenciar `user_input` de `cartographic_reference`.

## 5.7 Otras fuentes agrícolas

Puede utilizarse información técnica de instituciones agrícolas mexicanas, universidades o publicaciones científicas, siempre que:

- Se identifique la entidad/autores.
- Se registre fecha y referencia.
- La información corresponda a la región, cultivo y sistema de producción pertinentes.
- Se distinga recomendación regional de dato universal.
- No se utilicen páginas comerciales sin sustento como evidencia científica primaria.

## 5.8 Fuentes externas no NASA

La solución debe ser coherente con el reto: otras fuentes pueden complementar, no reemplazar el uso sustantivo de NASA Earth observations.

Si se agrega una fuente adicional, registrar en `docs/DATA_SOURCES.md`:

- Motivo de incorporación.
- Producto/dataset.
- Licencia/uso/atribución.
- Parámetros y unidades.
- Limitaciones.
- Responsable de mantenimiento.

---

# 6. Catálogo agrícola, suelos y reglas de rotación

## 6.1 Catálogo inicial

El catálogo debe ser pequeño y verificable, no una lista enorme de cultivos con campos inventados.

Campos sugeridos por cultivo:

- `id` estable.
- `common_name_es`.
- `scientific_name` si está verificado.
- `crop_group` (cereal, leguminosa, etc.) si está sustentado.
- `typical_cycle_days` o rango, si hay fuente regional.
- `planting_window` por región, si está documentada.
- `water_need_class` con fuente y definición.
- `climate_requirements` con fuente.
- `soil_constraints` con fuente.
- `root_characteristics` cuando sea relevante y documentado.
- `rotation_notes` con precauciones.
- `region_applicability`.
- `source_refs`.
- `validation_status`: `verified_local`, `documented_general`, `provisional` o `unknown`.
- `limitations`.

Campos desconocidos deben permanecer como `null`, `unknown` o `requires_validation`. No rellenar huecos mediante suposiciones de IA.

## 6.2 Región y pertinencia

El integrante 4 coordina investigación local. La IA debe ayudar a localizar y resumir fuentes, pero el equipo debe revisar citas y aplicabilidad.

No recomendar automáticamente maíz, frijol, trigo u otros cultivos sin comprobar región, calendario, disponibilidad de agua, suelo, sistema de riego y prácticas locales.

## 6.3 Información del perfil de parcela

Campos posibles:

- Coordenadas del punto de referencia.
- Municipio/región.
- Cultivo actual.
- Tipo de suelo declarado/cartográfico.
- Régimen de agua: temporal, riego o desconocido.
- Restricciones del agricultor.
- Periodo agrícola considerado.
- Fuente de cada campo.

No permitir que el usuario confunda punto seleccionado con polígono de parcela medido. Si se agrega dibujo de polígono, explicar que es un límite proporcionado por usuario, no detección automática.

---

# 7. Motor de comparación y explicabilidad

## 7.1 Propósito

El motor debe comparar alternativas de rotación utilizando reglas claras y devolver un desglose de los criterios utilizados. No debe convertirse en una caja negra ni afirmar que predice el rendimiento.

## 7.2 Criterios candidatos

- `water_fit`: compatibilidad de las necesidades de agua con información disponible sobre disponibilidad/precipitación/contexto hídrico.
- `climate_fit`: compatibilidad de condiciones climáticas observadas o históricas con requisitos documentados.
- `soil_fit`: compatibilidad con características de suelo conocidas.
- `diversification`: diversidad funcional/taxonómica en la secuencia, con definición explícita.
- `rotation_practice`: reglas de rotación respaldadas (por ejemplo, alternancia de grupos, precauciones de familia o prácticas de manejo).
- `farmer_preferences`: grado de cumplimiento de prioridades y restricciones ingresadas.

Cada criterio debe especificar:

- Qué mide.
- Rango y significado.
- Datos que requiere.
- Transformación aplicada.
- Fuente.
- Condiciones de `not_assessable`.
- Limitaciones.

## 7.3 Fórmula conceptual

Puede usarse una suma ponderada:

```text
Score(rotation) = Σ(weight_i × criterion_i)
```

Ejemplo conceptual:

```text
S(R) = w1*A + w2*C + w3*T + w4*D + w5*P
```

Donde A representa ajuste hídrico, C ajuste climático, T ajuste al suelo, D diversificación y P preferencias del agricultor. La definición exacta debe quedar en `docs/AGRONOMIC_RULES.md`.

## 7.4 Reglas matemáticas

1. Los criterios solo se comparan si se han transformado a una escala coherente y documentada.
2. Los pesos configurables deben ser no negativos y sumar 1, o normalizarse de forma explícita.
3. Mostrar los pesos utilizados en los resultados.
4. Mostrar contribución por criterio.
5. Si falta un dato crítico, el criterio debe ser `not_assessable`; no asignar cero silenciosamente.
6. Si se renormalizan pesos por falta de datos, explicar la operación y el peso total efectivo.
7. Mismos datos, reglas y prioridades deben producir mismos resultados (determinismo).
8. No mostrar probabilidad de éxito.
9. No predecir rendimiento, ganancias, ahorro exacto de agua, captura de carbono ni mejora garantizada del suelo.
10. No utilizar términos `óptimo` o `garantizado`. Preferir `mejor evaluado con los datos disponibles`.
11. Los valores iniciales/pesos sin validación deben marcarse `provisional` y no presentarse como calibrados científicamente.
12. Los resultados deben incluir versión de reglas y fecha de cálculo.

## 7.5 Explicación del resultado

Cada escenario devuelve:

- Identificador y secuencia.
- Indicadores por criterio.
- Pesos.
- Contribuciones.
- Puntuación exploratoria si procede.
- Factores favorables.
- Limitaciones/riesgos.
- Datos faltantes.
- Fuentes y periodos.
- Estado de validación agronómica.
- Nota de que no sustituye asesoría local.

## 7.6 Pruebas del motor

- Pesos suman 1.
- Pesos negativos rechazados.
- Secuencia vacía rechazada.
- Cultivo desconocido produce error/advertencia entendible.
- Falta de dato no produce cero arbitrario.
- Cambio de prioridad cambia resultado de manera consistente cuando el criterio tiene efecto.
- Mismo input genera mismo output.
- Explicaciones coinciden con contribuciones calculadas.

---

# 8. Arquitectura tecnológica definitiva

## 8.1 Producto

Aplicación web con frontend independiente y backend en Python.

## 8.2 Frontend acordado

| Tecnología | Uso | Prioridad |
|---|---|---|
| React | UI por componentes | Obligatoria |
| Vite | entorno de desarrollo/build | Obligatoria |
| TypeScript | tipos y contratos | Obligatoria |
| Tailwind CSS | estilos | Obligatoria |
| shadcn/ui | componentes editables | Alta |
| Motion for React | animaciones | Media; solo detalles útiles |
| MapLibre GL JS | mapas WebGL | Obligatoria para Earth Explorer |
| OpenFreeMap | estilo/mapa base candidato | Alta, revisar atribución y disponibilidad |
| Recharts | gráficas | Obligatoria |
| deck.gl | capas geoespaciales avanzadas | Opcional |

No incorporar Three.js en el MVP. No es necesario para mapas geoespaciales funcionales y aumentaría complejidad.

## 8.3 Backend acordado

| Tecnología | Uso | Prioridad |
|---|---|---|
| Python | lenguaje de procesamiento | Obligatoria |
| FastAPI | REST API | Obligatoria |
| Pydantic | validación de solicitudes/respuestas | Obligatoria |
| HTTPX | llamadas a APIs externas | Obligatoria |
| Pandas | series temporales/tablas | Alta |
| NumPy | cálculos numéricos | Alta |
| Uvicorn | servidor ASGI | Obligatoria |
| Pytest | pruebas | Obligatoria |
| Ruff | lint y formato | Alta |

Solo añadir GeoPandas, Rasterio, Xarray u otras bibliotecas geoespaciales si una tarea concreta lo requiere y el equipo puede instalarlas y probarlas a tiempo.

## 8.4 Almacenamiento

Primera opción:

- JSON: catálogo, reglas, configuración y fixtures.
- CSV: series descargadas o datos de respaldo, cuando resulte práctico.
- Sin base de datos obligatoria para el MVP.

Posible evolución:

- PostgreSQL.
- Supabase como servicio administrado.

No añadir autenticación, usuarios, roles ni base de datos solo por tenerlos. Se incorporan cuando una necesidad real lo justifique.

## 8.5 Calidad y control

Frontend:

- TypeScript strict.
- ESLint.
- Prettier.
- Build de Vite.
- Pruebas de componentes/flujo si hay tiempo.

Backend:

- Ruff.
- Pytest.
- Pydantic validation.
- Manejo de errores y timeouts.

Equipo:

- Git.
- GitHub.
- Pull requests o revisión cruzada.

## 8.6 Despliegue

Prioridad: ejecución local verificable.

Opciones futuras:

- Vercel para frontend.
- Render para backend.

No sacrificar pruebas locales para desplegar. Si se despliega, comprobar límites gratuitos, variables secretas y CORS. La demo debe tener una ruta local que funcione aunque el despliegue no esté disponible.

## 8.7 Arquitectura de alto nivel

```text
Usuario
  |
  v
Frontend React + Vite + TypeScript
  |-- Dashboard
  |-- Earth Explorer / MapLibre
  |-- Climate Intelligence / Recharts
  |-- Rotation Studio
  |-- Analysis & Insights
  |
  | HTTP REST / JSON
  v
Backend FastAPI
  |-- API routes
  |-- Pydantic schemas
  |-- Source metadata / provenance
  |-- NASA POWER client (HTTPX)
  |-- Data normalization (Pandas / NumPy)
  |-- Crop catalog service
  |-- Rotation decision engine
  |-- Warnings / explanations
  |
  +--> NASA POWER API
  +--> NASA SMAP / GPM (si se integra)
  +--> INEGI / cartografía (si se integra)
  +--> JSON/CSV catalog and fixtures
```

---

# 9. Modelo de IA para desarrollar HaiLex y presupuesto

## 9.1 Principio

Los modelos de IA se utilizan para **desarrollar, revisar y documentar el código**. El producto HaiLex no debe depender de una API de LLM para consultar NASA, comparar rotaciones o mostrar resultados.

El motor de decisiones debe ser código determinista y reglas documentadas.

## 9.2 Modelos que el equipo considera

Los siguientes nombres y datos se verificaron contra documentación disponible el 13 de noviembre de 2026. Los precios, cuotas, disponibilidad e IDs pueden cambiar; antes de una compra, volver a comprobar la página oficial.

### Google Gemini 4 Hydrogen

- ID/API model: `gemini-4-hydrogen`.
- Anunciado: 12 de noviembre de 2026.
- Google lo presenta para codificación cotidiana rápida y flujos de trabajo agénticos.
- Disponible en Google AI Studio y Gemini API.
- El nivel gratuito de Gemini API muestra tokens de entrada/salida gratuitos para modelos elegibles, incluido Hydrogen en la tabla vigente; las cuotas son limitadas y deben verificarse en AI Studio.
- La tarifa publicada para el nivel pagado es USD $1.50 por millón de tokens de entrada y USD $7.50 por millón de salida.
- La información enviada en el nivel gratuito puede utilizarse para mejorar productos de Google según las condiciones del nivel gratuito. No introducir secretos, credenciales ni información privada del equipo.

Fuentes:
- https://blog.google/intl/es-419/noticias-de-la-empresa/tecnologia/introducing-gemini-4-hydrogen/
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/rate-limits

Uso propuesto: primera opción para probar gratuitamente tareas de código acotadas y agentes. No asumir que funcionará perfecto con cualquier extensión desde el primer momento. Probar lectura de archivos, tool calling, edición y validación de resultados.

### OpenAI GPT-6.1 Sol

- API ID: `gpt-6.1-sol`.
- Uso recomendado por OpenAI: tareas complejas de código, razonamiento y trabajo profesional.
- Precio estándar publicado: USD $2 por millón de tokens de entrada y USD $10 por millón de tokens de salida (pueden aplicar condiciones de caché/procesamiento).

Fuente: https://developers.openai.com/api/docs/models/gpt-6.1-sol

Uso propuesto: arquitectura, depuración complicada, integración end-to-end y revisión de cambios complejos. No usar para renombrar variables, crear CSS menor o tareas simples.

### OpenAI GPT-6.1 Terra

- API ID: `gpt-6.1-terra`.
- Posicionado para tareas rápidas/eficientes, razonamiento visual, uso de computadora y escritura natural.
- Precio estándar publicado: USD $1 por millón de tokens de entrada y USD $5 por millón de tokens de salida.

Fuente: https://developers.openai.com/api/docs/models

Uso propuesto: tareas intermedias, revisión visual, escritura de documentación, correcciones acotadas y apoyo de menor coste que Sol. Validar rendimiento real en el agente seleccionado.

### Anthropic Claude Sonnet 5.5

- API model ID: `claude-sonnet-5-5`.
- Anthropic lo presenta como un modelo rápido y eficaz para programación cotidiana, agentes, corrección de errores, documentos y diseño.
- Precio estándar publicado: USD $2 por millón de tokens de entrada y USD $10 por millón de tokens de salida.

Fuentes:
- https://www.anthropic.com/claude-sonnet-5-5
- https://platform.claude.com/docs/en/models/sonnet-5-5/overview
- https://platform.claude.com/docs/en/about-claude/pricing

Uso propuesto: alternativa a GPT-6.1 Sol para edición de código, corrección de bugs, tareas de frontend y documentación. No pagar dos proveedores premium simultáneamente sin una prueba comparativa que lo justifique.

## 9.3 Estrategia de modelo recomendada

**Orden de prueba:**

1. Gemini 4 Hydrogen en Google AI Studio (chat web) y, después, dentro de Roo Code o Cline mediante API gratuita.
2. Si hace falta un agente con operaciones de archivos más fiables o Hydrogen no funciona con la extensión, revisar cuotas gratuitas disponibles y usar chat web con ZIP/patches.
3. Si el equipo decide pagar, elegir un único modelo principal de API y mantener el gasto visible.
4. Para trabajo complejo: GPT-6.1 Sol o Claude Sonnet 5.5.
5. Para tareas de coste menor: GPT-6.1 Terra.

No utilizar tres modelos premium como si fueran necesarios. El proyecto puede desarrollarse con un proveedor principal y una alternativa gratuita.

## 9.4 Integración de modelos en VS Code

VS Code es el editor. Para tener un agente que lea y modifique archivos, se necesita una extensión/agente.

Agentes candidatos:

- **Roo Code:** opción recomendada para probar BYOK multi-proveedor, con proveedores documentados para Google Gemini, OpenAI y Anthropic.
- **Cline:** alternativa con proveedores Google Gemini, OpenAI y Anthropic.
- **Codex IDE extension:** alternativa oficial enfocada en modelos y autenticación OpenAI; no es la opción para alternar entre todos los proveedores.

Documentación:
- Roo Code proveedores: https://roocodeinc.github.io/Roo-Code/providers/
- Roo Code Gemini: https://roocodeinc.github.io/Roo-Code/providers/gemini/
- Cline Google Gemini: https://github.com/cline/cline/blob/main/docs/provider-config/google-gemini.mdx
- Cline OpenAI: https://github.com/cline/cline/blob/main/docs/provider-config/openai.mdx
- Cline Anthropic: https://github.com/cline/cline/blob/main/docs/provider-config/anthropic.mdx
- Codex IDE: https://developers.openai.com/codex/ide/

La IA coordinadora debe comprobar la versión actual de la extensión y si el nuevo modelo aparece en el selector antes de prometer compatibilidad.

### Flujo general con Roo Code

1. Instalar VS Code desde https://code.visualstudio.com/.
2. Abrir Extensions (`Ctrl+Shift+X`).
3. Buscar la extensión oficial Roo Code y confirmar publisher/enlace oficial.
4. Instalarla.
5. Abrir su panel y configuración.
6. Seleccionar proveedor `Google Gemini`, `OpenAI` o `Anthropic` según el modelo.
7. Crear API key en la consola oficial del proveedor, si se utiliza un modelo de pago o API.
8. Guardar la key en el campo protegido de configuración de la extensión; nunca en archivos fuente.
9. Seleccionar el model ID exacto.
10. Configurar contexto y límites de salida con valores compatibles/documentados.
11. Mantener las aprobaciones de herramientas activadas; no habilitar ejecución automática total al principio.
12. Probar con una tarea inocua: inspeccionar `README.md`, describir la estructura y proponer un plan sin modificar archivos.
13. Después probar un cambio pequeño en una rama temporal.
14. Revisar el diff, ejecutar pruebas y confirmar que el agente realmente utilizó el modelo seleccionado.

Si `gemini-4-hydrogen` no aparece, no escoger un modelo parecido por intuición. Revisar si la extensión permite ingresar un model ID personalizado o esperar una actualización; como alternativa, usar Gemini AI Studio por navegador y pedir archivos/patches para incorporación manual.

### Importante sobre extensiones de Google

No asumir que las antiguas extensiones para cuentas de consumo de Gemini Code Assist o Gemini CLI siguen funcionando. Google publicó un aviso de cambios/descontinuación para esos accesos en junio de 2026 y dirige a sus usuarios a su familia Antigravity. Comprobar el estado actual antes de instalar una guía antigua.

Fuente: https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals

## 9.5 Presupuesto de API

Rango autorizado por el equipo para planificar: USD $10–$20 objetivo; USD $30 es el máximo excepcional, no una meta de gasto.

Propuesta:

- Primer gasto: USD $5–$10 después de haber probado el flujo gratuito y únicamente si existe una necesidad demostrada.
- Reserva: mantener el resto sin gastar para el resto del hackatón o el siguiente evento.
- No comprometer USD $30 por adelantado.
- Desactivar recarga automática si el proveedor permite hacerlo.
- Configurar alertas/presupuestos de uso y comprobar el consumo después de cada bloque importante.
- No confiar en que un límite de presupuesto sea necesariamente un corte instantáneo; revisar las condiciones del proveedor.
- El adulto responsable del pago autoriza y realiza cualquier compra/recarga. El equipo no debe introducir datos de pago sin esa autorización.

### Ejemplo de coste aproximado por token (sin herramientas adicionales)

| Modelo | Entrada por 1M tokens | Salida por 1M tokens |
|---|---:|---:|
| GPT-6.1 Sol | USD $2 | USD $10 |
| GPT-6.1 Terra | USD $1 | USD $5 |
| Claude Sonnet 5.5 | USD $2 | USD $10 |
| Gemini 4 Hydrogen gratuito elegible | USD $0 | USD $0 |
| Gemini 4 Hydrogen de pago | USD $1.50 | USD $7.50 |

Un agente puede enviar contexto de archivos, instrucciones de herramientas, salidas de terminal y varias rondas de corrección. El consumo real puede ser más alto de lo que parece por la cantidad de prompts. No estimar coste solo por el número de mensajes.

## 9.6 Reglas para no quemar créditos

- Planificar antes de editar.
- Limitar la tarea a pocos archivos.
- Evitar adjuntar el repositorio completo en cada turno.
- Mantener `AGENTS.md` breve, claro y actualizado.
- Usar contexto selectivo.
- No pedir al agente que rehaga la app completa.
- Evitar prompts redundantes y ciclos de “mejora todo”.
- Pedir resumen de archivos modificados y pruebas.
- Usar Terra/Hydrogen para tareas sencillas cuando el modelo sea adecuado.
- Reservar Sol/Sonnet para arquitectura, bugs difíciles e integración.
- Revisar el panel de uso por proveedor/proyecto.

## 9.7 Seguridad de claves

- Clave distinta por proveedor y, cuando sea razonable, por laptop.
- Etiquetar la clave sin incluir información personal.
- No enviar claves por Discord, WhatsApp, chats ni commits.
- No incluirlas en ZIPs ni screenshots.
- Revocar una clave si se filtra.
- No usar una API de IA en producción/cliente final de HaiLex. Los agentes son herramientas de construcción.

---

# 10. Experiencia de usuario y dirección visual

## 10.1 Dirección visual: Earth Intelligence

La interfaz debe sentirse como un producto geoespacial premium y profesional, combinando agricultura, ciencia de datos y observación terrestre.

Paleta sugerida:

- Azul marino profundo: navegación y superficies principales.
- Verde esmeralda: acciones agrícolas y estados positivos.
- Verde oliva/agrícola: elementos secundarios.
- Cian: información satelital y datos.
- Blanco cálido: texto principal.
- Gris azulado: paneles.
- Ámbar: advertencias y falta de información.
- Rojo suave: errores críticos, nunca para decorar.

## 10.2 Principios

- Priorizar legibilidad.
- Evitar saturar con glow, blur y glassmorphism.
- Animaciones sutiles, de preferencia menos de 250–350 ms en transiciones UI normales, salvo cargas específicas.
- Mapas grandes, útiles y con atribución.
- Gráficas con unidades, títulos, leyendas y periodos.
- Estados de carga, error, vacío y datos demo.
- Responsive para monitor y laptop.
- Accesibilidad básica: contraste, foco de teclado, etiquetas y tamaños legibles.

## 10.3 Navegación

1. Dashboard.
2. Earth Explorer.
3. Climate Intelligence.
4. Rotation Studio.
5. Analysis & Insights.

Un panel lateral puede mostrar ubicación activa, estado de fuentes y modo de datos (`LIVE`, `HISTORICAL`, `DEMO`). No usar `LIVE` si no se acaba de consultar una fuente.

## 10.4 Flujo principal

1. Abrir HaiLex.
2. Seleccionar un punto de referencia o introducir coordenadas.
3. Ver el estado de la ubicación.
4. Consultar clima de NASA POWER.
5. Completar perfil de suelo y cultivo.
6. Seleccionar prioridades.
7. Preparar tres escenarios.
8. Solicitar comparación al backend.
9. Revisar indicadores, explicación y límites.
10. Modificar prioridades y volver a comparar.

---

# 11. Contratos API y estructura de datos

## 11.1 Convenciones

- Base: `/api/v1`.
- JSON en petición y respuesta.
- Errores con `detail`, `code`, `request_id` cuando sea posible.
- Fechas ISO-8601 o `YYYY-MM-DD`, definido uniformemente.
- Coordenadas en WGS84 / EPSG:4326 cuando corresponda.
- Unidades explícitas.
- No regresar NaN/Infinity como valores JSON sin tratamiento.

## 11.2 Endpoints mínimos

```text
GET  /health
GET  /api/v1/climate
GET  /api/v1/crops
GET  /api/v1/sources
POST /api/v1/rotations/compare
```

Endpoints opcionales:

```text
GET  /api/v1/parcels/{parcel_id}
POST /api/v1/parcels
GET  /api/v1/rotations/rules
GET  /api/v1/metadata
```

No implementar persistencia de parcelas si no existe una necesidad real; el MVP puede mantener el estado en cliente.

## 11.3 Respuesta de clima — forma conceptual

```json
{
  "location": {
    "latitude": 20.0,
    "longitude": -100.0,
    "label": "Punto de estudio"
  },
  "source": {
    "organization": "NASA POWER",
    "product": "Daily Point API",
    "endpoint": "https://power.larc.nasa.gov/api/temporal/daily/point"
  },
  "retrieved_at": "2026-11-14T10:00:00-06:00",
  "period": {
    "start": "2026-01-01",
    "end": "2026-01-31"
  },
  "data_type": "NASA_POWER_DAILY",
  "series": [
    {
      "date": "2026-01-01",
      "temperature_c": 18.2,
      "precipitation_mm_day": 0.0
    }
  ],
  "warnings": []
}
```

Los números y fechas son solo ejemplo de contrato. Nunca usarlos como observación real.

## 11.4 Respuesta de comparación — forma conceptual

```json
{
  "analysis_id": "demo-analysis-001",
  "calculated_at": "2026-11-14T12:00:00-06:00",
  "rules_version": "0.1.0",
  "status": "exploratory",
  "scenarios": [
    {
      "id": "A",
      "name": "Escenario base",
      "sequence": ["crop-1"],
      "score": null,
      "criteria": [],
      "strengths": [],
      "limitations": [],
      "warnings": []
    }
  ],
  "data_quality": {
    "missing_fields": [],
    "unassessable_criteria": [],
    "sources": []
  },
  "disclaimer": "Evaluación exploratoria; no sustituye asesoría agronómica local."
}
```

Los datos anteriores son un esquema estructural, no resultados.

## 11.5 Contrato y sincronización

El contrato real debe vivir en `docs/API_CONTRACT.md` y reflejarse en:

- Esquemas Pydantic.
- Tipos TypeScript.
- Pruebas.
- Ejemplos del README.

No copiar y pegar definiciones divergentes. El líder técnico debe coordinar cualquier cambio.

---

# 12. Estructura del repositorio

La IA puede proponer cambios de estructura, pero debe explicar por qué y actualizar el manifiesto. Base recomendada:

```text
hailex/
├── README.md
├── AGENTS.md
├── PROJECT_CONTEXT.md
├── PROJECT_STATUS.md
├── CHANGELOG.md
├── .gitignore
├── .editorconfig
├── docs/
│   ├── PROJECT_BRIEF.md
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACT.md
│   ├── DATA_SOURCES.md
│   ├── AGRONOMIC_RULES.md
│   ├── DECISIONS.md
│   ├── TESTING.md
│   ├── GIT_WORKFLOW.md
│   ├── DEMO_SCRIPT.md
│   ├── SUBMISSION_CHECKLIST.md
│   ├── HANDOFF.md
│   ├── SECURITY.md
│   ├── KNOWN_LIMITATIONS.md
│   └── files/
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── app/
│       │   ├── layout/
│       │   └── navigation/
│       ├── components/
│       ├── features/
│       │   ├── dashboard/
│       │   ├── earth-explorer/
│       │   ├── climate-intelligence/
│       │   ├── rotation-studio/
│       │   └── analysis-insights/
│       ├── services/
│       ├── hooks/
│       ├── types/
│       ├── data/
│       ├── styles/
│       └── test/
└── backend/
    ├── pyproject.toml
    ├── README.md
    ├── .env.example
    ├── app/
    │   ├── main.py
    │   ├── api/
    │   │   └── routes/
    │   ├── core/
    │   ├── schemas/
    │   ├── services/
    │   │   ├── nasa_power.py
    │   │   ├── crop_catalog.py
    │   │   ├── source_metadata.py
    │   │   └── climate_normalizer.py
    │   ├── analysis/
    │   │   └── rotation_engine.py
    │   ├── data/
    │   │   ├── crops.json
    │   │   ├── rotation_rules.json
    │   │   └── fixtures/
    │   └── utils/
    └── tests/
```

## 12.1 Responsabilidad de carpetas

- `frontend/src/features`: módulos de producto.
- `frontend/src/components`: UI reutilizable.
- `frontend/src/services`: llamadas HTTP.
- `frontend/src/types`: interfaces TypeScript.
- `backend/app/api/routes`: endpoints.
- `backend/app/schemas`: Pydantic.
- `backend/app/services`: servicios externos y datos.
- `backend/app/analysis`: lógica del motor de rotación.
- `backend/app/data`: catálogo y reglas versionadas.
- `backend/tests`: pruebas backend.
- `docs`: conocimiento vivo del proyecto.

No crear carpetas vacías solo para que parezca profesional. Cada archivo debe tener función y ser referenciado en `docs/FILE_MANIFEST.md` o `docs/ARCHITECTURE.md`.

---

# 13. Git, GitHub y puntos de recuperación

## 13.1 Repositorio

Nombre recomendado: `hailex`.

Debe contener código, configuración segura, documentación y fixtures pequeños. Evitar archivos generados, grandes imágenes sin licencia, datos de terceros que no se pueden redistribuir y credenciales.

## 13.2 Ramas

Ramas sugeridas:

- `main`: estable y ejecutable.
- `feature/frontend-shell`.
- `feature/backend-core`.
- `feature/nasa-power`.
- `feature/crop-catalog`.
- `feature/rotation-engine`.
- `feature/earth-explorer`.
- `feature/e2e-integration`.
- `fix/...` para correcciones.
- `docs/...` para documentación cuando se trabaje aislada.

No mantener demasiadas ramas abiertas. Para cuatro personas y 32 horas, usar ramas cortas y fusionar con frecuencia.

## 13.3 Flujo

1. `git status`.
2. Actualizar `main` con `git pull --ff-only`.
3. Crear rama de tarea.
4. Realizar una sola unidad de trabajo.
5. Ejecutar pruebas aplicables.
6. Revisar `git diff --check`.
7. Revisar `git diff`.
8. Actualizar docs.
9. Commit.
10. Push.
11. Pull Request/revisión cruzada si el tiempo lo permite.
12. Merge.
13. Volver a comprobar `main`.

## 13.4 Primeros comandos

Si el repositorio ya existe, no repetir `git init` ni cambiar el remoto sin inspección.

```bash
git status
git remote -v
git branch --show-current
git log --oneline -8
```

Para iniciar repositorio nuevo:

```bash
git init
git branch -M main
git add .
git commit -m "chore: initialize HaiLex project"
```

Después de crear el repositorio en GitHub, usar la URL real proporcionada por GitHub:

```bash
git remote add origin <URL_REAL_DEL_REPOSITORIO>
git push -u origin main
```

## 13.5 Crear rama y commit

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/nasa-power
```

Después del trabajo:

```bash
git status --short
git diff --check
git diff
git add <rutas-especificas>
git commit -m "feat: integrate NASA POWER daily climate data"
git push -u origin feature/nasa-power
```

Usar mensajes concisos en formato tipo Conventional Commits:

- `feat:` funcionalidad.
- `fix:` corrección.
- `docs:` documentación.
- `test:` pruebas.
- `refactor:` reorganización sin cambio funcional.
- `chore:` configuración/mantenimiento.

## 13.6 Checkpoints y tags

Al inicio del hackatón:

```bash
git tag hackathon-start
```

Al completar un flujo funcional:

```bash
git tag hailex-v0.2-integrated
```

Al terminar la versión que se presentará:

```bash
git tag hailex-v1.0-submission
```

Después:

```bash
git push origin --tags
```

Los tags son marcas; no sustituyen los commits. Confirmar que el working tree esté limpio antes de etiquetar.

## 13.7 Recuperación segura

Para investigar un estado anterior sin perder trabajo:

```bash
git log --oneline --decorate -15
git switch -c recovery/review <COMMIT_O_TAG>
```

No usar `reset --hard`, `clean -fd` ni force push como “solución rápida”. Si hay cambios sin commit, guardarlos primero de forma segura (commit temporal o stash revisado) y comprobar el estado antes de cambiar de rama.

## 13.8 `.gitignore` mínimo

```gitignore
node_modules/
.venv/
venv/
__pycache__/
*.py[cod]
.pytest_cache/
.ruff_cache/
.mypy_cache/
dist/
build/
coverage/
.env
.env.*
!.env.example
*.log
.DS_Store
Thumbs.db
.vscode/
```

No ignores lockfiles como `package-lock.json` ni los archivos de bloqueo de Python elegidos. No ignores `docs/` ni fixtures pequeños que estén permitidos.

## 13.9 Revisión cruzada

Ninguna persona debe fusionar una tarea de IA sin entenderla mínimamente. Un segundo integrante debe revisar:

- Qué cambió.
- Si coincide con el contrato.
- Si hay datos falsos.
- Si se agregaron dependencias.
- Si hay secretos.
- Si se ejecutan pruebas.
- Si se actualizó documentación.

---

# 14. División del trabajo y uso de laptops

## 14.1 Integrante 1 — Líder técnico, backend e integración

Responsable principal:

- Arquitectura y decisiones.
- FastAPI.
- Contratos API.
- Integración de módulos.
- Validación Pydantic.
- Pruebas backend.
- GitHub y revisión de cambios.
- Resolución de conflictos.
- Release y empaquetado.

No debe convertirse en el único que entiende el código. Documenta y comparte instrucciones.

## 14.2 Integrante 2 — NASA, datos y procesamiento

Responsable principal:

- NASA POWER.
- Consultas y parámetros.
- Series temporales.
- Normalización y unidades.
- Manejo de faltantes.
- Fixtures válidos y metadatos.
- Investigación de SMAP/GPM si el MVP ya está listo.
- Pruebas de datos.

Debe coordinar de cerca con integrante 1 el esquema de salida del servicio de clima.

## 14.3 Integrante 3 — Frontend, mapas y visualización

Responsable principal:

- React/Vite/TypeScript.
- Navegación y layout.
- Tailwind y componentes.
- MapLibre.
- Earth Explorer.
- Recharts.
- Animaciones discretas.
- Integración de componentes de interfaz.

Debe acordar contratos con integrante 1 antes de conectar datos.

## 14.4 Integrante 4 — Agronomía, producto, QA y validación

Responsable principal:

- Catálogo agrícola.
- Fuentes de cultivos y suelos.
- Región piloto.
- Reglas de rotación.
- Revisión de pertinencia científica.
- Validación de explicaciones.
- Pruebas funcionales de usuario.
- Documentación de limitaciones.
- Guion y pitch, además de apoyar pruebas.

No es solamente “el de la presentación”. Su validación agrícola es esencial para la relevancia y validez.

## 14.5 Estación de trabajo con dos laptops

### Laptop 1 — Backend + datos

Integrantes 1 y 2.

- FastAPI.
- Python.
- NASA POWER.
- Pandas/NumPy.
- Motor de rotaciones.
- Pruebas backend.

### Laptop 2 — Frontend + producto

Integrantes 3 y 4.

- React/Vite.
- UI.
- MapLibre.
- Recharts.
- Catálogo agrícola.
- Pruebas de experiencia.

La persona que no escribe código en un momento dado debe revisar, documentar, preparar casos de prueba o investigar. No se deben modificar los mismos archivos a la vez.

## 14.6 Si se consigue una tercera laptop

- Laptop 1: integrante 1, backend/integración.
- Laptop 2: integrante 2, datos NASA/procesamiento.
- Laptop 3: integrante 3, frontend/mapas.
- Integrante 4: agronomía/QA/documentación, usando una laptop por turnos cuando lo requiera.

La tercera laptop es comodidad, nunca requisito.

## 14.7 Contrato de trabajo entre integrantes

- Integrante 1 mantiene el contrato API.
- Integrante 2 entrega datos normalizados con metadatos.
- Integrante 3 consume solamente el contrato aprobado.
- Integrante 4 valida fuentes, criterios y contenido visible.
- Integrante 1 integra y coordina releases.
- Todos revisan las funciones críticas antes de presentar.

---

# 15. Ingeniería de calidad, seguridad y documentación

## 15.1 Definition of Done

Una tarea está terminada solamente si:

- Cumple un requisito concreto.
- Los archivos están en rutas adecuadas.
- El código es modular y comprensible.
- El contrato de datos es consistente.
- Tiene manejo de errores.
- Tiene pruebas apropiadas.
- Pasa lint/typecheck/build/pruebas aplicables.
- No introduce dependencias innecesarias.
- No deja código muerto o duplicado.
- No incluye datos falsos sin etiqueta.
- No incluye secretos.
- La documentación se actualizó.
- Hay evidencia de prueba.
- Existe commit de recuperación.

## 15.2 Política de dependencias

Antes de incorporar una dependencia, responder:

1. ¿Qué requisito cubre?
2. ¿Ya existe una herramienta en el stack que lo haga?
3. ¿Es compatible con versiones actuales?
4. ¿Está mantenida y documentada?
5. ¿Tiene licencia compatible?
6. ¿Necesita clave, cuenta, pago o servicio externo?
7. ¿Aumenta el bundle o la complejidad?
8. ¿Cómo se prueba?
9. ¿Cómo se elimina si falla?

Registrar dependencias importantes en `docs/DECISIONS.md`.

## 15.3 Estándares de frontend

- Componentes con responsabilidad clara.
- Evitar archivos monolíticos.
- No duplicar lógica de API.
- Definir estados `loading`, `success`, `empty`, `error`.
- Formularios accesibles.
- Validar entradas en cliente y servidor.
- Mostrar errores legibles.
- Evitar llamadas de API duplicadas por render.
- No exponer secretos en variables públicas.
- No representar resultados como actuales si son fixtures.

## 15.4 Estándares de backend

- Tipos y modelos Pydantic.
- Rutas delgadas; lógica en servicios.
- Timeouts explícitos.
- Manejo de errores HTTP.
- Logs sin secretos.
- Separación de datos/servicios/algoritmos.
- Pruebas unitarias para reglas.
- Determinismo del motor.
- Esquemas con unidades/metadatos.
- Evitar global mutable state no necesario.

## 15.5 Seguridad básica

- `.env` excluido.
- CORS limitado a orígenes requeridos.
- No confiar en datos del frontend.
- Validar coordenadas, fechas, pesos, IDs y secuencias.
- Limitar consultas externas y timeouts.
- No permitir archivos subidos innecesarios.
- No hacer logging de secretos o datos sensibles.
- Revisar paquetes antes de instalarlos.

## 15.6 Documentación obligatoria

### `README.md`

Debe contener:

- Resumen de HaiLex.
- Problema y solución.
- Funcionalidades.
- Stack.
- Requisitos previos.
- Instalación.
- Ejecución de frontend y backend.
- Pruebas.
- Variables de entorno.
- Datos reales vs demo.
- Enlaces a docs.
- Estado y limitaciones.

### `AGENTS.md`

Reglas para agentes:

- Arquitectura y comandos.
- Convenciones.
- Qué no modificar.
- Contratos.
- Pruebas.
- Política de datos.
- Git.
- Seguridad.
- Tareas activas.

### `PROJECT_CONTEXT.md`

Contexto suficiente para un nuevo integrante o chat IA: objetivo, módulos, stack, datos, arquitectura, estado, limitaciones y enlaces.

### `PROJECT_STATUS.md`

- Fecha/hora local.
- Commit actual.
- Fases terminadas/en curso/pendientes.
- Funciones completas/parciales/futuras.
- Pruebas ejecutadas y resultados.
- Problemas conocidos.
- Próxima tarea exacta.

### `CHANGELOG.md`

Cada entrada registra:

- Fecha/hora `America/Mexico_City` si se puede verificar.
- Cambio.
- Motivo.
- Archivos/módulos afectados.
- Pruebas ejecutadas.
- Commit asociado.

### `docs/ARCHITECTURE.md`

Diagramas, capas y responsabilidades reales.

### `docs/API_CONTRACT.md`

Endpoints, parámetros, modelos, errores y ejemplos.

### `docs/DATA_SOURCES.md`

Fuentes, productos, parámetros, unidades, periodo, resolución, limitaciones, atribución y estado de integración.

### `docs/AGRONOMIC_RULES.md`

Reglas, escalas, pesos, fuentes y limitaciones.

### `docs/DECISIONS.md`

Decisiones con alternativas, motivos y consecuencias.

### `docs/TESTING.md`

Comandos, fixtures, casos, resultados y problemas.

### `docs/GIT_WORKFLOW.md`

Ramas, commits, tags, recuperación y PRs.

### `docs/DEMO_SCRIPT.md`

Demo paso a paso, datos de prueba, resultado esperado y contingencia.

### `docs/SUBMISSION_CHECKLIST.md`

Requisitos del portal, enlaces, materiales y confirmación de envío.

### `docs/HANDOFF.md`

Cómo continuar: versiones, variables, comandos, estado, ramas y tareas abiertas.

### `docs/KNOWN_LIMITATIONS.md`

Todo lo que se sabe que no está implementado, es aproximado, tiene incertidumbre o necesita validación.

## 15.7 Actualización documental después de cada tarea

Cada tarea que modifique código, contratos, dependencias, datos, arquitectura o comportamiento debe actualizar documentos afectados en la misma fase.

Nunca esperar al final para documentar. El agente debe informar qué archivos documentales actualizó y por qué.

---

# 16. Pruebas y criterios de aceptación globales

## 16.1 Backend

- `/health` responde OK.
- Parámetros inválidos devuelven errores entendibles.
- NASA POWER responde o falla de manera controlada.
- Timeouts no bloquean el servidor indefinidamente.
- Faltantes se representan como faltantes.
- Valores y unidades se normalizan de forma documentada.
- Catálogo se carga y valida.
- Motor es determinista.
- Pesos y escalas se validan.
- Pytest pasa.
- Ruff pasa.

## 16.2 Frontend

- `npm run dev` funciona.
- `npm run build` pasa.
- Navegación completa.
- Los cinco módulos están accesibles.
- Mapa carga o fallback visible.
- Selección de ubicación actualiza el contexto.
- Climate Intelligence refleja datos del backend/fixture marcado.
- Rotation Studio permite configurar escenarios/prioridades.
- Analysis muestra desglose y advertencias.
- Estados loading/error/empty funcionan.
- No hay errores críticos en consola.
- Responsive aceptable.

## 16.3 End-to-end

1. Abrir app.
2. Elegir ubicación de prueba.
3. Consultar clima.
4. Confirmar fuente/periodo/unidades.
5. Completar perfil de suelo/cultivo.
6. Elegir prioridades.
7. Comparar tres rotaciones.
8. Ver explicación.
9. Modificar prioridad y repetir.
10. Comprobar que el resultado cambia de forma determinista cuando corresponde.

## 16.4 Validación científica

- Las fuentes están citadas.
- Las fechas son correctas.
- Unidades son correctas.
- Se identifica tipo de dato.
- Resolución no se exagera.
- Los valores demo están etiquetados.
- Las rotaciones están documentadas.
- No hay afirmaciones de rendimiento o ahorro no respaldadas.
- Las limitaciones aparecen en la interfaz y documentación.

## 16.5 Pruebas de aceptación del juez

Un usuario externo debe poder responder sin ayuda:

- ¿Qué es HaiLex?
- ¿Qué problema resuelve?
- ¿Qué datos NASA utiliza?
- ¿Qué datos locales incorpora?
- ¿Qué alternativas compara?
- ¿Cómo se calcula la evaluación?
- ¿Por qué el resultado puede ser incierto?
- ¿Cómo se relaciona directamente con Field Shift?

---

# 17. Plan maestro por fases

La IA coordinadora debe convertir cada fase en prompts y tareas manejables. Las fases 5–8 (backend/datos/motor) y 9–12 (frontend/módulos) pueden avanzar en paralelo después de la fase de contratos. No avanzar saltando criterios de aceptación.

## Fase 0 — Auditoría, inventario y línea base

**Objetivo:** entender qué existe realmente al ingresar al hackatón. No asumir que el repo está vacío ni que la demo quedó completa.

**Responsables:** integrante 1 lidera; todos revisan su área.

Tareas:

1. Abrir repositorio local.
2. Ejecutar `git status`, `git log`, `git remote -v`.
3. Revisar árbol de archivos.
4. Ejecutar frontend/backend si existen.
5. Registrar versiones de Node, npm, Python, pip y Git.
6. Ejecutar pruebas/build existentes.
7. Identificar secrets o archivos no versionables.
8. Revisar documentación previa.
9. Registrar módulos reales y faltantes.
10. Crear tag/checkpoint si hay una versión útil.

**Entregables:** inventario, estado, riesgos y plan de trabajo real.

**Aceptación:** cada integrante conoce qué funciona, qué no y cuál es el commit base.

**Git:** tag `hackathon-start-audit` si el repo está limpio y el commit representa el estado real.

## Fase 1 — Congelar alcance y definir demo final

**Objetivo:** acordar qué debe quedar funcionando al terminar y qué queda como extensión.

Tareas:

- Elegir región piloto.
- Elegir coordenadas de prueba y justificarlas.
- Fijar tres escenarios de rotación que puedan documentarse.
- Confirmar variables NASA POWER.
- Fijar versión de contratos API.
- Priorizar todas las funcionalidades del inventario.
- Identificar dependencias bloqueantes.

**Entregable:** `docs/PROJECT_BRIEF.md`, lista de requisitos y prioridades.

**Aceptación:** no hay dudas sobre qué debe hacer la demo integrada y qué se etiqueta como parcial/futuro.

## Fase 2 — Repositorio, reglas y checkpoints

**Objetivo:** preparar colaboración antes de generar más código.

Tareas:

- Crear/validar repo `hailex`.
- Confirmar acceso de los cuatro integrantes.
- Crear `.gitignore`, `.editorconfig`, `AGENTS.md`.
- Actualizar README, PROJECT_CONTEXT, PROJECT_STATUS y CHANGELOG.
- Crear ramas pequeñas.
- Comprobar que no se filtren secretos.
- Definir protocolo para incorporar ZIPs.

**Aceptación:** los cuatro pueden clonar, instalar o ejecutar instrucciones y hacer commits sin conflictos de identidad.

**Git:** commit `chore: establish hackathon baseline`.

## Fase 3 — Contratos y arquitectura congelados

**Objetivo:** evitar incompatibilidad entre estaciones.

Tareas:

- Definir esquemas de clima.
- Definir perfil de parcela.
- Definir catálogo de cultivos.
- Definir petición/respuesta de comparación.
- Definir manejo de errores.
- Definir metadatos de procedencia.
- Definir tipos TypeScript.
- Dibujar arquitectura real.

**Aceptación:** integrante 1/2 puede describir lo que backend devuelve; integrante 3 puede mostrar cómo frontend lo consume; integrante 4 valida qué significa cada campo.

**Git:** commit `docs: define API and data contracts`.

## Fase 4 — Investigación científica y fixtures controlados

**Objetivo:** preparar las fuentes y datos de respaldo antes de que el frontend dependa de ellos.

Tareas:

- Verificar la documentación de POWER.
- Elegir coordenadas y periodo.
- Probar consulta manual.
- Guardar respuesta si es válida.
- Registrar metadatos.
- Investigar cultivos y rotaciones.
- Crear fixtures separados de datos reales.
- Crear `DATA_SOURCES.md` y `AGRONOMIC_RULES.md`.

**Aceptación:** cada fixture tiene fuente/fecha y etiqueta; no hay datos ficticios presentados como reales.

**Git:** commit `data: add documented source metadata and fixtures`.

## Fase 5 — Backend foundation

**Objetivo:** crear servicio robusto y verificable.

Tareas:

- Entorno Python.
- Dependencias con versiones apropiadas.
- FastAPI/Uvicorn.
- Pydantic.
- CORS local.
- `/health`.
- Manejo uniforme de errores.
- Logging sin secretos.
- Pruebas iniciales.

**Aceptación:** servidor inicia, health responde, docs OpenAPI abre, pytest y Ruff pasan.

**Git:** commit `feat: create FastAPI service foundation`.

## Fase 6 — NASA POWER service

**Objetivo:** integrar primera fuente real de NASA.

Tareas:

- Cliente HTTPX.
- Validación lat/long y fechas.
- Timeouts.
- Parámetros revisados.
- Parseo y normalización.
- Faltantes.
- Caché básica.
- Fixtures de API.
- `/api/v1/climate`.
- Pruebas con éxito, error, timeout y respuesta vacía.

**Aceptación:** consulta real reproducible o bloqueo externo documentado con fixture válido histórico. Procedencia siempre visible.

**Git:** commit `feat: integrate NASA POWER climate service`.

## Fase 7 — Catálogo agrícola y perfil de suelo

**Objetivo:** integrar las características de cultivos y contexto local.

Alcance vigente: catálogo y perfil con fuentes, validación y datos desconocidos explícitos;
POWER aporta contexto climático descriptivo. La cartografía INEGI no es laboratorio.

Tareas:

- Catálogo JSON.
- Fuentes por cultivo.
- Estado de validación.
- Perfil parcela.
- Campos desconocidos.
- Contexto cartográfico INEGI si está disponible.
- `/api/v1/crops`.

**Aceptación:** ningún campo crítico se inventa; fuentes identificadas; INEGI no se presenta como análisis de laboratorio.

**Git:** commit `feat: add documented crop catalog and parcel profile`.

## Fase 8 — Rotation engine

**Objetivo:** implementar el corazón de HaiLex.

Tareas:

- Esquema de escenarios.
- Validación de secuencias.
- Criterios y escalas.
- Pesos y preferencias.
- Manejo de datos faltantes.
- Desglose por criterio.
- Explicaciones.
- Advertencias.
- `/api/v1/rotations/compare`.
- Pruebas unitarias y casos límite.

**Aceptación:** cálculo reproducible, explicable, sin predicciones inventadas y con regla versionada.

**Git:** commit `feat: implement explainable rotation comparison engine`.

## Fase 9 — Frontend shell y sistema visual

**Objetivo:** aplicación navegable con cinco módulos.

Tareas:

- React/Vite/TypeScript.
- Tailwind.
- shadcn/ui si la instalación funciona.
- Layout/sidebar.
- Navegación.
- Diseño Earth Intelligence.
- Responsive inicial.
- Estados de UI.
- Tipos API.

**Aceptación:** build pasa, cinco rutas/pantallas navegan, no hay errores críticos, los datos demo están etiquetados.

**Git:** commit `feat: build HaiLex frontend shell`.

## Fase 10 — Earth Explorer

**Objetivo:** mapa útil con selección de ubicación.

Tareas:

- MapLibre.
- Estilo base gratuito y atribución.
- Zoom y marcador.
- Entrada manual de coordenadas.
- Selección por clic.
- Panel lateral.
- Estado de carga/error.
- Fallback si el estilo externo no carga.
- 3D solo si hay DEM compatible.

**Aceptación:** el mapa representa ubicación de forma clara, puede modificar coordenadas y transmite la selección al estado global. No inventa capas de humedad/lluvia.

**Git:** commit `feat: add interactive Earth Explorer`.

## Fase 11 — Climate Intelligence

**Objetivo:** visualizar información de NASA POWER.

Tareas:

- Conectar endpoint.
- Selector de periodo.
- Gráficas Recharts.
- Unidades y leyendas.
- Fuente y fecha.
- Faltantes y warnings.
- Fixture etiquetado como fallback.

**Aceptación:** cada gráfica se puede rastrear a la respuesta del backend; cambia cuando cambia ubicación/periodo; error API no rompe la página.

**Git:** commit `feat: connect NASA climate data to dashboard`.

## Fase 12 — Rotation Studio

**Objetivo:** permitir crear/seleccionar escenarios y prioridades.

Tareas:

- Perfil de parcela.
- Selección de cultivo actual.
- Selección de cultivos candidatos documentados.
- Tres escenarios.
- Configuración de secuencias.
- Prioridades con sliders/controles.
- Validación de pesos.
- Mostrar advertencias.

**Aceptación:** usuario crea/selecciona tres alternativas y las envía al backend sin desajustes del contrato.

**Git:** commit `feat: build Rotation Studio`.

## Fase 13 — Analysis & Insights

**Objetivo:** mostrar evaluación y explicar las diferencias.

Tareas:

- Comparación visual.
- Tarjetas y gráficas.
- Criterios y contribuciones.
- Factores favorables/limitantes.
- Procedencia.
- Datos faltantes.
- Nota de validez.
- Botón de volver a configurar.

**Aceptación:** un usuario entiende por qué el escenario aparece mejor evaluado y qué datos sostienen la comparación.

**Git:** commit `feat: build explainable Analysis and Insights view`.

## Fase 14 — Integración end-to-end

**Objetivo:** cerrar flujo completo de usuario.

Tareas:

1. Abrir dashboard.
2. Seleccionar ubicación.
3. Consultar clima.
4. Completar perfil.
5. Seleccionar escenarios.
6. Ajustar prioridades.
7. Ejecutar comparación.
8. Ver resultados.
9. Cambiar prioridad.
10. Recalcular.

**Aceptación:** funciona sin abrir herramientas de desarrollo y con logs razonables. Frontend no duplica lógica del backend.

**Git:** commit `feat: integrate HaiLex end-to-end workflow`.

## Fase 15 — QA, seguridad y limpieza

**Objetivo:** estabilizar el producto.

Tareas:

- Ejecutar todas las pruebas.
- Typecheck.
- ESLint/Prettier.
- Build.
- Pytest/Ruff.
- Revisar console/network.
- Revisar `.env` y Git history reciente.
- Revisar imports/dependencias sin uso.
- Revisar código duplicado y TODOs.
- Verificar fixtures y etiquetas.
- Probar fallos de red.
- Revisar en navegador limpio.

**Aceptación:** no hay errores bloqueantes, el build pasa y todo defecto pendiente queda en `KNOWN_LIMITATIONS.md`.

**Git:** commit `test: stabilize and verify release candidate`.

## Fase 16 — UX, visual polish y accesibilidad

**Objetivo:** elevar calidad visual sin arriesgar funciones.

Tareas:

- Consistencia de espaciado/colores.
- Jerarquía tipográfica.
- Responsive.
- Estados de carga.
- Transiciones Motion discretas.
- Tooltips y explicaciones.
- Accesibilidad básica.
- Rendimiento.

**Aceptación:** una persona externa puede navegar y comprender la plataforma; no se añaden efectos que rompan estabilidad.

**Git:** commit `style: polish HaiLex user experience`.

## Fase 17 — Pruebas de demo, storytelling y pitch

**Objetivo:** preparar una demostración realista y convincente.

Tareas:

- Preparar ubicación y periodo de prueba.
- Confirmar respuestas/fallbacks.
- Ensayar el flujo completo.
- Medir duración.
- Preparar video/capturas de respaldo si está permitido.
- Preparar explicación de fuentes, algoritmo y limitaciones.
- Preparar preguntas de jueces.

**Aceptación:** cualquier integrante puede ejecutar la demo y explicar el problema, la fuente NASA, las tres alternativas y el método.

**Git:** commit `docs: finalize demo script and judge Q&A`.

## Fase 18 — Entrega, empaquetado y handoff

**Objetivo:** que el proyecto quede entregado y mantenible.

Tareas:

- Revisar requisitos oficiales y locales.
- Comprobar que enlaces funcionen.
- Verificar README y repositorio.
- Revisar visibilidad pública/privada según instrucciones.
- Eliminar secretos y archivos no permitidos.
- Crear tag final.
- Subir cambios.
- Enviar por plataforma oficial.
- Confirmar recepción/estado de envío.
- Guardar enlace de proyecto.
- Actualizar PROJECT_STATUS y HANDOFF.

**Aceptación:** existe evidencia de push, tag, enlaces y envío oficial confirmado.

**Git:** tag `hailex-v1.0-hackathon-submission` si el estado es estable.

---

# 18. Cronograma de ejecución de las 32 horas

La sede Querétaro comunicó al equipo que el evento inicia sábado 14 de noviembre de 2026 a las 9:00 a. m. y termina domingo 15 alrededor de las 5:00 p. m. Además, indicó que los participantes deben permanecer dentro de las instalaciones durante toda la competencia y que salir impide continuar/reingresar. Esta es información local compartida por el equipo; confirmar detalles logísticos con la organización.

No planear salidas para comida o materiales. Preparar previamente agua, alimentos permitidos, cargadores, adaptadores y artículos personales. Confirmar política de extensiones, tomas, Wi-Fi, áreas de descanso y objetos permitidos.

## 18.1 Sábado 14 — mañana

| Hora | Actividad | Resultado |
|---|---|---|
| 09:00–09:30 | Registro, ingreso y ubicación de estaciones | Equipo dentro y laptops instaladas |
| 09:30–10:00 | Confirmar reglas locales, conexión y recursos | Restricciones conocidas |
| 10:00–10:45 | Fase 0: auditoría rápida y línea base Git | Estado real protegido |
| 10:45–11:30 | Fases 1–3: alcance, contratos y prioridades | Contratos congelados |
| 11:30–13:30 | Trabajo paralelo: backend + frontend | Esqueletos ejecutables |
| 13:30–14:00 | Pausa/alimentación dentro del recinto | Equipo recuperado |

## 18.2 Sábado 14 — tarde

| Hora | Actividad | Resultado |
|---|---|---|
| 14:00–16:00 | NASA POWER + catálogo + UI shell | Datos y pantallas base |
| 16:00–17:30 | Motor de rotación y contratos integrados | Comparador API funcional |
| 17:30–19:00 | Earth Explorer y Climate Intelligence | Mapa y clima conectados |
| 19:00–19:30 | Pausa dentro del recinto | Sin salir |
| 19:30–21:00 | Rotation Studio + Analysis | Flujo principal completo |
| 21:00–22:00 | Prueba end-to-end y checkpoint | Primera versión integrada |

## 18.3 Sábado 14 — noche

| Hora | Actividad | Resultado |
|---|---|---|
| 22:00–23:00 | Corregir bloqueadores | Flujo más estable |
| 23:00–00:00 | Pruebas y documentación | Estado actualizado |
| 00:00–06:00 | Descanso por turnos según reglas/espacio disponible; solo tareas ligeras y seguras si hace falta | Evitar deterioro por fatiga |

No asumir que existe un área para dormir. No planear que los cuatro trabajen continuamente ni dejar tareas críticas sin relevo. Si la sede no permite descanso acostado, organizar pausas breves de manera permitida y segura.

## 18.4 Domingo 15 — mañana

| Hora | Actividad | Resultado |
|---|---|---|
| 06:00–08:00 | Revisión de procesos, dependencias y despliegue si aplica | App arranca limpio |
| 08:00–09:00 | Reunión de sincronización y priorización | Lista de bloqueadores |
| 09:00–11:00 | QA integrado, bugs y datos | Pruebas de aceptación |
| 11:00–12:00 | Validación agronómica y científica | Claims revisados |

## 18.5 Domingo 15 — tarde

| Hora | Actividad | Resultado |
|---|---|---|
| 12:00–12:30 | Alimentación dentro de instalaciones | Pausa |
| 12:30–13:30 | Pulido visual y responsive | Demo clara |
| 13:30–14:15 | Ensayo de pitch y demo | Narrativa lista |
| 14:15–15:00 | Congelar funcionalidades; solo fixes críticos | Release candidate |
| 15:00–15:45 | Revisar documentación, repositorio y envío | Paquete completo |
| 15:45–16:15 | Enviar proyecto y confirmar recepción | Entrega registrada |
| 16:15–16:45 | Capturas, enlaces, tag y respaldo | Evidencia guardada |
| 16:45–17:00 | Confirmar cierre y seguir indicaciones de sede | Cierre ordenado |

Estos son horarios recomendados de organización, no el programa oficial de todas las actividades del evento. Si la sede adelanta el cierre o la entrega, ajustar inmediatamente. El objetivo es enviar antes del fin de la jornada presencial; no depender de que la plataforma mantenga un plazo posterior.

---

# 19. Estrategia de priorización y reducción de alcance sin perder funciones

No eliminar módulos cuando el tiempo se agote. Reducir profundidad, pero conservar la estructura del producto y ser honesto sobre el estado.

## 19.1 Niveles

### P0 — Debe funcionar

- Frontend abre.
- Backend abre.
- NASA POWER real integrada o fallback histórico válido y etiquetado con explicación de bloqueo.
- Perfil de parcela.
- Catálogo pequeño y documentado.
- Tres rotaciones.
- Motor de comparación explicable.
- Vista de resultados y procedencia.
- Flujo end-to-end.
- Repositorio y documentación.

### P1 — Muy importante

- Earth Explorer con selección de punto.
- Gráficas de clima.
- Prioridades ajustables.
- Estados de error/carga/vacío.
- Fuentes/limitaciones visibles.
- UI consistente.

### P2 — Si el núcleo está estable

- Vista globo/relieve 3D.
- Capas geoespaciales extra.
- SMAP o GPM.
- Gráficas comparativas adicionales.
- Exportar reporte simple.

### P3 — Mejoras posteriores

- ECOSTRESS.
- Escenarios climáticos futuros.
- Autenticación y base de datos.
- Chatbot explicativo.
- Multi-parcela.
- Historial de análisis.
- Dashboard de asesor.
- Polígonos de parcelas y análisis espacial más avanzado.

## 19.2 Qué hacer si falta tiempo

- Mantener los cinco módulos visibles.
- Marcar lo incompleto como `planned` o `limited`.
- Priorizar el flujo de una ubicación y tres escenarios.
- No añadir SMAP/GPM si POWER y el motor aún fallan.
- No perseguir 3D si el mapa 2D no es estable.
- No añadir login/base de datos.
- No añadir IA conversacional a la aplicación.
- No hacer refactorizaciones extensas en las últimas horas.
- No eliminar procedencia ni advertencias para que se vea más limpio.

## 19.3 Criterio de decisión para toda nueva función

Antes de añadirla, contestar:

1. ¿Contribuye directamente a Field Shift?
2. ¿Mejora el impacto, creatividad, validez, relevancia o presentación?
3. ¿Aporta más que lo que cuesta implementarla y probarla?
4. ¿Se puede completar y documentar dentro del tiempo restante?
5. ¿Puede romper el flujo principal?

Si no aumenta claramente el valor y el riesgo es alto, registrarla como futura mejora.

---

# 20. Demo, pitch y evaluación competitiva

## 20.1 Guion de demo de 90–120 segundos

La duración real dependerá de las reglas de presentación del evento local; este es un guion interno de ensayo.

1. **Problema (0–15 s):** un agricultor debe decidir qué cultivar después con información dispersa y condiciones ambientales cambiantes.
2. **Ubicación (15–30 s):** seleccionar punto de estudio y mostrar coordenadas/fuente.
3. **Datos (30–45 s):** mostrar temperatura y precipitación NASA POWER con periodo, unidades y procedencia.
4. **Alternativas (45–65 s):** mostrar tres rotaciones basadas en información agrícola documentada.
5. **Comparación (65–90 s):** mostrar cómo los criterios y prioridades afectan las evaluaciones.
6. **Explicabilidad (90–105 s):** enseñar factores favorables, limitaciones y datos faltantes.
7. **Impacto (105–120 s):** explicar cómo HaiLex convierte datos complejos en escenarios comprensibles.

## 20.2 Mensaje de apertura

> Cada temporada, los agricultores deben tomar decisiones que afectan sus tierras y su producción. Las condiciones de clima, agua y suelo hacen que comparar alternativas sea cada vez más complejo. HaiLex integra observaciones de NASA e información agrícola local para explorar y comparar rotaciones de cultivos. No pretende decidir a ciegas por el agricultor: muestra datos, alternativas, criterios y limitaciones para apoyar decisiones mejor fundamentadas.

## 20.3 Cómo demostrar los cinco criterios

### Impact

- Seleccionar una región piloto relevante.
- Describir un problema concreto.
- Explicar cómo el comparador apoya la exploración de opciones.
- No inventar cantidad de agricultores beneficiados ni ahorro estimado.

### Creativity

- Integrar NASA con contexto local.
- Prioridades configurables.
- Comparar estrategias y explicar los factores.
- Usar interfaz geoespacial para hacer comprensible la información.

### Validity

- Fuentes identificables.
- Unidades y periodos correctos.
- Limitaciones espaciales visibles.
- Reglas documentadas.
- Resultados reproducibles.
- Datos demo separados.

### Relevance

- Mostrar de forma directa datos NASA.
- Información local del suelo.
- Características de cultivos.
- Prioridades del agricultor.
- Exploración de rotaciones.

### Presentation

- Demo real, no capturas únicamente.
- Interfaz clara.
- Storytelling centrado en una decisión.
- Mostrar el origen de datos.
- Explicar qué ya funciona y qué es futuro.

## 20.4 Preguntas probables de jueces

Preparar respuestas claras a:

- ¿Qué producto de NASA utilizan exactamente?
- ¿Cómo obtienen la información?
- ¿Qué significa la resolución de la fuente?
- ¿Cómo combinan datos de distinta escala temporal/espacial?
- ¿Cómo seleccionaron la región piloto?
- ¿De dónde vienen los datos sobre cultivos?
- ¿Quién validó las reglas agronómicas?
- ¿Qué representa la puntuación?
- ¿Qué hacen cuando faltan datos?
- ¿Por qué no usan IA generativa para decidir?
- ¿Qué limitaciones tiene el sistema?
- ¿Cómo puede escalarse a otras regiones?

No responder con afirmaciones que el equipo no pueda respaldar.

---

# 21. Entrega oficial, publicación y cierre

## 21.1 Condiciones de sede

Según la información local compartida por el equipo:

- Inicio: sábado 14 de noviembre de 2026 a las 9:00 a. m.
- Final: domingo 15 de noviembre de 2026 aproximadamente a las 5:00 p. m.
- Permanencia dentro de las instalaciones durante toda la competencia.
- Si salen, no pueden volver a ingresar ni continuar participando.

Confirmar con la organización cualquier regla no especificada: alimentos, agua, electricidad, extensión, descanso, conectividad, dispositivos y acceso.

## 21.2 Entrega del proyecto

La IA debe consultar el portal oficial y las instrucciones de la sede antes de declarar requisitos definitivos. No asumir que la hora de cierre local equivale a la fecha/hora límite global de la plataforma.

Checklist:

- Cuenta y registro del equipo listos.
- Evento local correcto seleccionado.
- Equipo de cuatro integrantes registrado.
- Página del proyecto completa.
- Título y descripción coherentes.
- Resumen del problema y solución.
- Datos y fuentes citados.
- Explicación de uso de NASA.
- Enlace de repositorio/demostración cuando corresponda.
- Material audiovisual solicitado.
- Enlaces probados desde una sesión externa.
- Envío final confirmado.

El equipo debe completar la entrega antes del cierre presencial de la sede, aunque el portal pudiera tener un horario adicional. No depender de ese margen adicional sin verificarlo.

## 21.3 Publicación de GitHub

Si los requisitos piden repositorio público:

- Revisar `.env` y secretos.
- Revisar historial reciente.
- Revisar datos y licencias.
- Revisar README.
- Confirmar instalación.
- Confirmar que no se suban dependencias generadas.
- Revisar accesibilidad del enlace.

No cambiar la visibilidad sin comprobar que no se exponga información sensible.

## 21.4 Cierre y handoff

Actualizar:

- `PROJECT_STATUS.md`.
- `CHANGELOG.md`.
- `docs/HANDOFF.md`.
- `docs/KNOWN_LIMITATIONS.md`.
- `docs/DEMO_SCRIPT.md`.

Crear tag de la entrega y guardar la URL del proyecto enviado.

---

# 22. Mejoras posteriores o extensiones opcionales

Estas mejoras pueden aumentar el valor del proyecto, pero no deben competir con el flujo principal.

## 22.1 Segunda fuente NASA (SMAP o GPM)

Priorizar según disponibilidad de datos y facilidad de integración. Elegir una primero. No integrar ambas por apariencia.

## 22.2 Capa geoespacial 3D

- Globo/terreno.
- DEM compatible.
- Capas con escala real.
- Transparencia de resolución.
- Evitar interpolación que aparente mayor precisión.

## 22.3 Exportación de reporte

Generar PDF/CSV simple con:

- Ubicación.
- Periodo.
- Datos/fuentes.
- Escenarios.
- Criterios.
- Limitaciones.

Solo si el flujo principal está estable.

## 22.4 Historial de comparaciones

Guardar análisis anteriores para la misma parcela. Requiere definir persistencia, privacidad y versión de reglas.

## 22.5 Proyecciones climáticas

NASA POWER Projection u otras fuentes climáticas pueden incorporarse en el futuro. Diferenciar escenarios proyectados de observaciones históricas; documentar modelo, horizonte, escenario y limitaciones.

## 22.6 Asistente explicativo

Si se añade, utilizarlo para reformular la explicación ya calculada por el motor. No debe inventar criterios ni sustituir el cálculo. La interfaz debe mostrar que el texto es generado y permitir consultar la fuente del dato original.

## 22.7 Más cultivos y regiones

Ampliar solo cuando se cuente con información local y reglas suficientemente documentadas.

## 22.8 Validación con personas usuarias

Entrevistas o pruebas con agricultores/especialistas, con consentimiento y registro fiel de observaciones. No fingir entrevistas que no se hicieron.

---

# 23. Plantillas de prompts para agentes y chats gratuitos

## 23.1 Prompt de coordinador

```text
Eres el líder técnico y coordinador del proyecto HaiLex. Lee HAILEX_MASTER_CONTEXT_HACKATHON.md completo y consulta PROJECT_CONTEXT.md, PROJECT_STATUS.md, AGENTS.md y los documentos pertinentes del repositorio.

No generes el proyecto entero de golpe. Divide el trabajo en fases pequeñas, con criterios verificables. Respeta cuatro integrantes y dos laptops. Mantén el stack acordado. No inventes datos científicos. No elimines funciones sin aprobación. No cambies contratos sin coordinación. No agregues dependencias sin justificación.

Para cada tarea entrega objetivo, alcance, archivos, responsable, prompt específico, comandos, pruebas, checklist, actualización documental, commit recomendado y evidencia necesaria.

Antes de proponer cambios, inspecciona el estado real del repositorio y protege el trabajo existente con Git.
```

## 23.2 Prompt para frontend

```text
CONTEXTO: HaiLex, plataforma de apoyo a decisiones agrícolas para NASA Space Apps 2026. Lee HAILEX_MASTER_CONTEXT_HACKATHON.md, AGENTS.md, PROJECT_CONTEXT.md, ARCHITECTURE.md y API_CONTRACT.md.

ROL: desarrollador frontend senior.

STACK: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Recharts + MapLibre GL JS; Motion solo para animaciones útiles.

TAREA EXACTA: [describir una función y una pantalla].

ARCHIVOS PERMITIDOS: [lista].
ARCHIVOS QUE NO DEBES MODIFICAR: [lista].
CONTRATO: [esquema exacto de API].

REGLAS: componentes mantenibles; TypeScript strict; estados loading/error/empty; no duplicar lógica de backend; no secretos; no datos demo sin etiqueta; no instalar librerías sin justificar; no reescribir archivos completos sin necesidad.

ENTREGABLE: archivos completos con rutas exactas o ZIP, manifiesto, pasos de instalación, pruebas, screenshot si procede y documentación actualizada.
```

## 23.3 Prompt para backend

```text
CONTEXTO: HaiLex. Lee HAILEX_MASTER_CONTEXT_HACKATHON.md, AGENTS.md, PROJECT_CONTEXT.md, ARCHITECTURE.md, API_CONTRACT.md, DATA_SOURCES.md y AGRONOMIC_RULES.md.

ROL: ingeniero backend senior Python/FastAPI.

STACK: FastAPI, Pydantic, HTTPX, Pandas, NumPy, Uvicorn, Pytest y Ruff.

TAREA EXACTA: [una función o endpoint].

CONTRATO: respetar exactamente API_CONTRACT.md.

REGLAS: rutas delgadas; lógica en servicios; validar todo; timeout; errores claros; logging sin secretos; determinismo; pruebas; procedencia de los datos; no inventar datos ni recomendaciones.

ENTREGABLE: archivos completos con rutas, tests, comandos, manifiesto y actualización documental.
```

## 23.4 Prompt para datos y agronomía

```text
CONTEXTO: HaiLex y el reto Field Shift. Lee HAILEX_MASTER_CONTEXT_HACKATHON.md, DATA_SOURCES.md y AGRONOMIC_RULES.md.

ROL: investigador de datos geoespaciales y apoyo de investigación agronómica.

TAREA: [fuente, producto, cultivo, suelo o rotación específica].

REGLAS: preferir fuentes NASA, INEGI, instituciones agrícolas y publicaciones técnicas. Verificar fuente, fecha, escala, unidades y contexto. No inventar atributos faltantes. Diferenciar observación, estimación, modelo y cartografía. Citar URLs. Registrar incertidumbres y aplicabilidad regional.

ENTREGABLE: resumen verificable, estructura de datos propuesta, referencias, limitaciones y recomendaciones concretas para integrar al proyecto.
```

## 23.5 Prompt para QA/revisión

```text
Actúa como revisor senior de calidad de HaiLex. No reescribas el proyecto.

Inspecciona los archivos indicados y detecta:
- errores funcionales;
- inconsistencias API;
- datos o claims no respaldados;
- código duplicado/muerto;
- dependencias no usadas;
- errores de tipos;
- falta de manejo de errores;
- problemas de seguridad;
- pruebas ausentes;
- documentación desactualizada.

Clasifica cada hallazgo por severidad, ruta y evidencia. Propón el menor cambio seguro para corregirlo. Después de corregir, indica pruebas exactas y resultado esperado.
```

## 23.6 Prompt para generar ZIP

```text
Genera un ZIP solamente para la tarea indicada. Incluye rutas relativas dentro de la carpeta del módulo, todos los archivos fuente, FILES_MANIFEST.md, README_DEL_MODULO.md, dependencias declaradas, comandos y pruebas. No incluir node_modules, .venv, dist, build, cachés, secretos, ni reemplazar todo el repositorio. Indica qué archivos existentes deben modificarse y qué cambios podrían entrar en conflicto. No incluyas datos ficticios como reales.
```

## 23.7 Prompt de handoff a un chat nuevo

```text
Voy a continuar HaiLex en este chat. Lee el documento maestro y los archivos PROJECT_CONTEXT.md, PROJECT_STATUS.md, CHANGELOG.md y HANDOFF.md. No asumas que conoces trabajo no documentado. Resume el último commit, qué funciona, qué falla, qué pruebas pasaron y la siguiente tarea concreta. No cambies código hasta que el equipo apruebe el plan.
```

---

# 24. Registro de decisiones y cambios

## 24.1 Registro mínimo de decisión

Cada decisión técnica importante debe registrarse con:

- ID.
- Fecha/hora local.
- Problema.
- Opciones consideradas.
- Decisión.
- Motivo.
- Consecuencias.
- Responsable.
- Commit relacionado.

## 24.2 Cambios de alcance

No eliminar función sin:

1. Identificarla en el alcance.
2. Explicar problema de tiempo/técnica.
3. Proponer sustituto o nivel reducido.
4. Marcar estado en PROJECT_STATUS.
5. Obtener aprobación del equipo.

## 24.3 Registro de errores

Cada bug bloqueante debe tener:

- ID o título.
- Pasos para reproducir.
- Resultado esperado.
- Resultado observado.
- Logs relevantes sin secretos.
- Responsable.
- Estado.
- Commit de corrección.

## 24.4 Registro de pruebas

Por prueba:

- Fecha/hora.
- Equipo/laptop.
- Comando o pasos.
- Datos de prueba.
- Resultado esperado.
- Resultado obtenido.
- Estado `PASS`/`FAIL`.
- Observación.

---

# 25. Fuentes oficiales y documentación técnica

## Reto y evento

- NASA Space Apps 2026: https://www.spaceappschallenge.org/2026/
- Reto Field Shift: https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/

## NASA

- NASA POWER: https://power.larc.nasa.gov/
- POWER Daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- POWER API tutorial: https://power.larc.nasa.gov/docs/tutorials/service-data-request/api/
- POWER Projection API: https://power.larc.nasa.gov/docs/services/api/projection/
- SMAP NSIDC: https://nsidc.org/data/smap/data
- GPM IMERG: https://gpm.nasa.gov/data/imerg
- ECOSTRESS product: https://data.nasa.gov/dataset/ecostress-gridded-evapotranspiration-instantaneous-and-daytime-l3-global-70-m-v002-b0768

## México

- INEGI Edafología: https://www.inegi.org.mx/temas/edafologia/
- INEGI Uso del suelo: https://www.inegi.org.mx/temas/usosuelo/

## Frontend

- React: https://react.dev/
- Vite: https://vite.dev/
- TypeScript: https://www.typescriptlang.org/
- Tailwind: https://tailwindcss.com/
- shadcn/ui: https://ui.shadcn.com/
- Motion: https://motion.dev/
- MapLibre: https://maplibre.org/maplibre-gl-js/docs/
- OpenFreeMap: https://openfreemap.org/
- deck.gl: https://deck.gl/
- Recharts: https://recharts.org/

## Backend

- Python: https://www.python.org/
- FastAPI: https://fastapi.tiangolo.com/
- Pydantic: https://docs.pydantic.dev/
- Pandas: https://pandas.pydata.org/
- NumPy: https://numpy.org/
- HTTPX: https://www.python-httpx.org/
- Pytest: https://docs.pytest.org/
- Ruff: https://docs.astral.sh/ruff/

## Git y herramientas

- Git: https://git-scm.com/doc
- GitHub Docs: https://docs.github.com/
- VS Code: https://code.visualstudio.com/
- Roo Code providers: https://roocodeinc.github.io/Roo-Code/providers/
- Roo Code Gemini: https://roocodeinc.github.io/Roo-Code/providers/gemini/
- Cline Google Gemini: https://github.com/cline/cline/blob/main/docs/provider-config/google-gemini.mdx
- Codex IDE: https://developers.openai.com/codex/ide/

## Modelos y costos — verificado el 13 de noviembre de 2026

- OpenAI model catalog: https://developers.openai.com/api/docs/models
- GPT-6.1 Sol: https://developers.openai.com/api/docs/models/gpt-6.1-sol
- Anthropic Sonnet 5.5: https://platform.claude.com/docs/en/models/sonnet-5-5/overview
- Anthropic pricing: https://platform.claude.com/docs/en/about-claude/pricing
- Gemini 4 Hydrogen announcement: https://blog.google/intl/es-419/noticias-de-la-empresa/tecnologia/introducing-gemini-4-hydrogen/
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API rate limits: https://ai.google.dev/gemini-api/docs/rate-limits

Los modelos, precios, cuotas, términos, proveedores y extensiones cambian. Antes de utilizar o pagar un servicio, la IA coordinadora debe consultar sus documentos oficiales actuales. No tomar precios de un mensaje antiguo como garantía.

---

# 26. Estado inicial y protocolo de inicio

Este documento define el objetivo definitivo y el plan; **no significa que las fases estén implementadas**.

Al comenzar, la IA debe auditar y completar la tabla:

| Área | Estado a confirmar |
|---|---|
| Nombre HaiLex | Definido por el equipo |
| Reto Field Shift | Identificado |
| Equipo | 4 integrantes |
| Laptops | 2 confirmadas; 3.ª posible |
| Repositorio GitHub | Auditar/confirmar |
| Frontend | Auditar estado real |
| Backend | Auditar estado real |
| NASA POWER | Probar/integrar |
| SMAP | Extensión opcional |
| GPM | Extensión opcional |
| ECOSTRESS | Extensión avanzada |
| INEGI | Investigar/integrar según datos |
| Catálogo agrícola | Documentar/validar |
| Motor de rotaciones | Implementar/probar |
| MapLibre | Integrar/probar |
| Cinco módulos UI | Auditar |
| Flujo end-to-end | Probar |
| Documentación | Actualizar |
| Pruebas | Ejecutar |
| Entrega | Preparar/confirmar |

## 26.1 Primera acción

Iniciar con **Fase 0 — Auditoría, inventario y línea base**.

No preguntar de nuevo por información que ya está documentada. No asumir que todo está vacío. No borrar archivos ni reiniciar el proyecto.

## 26.2 Si la demo pre-hackatón ya existe

- Auditarla.
- Preservar todo lo que funcione.
- Identificar deuda técnica.
- Crear tag de línea base.
- Ajustar la arquitectura gradualmente.
- Integrar solo lo necesario.

La versión demo anterior es un punto de partida, no un proyecto descartable.

## 26.3 Si la demo no existe o está incompleta

- Conservar cualquier archivo útil.
- Crear una rama nueva desde el commit actual.
- Completar primero esqueleto, contrato y flujo principal.
- Reutilizar la estructura acordada.
- No intentar construir todo el stack avanzado a la vez.

---

# 27. Principio rector del proyecto

> **HaiLex debe ser una plataforma útil, explicable, verificable y mantenible; no una colección de pantallas bonitas generadas por IA.**
>
> Cada dato debe tener procedencia. Cada resultado debe poder explicarse. Cada módulo debe tener una responsabilidad. Cada cambio debe quedar documentado y guardado en Git. Cada fase debe probarse antes de avanzar. Ninguna funcionalidad del alcance debe desaparecer silenciosamente.
>
> La calidad no se mide por cuántas tecnologías se incorporen, sino por la coherencia entre el problema, los datos, el método, la experiencia de usuario y la evidencia de funcionamiento.

---

# Apéndice A — Prompt de arranque para la IA que recibirá este documento

Copia el siguiente texto en el chat/agente después de adjuntar este archivo:

```text
Este archivo es el documento maestro definitivo de HaiLex para NASA Space Apps Challenge 2026.

Léelo completo y úsalo como fuente de verdad para el proyecto. Tu papel es ser nuestro líder técnico, arquitecto, coordinador y responsable de calidad.

Somos cuatro integrantes y contamos con dos laptops confirmadas. La sede Querétaro comunicó que el evento va del sábado 14 de noviembre de 2026 a las 9:00 a. m. al domingo 15 de noviembre alrededor de las 5:00 p. m.; debemos permanecer en las instalaciones durante toda la competencia.

El objetivo es completar y entregar HaiLex. No queremos que generes todo de golpe. Queremos que nos guíes por las fases de este documento, con prompts precisos para cada tarea, pruebas, checklists, documentación y commits.

Primero:
1. Resume HaiLex y el reto Field Shift.
2. Resume el stack y las funciones obligatorias.
3. Resume el plan de IA: probar Gemini 4 Hydrogen en nivel gratuito primero; Roo Code en VS Code como agente multi-proveedor a validar; posible API pagada de GPT-6.1 Sol/Terra o Claude Sonnet 5.5 si el equipo y su adulto responsable autorizan un gasto de USD $10–$20, máximo $30.
4. Inspecciona el repositorio/archivos existentes antes de sugerir cambios.
5. Inicia Fase 0 con comandos exactos y criterios de aceptación.

Reglas: no borrar ni reemplazar trabajo válido, no inventar datos científicos, no exponer claves, no añadir dependencias innecesarias, no eliminar funcionalidades, no cambiar contratos sin coordinación, mantener README/AGENTS/PROJECT_CONTEXT/PROJECT_STATUS/CHANGELOG y crear checkpoints Git.

Cada fase debe incluir objetivo, responsables, prompts, archivos, comandos, pruebas, checklist, documentación, commit/tag y condición para avanzar.
```

---

# Apéndice B — Handoff mínimo entre chats de IA

Cuando se alcance límite de contexto o se cambie de modelo/chat, generar un archivo `docs/HANDOFF.md` con:

```text
PROYECTO: HaiLex
FECHA/HORA LOCAL:
COMMIT ACTUAL:
RAMA ACTUAL:
FASE ACTUAL:
ÚLTIMA FASE ACEPTADA:
FUNCIONALIDADES QUE FUNCIONAN:
FUNCIONALIDADES PARCIALES:
BUGS ABIERTOS:
PRUEBAS EJECUTADAS:
COMANDOS QUE FUNCIONAN:
ARCHIVOS MODIFICADOS:
DECISIONES TOMADAS:
PRÓXIMA TAREA EXACTA:
EVIDENCIA NECESARIA:
```

El nuevo chat debe leer este handoff y verificar el estado real de Git antes de continuar. No debe asumir que una tarea se completó solo porque el handoff lo afirma; debe comprobar pruebas/archivos/commit cuando tenga acceso.

---

# Apéndice C — Checklist final de lanzamiento

## Producto

- [ ] HaiLex tiene las cinco secciones.
- [ ] Dashboard muestra resumen real/etiquetado.
- [ ] Earth Explorer permite seleccionar ubicación.
- [ ] Climate Intelligence muestra datos y metadatos.
- [ ] Rotation Studio configura tres escenarios.
- [ ] Analysis & Insights explica la comparación.
- [ ] La procedencia se muestra.
- [ ] Las advertencias son visibles.

## Ciencia y datos

- [ ] NASA POWER integrado.
- [ ] Parámetros/unidades comprobados.
- [ ] Periodo/ubicación documentados.
- [ ] Fixtures etiquetados.
- [ ] Catálogo agrícola documentado.
- [ ] Suelo/contexto local identificado.
- [ ] Escalas y resoluciones no exageradas.
- [ ] Pesos y criterios explicables.
- [ ] Sin predicciones falsas.

## Ingeniería

- [ ] Frontend build pasa.
- [ ] Backend tests pasan.
- [ ] Lint pasa.
- [ ] Typecheck pasa.
- [ ] CORS correcto.
- [ ] Errores controlados.
- [ ] Sin secretos.
- [ ] Sin dependencias huérfanas.
- [ ] README actualizado.
- [ ] AGENTS actualizado.
- [ ] PROJECT_STATUS actualizado.
- [ ] CHANGELOG actualizado.
- [ ] Docs de API/datos/reglas actualizados.

## Colaboración

- [ ] Cuatro integrantes conocen el flujo.
- [ ] Ambas laptops ejecutan el proyecto.
- [ ] GitHub está actualizado.
- [ ] `main` está estable.
- [ ] Existe tag de release.
- [ ] Hay plan de recuperación.

## Presentación y entrega

- [ ] Demo ensayada.
- [ ] Demo de respaldo preparada.
- [ ] Pitch claro.
- [ ] Limitaciones reconocidas.
- [ ] Enlaces probados.
- [ ] Entrega oficial confirmada.
- [ ] Evidencia de envío guardada.

**Fin del documento maestro definitivo de HaiLex.**
