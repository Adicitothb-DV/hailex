# Asesor Agrícola Groq

El backend lee `GROQ_API_KEY` desde `backend/.env` o el entorno del proceso. Copia
`backend/.env.example` a `backend/.env` solo si no existe y añade tu clave en esa variable;
no la envíes por chat, no la uses en `VITE_*` ni la subas a Git. Reinicia el backend.
El modelo es `openai/gpt-oss-120b`, con HTTPS al endpoint oficial de Groq; el timeout y
los tokens de salida se configuran en el mismo archivo. La cuenta puede tener límites o costos.

En Asesor Agrícola guarda el perfil, elige municipio/cultivo y un análisis si existe, escribe
tu pregunta, selecciona fuentes y acepta el envío. Perfil (sin nombre), pregunta, municipio,
modalidad, contexto SIAP/NASA/Sentinel seleccionados y resultado determinista de familias
se envían a Groq. Los resultados no se guardan automáticamente como hechos de una parcela.

El modelo recibe estadísticas acotadas: registros SIAP municipales agrupados por ciclo y
modalidad, últimos 30 días NASA POWER en punto municipal, humedad de superficie y raíz en
sus unidades originales y resumen satelital. Ausencias se indican. Si falla una fuente, el
asesor continúa con un estado parcial. El análisis satelital no se verifica automáticamente
contra el municipio declarado. La respuesta puede equivocarse: contrasta las cifras y acude a
un técnico. No se ha validado ningún modelo predictivo numérico. No se investigan precios
actuales ni se realizan escrituras o llamadas de herramientas por el modelo.

El endpoint es `POST /api/v1/advisor/chat` y usa un esquema JSON validado; el prompt está en
`backend/app/services/advisor_prompt.py` y debe versionarse al cambiar. El prototipo es local,
sin autenticación ni aislamiento de usuarios; no desplegarlo públicamente sin protección.
Las pruebas usan proveedores simulados y no consumen cuota.