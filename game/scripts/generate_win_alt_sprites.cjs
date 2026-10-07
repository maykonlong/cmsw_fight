// Gera as poses win_alt do zero em pixel art (grid 25x26, blocos de 20px -> 500x520)
// Kevin: flex duplo de bíceps | Vini Dog: apontando pro rival com mão na cintura
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const W = 25, H = 26, SCALE = 20;
const OUTLINE = '#171019';

function makeGrid() { return Array.from({ length: H }, () => Array(W).fill(null)); }

function R(g, x, y, w, h, c) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    if (i >= 0 && i < W && j >= 0 && j < H) g[j][i] = c;
  }
}

// contorno automático: célula vazia vizinha de preenchida vira contorno
function outline(g) {
  const out = Array.from({ length: H }, () => Array(W).fill(null));
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (g[j][i]) { out[j][i] = g[j][i]; continue; }
    const near = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => {
      const a = i+dx, b = j+dy; return a>=0 && a<W && b>=0 && b<H && g[b][a];
    });
    if (near) out[j][i] = OUTLINE;
  }
  return out;
}

function render(g, file) {
  const png = new PNG({ width: W * SCALE, height: H * SCALE });
  const oc = hex(OUTLINE);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const cell = g[j][i];
    const c = cell ? hex(cell) : [0, 0, 0, 0];
    for (let y = 0; y < SCALE; y++) for (let x = 0; x < SCALE; x++) {
      const idx = ((j * SCALE + y) * W * SCALE + (i * SCALE + x)) * 4;
      png.data[idx] = c[0]; png.data[idx+1] = c[1]; png.data[idx+2] = c[2];
      png.data[idx+3] = cell ? 255 : 0;
      if (!cell) { png.data[idx] = oc[0]; png.data[idx+1] = oc[1]; png.data[idx+2] = oc[2]; }
    }
  }
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'assets', 'sprites', file), PNG.sync.write(png));
  console.log('gerado:', file);
}

function hex(h) { return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16), 255]; }

// ── KEVIN: flex duplo de bíceps ─────────────────────────────────
function kevinWinAlt() {
  const skin = '#f9a265', skinSh = '#e08c4e', hair = '#4a3222', hairSh = '#3a2618';
  const tank = '#eeecef', tankSh = '#cfd0d6', pants = '#221f26', pantsSh = '#363136';
  const shoe = '#f2f1f4', shoeSh = '#c9c8ce', chain = '#d7d9de';
  const g = makeGrid();

  // cabeça
  R(g, 10, 5, 5, 2, hair);            // topo do cabelo
  R(g, 9, 6, 1, 2, hair); R(g, 15, 6, 1, 2, hair); // laterais do cabelo
  R(g, 10, 7, 5, 3, skin);            // rosto
  R(g, 10, 9, 5, 1, skinSh);          // sombra do queixo
  R(g, 11, 8, 1, 1, '#241812'); R(g, 13, 8, 1, 1, '#241812'); // olhos
  R(g, 12, 9, 1, 1, '#8c4a3a');       // boca (sorriso)
  // pescoço
  R(g, 11, 10, 3, 1, skinSh);
  // torso (regata) — peito estufado
  R(g, 9, 11, 7, 5, tank);
  R(g, 14, 11, 2, 5, tankSh);         // sombra lateral
  R(g, 9, 12, 1, 4, skin);            // ombro/peito esquerdo à mostra
  R(g, 11, 12, 3, 3, chain);          // corrente
  // braço esquerdo erguido em flex: punho acima da cabeça, bíceps estufado
  R(g, 5, 3, 3, 2, skin);             // punho fechado no topo
  R(g, 4, 3, 1, 2, skinSh);           // dedos
  R(g, 5, 5, 2, 2, skin);             // antebraço
  R(g, 6, 7, 2, 2, skin);             // bíceps flexionado (bolha)
  R(g, 7, 9, 2, 2, skinSh);           // dobra do cotovelo
  R(g, 8, 11, 2, 2, skin);            // ombro
  // braço direito erguido em flex (espelhado)
  R(g, 17, 3, 3, 2, skin);            // punho fechado no topo
  R(g, 20, 3, 1, 2, skinSh);          // dedos
  R(g, 18, 5, 2, 2, skin);            // antebraço
  R(g, 17, 7, 2, 2, skin);            // bíceps flexionado (bolha)
  R(g, 16, 9, 2, 2, skinSh);          // dobra do cotovelo
  R(g, 15, 11, 2, 2, skin);           // ombro
  // calça
  R(g, 9, 16, 7, 2, pants);
  R(g, 9, 18, 3, 4, pants); R(g, 13, 18, 3, 4, pants); // pernas afastadas
  R(g, 14, 18, 2, 4, pantsSh);
  R(g, 9, 21, 3, 1, pantsSh); R(g, 13, 21, 3, 1, pantsSh); // barra
  // tênis
  R(g, 7, 22, 5, 2, shoe); R(g, 13, 22, 5, 2, shoe);
  R(g, 7, 24, 5, 1, shoeSh); R(g, 13, 24, 5, 1, shoeSh);
  return outline(g);
}

// ── VINI DOG: apontando pro rival, mão na cintura ───────────────
function viniWinAlt() {
  const skin = '#fcb06c', skinSh = '#e0954f', beard = '#1c1410';
  const cap = '#1e1c1c', capSh = '#2d2b2b', tee = '#131313', teeSh = '#2d2b2b';
  const jeans = '#7eb9fd', jeansSh = '#5c94d8', shoe = '#f6f5f8', shoeSh = '#c9c8ce', chain = '#f2c14e';
  const g = makeGrid();

  // boné (pra trás, aba colada à direita)
  R(g, 9, 4, 6, 2, cap);
  R(g, 15, 5, 2, 1, capSh);           // aba pra trás
  R(g, 9, 6, 1, 1, capSh);            // frente da aba embaixo
  // rosto
  R(g, 10, 6, 5, 2, skin);
  R(g, 11, 6, 1, 1, '#241812'); R(g, 13, 6, 1, 1, '#241812'); // olhos
  R(g, 10, 8, 5, 2, beard);           // barba cheia no queixo
  // pescoço
  R(g, 11, 9, 3, 1, skinSh);
  // camiseta preta
  R(g, 9, 10, 7, 5, tee);
  R(g, 14, 10, 2, 5, teeSh);
  R(g, 11, 10, 3, 2, chain);          // corrente dourada
  // braço direito apontando pro rival (altura do ombro, reto)
  R(g, 16, 10, 3, 2, tee);            // manga
  R(g, 19, 10, 3, 2, skin);           // antebraço estendido
  R(g, 22, 10, 2, 1, skin);           // mão + dedo apontando
  R(g, 23, 11, 1, 1, skinSh);
  // braço esquerdo na cintura (akimbo)
  R(g, 6, 11, 2, 2, tee);             // cotovelo aberto
  R(g, 7, 13, 3, 1, skin);            // mão na cintura
  R(g, 8, 14, 1, 1, skinSh);
  // jeans
  R(g, 9, 15, 7, 2, jeans);
  R(g, 14, 15, 2, 2, jeansSh);
  R(g, 9, 17, 3, 5, jeans); R(g, 13, 17, 3, 5, jeans); // pernas
  R(g, 14, 17, 2, 5, jeansSh);
  R(g, 9, 21, 3, 1, jeansSh); R(g, 13, 21, 3, 1, jeansSh); // barra
  // tênis
  R(g, 7, 22, 5, 2, shoe); R(g, 13, 22, 5, 2, shoe);
  R(g, 7, 24, 5, 1, shoeSh); R(g, 13, 24, 5, 1, shoeSh);
  return outline(g);
}

render(kevinWinAlt(), 'kevin_win_alt.png');
render(viniWinAlt(), 'vini_dog_win_alt.png');
