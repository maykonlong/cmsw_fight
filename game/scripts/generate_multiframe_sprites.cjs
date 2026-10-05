const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const spritesDir = path.join(__dirname, '../public/assets/sprites');
const actionPoses = ['punch', 'kick', 'crouch_punch', 'sweep', 'air_punch', 'air_kick', 'special', 'walk'];

function createActiveFrame(png, poseType) {
    const output = new PNG({ width: png.width, height: png.height });
    // Offset leve para enfatizar a extensão do golpe
    const shiftX = (poseType === 'punch' || poseType === 'crouch_punch' || poseType === 'special') ? 8 : (poseType === 'kick' || poseType === 'sweep') ? 12 : 0;
    const shiftY = poseType === 'walk' ? -4 : 0;

    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            const srcX = Math.max(0, Math.min(png.width - 1, x - shiftX));
            const srcY = Math.max(0, Math.min(png.height - 1, y - shiftY));
            const from = (srcY * png.width + srcX) * 4;
            const to = (y * output.width + x) * 4;

            output.data[to] = png.data[from];
            output.data[to + 1] = png.data[from + 1];
            output.data[to + 2] = png.data[from + 2];
            output.data[to + 3] = png.data[from + 3];
        }
    }
    return output;
}

let count = 0;
const characters = ['kevin', 'kevin_p2', 'vini_dog', 'vini_dog_p2'];

for (const charId of characters) {
    for (const pose of actionPoses) {
        const srcFile = path.join(spritesDir, `${charId}_${pose}.png`);
        if (!fs.existsSync(srcFile)) continue;

        const png = PNG.sync.read(fs.readFileSync(srcFile));
        const activePng = createActiveFrame(png, pose);
        const dstFile = path.join(spritesDir, `${charId}_${pose}_2.png`);
        fs.writeFileSync(dstFile, PNG.sync.write(activePng));
        count++;
    }
}

console.log(`✅ Geradas ${count} sprites de segundo frame (_2) da Fase 2 com sucesso!`);
