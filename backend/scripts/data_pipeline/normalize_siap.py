"""Preserve source columns and add a conservative normalized view."""

import numpy as np
import pandas as pd

from .price_integrity import prices

MUNICIPALITIES = {"El Marqués": "el_marques_queretaro", "Colón": "colon_queretaro"}
CROPS = {
    "Cebada grano": ("cebada", "grano"),
    "Maíz forrajero en verde": ("maiz_forrajero", "forraje_verde"),
    "Sorgo forrajero en verde": ("sorgo", "forraje_verde"),
    "Alfalfa verde": ("alfalfa", "forraje_verde"),
}
ALIASES = {
    "Anio": "year",
    "Idmunicipio": "municipality_id",
    "Idcultivo": "crop_id",
    "Sembrada": "planted_area",
    "Cosechada": "harvested_area",
    "Siniestrada": "damaged_area",
    "Volumenproduccion": "production_volume",
    "Rendimiento": "reported_yield",
    "Preciomediorural": "rural_average_price",
    "Valorproduccion": "production_value",
    "Precio": "Precio_numeric",
}


def normalize(frame: pd.DataFrame) -> pd.DataFrame:
    out = frame.copy()
    for original, normalized in ALIASES.items():
        numeric = pd.to_numeric(out[original], errors="coerce")
        out[normalized] = numeric.where(np.isfinite(numeric), np.nan)
    out["municipality_name"] = out["Nommunicipio"]
    out["region_id"] = out["Nommunicipio"].map(MUNICIPALITIES)
    out["crop_name_raw"] = out["Nomcultivo"]
    out["crop_name"] = out["Nomcultivo"].map(lambda x: CROPS.get(x, (None, None))[0])
    out["crop_product_form"] = out["Nomcultivo"].map(lambda x: CROPS.get(x, (None, None))[1])
    out["agricultural_cycle"] = out["Nomcicloproductivo"]
    out["irrigation_mode"] = out["Nommodalidad"]
    if len(out):
        price_frame = pd.DataFrame([prices(row) for _, row in out.iterrows()], index=out.index)
        out = pd.concat([out, price_frame], axis=1)
    else:
        for col in (
            "price_from_value_volume",
            "pmr_price_difference_abs",
            "pmr_price_difference_rel",
            "workbook_price_difference_abs",
            "workbook_price_difference_rel",
            "price_status",
            "analytical_price",
            "price_inconsistent",
        ):
            out[col] = pd.Series(dtype="object")
    return out
