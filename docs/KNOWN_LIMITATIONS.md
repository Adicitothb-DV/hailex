# KNOWN_LIMITATIONS.md — Limitaciones Conocidas

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
