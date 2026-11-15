# DECISIONS.md — Registro de Decisiones Técnicas

- **DEC-004 (Fase 7D):** Bloquear entrenamiento real hasta verificar unidades y
  procedencia SIAP, deflactor oficial y fechas de disponibilidad; nunca interpretar
  coincidencia numérica de columnas como equivalencia de fuentes. Requisitos sugeridos,
  sujetos a revisión: 10 años por grupo y 3 folds temporales; no certifican elegibilidad.

- **DEC-001 (2026-11-14):** Uso de JSON/CSV locales en MVP sin base de datos ni autenticación para priorizar integración end-to-end.
- **DEC-002 (2026-11-14):** Motor de comparación 100% determinista en Python; cero llamadas a LLM en runtime.
- **DEC-003 (2026-11-14):** Uso de `.clinerules` compacto para optimizar presupuesto de tokens en Cline (GPT-6.1 Sol / Terra).
