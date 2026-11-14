# AGRONOMIC_RULES.md — Reglas de Rotación y Criterios (v0.1.0)

- Fórmula: `Score(R) = Σ(weight_i × criterion_i)` sobre criterios evaluables (`status == 'assessed'`).
- Si un criterio carece de datos críticos (ej. `soil_type == 'unknown'`), su estado es `not_assessable` y se renormalizan los pesos evaluables reportando `assessable_weight_ratio`.
- Estado de validación: `provisional` hasta revisión con literatura INIFAP/FAO.
