const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const spritesDir = path.join(__dirname, '../public/assets/sprites');
const characters = ['kevin', 'kevin_p2', 'vini_dog', 'vini_dog_p2'];

/**
 * Aplica transformações geométricas puras na PNG mantendo a transparência.
 */
function transformSprite(srcPng, options = {}) {
    const scaleX = options.scaleX ?? 1.0;
    const scaleY = options.scaleY ?? 1.0;
    const shiftX = options.shiftX ?? 0;
    const shiftY = options.shiftY ?? 0;
    const skewX = options.skewX ?? 0.0;

    const out = new PNG({ width: srcPng.width, height: srcPng.height });

    const cx = srcPng.width / 2;
    const cy = srcPng.height / 2;

    for (let y = 0; y < srcPng.height; y++) {
        for (let x = 0; x < srcPng.width; x++) {
            // Transformação reversa para amostragem limpa
            const dx = x - cx - shiftX;
            const dy = y - cy - shiftY;

            const srcX = Math.round(cx + (dx - dy * skewX) / scaleX);
            const srcY = Math.round(cy + dy / scaleY);

            if (srcX >= 0 && srcX < srcPng.width && srcY >= 0 && srcY < srcPng.height) {
                const fromIndex = (srcY * srcPng.width + srcX) * 4;
                const toIndex = (y * out.width + x) * 4;

                out.data[toIndex] = srcPng.data[fromIndex];
                out.data[toIndex + 1] = srcPng.data[fromIndex + 1];
                out.data[toIndex + 2] = srcPng.data[fromIndex + 2];
                out.data[toIndex + 3] = srcPng.data[fromIndex + 3];
            }
        }
    }
    return out;
}

let generatedCount = 0;

for (const charId of characters) {
    const basePunchPath = path.join(spritesDir, `${charId}_punch.png`);
    const baseKickPath = path.join(spritesDir, `${charId}_kick.png`);
    const baseAirKickPath = path.join(spritesDir, `${charId}_air_kick.png`);
    const baseIdlePath = path.join(spritesDir, `${charId}_idle.png`);

    if (!fs.existsSync(basePunchPath) || !fs.existsSync(baseKickPath) || !fs.existsSync(baseIdlePath)) {
        continue;
    }

    const punchPng = PNG.sync.read(fs.readFileSync(basePunchPath));
    const kickPng = PNG.sync.read(fs.readFileSync(baseKickPath));
    const airKickPng = fs.existsSync(baseAirKickPath) ? PNG.sync.read(fs.readFileSync(baseAirKickPath)) : kickPng;
    const idlePng = PNG.sync.read(fs.readFileSync(baseIdlePath));

    // 1. Soco Esquerdo Leve (punch_l & punch_l_2)
    const punchL1 = transformSprite(punchPng, { scaleX: 0.94, shiftX: 12, shiftY: 4 });
    const punchL2 = transformSprite(punchPng, { scaleX: 1.05, shiftX: 25, shiftY: -2, skewX: 0.05 });

    // 2. Soco Direito Forte (punch_r & punch_r_2)
    const punchR1 = transformSprite(punchPng, { scaleX: 1.10, shiftX: 35, shiftY: -6, skewX: -0.08 });
    const punchR2 = transformSprite(punchPng, { scaleX: 1.20, shiftX: 50, shiftY: -10, skewX: -0.12 });

    // 3. Chute Esquerdo Leve (kick_l & kick_l_2)
    const kickL1 = transformSprite(kickPng, { scaleX: 0.92, shiftX: 15, shiftY: 10 });
    const kickL2 = transformSprite(kickPng, { scaleX: 1.04, shiftX: 30, shiftY: 5, skewX: 0.06 });

    // 4. Chute Direito Forte (kick_r & kick_r_2)
    const kickR1 = transformSprite(kickPng, { scaleX: 1.12, shiftX: 40, shiftY: -12, skewX: -0.10 });
    const kickR2 = transformSprite(kickPng, { scaleX: 1.25, shiftX: 58, shiftY: -18, skewX: -0.15 });

    // 5. Voadora Vertical (air_kick_up & air_kick_up_2)
    const airKickUp1 = transformSprite(airKickPng, { scaleY: 0.95, shiftY: -15 });
    const airKickUp2 = transformSprite(airKickPng, { scaleX: 1.12, scaleY: 1.08, shiftX: 20, shiftY: -25 });

    // 6. Voadora Diagonal (air_kick_diag & air_kick_diag_2)
    const airKickDiag1 = transformSprite(airKickPng, { scaleX: 1.15, shiftX: 35, shiftY: 12, skewX: -0.15 });
    const airKickDiag2 = transformSprite(airKickPng, { scaleX: 1.28, shiftX: 55, shiftY: 20, skewX: -0.22 });

    // 7. Agarrão (throw & throw_2)
    const throw1 = transformSprite(idlePng, { scaleX: 1.08, shiftX: 28, shiftY: -8, skewX: 0.10 });
    const throw2 = transformSprite(punchPng, { scaleX: 1.18, shiftX: 45, shiftY: -15, skewX: -0.14 });

    // 8. Sendo Agarrado (thrown)
    const thrown1 = transformSprite(idlePng, { scaleX: 0.90, scaleY: 0.92, shiftX: -30, shiftY: 25, skewX: 0.25 });

    // Salvar todas as sprites de forma aditiva
    const filesToSave = [
        [`${charId}_punch_l.png`, punchL1],
        [`${charId}_punch_l_2.png`, punchL2],
        [`${charId}_punch_r.png`, punchR1],
        [`${charId}_punch_r_2.png`, punchR2],
        [`${charId}_kick_l.png`, kickL1],
        [`${charId}_kick_l_2.png`, kickL2],
        [`${charId}_kick_r.png`, kickR1],
        [`${charId}_kick_r_2.png`, kickR2],
        [`${charId}_air_kick_up.png`, airKickUp1],
        [`${charId}_air_kick_up_2.png`, airKickUp2],
        [`${charId}_air_kick_diag.png`, airKickDiag1],
        [`${charId}_air_kick_diag_2.png`, airKickDiag2],
        [`${charId}_throw.png`, throw1],
        [`${charId}_throw_2.png`, throw2],
        [`${charId}_thrown.png`, thrown1],
    ];

    for (const [filename, pngData] of filesToSave) {
        fs.writeFileSync(path.join(spritesDir, filename), PNG.sync.write(pngData));
        generatedCount++;
    }
}

console.log(`✅ Geradas ${generatedCount} novas sprites de golpes expandidos (socos E/D, chutes E/D, voadoras V/D, agarrão) com sucesso!`);
