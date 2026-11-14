# API_CONTRACT.md — Contrato Oficial Frontend <-> Backend (v0.1.0)

**Base URL local:** `http://localhost:8000`  
**Prefijo API:** `/api/v1`  
**Formato:** JSON (`application/json`), fechas `YYYY-MM-DD`, coordenadas WGS84 (`EPSG:4326`).

---

## 1. `GET /health`
Verifica que el servidor esté activo.
**Respuesta `200 OK`:**
```json
{
  "status": "ok",
  "service": "hailex-api",
  "version": "0.1.0"
}
```

---

## 2. `GET /api/v1/climate`
Obtiene serie temporal climática normalizada desde NASA POWER Daily Point API (o fixture histórico etiquetado si hay fallo externo).

**Query Params:**
- `latitude` (float, requerido): `[-90, 90]`
- `longitude` (float, requerido): `[-180, 180]`
- `start` (string, requerido): `YYYY-MM-DD`
- `end` (string, requerido): `YYYY-MM-DD`
- `label` (string, opcional): Nombre de ubicación de estudio (default `"Punto de estudio"`)

**Respuesta `200 OK`:**
```json
{
  "location": {
    "latitude": 20.5888,
    "longitude": -100.3899,
    "label": "Querétaro - Punto de estudio"
  },
  "source": {
    "organization": "NASA POWER",
    "product": "Daily Point API (AG Community)",
    "endpoint": "https://power.larc.nasa.gov/api/temporal/daily/point",
    "spatial_resolution": "0.5° x 0.625° (aprox. regional; no resolución de parcela)",
    "data_origin": "observation_and_assimilation"
  },
  "retrieved_at": "2026-11-14T11:30:00-06:00",
  "period": {
    "start": "2025-01-01",
    "end": "2025-12-31"
  },
  "data_type": "LIVE",
  "units": {
    "temperature_c": "°C",
    "precipitation_mm_day": "mm/day",
    "solar_radiation_mj_m2_day": "MJ/m²/day"
  },
  "summary": {
    "mean_temperature_c": 19.4,
    "total_precipitation_mm": 542.0,
    "valid_days": 365,
    "missing_days": 0
  },
  "series": [
    {
      "date": "2025-01-01",
      "temperature_c": 15.2,
      "precipitation_mm_day": 0.0,
      "solar_radiation_mj_m2_day": 18.4
    }
  ],
  "warnings": [
    "Los datos satelitales/asimilados representan una celda regional y no mediciones directas dentro de la parcela."
  ]
}
```
*Nota:* Si se usa respaldo local, `data_type` debe ser `"HISTORICAL_FIXTURE"` o `"DEMO_DATA"` y agregarse una advertencia explícita en `warnings`.

---

## 3. `GET /api/v1/crops`
Devuelve el catálogo documentado de cultivos candidatos.

**Respuesta `200 OK`:**
```json
{
  "catalog_version": "0.1.0",
  "crops": [
    {
      "id": "maiz-grano",
      "common_name_es": "Maíz de grano",
      "scientific_name": "Zea mays",
      "crop_group": "cereal",
      "typical_cycle_days": { "min": 120, "max": 160 },
      "water_need_class": "medium_high",
      "temp_optimal_c": { "min": 18.0, "max": 30.0 },
      "soil_preferences": ["franco", "franco-arcilloso", "vertisol"],
      "nitrogen_fixation": false,
      "rotation_notes": "Alta extracción de nitrógeno; recomendable alternar con leguminosas.",
      "region_applicability": "Bajío / Querétaro (temporal y riego)",
      "validation_status": "documented_general",
      "source_refs": ["INIFAP / SIAP - Guía técnica agrícola"],
      "limitations": "Requiere validar variedad local y fecha exacta de siembra."
    }
  ]
}
```

---

## 4. `GET /api/v1/sources`
Lista las fuentes de datos configuradas, su estado de integración, unidades y limitaciones.

**Respuesta `200 OK`:**
```json
{
  "sources": [
    {
      "id": "nasa-power",
      "name": "NASA POWER Daily Point API",
      "organization": "NASA Langley Research Center",
      "status": "implemented",
      "data_type": "observation_and_assimilation",
      "parameters": ["T2M", "PRECTOTCORR", "ALLSKY_SFC_SW_DWN"],
      "resolution": "0.5° lat x 0.625° lon, diaria",
      "url": "https://power.larc.nasa.gov/",
      "limitations": "Resolución regional; no sustituye pluviómetro o estación en parcela."
    },
    {
      "id": "inegi-edafologia",
      "name": "INEGI Edafología (Referencia / Entrada de usuario)",
      "organization": "INEGI México",
      "status": "partial",
      "data_type": "user_input_or_cartographic_reference",
      "parameters": ["soil_type"],
      "resolution": "Escala cartográfica regional 1:250,000",
      "url": "https://www.inegi.org.mx/temas/edafologia/",
      "limitations": "La cartografía regional no sustituye análisis físico-químico de laboratorio."
    }
  ]
}
```

---

## 5. `POST /api/v1/rotations/compare`
Evalúa de forma determinista y explicable 3 escenarios de rotación de cultivos.

**Request Body:**
```json
{
  "parcel": {
    "latitude": 20.5888,
    "longitude": -100.3899,
    "region_label": "Querétaro - Punto de estudio",
    "current_crop_id": "maiz-grano",
    "soil_type": "vertisol",
    "soil_source": "user_input",
    "water_regime": "rainfed"
  },
  "climate_summary": {
    "mean_temperature_c": 19.4,
    "total_precipitation_mm": 542.0,
    "period_start": "2025-01-01",
    "period_end": "2025-12-31",
    "data_type": "LIVE"
  },
  "weights": {
    "water_fit": 0.25,
    "climate_fit": 0.20,
    "soil_fit": 0.20,
    "diversification": 0.20,
    "rotation_practice": 0.15
  },
  "scenarios": [
    {
      "id": "A",
      "name": "Monocultivo continuo (Línea base)",
      "sequence": ["maiz-grano", "maiz-grano", "maiz-grano"]
    },
    {
      "id": "B",
      "name": "Alternancia Cereal - Leguminosa",
      "sequence": ["maiz-grano", "frijol", "maiz-grano"]
    },
    {
      "id": "C",
      "name": "Rotación diversificada de 3 grupos",
      "sequence": ["maiz-grano", "frijol", "avena-forrajera"]
    }
  ]
}
```

**Respuesta `200 OK`:**
```json
{
  "analysis_id": "ana-20261114-001",
  "calculated_at": "2026-11-14T12:00:00-06:00",
  "rules_version": "0.1.0",
  "validation_status": "provisional",
  "normalized_weights": {
    "water_fit": 0.25,
    "climate_fit": 0.20,
    "soil_fit": 0.20,
    "diversification": 0.20,
    "rotation_practice": 0.15
  },
  "best_evaluated_scenario_id": "C",
  "scenarios": [
    {
      "id": "C",
      "name": "Rotación diversificada de 3 grupos",
      "sequence": ["maiz-grano", "frijol", "avena-forrajera"],
      "total_score": 0.78,
      "assessable_weight_ratio": 1.0,
      "criteria": [
        {
          "criterion": "water_fit",
          "label_es": "Ajuste hídrico",
          "status": "assessed",
          "raw_score": 0.80,
          "weight": 0.25,
          "weighted_contribution": 0.20,
          "explanation": "Demanda hídrica compatible con régimen de temporal y precipitación acumulada observada."
        }
      ],
      "strengths": ["Alterna gramíneas con leguminosa fijadora de nitrógeno."],
      "limitations": ["Sujeto a disponibilidad de semilla y ventana local de lluvias."],
      "warnings": []
    }
  ],
  "data_quality": {
    "missing_fields": [],
    "unassessable_criteria": [],
    "sources_used": ["NASA POWER Daily Point API", "Catálogo Agrícola HaiLex v0.1.0"]
  },
  "disclaimer": "Evaluación exploratoria bajo criterios configurados y datos disponibles; no garantiza rendimiento ni sustituye asesoría agronómica local."
}
```

## 6. Errores Estándar (`400`, `422`, `502`, `504`)
```json
{
  "detail": "Descripción clara del error",
  "code": "INVALID_COORDINATES",
  "request_id": "req-12345"
}
```
