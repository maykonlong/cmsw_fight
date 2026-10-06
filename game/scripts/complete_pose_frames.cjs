/**
 * Gera os frames _3 e _4 que faltam para poses que só têm base + _2.
 *
 * Motivo: o AttackState anima cada golpe em 4 frames (getPoseName), mas as
 * poses expandidas (socos E/D, chutes E/D, voadoras) foram geradas apenas com
 * 2 frames. Sem _3/_4, o Phaser caía no fallback "idle" durante a fase ativa
 * do golpe — o lutador mostrava a pose parado no meio do soco.
 *
 * Regras:
 *   _3 (fase ativa)  = cópia do frame _2 (mantém a extensão)
 *   _4 (recuperação) = cópia do frame base (volta à posição inicial)
 *
 * Uso: node scripts/complete_pose_frames.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const spritesDir = path.join(__dirname, '../public/assets/sprites');
const characters = ['kevin', 'kevin_p2', 'vini_dog', 'vini_dog_p2'];

// Poses expandidas que hoje possuem apenas os frames base e _2.
const twoFramePoses = ['punch_l', 'punch_r', 'kick_l', 'kick_r', 'air_kick_up', 'air_kick_diag'];

let created = 0;
for (const charId of characters) {
    for (const pose of twoFramePoses) {
        const frame1 = path.join(spritesDir, `${charId}_${pose}.png`);
        const frame2 = path.join(spritesDir, `${charId}_${pose}_2.png`);
        const frame3 = path.join(spritesDir, `${charId}_${pose}_3.png`);
        const frame4 = path.join(spritesDir, `${charId}_${pose}_4.png`);

        if (!fs.existsSync(frame1) || !fs.existsSync(frame2)) {
            console.warn(`⚠️  Pulando ${charId}_${pose}: frames base auscentes.`);
            continue;
        }

        if (!fs.existsSync(frame3)) {
            fs.copyFileSync(frame2, frame3);
            created++;
        }
        if (!fs.existsSync(frame4)) {
            fs.copyFileSync(frame1, frame4);
            created++;
        }
    }
}

console.log(`✅ ${created} frames de recuperação/ativa criados (poses agora animam em 4 frames).`);
