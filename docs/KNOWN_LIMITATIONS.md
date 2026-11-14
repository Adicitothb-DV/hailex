# KNOWN_LIMITATIONS.md — Limitaciones Conocidas

1. NASA POWER no está integrado. Resolución/unidades/origen deben verificarse por producto y parámetro; no representan medición exacta de parcela.
2. No existe motor ni pesos calibrados; reglas, fuentes y prioridades iniciales requieren revisión agronómica local.
3. La evaluación no predice rendimiento en toneladas ni rentabilidad económica.
4. Fase 5 implementa únicamente infraestructura y health. Clima, catálogo, sources, compare, snapshots y flujo frontend-backend no están implementados.
5. APP_PORT se valida, pero Uvicorn CLI requiere --port para cambiar de puerto. Variables NASA reservadas no se consumen aún.
6. La configuración HTTP de CORS es local por defecto; CORS no es autenticación y no bloquea clientes no navegador.
7. Errores después de comenzar una futura respuesta streaming no pueden cambiarse a un sobre JSON nuevo. No hay streaming de negocio en esta fase.
8. El log de aplicación omite datos sensibles por diseño; el filtro de acceso redacta el destino del formato estándar de Uvicorn. Configuraciones de logging externas requieren revisión propia.
9. Swagger usa recursos externos para su UI; OpenAPI y health son locales. Prueba HTTP de /docs valida entrega HTML, no render visual offline.
