// Placeholder gen: cria kevin_p2.png e vini_dog_p2.png (500x520, transparente
// com borda vermelha arcade) pois são carregados por CombatScene/BootScene como
// fallback de diretório, mas nunca renderizados (a textura real vem do JSON:
// data.sprites.idle = kevin_p2_idle, vini_dog_p2_idle). Mantém o asset set
// completo e elimina 404s de boot.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '../public/assets/sprites');
const W = 500;
const H = 520;
const RED = [255, 80, 33, 255];

function makePlaceholder() {
    const png = new PNG({ width: W, height: H });
    const d = png.data;
    for (let i = 0; i < d.length; i += 4) {
        d[i] = 0; d[i + 1] = 0; d[i + 2] = 0; d[i + 3] = 0;
    }
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (x < 10 || x >= W - 10 || y < 10 || y >= H - 10) {
                const i = (y * W + x) * 4;
                d[i] = RED[0]; d[i + 1] = RED[1]; d[i + 2] = RED[2]; d[i + 3] = RED[3];
            }
        }
    }
    return png;
}

function writePng(png, filename) {
    const bytes = PNG.sync.write(png);
    fs.writeFileSync(path.join(root, filename), bytes);
    console.log('created', filename, png.width + 'x' + png.height);
}

writePng(makePlaceholder(), 'kevin_p2.png');
writePng(makePlaceholder(), 'vini_dog_p2.png');

