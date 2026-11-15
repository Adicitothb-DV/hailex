# Lex: voz e investigación (integración parcial)

En `backend/.env`, conserva los valores existentes y configura claves nuevas privadas en
`GROQ_API_KEY` y `FISH_AUDIO_API_KEY`; no guardes claves en frontend ni Git. Opcionales:
`FISH_AUDIO_REFERENCE_ID=d85aae3c4f4d4c70860997c27554f533` para español,
`FISH_AUDIO_REFERENCE_ID_EN=79d0bd3e4e5444b18f7b6d89b5927bf1` para inglés,
`FISH_AUDIO_MODEL=s2.1-pro-free`, `LEX_VOICE_ENABLED=true` y
`LEX_WEB_RESEARCH_ENABLED=true`. Reinicia el backend tras editar el archivo.

El frontend envía el locale del turno a `/advisor/tts`; las solicitudes antiguas sin locale
usan español. Si el navegador bloquea la reproducción automática, pulsa «Reproducir audio»:
utiliza el audio ya generado. Ambos IDs devolvieron MP3 con `s2.1-pro-free` en una prueba
real breve; esto no verifica altavoces ni permisos de cada navegador. Los turnos históricos sin
metadatos de idioma utilizan el idioma activo al solicitar lectura manual.

Con lectura automática, se conserva el turno inmediatamente pero se muestra la respuesta al
estar listo el MP3 o al comenzar la reproducción. Si se bloquea, falla o tarda más de 30 s,
se muestra el texto con aviso. El modo `latency=low` reduce latencia en una medición puntual,
pero la generación completa sigue dependiendo de Groq, la red y Fish Audio. Respuestas de
más de 1800 caracteres muestran todo el texto, pero el audio se limita a los primeros 1800.

Abre el botón Lex en cualquier sección. El chat se conserva en `sessionStorage` de la misma
pestaña durante navegación y recarga; no se cifra ni sobrevive al cierre de sesión. Con
«Dictar consulta» el navegador solicita micrófono y transcribe una frase, que se debe revisar
y enviar manualmente. «Activar escucha de Lex» habilita reconocimiento continuo solo mientras
la página está activa: al reconocer «Lex» abre el panel, detiene la escucha y deja la frase
para revisión antes de enviarla. El navegador puede enviar audio a su proveedor de reconocimiento;
el soporte varía y ante errores se ofrece escritura. Cada respuesta nueva intenta reproducirse
con Fish Audio REST; se puede desactivar, pausar o detener. Si el navegador bloquea reproducción
automática, pulsa «Escuchar respuesta». No hay WebSocket ni ASR alternativo.

La investigación web está activada inicialmente y se puede desmarcar. Si la consulta sugiere actualidad, se ejecuta Browser Search
por separado de la respuesta JSON. Solo se exponen enlaces recibidos del proveedor,
etiquetadas sin verificar. No hay verificación de páginas, extracción de precios, cotejo de
fechas, ni cálculos económicos: no se garantiza información actual. El chat sigue funcionando
si búsqueda o audio fallan. SIAP, POWER y Sentinel-2 mantienen sus limitaciones previas.

Pruebas automatizadas: 144 tests backend, Ruff, build/lint frontend y navegador con
respuestas simuladas. No se han probado credenciales reales nuevas, micrófono ni Fish Audio
en este entorno.
El backend es local, sin autenticación ni separación multiusuario: no exponerlo públicamente.