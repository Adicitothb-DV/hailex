# HaiLex language and theme (partial implementation)

HaiLex supports `en-US` and `es-MX`; English is the default for a fresh installation.
Language and theme are stored independently under `hailex.preferences.locale` and
`hailex.preferences.theme`. Storage failures fall back safely; changes do not reload the page.
The chat API receives the current locale per turn. Existing conversation text and source data
remain unchanged. Backend clients that omit locale retain the previous Spanish behavior.

The initial catalogs are `frontend/src/i18n/en-US.json` and `frontend/src/i18n/es-MX.json`.
Add matching semantic keys to both catalogs, use `useTranslation()` in components, and run
`npm run test:i18n` from `frontend` to check key and interpolation parity. With the dev server
running, `npm run test:preferences` checks the controls and persistence in headless Chrome.
Do not translate
raw data, source titles, quotations, user content, IDs, or provider names. Format presentation
values with `Intl` using the active locale, keeping the original units and MXN currency.

Existing light theme CSS tokens and preliminary dark overrides are in `frontend/src/styles/v2.css`;
use tokens instead of introducing fixed colors. The controls are in
`frontend/src/app/PreferencesControls.tsx`. Dark mode and translation remain incomplete:
the remaining feature pages, charts, map controls and backend errors require migration and
accessibility/contrast testing. No claim of complete bilingual or dark-mode coverage is intended.
The existing `test:ui` browser test expects a Spanish default and currently fails; update its
expectations and audit the remaining flows as part of the full migration. Fish Audio returned MP3
for both configured voices in a live test; model language is an instruction, not a guaranteed output.