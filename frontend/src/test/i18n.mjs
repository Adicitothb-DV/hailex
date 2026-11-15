import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const en = JSON.parse(readFileSync(new URL('../i18n/en-US.json', import.meta.url), 'utf8'));
const es = JSON.parse(readFileSync(new URL('../i18n/es-MX.json', import.meta.url), 'utf8'));
assert.deepEqual(Object.keys(en).sort(), Object.keys(es).sort(), 'Locale keys must match');
for (const key of Object.keys(en)) {
  assert.equal(typeof en[key], 'string');
  assert.equal(typeof es[key], 'string');
  const parameters = (text) =>
    [...text.matchAll(/{{\s*([^{}\s]+)\s*}}/g)].map((match) => match[1]).sort();
  assert.deepEqual(parameters(en[key]), parameters(es[key]), `Interpolation differs for ${key}`);
}
console.log(`Catalog parity: ${Object.keys(en).length} keys`);
