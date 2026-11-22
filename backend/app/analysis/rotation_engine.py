"""A transparent family-change ordering, not an agronomic suitability model."""

from app.schemas.rotation_workspace import RotationInput
from app.services.crops import load_catalog


def compare_rotation(request: RotationInput) -> dict:
    catalog = load_catalog()
    crops = {crop.id: crop for crop in catalog.crops}
    previous = crops.get(request.previous_crop) if request.previous_crop else None
    can_order = bool(
        request.prioritize_family_change and previous and previous.botanical_family
    )
    options = []
    for crop in catalog.crops:
        known = previous is not None and previous.botanical_family and crop.botanical_family
        same_family = (previous.botanical_family == crop.botanical_family) if known else None
        options.append(
            {
                "crop_id": crop.id,
                "name": crop.common_name,
                "family": crop.botanical_family,
                "same_family_as_previous": same_family,
                "family_status": "assessable" if known else "not_assessable",
                "repeated_crop": crop.id == previous.id if previous else None,
                "source_refs": crop.identity_source_refs.get("botanical_family", []),
            }
        )
    if can_order:
        options.sort(key=lambda item: (item["same_family_as_previous"] is not False, item["name"]))
    return {
        "ordering": "family_change_requested" if can_order else "not_assessable",
        "options": options,
        "factors": {
            "previous_crop": "user_input" if previous else "not_assessable",
            "region": "user_input" if request.region else "not_assessable",
            "water_regime": "user_input" if request.water_regime != "unknown" else "not_assessable",
            "climate": "not_assessable",
            "soil": "not_assessable",
            "water_requirements": "not_assessable",
            "economics": "not_assessable",
            "crop_calendar": "not_assessable",
        },
        "sources": [source.model_dump(mode="json") for source in catalog.sources],
        "forecast_status": "forecast_not_reliable",
        "limitations": [
            "El orden solo refleja la preferencia explícita de cambiar de familia, no aptitud, rendimiento ni rentabilidad.",
            "Maíz forrajero, sorgo y cebada pertenecen a Poaceae; alfalfa pertenece a Fabaceae.",
            "Faltan datos locales verificables de suelo, agua, calendario y mercado para evaluar la rotación completa.",
            "El régimen de agua y el municipio son declaraciones del usuario y no determinan la clasificación.",
            "No se predice rendimiento ni se sustituye una visita técnica.",
        ],
    }