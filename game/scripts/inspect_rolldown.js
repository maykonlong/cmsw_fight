// Inspect rolldown optionalDependencies for WASM binding packages (CommonJS)
'use strict';
const fs = require('node:fs');
const pj = JSON.parse(fs.readFileSync('game/node_modules/rolldown/package.json', 'utf8'));
console.log('rolldown version:', pj.version);
console.log('optionalDependencies:');
for (const [k, v] of Object.entries(pj.optionalDependencies || {})) {
  console.log('  ', k, v);
}
console.log('hasWasmWasi:', !!pj.optionalDependencies && !!pj.optionalDependencies['@rolldown/binding-wasm32-wasi']);
