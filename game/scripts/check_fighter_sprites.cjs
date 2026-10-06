const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

// Lista mestre de poses carregadas pelo BootScene.
// Manter em sincronia com src/scenes/BootScene.ts.
const poses = [
    'idle', 'walk', 'walk_2', 'walk_3', 'walk_back', 'run_1', 'run_2', 'run_3', 'run_back_1', 'run_back_2', 'run_back_3',
    'jump', 'jump_1', 'jump_2', 'jump_3',
    'air_punch', 'air_punch_2', 'air_punch_3', 'air_punch_4',
    'air_kick', 'air_kick_2', 'air_kick_3', 'air_kick_4',
    'air_kick_up', 'air_kick_up_2', 'air_kick_up_3', 'air_kick_up_4',
    'air_kick_diag', 'air_kick_diag_2', 'air_kick_diag_3', 'air_kick_diag_4',
    'crouch', 'crouch_punch', 'crouch_punch_2', 'crouch_punch_3', 'crouch_punch_4',
    'sweep', 'sweep_2', 'sweep_3', 'sweep_4',
    'block',
    'punch', 'punch_2', 'punch_3', 'punch_4',
    'punch_l', 'punch_l_2', 'punch_l_3', 'punch_l_4',
    'punch_r', 'punch_r_2', 'punch_r_3', 'punch_r_4',
    'kick', 'kick_2', 'kick_3', 'kick_4',
    'kick_l', 'kick_l_2', 'kick_l_3', 'kick_l_4',
    'kick_r', 'kick_r_2', 'kick_r_3', 'kick_r_4',
    'special', 'special_2', 'special_3', 'special_4',
    'throw', 'throw_2', 'thrown',
    'hit', 'ko', 'win',
];

// Poses com arte "crua" validada quanto a dimensão e margens de segurança.
const qualityPoses = [
    'idle', 'walk', 'jump', 'air_punch', 'air_kick', 'crouch',
    'crouch_punch', 'sweep', 'block', 'punch', 'kick', 'special',
    'hit', 'ko', 'win',
];
const characters = ['kevin', 'kevin_p2', 'vini_dog', 'vini_dog_p2'];
const base = ['kevin', 'vini_dog', 'kevin_p2', 'vini_dog_p2'];
const root = path.resolve(__dirname, '../public/assets/sprites');
let checked = 0;

// 1) Completude — evita 404 no boot e fallback visual para "idle" durante golpes.
const missing = [];
for (const fighter of characters) {
    for (const pose of poses) {
        if (!fs.existsSync(path.join(root, `${fighter}_${pose}.png`))) {
            missing.push(`${fighter}_${pose}.png`);
        }
    }
}
for (const base of ['kevin', 'vini_dog']) {
    if (!fs.existsSync(path.join(root, `${base}.png`))) {
        missing.push(`${base}.png`);
    }
}
if (missing.length > 0) {
    throw new Error(
        `Sprites faltando (${missing.length}):\n  ${missing.join('\n  ')}\n` +
        `Dica: rode "npm run generate:pose-frames" para criar os frames _3/_4 herdados dos frames existentes.`
    );
}

// 2) Qualidade — poses base dos lutadores em 500x520 com margem de segurança.
for (const fighter of ['kevin', 'vini_dog']) {
    for (const pose of qualityPoses) {
        const filename = `${fighter}_${pose}.png`;
        const png = PNG.sync.read(fs.readFileSync(path.join(root, filename)));
        if (png.width !== 500 || png.height !== 520) {
            throw new Error(`${filename}: expected 500x520, got ${png.width}x${png.height}`);
        }
        let left = png.width, right = -1, top = png.height, bottom = -1;
        for (let y = 0; y < png.height; y++) {
            for (let x = 0; x < png.width; x++) {
                if (png.data[(y * png.width + x) * 4 + 3] < 20) continue;
                left = Math.min(left, x); right = Math.max(right, x);
                top = Math.min(top, y); bottom = Math.max(bottom, y);
            }
        }
        if (right < left || left < 8 || right > 491 || top < 8 || bottom > 505) {
            throw new Error(`${filename}: artwork is empty or touches a canvas edge (${left},${top})-(${right},${bottom})`);
        }
        checked++;
    }
}
console.log(`${checked} fighter poses have complete, padded 500x520 frames.`);
