// Gera os ícones PWA do Combat Masters: logo pixel art "CM" dourado
// sobre navy com moldura neon, nos tamanhos 192, 512 e 512 maskable.
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const NAVY = [5, 7, 17], NAVY2 = [12, 16, 42];
const GOLD = [255, 215, 0], GOLD2 = [255, 160, 20];
const RED = [213, 40, 33], CYAN = [0, 204, 255];
const WHITE = [255, 250, 230];

// letras C e M em grid 6x8
const C = [
  '.####.',
  '#....#',
  '#.....',
  '#.....',
  '#.....',
  '#.....',
  '#....#',
  '.####.'
];
const M = [
  '#.....#',
  '##...##',
  '#.#.#.#',
  '#.#.#.#',
  '#..#..#',
  '#.....#',
  '#.....#',
  '#.....#'
];
// grid total: 6 + 2 + 7 = 15 colunas, 8 linhas
const GLYPH_W = 15, GLYPH_H = 8;

function glyphPixel(col, row) {
  if (row < 0 || row >= GLYPH_H) return null;
  if (col < 6) return C[row][col] === '#' ? 'c' : null;
  if (col >= 8 && col < 15) return M[row][col - 8] === '#' ? 'm' : null;
  return null;
}

function drawIcon(size, maskable) {
  const png = new PNG({ width: size, height: size });
  const safe = maskable ? 0.12 : 0.04; // margem segura (maskable exige área viva central)
  const grid = Math.floor(size * (1 - safe * 2) / GLYPH_W); // 15 colunas é o limite da largura
  const gw = grid * GLYPH_W, gh = grid * GLYPH_H;
  const gx = Math.floor((size - gw) / 2);
  const gy = Math.floor((size - gh) / 2) + Math.floor(grid * 0.4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      let r, g, b, a = 255;

      if (maskable) {
        // fundo full-bleed para maskable
        const t = y / size;
        r = NAVY[0] + (NAVY2[0] - NAVY[0]) * t;
        g = NAVY[1] + (NAVY2[1] - NAVY[1]) * t;
        b = NAVY[2] + (NAVY2[2] - NAVY[2]) * t;
      } else {
        // cantos arredondados
        const rad = size * 0.18;
        const cx = Math.min(Math.max(x, rad), size - rad);
        const cy = Math.min(Math.max(y, rad), size - rad);
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > rad * rad) {
          png.data[idx + 3] = 0;
          continue;
        }
        const t = y / size;
        r = NAVY[0] + (NAVY2[0] - NAVY[0]) * t;
        g = NAVY[1] + (NAVY2[1] - NAVY[1]) * t;
        b = NAVY[2] + (NAVY2[2] - NAVY[2]) * t;
        // moldura neon
        const border = size * 0.035;
        if (x < border || x > size - border || y < border || y > size - border) {
          const gold = (x + y) % (size * 0.2) < size * 0.1 ? GOLD : GOLD2;
          r = gold[0]; g = gold[1]; b = gold[2];
        }
      }

      // letra C dourada
      const col = Math.floor((x - gx) / grid);
      const row = Math.floor((y - gy) / grid);
      const cellX = x - gx - col * grid, cellY = y - gy - row * grid;
      const inner = cellX > grid * 0.12 && cellX < grid * 0.88 && cellY > grid * 0.12 && cellY < grid * 0.88;
      if (inner) {
        const ch = glyphPixel(col, row);
        if (ch) {
          // gradiente dourado + brilho no topo
          const shine = cellY < grid * 0.3 ? 1.12 : 1;
          if (ch === 'c') { r = GOLD[0] * shine; g = GOLD[1] * shine; b = GOLD[2] * shine; }
          else { r = WHITE[0] * shine; g = WHITE[1] * shine; b = WHITE[2] * shine; }
        }
      }

      // barra vermelha embaixo (identidade arcade)
      const barY = size * (maskable ? 0.86 : 0.885);
      if (y > barY && y < barY + size * 0.03 && x > size * 0.2 && x < size * 0.8) {
        r = RED[0]; g = RED[1]; b = RED[2];
      }

      png.data[idx] = Math.min(255, Math.round(r));
      png.data[idx + 1] = Math.min(255, Math.round(g));
      png.data[idx + 2] = Math.min(255, Math.round(b));
      png.data[idx + 3] = a;
    }
  }
  return png;
}

const out = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'icon-192.png'), PNG.sync.write(drawIcon(192, false)));
fs.writeFileSync(path.join(out, 'icon-512.png'), PNG.sync.write(drawIcon(512, false)));
fs.writeFileSync(path.join(out, 'icon-512-maskable.png'), PNG.sync.write(drawIcon(512, true)));
console.log('ícones gerados em public/icons/');
