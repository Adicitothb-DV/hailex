# AGRONOMIC_RULES.md — Investigación, no recomendaciones definitivas

Consultado 2026-11-14. Catálogo local provisional: `maiz_forrajero`,
`alfalfa`, `cebada`, `sorgo`. No se asignan puntuaciones; cualquier criterio sin
datos críticos debe ser `not_assessable`. Las secuencias requieren agronomía local.

## Territorio y evidencia municipal

- **El Marqués:** La Cañada es cabecera. La ficha estatal [M] documenta superficie
  agrícola de riego y temporal en unidades activas del Censo Agropecuario 2022 y los
  cuatro cultivos en el avance al 31 de octubre de 2024. Clima y suelos específicos, localidades productivas y
  geometría de parcelas aún no verificados: no extrapolar del municipio vecino.
- **Colón:** Colón es cabecera; Ajuchitlán es localidad relevante. El ordenamiento [O]
  describe clima municipal predominantemente templado y semiseco, con lluvias en verano,
  y menciona inundaciones en San Ildefonso y Ajuchitlán. La identificación de clases de
  suelo por unidad aún no está verificada. La ficha [C] documenta los cuatro cultivos;
  verificar régimen por cultivo y disponibilidad efectiva de agua.
- San Juan del Río es evidencia **regional**, no de ninguno de los dos municipios: la
  plataforma INIFAP-CIMMYT [I] documenta riego, maíz en primavera-verano y cebada en
  otoño-invierno. Ni sus suelos ni su manejo son automáticamente representativos aquí.

### Producción municipal — fichas estatales basadas en SIAP

| Municipio y periodo | Cultivo/modalidad reportada | Sembrada ha | Cosechada ha | Producción t | Rendimiento publicado t/ha |
|---|---|---:|---:|---:|---:|
| El Marqués, avance octubre 2024 | Maíz forrajero verde | 5300 | 4861 | 32861 | 7 |
| El Marqués, avance octubre 2024 | Alfalfa | 915 | 915 | 69962 | 76 |
| El Marqués, avance octubre 2024 | Cebada grano | 120 | 120 | 654 | 5 |
| El Marqués, avance octubre 2024 | Sorgo forrajero verde | 43 | 43 | 1548 | 36 |
| El Marqués, avance octubre 2024 | Sorgo grano | 43 | 37 | 248 | 7 |
| Colón, cierre 2023 | Maíz forrajero verde | 971 | 971 | 61856 | 64 |
| Colón, cierre 2023 | Alfalfa | 1497 | 1497 | 102125 | 68 |
| Colón, cierre 2023 | Cebada grano | 214 | 214 | 1177 | 6 |
| Colón, cierre 2023 | Sorgo forrajero verde | 76 | 76 | 3752 | 50 |
| Colón, cierre 2023 | Sorgo grano | 100 | 100 | 867 | 9 |

El avance de El Marqués no es cierre anual ni comparable automáticamente con el cierre
de Colón. La ficha de El Marqués reporta para maíz forrajero en 2023, por separado,
5390 ha sembradas y 363680 t; no se ha verificado el resto de esa fila. Las fichas
redondean; rendimiento es el publicado, no una promesa. Ciclo y régimen
individuales para estas filas: **no desglosados en la tabla citada**, pendientes de SIAP.
No combinar modalidades de sorgo; maíz forrajero verde no es maíz de grano. Las fuentes
y metodología de levantamiento/detalle del cierre deben verificarse en SIAP; estadísticas
agregadas no identifican una parcela. [M] y [C] se citan con URL en la sección final.

## Cuatro fichas de investigación

Los nombres científicos están respaldados por FAO [T]; agrupación gramíneas/leguminosa
por DOF [D]. Familias Poaceae (gramíneas) y Fabaceae (leguminosa). La presencia municipal
está verificada solo para las modalidades y años de la tabla; atributos y calendarios
locales siguen pendientes, aunque se presente contexto general.

### `maiz_forrajero` — maíz forrajero, *Zea mays*, Poaceae

- El Marqués: forrajero verde 2023 y avance 2024; Colón: 2023 [M], [C].
- Anual. En la plataforma regional [I] hay maíz PV, sin
  especificar equivalencia con modalidad forrajera. La duración y fecha de siembra local
  no están verificadas.
- FAO [W] da 500–800 mm por periodo como aproximación general para maíz, sin atribuirla
  a forraje ni a ninguna parcela. Evaluar
  clima local y agua, drenaje y suelo antes de uso; tolerancias locales no verificadas.
- Gramínea: en rotación con otra gramínea persiste la familia; manejo de residuos y
  patógenos requiere verificación. No asignar beneficios o rendimientos automáticos.

### `alfalfa` — alfalfa, *Medicago sativa*, Fabaceae

- El Marqués: avance 2024; Colón: 2023 [M], [C]. Es leguminosa forrajera
  perenne [F], con múltiples cortes; no tratarla como un ciclo anual intercambiable.
- FAO [W] da 800–1600 mm como referencia general aproximada, no demanda local ni ahorro;
  revisar periodo y número de cortes. Fecha de establecimiento, duración del cultivo,
  agua disponible, riesgos de anegamiento, clima y suelo local: pendientes.
- Su leguminosa puede participar en procesos de fijación de nitrógeno, dependientes de
  condiciones de campo; no cuantificar aporte ni asumir beneficio a sucesor sin medir.

### `cebada` — cebada, *Hordeum vulgare*, Poaceae

- El Marqués: avance 2024; Colón: 2023, modalidad **grano** [M], [C]. No asumir maltera o forrajera
  en cada municipio. [I] documenta cebada maltera regional en otoño-invierno con riego.
- FAO [W] indica aproximadamente 450–650 mm por ciclo de referencia general para
  cebada; FAO [W2] usa 120 días como ejemplo, no duración verificada local. Clima
  templado y susceptibilidad al encharcamiento se describen en [B]; definir variedad,
  calendario local, calidad de suelo y agua antes de aplicar.
- Gramínea posterior a maíz/sorgo: riesgos fitosanitarios y residuos deben revisarse;
  no suponer interrupción de todos los ciclos de plagas.

### `sorgo` — sorgo, *Sorghum bicolor*, Poaceae

- El Marqués: avance 2024; Colón: 2023, **grano y forrajero verde** por separado [M], [C]. No
  atribuir híbrido o uso específico adicional. [T] respalda el nombre; DOF [D] usa
  *Sorghum vulgare*, sinónimo indicado por FAO [S].
- FAO [W] indica aproximadamente 450–650 mm por periodo de referencia general;
  [W2] usa 120 días de ejemplo. El sorgo es variable según variedad, modalidad y clima;
  fecha de siembra, duración, condiciones de suelo y riesgos locales son pendientes.
  Considerar estrés hídrico y manejo de residuos, sin prometer menor consumo local.

## Secuencias para revisión agronómica

Las etiquetas no convierten la evidencia regional en validación municipal. Condiciones
comunes: agua/tenencia, régimen riego o temporal, fecha, variedad, suelo y sanidad de la
parcela y factibilidad económica no disponibles; ningún beneficio está cuantificado.

| Secuencia | Municipio piloto | Estado | Evidencia y límites |
|---|---|---|---|
| Maíz forrajero → cebada | El Marqués | `requires_validation` | [I] documenta maíz → cebada en plataforma de riego de San Juan del Río, no maíz forrajero expresamente; se requiere validar modalidad y condiciones en El Marqués. [M] confirma presencia separada, no rotación. |
| Maíz forrajero → cebada | Colón | `requires_validation` | Misma evidencia regional [I]; [C] solo documenta cultivos separados en Colón. Riesgo de agua y continuidad de gramíneas; no extrapolar automáticamente. |
| Sorgo → cebada | El Marqués | `provisional` | [R] propone cebada sobre residuos de sorgo en Bajío, no demuestra práctica municipal. Definir modalidad, riego, residuos y sanidad; beneficio sugerido por [R] no está medido localmente. |
| Sorgo → cebada | Colón | `provisional` | [R] regional y [C] presencia separada; condiciones locales y factibilidad todavía no verificadas. |
| Alfalfa plurianual → maíz forrajero | El Marqués | `not_assessed` | Hipótesis por contraste leguminosa/gramínea, no secuencia municipal documentada. Falta duración de alfalfa, manejo de terminación, agua y nitrógeno. |
| Alfalfa plurianual → maíz forrajero | Colón | `not_assessed` | Hipótesis independiente para Colón; mismos vacíos, sin evidencia de una parcela local. |

No se ha demostrado que las secuencias tengan resultados iguales entre municipios. No
existen ganadores; `documented` se reserva para una secuencia efectivamente documentada
en el ámbito de aplicación concreto.

## Referencias — consultadas 2026-11-14

- [M] Gobierno de Querétaro/SEDESU, *El Marqués*, octubre 2024, avance SIAP 2024,
  municipio El Marqués: https://queretaro.gob.mx/documents/828910/1043660/El-Marques-octubre-2024.pdf/d4265ed8-cae2-42bb-dc66-37d349c587d1?t=1737666210805
- [C] Gobierno de Querétaro/SEDESU, *Colón*, octubre 2024, cierre SIAP 2023, municipio
  Colón: https://queretaro.gob.mx/documents/828910/1043660/Colon-Octubre-2024.pdf/0f050498-030c-8b98-60bd-a72bb467617d?t=1737666209701
- [O] Municipio de Colón, *Ordenamiento ecológico local*, noviembre 2017, municipio:
  https://www.colon.gob.mx/include/pdf/informacion%20publica/articulo%2067/VI/PROGRAMAS/EL%20PROGRAMA%20DE%20ORDENAMIENTO%20ECOL%C3%93GICO%20LOCAL%20DE%20COL%C3%93N/Programa%20de%20Ordenamiento%20Ecol%C3%B3gico%20Local%20M.T..pdf
- [I] CIMMYT/INIFAP, *Visita a la plataforma de investigación en INIFAP-Querétaro*,
  2017, San Juan del Río: https://www.cimmyt.org/es/noticias/visita-a-la-plataforma-de-investigacion-en-inifap-queretaro/
- [R] CIMMYT, *Tips para una producción sustentable de cebada en el Bajío*, 2025,
  ámbito regional: https://www.cimmyt.org/es/noticias/tips-para-una-produccion-sustentable-de-cebada-en-el-bajio/
- [F] Agricultura México, *¿Qué forrajes se cultivan en cada ciclo agrícola?*, 2024,
  ámbito nacional: https://www.gob.mx/agricultura/articulos/que-forrajes-se-cultivan-en-cada-ciclo-agricola?idiom=es
- [W] FAO, *Crop water needs*, sin fecha, necesidades generales aproximadas:
  https://www.fao.org/4/s2022e/s2022e02.htm
- [W2] FAO, *Crop water needs*, sin fecha, duraciones y fases generales:
  https://www.fao.org/4/s2022e/s2022e07.htm
- [T] FAO, *Key to scientific names*, sin fecha, taxonomía general:
  https://www.fao.org/4/s4314e/s4314e0x.htm
- [D] Diario Oficial de la Federación, regulación de grupos de cultivos, 2020, México:
  https://dof.gob.mx/nota_detalle_popup.php?codigo=5592222
- [S] FAO EcoCrop, *Sorghum bicolor*, sin fecha, sinónimo y familia, general:
  https://ecocrop.apps.fao.org/ecocrop/srv/en/cropView?id=48747
- [B] Gobierno de Australia, Office of the Gene Technology Regulator, *The biology of
  Hordeum vulgare L.*, 2021, referencia general de suelo/clima y encharcamiento:
  https://www.ogtr.gov.au/sites/default/files/2021-11/the_biology_of_hordeum_vulgare_l_barley_november_2021.pdf
