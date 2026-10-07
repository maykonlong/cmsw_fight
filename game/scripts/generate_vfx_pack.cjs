// PACOTE DE ARTE VFX/CENÁRIO/CINEMÁTICA — Combat Masters
// Gera 24+ sprites procedurais (pixel art de alta resolução por funções implícitas):
// faíscas de impacto (4f), explosão de clash (3f), escudo de guarda, estrela de dizzy,
// anéis de aura (3f), raios elétricos (3f), coração do beijo (3f), cachorro correndo (3f),
// poeira, fumaça de vape, torcida animada (2f), letreiro neon piscando (2f).
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'assets', 'sprites');

// ── mini framework de desenho ────────────────────────────────────
function canvas(w, h) { return { w, h, d: new Uint8ClampedArray(w * h * 4) }; }
function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function blend(img, x, y, c, a) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = (y * img.w + x) * 4, sa = a / 255, da = img.d[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  img.d[i]     = (c[0] * sa + img.d[i]     * da * (1 - sa)) / oa;
  img.d[i + 1] = (c[1] * sa + img.d[i + 1] * da * (1 - sa)) / oa;
  img.d[i + 2] = (c[2] * sa + img.d[i + 2] * da * (1 - sa)) / oa;
  img.d[i + 3] = oa * 255;
}
function fillCircle(img, cx, cy, r, c, a = 255) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d <= r) blend(img, x, y, c, a * Math.min(1, (r - d) + 1));
  }
}
function fillEllipse(img, cx, cy, rx, ry, c, a = 255) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    if (dx * dx + dy * dy <= 1) blend(img, x, y, c, a);
  }
}
function fillRect(img, x, y, w, h, c, a = 255) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) blend(img, i, j, c, a);
}
function thickLine(img, x0, y0, x1, y1, w, c, a = 255) {
  const len = Math.hypot(x1 - x0, y1 - y0), steps = Math.ceil(len * 2);
  for (let i = 0; i <= steps; i++) {
    fillCircle(img, x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps, w / 2, c, a);
  }
}
// faísca de 4 pontas via superelipse (n pequeno = pontas longas)
function sparkle(img, cx, cy, R, n, c, a = 255, rot = 0) {
  const cos = Math.cos(rot), sin = Math.sin(rot);
  for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
    const dx = x - cx, dy = y - cy;
    const rx = dx * cos - dy * sin, ry = dx * sin + dy * cos;
    const nx = rx / R, ny = ry / R;
    if (Math.pow(Math.abs(nx), n) + Math.pow(Math.abs(ny), n) <= 1) {
      const edge = Math.pow(Math.abs(nx), n) + Math.pow(Math.abs(ny), n);
      blend(img, x, y, c, a * (1 - edge * 0.25));
    }
  }
}
// anel com ondulação angular
function ring(img, cx, cy, r, thick, c, a = 255, jag = 0, freq = 0) {
  for (let y = Math.floor(cy - r - thick); y <= cy + r + thick; y++) for (let x = Math.floor(cx - r - thick); x <= cx + r + thick; x++) {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    const rr = r + (jag ? Math.sin(ang * freq) * jag : 0);
    if (Math.abs(d - rr) <= thick / 2) blend(img, x, y, c, a);
  }
}
// coração clássico: (x²+y²-1)³ - x²·y³ < 0
function heart(img, cx, cy, s, c, a = 255) {
  for (let y = Math.floor(cy - s * 1.35); y <= cy + s * 1.2; y++) for (let x = Math.floor(cx - s * 1.3); x <= cx + s * 1.3; x++) {
    const nx = (x - cx) / s, ny = -(y - cy) / s + 0.15;
    const f = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny;
    if (f < 0) blend(img, x, y, c, a);
  }
}
function polygon(img, pts, c, a = 255) {
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  pts.forEach(p => { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
  const inside = (x, y) => {
    let hit = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };
  for (let y = Math.floor(minY); y <= maxY; y++) for (let x = Math.floor(minX); x <= maxX; x++) if (inside(x, y)) blend(img, x, y, c, a);
}
function save(img, file) {
  const png = new PNG({ width: img.w, height: img.h });
  png.data = Buffer.from(img.d);
  fs.writeFileSync(path.join(OUT, file), PNG.sync.write(png));
  console.log('ok:', file);
}
function rng(seed) { let s = seed; return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; }

const WHITE = hex('#ffffff'), GOLD = hex('#ffd54a'), ORANGE = hex('#ff9a2a'), RED = hex('#ff5a3c');
const CYAN = hex('#7fe3ff'), CYAN2 = hex('#39b7e8'), PINK = hex('#ff6fa8'), PINK2 = hex('#ff9ac2');
const BLUE = hex('#2e7ff0'), BLUE2 = hex('#7fbaff'), STEEL = hex('#cfd6de'), SMOKE = hex('#dfe7ee');
const DARK = hex('#0b0f22'), RIM = hex('#28325c'), NEON_G = hex('#3dff9e'), NEON_OFF = hex('#1d4a35');

// ── 1. FAÍSCAS DE IMPACTO (4 frames) ─────────────────────────────
for (let k = 0; k < 4; k++) {
  const img = canvas(96, 96);
  const R = 30 + k * 9, n = 0.3 + k * 0.05, rot = k * 0.22; // n baixo = pontas longas de faísca
  sparkle(img, 48, 48, R, n, ORANGE, 235, rot);
  sparkle(img, 48, 48, R * 0.72, n * 0.9, GOLD, 255, rot);
  sparkle(img, 48, 48, R * 0.4, 0.22, WHITE, 255, rot);
  // estilhaços laterais nos frames avançados
  if (k >= 2) for (let s = 0; s < 6; s++) {
    const ang = s / 6 * Math.PI * 2 + k;
    const r0 = R + 4 + k * 3;
    fillCircle(img, 48 + Math.cos(ang) * r0, 48 + Math.sin(ang) * r0, 3 - k * 0.5, GOLD, 220);
  }
  save(img, `spark_${k + 1}.png`);
}

// ── 2. EXPLOSÃO DE CLASH (3 frames) ──────────────────────────────
for (let k = 0; k < 3; k++) {
  const img = canvas(160, 160);
  sparkle(img, 80, 80, 34 + k * 16, 0.42, RED, 240, Math.PI / 4 + k * 0.1);
  sparkle(img, 80, 80, 26 + k * 13, 0.4, GOLD, 255, Math.PI / 4);
  ring(img, 80, 80, 26 + k * 26, 9 - k * 2, CYAN, 230 - k * 40, 5, 9);
  sparkle(img, 80, 80, 12 + k * 4, 0.3, WHITE, 255);
  save(img, `clash_${k + 1}.png`);
}

// ── 3. ESCUDO DE GUARDA ──────────────────────────────────────────
{
  const img = canvas(128, 160);
  // crescente voltado para a esquerda (espelha conforme facing)
  for (let y = 0; y < 160; y++) for (let x = 0; x < 128; x++) {
    const dx = (x - 78) / 52, dy = (y - 80) / 78;
    const d = dx * dx + dy * dy;
    if (d <= 1 && dx < -0.05) {
      blend(img, x, y, CYAN2, 150);
      if (d > 0.72) blend(img, x, y, CYAN, 235);
      if (d > 0.9) blend(img, x, y, WHITE, 255);
    }
  }
  save(img, 'guard_shield.png');
}

// ── 4. ESTRELA DO DIZZY ──────────────────────────────────────────
{
  const img = canvas(48, 48);
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 === 0 ? 22 : 9;
    pts.push([24 + Math.cos(ang) * r, 24 + Math.sin(ang) * r]);
  }
  polygon(img, pts, GOLD, 255);
  polygon(img, pts.map(p => [24 + (p[0] - 24) * 0.5, 24 + (p[1] - 24) * 0.5]), WHITE, 255);
  save(img, 'star.png');
}

// ── 5. POEIRA ────────────────────────────────────────────────────
{
  const img = canvas(96, 64);
  fillCircle(img, 30, 46, 16, SMOKE, 190);
  fillCircle(img, 52, 40, 20, SMOKE, 210);
  fillCircle(img, 72, 46, 14, SMOKE, 170);
  fillCircle(img, 46, 30, 10, hex('#ffffff'), 160);
  save(img, 'dust_puff.png');
}

// ── 6. ANÉIS DE AURA (3 frames) ──────────────────────────────────
for (let k = 0; k < 3; k++) {
  const img = canvas(224, 224);
  const r = 62 + k * 16;
  ring(img, 112, 112, r, 12 - k * 2, GOLD, 235, 5, 9);
  ring(img, 112, 112, r - 8, 4, WHITE, 220, 5, 9);
  // redemoinhos nos cantos
  for (let s = 0; s < 4; s++) {
    const ang = s / 4 * Math.PI * 2 + k * 0.5;
    fillCircle(img, 112 + Math.cos(ang) * (r + 14), 112 + Math.sin(ang) * (r + 14), 5 - k, GOLD, 200);
  }
  save(img, `aura_ring_${k + 1}.png`);
}

// ── 7. RAIOS ELÉTRICOS (3 frames) ────────────────────────────────
for (let k = 0; k < 3; k++) {
  const img = canvas(80, 128);
  const rand = rng(7 + k * 131);
  let x = 40; const pts = [[x, 4]];
  for (let y = 4; y <= 124; y += 15) { x += (rand() - 0.5) * 52; x = Math.max(14, Math.min(66, x)); pts.push([x, y]); }
  for (let i = 0; i < pts.length - 1; i++) {
    thickLine(img, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 11, CYAN2, 90);
    thickLine(img, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 5, CYAN, 255);
    thickLine(img, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 2, WHITE, 255);
  }
  // ramificação
  const b = pts[2 + k % 2];
  thickLine(img, b[0], b[1], b[0] + (k % 2 ? 22 : -22), b[1] + 24, 3, CYAN, 220);
  save(img, `electric_bolt_${k + 1}.png`);
}

// ── 8. CORAÇÃO DO BEIJO (3 frames) ───────────────────────────────
for (let k = 0; k < 3; k++) {
  const img = canvas(192, 160);
  const s = 40 + [0, 7, 2][k];
  // aura externa pulsante
  fillCircle(img, 96, 84, s * 1.55, PINK, 55 + k * 18);
  fillCircle(img, 96, 84, s * 1.25, PINK, 75);
  heart(img, 96, 82, s, PINK, 255);
  heart(img, 96, 80, s * 0.82, PINK2, 255);
  heart(img, 96 - s * 0.22, 78, s * 0.3, hex('#ffffff'), 210);
  // faíscas de amor
  for (let h = 0; h < 5; h++) {
    const ang = h / 5 * Math.PI * 2 + k;
    fillCircle(img, 96 + Math.cos(ang) * (s * 1.7), 84 + Math.sin(ang) * (s * 1.7), 3, PINK2, 210);
  }
  save(img, `beijo_${k + 1}.png`);
}

// ── 9. CACHORRO DE AURA CORRENDO (3 frames) ──────────────────────
for (let k = 0; k < 3; k++) {
  const img = canvas(320, 160);
  const cy = 78;
  const ph = k / 3 * Math.PI * 2;
  // linhas de velocidade
  for (let l = 0; l < 4; l++) fillRect(img, 8 + l * 12, cy - 26 + l * 12, 46 - l * 6, 4, BLUE2, 120);
  // patas (ciclo de corrida: 4 pernas em fases)
  const legs = [[120, 0], [140, Math.PI], [195, Math.PI * 0.6], [215, Math.PI * 1.6]];
  for (const [lx, off] of legs) {
    const swing = Math.sin(ph + off) * 26;
    const lift = Math.abs(Math.cos(ph + off)) * 12;
    thickLine(img, lx, cy + 22, lx + swing, cy + 54 - lift, 13, BLUE, 255);
    fillCircle(img, lx + swing, cy + 54 - lift, 7, BLUE2, 255);
  }
  // corpo
  fillEllipse(img, 170, cy, 96, 34, BLUE, 255);
  fillEllipse(img, 165, cy + 8, 80, 22, BLUE2, 200);
  // peito/pescoço + cabeça
  fillEllipse(img, 250, cy - 16, 34, 26, BLUE, 255);
  fillCircle(img, 272, cy - 30, 24, BLUE, 255);
  fillEllipse(img, 296, cy - 24, 18, 11, BLUE, 255);   // focinho
  fillCircle(img, 304, cy - 26, 4, WHITE, 255);         // nariz
  fillCircle(img, 278, cy - 36, 5, WHITE, 255);         // olho brilho
  fillEllipse(img, 260, cy - 44, 8, 13, BLUE, 255);     // orelha (deitada para trás)
  fillEllipse(img, 248, cy - 42, 6, 10, BLUE2, 200);    // orelha interna
  fillEllipse(img, 90, cy - 6, 30, 14, BLUE2, 120);
  fillEllipse(img, 52, cy - 2, 18, 9, BLUE2, 70);
  save(img, `dog_run_${k + 1}.png`);
}

// ── 10. FUMAÇA DE VAPE ───────────────────────────────────────────
{
  const img = canvas(64, 64);
  fillCircle(img, 32, 36, 18, SMOKE, 170);
  fillCircle(img, 22, 30, 12, hex('#ffffff'), 150);
  fillCircle(img, 42, 26, 10, SMOKE, 140);
  save(img, 'vape_puff.png');
}

// ── 11. TORCIDA ANIMADA (2 frames) ───────────────────────────────
for (let k = 0; k < 2; k++) {
  const img = canvas(384, 128);
  const rand = rng(42);
  for (let i = 0; i < 9; i++) {
    const cx = 22 + i * 42 + (rand() - 0.5) * 10;
    const bob = ((i + k) % 2) * 5;
    const cy = 84 - bob + rand() * 4;
    const r = 13 + rand() * 4;
    fillCircle(img, cx, cy, r, DARK, 255);                     // cabeça
    fillEllipse(img, cx, cy + r + 12, r + 9, 16, DARK, 255);   // ombros
    fillEllipse(img, cx - 3, cy - 4, r * 0.55, r * 0.4, RIM, 190); // brilho da luz no topo
  }
  // braços levantados em frame de vibração
  if (k === 1) for (let i = 0; i < 4; i++) {
    const cx = 40 + i * 96;
    fillRect(img, cx - 3, 42, 6, 26, DARK, 255);
    fillCircle(img, cx, 40, 5, RIM, 220);
  }
  save(img, `crowd_${k + 1}.png`);
}

// ── 12. LETREIRO NEON PISCANDO (2 frames) ────────────────────────
for (let k = 0; k < 2; k++) {
  const img = canvas(256, 96);
  const on = k === 0;
  const frameC = on ? NEON_G : NEON_OFF;
  const textC = on ? CYAN : NEON_OFF;
  // moldura com cantos arredondados + halo
  ring(img, 128, 48, 0, 0, frameC, 0); // no-op p/ manter estilo
  for (let y = 8; y < 88; y++) for (let x = 8; x < 248; x++) {
    const edge = x < 14 || x > 241 || y < 14 || y > 81;
    if (edge) {
      const halo = x < 8 || x > 247 || y < 8 || y > 87;
      if (halo) blend(img, x, y, frameC, on ? 70 : 25);
      else blend(img, x, y, frameC, 255);
    }
  }
  // "texto" do letreiro: barras cianas (estilo open sign)
  fillRect(img, 34, 32, 84, 12, textC, on ? 255 : 130);
  fillRect(img, 34, 54, 62, 12, textC, on ? 255 : 110);
  fillCircle(img, 160, 49, 22, on ? PINK : NEON_OFF, on ? 235 : 120);   // coração do letreiro
  fillCircle(img, 160, 49, 13, on ? PINK2 : NEON_OFF, on ? 255 : 100);
  // suportes
  fillRect(img, 60, 0, 5, 8, STEEL, 255); fillRect(img, 190, 0, 5, 8, STEEL, 255);
  save(img, `neon_open_${k + 1}.png`);
}

console.log('pacote VFX completo gerado!');
