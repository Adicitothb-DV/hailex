# KNOWN_LIMITATIONS.md — Limitaciones Conocidas

## Demo actual

El estado vigente y las limitaciones del procesamiento Sentinel-2, AOI, SIAP y
persistencia se encuentran en `docs/FINAL_DEMO_SCOPE.md`. Los apartados siguientes
conservan el contexto histórico de las fases anteriores.

## Catálogo y parcela

- El catálogo describe nombres y formas de producto; requisitos y calendarios locales
  permanecen desconocidos. El perfil es un esquema, no un servicio de almacenamiento.
- Ninguna clase edáfica se consulta automáticamente. Cartografía no es laboratorio.

## Clima Fase 7C

- Ventanas nacionales aproximadas, con discrepancia de inicio PV entre fuentes SIAP;
  faltan calendarios locales y fechas fenológicas. Alfalfa se trata como perenne especial.
- Falta parte de 2002 y 2026 para ocho ventanas; las sumas completas no se calculan.
- No se adquirió referencia 1991–2020: no hay anomalías; terciles son descriptivos.
- Instantáneas históricas son JSON reserializados, no respuestas HTTP originales; los
  puntos pueden compartir celdas, y radiación idéntica no prueba una celda compartida.

## SIAP Fase 7B

- El consolidado intermedio no certifica la fuente original; diccionario y unidades de
  precio/valor no verificados. `official_pmr` denota el campo, no certificación de origen.
- Las agregaciones por municipio/cultivo son provisionales y colapsan ciclo/modalidad;
  el solapamiento de superficies y la comparabilidad de unidades requieren revisión.
- Años SIAP 2015–2020 ausentes; sin interpolación. El resultado sin
  advertencias no sustituye validación agronómica o estadística.

## Frontend V2

- La ubicación y consulta se pierden al recargar; no hay historial persistente.
- Catálogo, perfil de suelo, edición/evaluación de escenarios y comparación siguen pendientes.
- OpenFreeMap requiere red y sus recursos pueden fallar; el respaldo es entrada manual.
- El módulo de mapa sigue siendo grande pese a carga diferida. No se hizo auditoría formal
  de accesibilidad, contraste, lector de pantalla ni zoom 200 %.
- Tipos TypeScript y verificación básica del sobre no son validación exhaustiva en runtime.
- Hora solar aproximada en UTC, sin corrección atmosférica ni zona horaria civil local.

1. NASA POWER está integrado para clima diario AG/UTC; productos y disponibilidad pueden cambiar. Revisar el diccionario vigente si cambian unidades o procedencia. No son mediciones de parcela.
2. No existe motor ni pesos calibrados; reglas, fuentes y prioridades iniciales requieren revisión agronómica local.
3. La evaluación no predice rendimiento en toneladas ni rentabilidad económica.
4. Clima, sources y snapshots en memoria están implementados; catálogo, compare y flujo frontend-backend no.
5. APP_PORT se valida, pero Uvicorn CLI requiere --port para cambiar de puerto. Variables NASA reservadas no se consumen aún.
6. La configuración HTTP de CORS es local por defecto; CORS no es autenticación y no bloquea clientes no navegador.
7. Errores después de comenzar una futura respuesta streaming no pueden cambiarse a un sobre JSON nuevo. No hay streaming de negocio en esta fase.
8. El log de aplicación omite datos sensibles por diseño; el filtro de acceso redacta el destino del formato estándar de Uvicorn. Configuraciones de logging externas requieren revisión propia.
9. Swagger usa recursos externos para su UI; OpenAPI y health son locales. Prueba HTTP de /docs valida entrega HTML, no render visual offline.
10. Las respuestas históricas POWER para ambas cabeceras son independientes y no son mediciones de parcela ni servicio en vivo. Las series solares coinciden; datum de la publicación de coordenadas y prueba poligonal independiente pendientes.
11. La evidencia de secuencias es regional o hipotética, no validación agronómica municipal. Desgloses por ciclo y régimen y datos gubernamentales aportados por el equipo siguen pendientes.
12. Un worker; snapshots y caché se pierden en reinicio. El bloqueo global serializa peticiones climáticas diferentes; sin despliegue multinodo ni persistencia. Respaldo histórico solo para consulta exacta de 2025 y puntos archivados.
