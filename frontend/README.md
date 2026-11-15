# HaiLex Frontend (React + Vite + TypeScript)

## Frontend V2 — estado actual

Cinco rutas por fragmento, drawer accesible, mapa vectorial y consulta climática real.
El estado de ubicación y de la última consulta vive en memoria; se pierde al recargar.
Dashboard, Earth Explorer y Climate Intelligence comparten el punto. Rotation Studio y
Analysis & Insights son vistas preparatorias: catálogo, perfiles y motor siguen pendientes.

Para ejecutar en Windows, inicia primero el backend siguiendo `backend/README.md` en el
puerto 8000; en otra terminal, desde `frontend/`, ejecuta `npm.cmd ci` y `npm.cmd run dev`.
Vite escucha en `http://127.0.0.1:5173`. Por defecto la API está en
`http://127.0.0.1:8000`; opcionalmente define `VITE_API_BASE_URL` como origen del backend
antes de iniciar Vite. No incluyas secretos en variables `VITE_*`. Configura CORS en el
backend si usas otro origen del frontend. Health comprueba el proceso, no el proveedor NASA.

- `GET /api/v1/health`, `GET /api/v1/sources` y `GET /api/v1/climate/series` usan los
  sobres y parámetros del backend; la consulta se realiza explícitamente al enviar el formulario.
- Clima presenta las tres variables, unidades, tipo, resoluciones, conteos, advertencias y
  modo de recuperación; valores faltantes permanecen `null`. El periodo y los fixtures
  históricos se identifican; upstream no significa observación actual o medición en parcela.
- Referencias municipales según `docs/DATA_SOURCES.md`; datum de la publicación original
  no verificado. Los puntos no delimitan parcelas. Sin solicitud automática de geolocalización.
- MapLibre carga el estilo vectorial Liberty de OpenFreeMap con atribución OpenFreeMap,
  OpenMapTiles y OpenStreetMap; requiere red y tiene fallback con coordenadas manuales.
- El indicador solar calcula elevación aproximada con hora UTC y coordenadas; no es pronóstico.
- Dependencias nuevas: MapLibre GL JS (mapa), Recharts y `react-is` (gráficas), Lucide
  (iconos). Carga diferida por pantalla; el módulo de mapa sigue siendo grande.
- Pruebas: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run format:check`,
  `npm.cmd run build` y, con backend y Vite activos, `npm.cmd run test:ui`. La prueba de
  navegador requiere Chrome/Edge y red NASA; crea capturas y perfil en la carpeta temporal.

### Registro anterior UI-01 (histórico)

## Estado: UI-01 — identidad, layout y navegación

Shell ejecutable con sidebar, header, menú móvil y cinco pantallas navegables:
Dashboard, Earth Explorer, Climate Intelligence, Rotation Studio y Analysis & Insights.
Las funciones agrícolas siguen pendientes: no hay llamadas HTTP, mapa, gráficas,
formularios de escenarios, puntuaciones ni datos simulados.

El tema claro y la navegación verde bosque aplican la dirección visual V1 aprobada.
Los controles nativos y pequeños SVG propios evitan dependencias adicionales en esta fase.
shadcn/ui y Lucide no se incorporaron; se evaluarán cuando exista una necesidad concreta.

## Requisitos

- Node.js 24.12.0 o posterior de la línea 24.
- npm 11.6.2 o posterior de la línea 11.
- Referencia de validación: Windows, Node.js 24.12.0 y npm 11.6.2.

Usar la misma instalación de Node en ambas laptops. No se necesita Corepack.

## Instalación reproducible (PowerShell)

Desde la raíz del repositorio, entrar en `frontend` y ejecutar:

```powershell
Set-Location .\frontend
node --version
npm.cmd --version
npm.cmd ci
npm.cmd run dev
```

Abrir `http://127.0.0.1:5173`. El puerto es fijo: si está ocupado, el servidor falla
en lugar de elegir otro silenciosamente. Detenerlo con `Ctrl+C`.
En macOS/Linux se usa `npm` en lugar de `npm.cmd`.

## Comandos

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd run build
npm.cmd run preview
```

`build` ejecuta TypeScript antes de generar `dist`. `preview` sirve el build en
`http://127.0.0.1:4173`; no sustituye un servidor de producción.
`npm.cmd run format` aplica Prettier y modifica los archivos de formato admitido.
Para repetir una instalación existente se usa `npm.cmd ci`; no borrar el lockfile.

## Configuración y decisiones

- React y React DOM: montaje en `src/main.tsx`, pantalla inicial en `src/App.tsx`.
- TypeScript estricto sin emisión; incluye código y configuración de Vite.
- Tailwind CSS 4 mediante `@tailwindcss/vite` e importación en `src/styles/globals.css`.
  No necesita archivo Tailwind ni configuración PostCSS separados para esta base.
- ESLint flat config para TypeScript, reglas de hooks y React Refresh.
- Prettier separado de ESLint; `eslint-config-prettier` evita conflictos.
- TypeScript 6.0.3 fijado por compatibilidad declarada con typescript-eslint.
- Versiones directas exactas y `package-lock.json` para instalaciones reproducibles.
- shadcn/ui no se ha añadido: se incorporarán solo los componentes necesarios.
- MapLibre, Recharts y Motion quedan para sus tareas funcionales, no para esta base.

No se requieren variables de entorno ni credenciales. Nunca colocar secretos en
variables `VITE_*`. No hay backend requerido para ver esta pantalla.

El contrato API está en la carpeta `docs` de la raíz, fuera de `frontend`, y no se
modifica en esta tarea. No se han añadido fixtures ni datos simulados.

## Comprobación manual

1. Abrir la URL de desarrollo y recorrer las cinco secciones; sus funciones pendientes están identificadas.
2. Comprobar que no hay errores en la consola del navegador.
3. Revisar la pantalla a 320, 768 y 1366 píxeles de ancho y con zoom al 200 %.
4. Repetir con `build` y `preview` para comprobar el artefacto de producción.
5. Probar atrás/adelante, recargar una ruta y abrir `#/unknown` (pantalla de recuperación).
6. Con teclado: enlace de salto, foco en contenido al navegar, menú móvil, Tab/Shift+Tab y Escape.

## Navegación y organización UI-01

Las rutas son fragmentos (`#/dashboard`, `#/earth-explorer`, `#/climate-intelligence`,
`#/rotation-studio`, `#/analysis-insights`). La raíz muestra Dashboard. No hay React Router.

- `src/App.tsx`: composición de pantallas y recuperación de ruta desconocida.
- `src/app/navigation/navigation.ts`: catálogo y resolución tipada de destinos, no modelos API.
- `src/hooks/useScreenNavigation.ts`: suscripción a cambios de fragmento con React.
- `src/app/layout/AppLayout.tsx`: sidebar, diálogo móvil, foco y contenido principal.
- `src/app/layout/AppHeader.tsx` y `Sidebar.tsx`: contexto y navegación compartidos.
- `src/components/NavigationIcon.tsx`, `PageHeading.tsx`, `PendingPanel.tsx`: piezas reutilizables.
- `src/features/*/*Page.tsx`: contenido propio de cada pantalla, sin lógica agrícola.
- `src/styles/globals.css`: tokens Tailwind, tema claro, layout, responsive y movimiento reducido.
- `src/test/shell.browser.mjs`: prueba real de navegador mediante DevTools y Node, sin paquetes extra.

Se conservan los directorios y sus 14 `.gitkeep`. No se modifica el contrato API provisional.
Los indicadores describen ausencia de integración, no una conexión externa comprobada.

## Prueba de navegador UI-01

Con el servidor de desarrollo iniciado, ejecutar en otra terminal desde `frontend`:

```powershell
npm.cmd run test:ui
```

Requiere Chrome o Edge local; el script busca sus rutas habituales de Windows.
Para otra instalación, definir `CHROME_PATH` con la ruta absoluta del ejecutable.
`HAILEX_TEST_URL` permite probar otro servidor (por ejemplo preview en el puerto 4173).
El navegador de prueba usa un perfil temporal fuera del repositorio y se cierra al terminar.
Su carpeta temporal se informa en la salida y no se elimina automáticamente.

Comprueba cinco rutas a 320/768/1024/1366 px sin desbordamiento horizontal, encabezado único,
enlace activo, foco, historial, recarga, menú móvil, Tab/Shift+Tab, Escape, cambio a desktop,
ruta desconocida, movimiento reducido y ausencia de recursos externos y errores de ejecución/consola.
No equivale a una auditoría completa de accesibilidad ni a revisión visual/lector de pantalla.

## Evidencia UI-01

- Prueba de navegador: PASS después de corregir el recorrido cíclico de foco del menú.
- TypeScript, ESLint, formato y build: PASS en la verificación final.
- Suite ampliada PASS tanto en desarrollo como en el build servido con preview.
- Sin paquetes añadidos ni actualización de dependencias; lockfile conservado.
- Pendiente: revisión visual manual, zoom al 200 %, contraste y lector de pantalla.

## Evidencia de validación FE-02

- `npm.cmd ci`: instalación reproducible comprobada; árbol directo sin paquetes sobrantes.
- `npm.cmd run build`: correcto, incluyendo TypeScript.
- `npm.cmd run lint` y `npm.cmd run format:check`: correctos.
- `npm.cmd run dev`: inicio comprobado, HTTP 200 y montaje React verificado en Chrome headless.
- Tailwind genera las utilidades usadas por la pantalla.
- Pendiente: revisión visual manual, consola y tamaños indicados arriba.

### Aviso de seguridad de herramientas de desarrollo

La auditoría de npm reportó siete hallazgos moderados asociados a `minimatch`
en la cadena de `typescript-eslint` (aviso `GHSA-g3hv-75wg-m249`).
`npm.cmd audit --omit=dev` reportó cero vulnerabilidades de producción.
No se aplicó `npm audit fix --force`: la propuesta introduce un cambio incompatible.
Revisar una actualización compatible antes de integrar código o patrones glob no confiables.
La instalación es funcional; la auditoría completa de seguridad no está limpia.
