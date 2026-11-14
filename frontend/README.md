# HaiLex Frontend (React + Vite + TypeScript)

## Estado: FE-02 — configuración base

Aplicación mínima ejecutable, sin lógica de negocio, llamadas HTTP ni datos agrícolas.
Se conservan los directorios de los cinco módulos: Dashboard, Earth Explorer,
Climate Intelligence, Rotation Studio y Analysis & Insights. Sus funciones están pendientes.

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

1. Abrir la URL de desarrollo y comprobar el título HaiLex y el aviso de configuración inicial.
2. Comprobar que no hay errores en la consola del navegador.
3. Revisar la pantalla a 320, 768 y 1366 píxeles de ancho y con zoom al 200 %.
4. Repetir con `build` y `preview` para comprobar el artefacto de producción.

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
