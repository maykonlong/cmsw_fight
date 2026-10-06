// Print versions for diagnostics
const fs = require('node:fs');
for (const p of ['game/node_modules/rolldown/package.json','game/node_modules/vite/package.json','game/node_modules/typescript/package.json']) {
    try {
        const j = JSON.parse(fs.readFileSync(p, 'utf8'));
        console.log(p, '->', j.version, j.name);
    } catch(e) {
        console.log(p, 'ERROR', e.message);
    }
}
