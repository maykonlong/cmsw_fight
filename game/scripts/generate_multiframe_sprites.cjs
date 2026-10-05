const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const spritesDir = path.join(__dirname, '../public/assets/sprites');
const actionPoses = ['punch', 'kick', 'crouch_punch', 'sweep', 'air_punch', 'air_kick', 'special', 'walk'];

function createActiveFrame(png, poseType, variant = 2) {
    const output = new PNG({ width: png.width, height: png.height });
    let shiftX = 0;
    let shiftY = 0;

    if (poseType === 'punch' || poseType === 'crouch_punch' || poseType === 'special') {
        shiftX = 8;
    } else if (poseType === 'kick' || poseType === 'sweep') {
        shiftX = 12;
    } else if (poseType === 'walk') {
        if (variant === 2) {
            shiftX = 4;
            shiftY = -4;
        } else if (variant === 3) {
            shiftX = -4;
            shiftY = 2;
        }
    }

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
        
        const activePng2 = createActiveFrame(png, pose, 2);
        const dstFile2 = path.join(spritesDir, `${charId}_${pose}_2.png`);
        fs.writeFileSync(dstFile2, PNG.sync.write(activePng2));
        count++;

        if (pose === 'walk') {
            const activePng3 = createActiveFrame(png, pose, 3);
            const dstFile3 = path.join(spritesDir, `${charId}_walk_3.png`);
            fs.writeFileSync(dstFile3, PNG.sync.write(activePng3));
            count++;

            const backPng = createActiveFrame(png, pose, 3);
            const dstFileBack = path.join(spritesDir, `${charId}_walk_back.png`);
            fs.writeFileSync(dstFileBack, PNG.sync.write(backPng));
            count++;
        }
    }
}

console.log(`✅ Geradas ${count} sprites de frames multiframe de caminhada e combate!`);
