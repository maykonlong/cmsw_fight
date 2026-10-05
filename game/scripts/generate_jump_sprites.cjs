const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const spritesDir = path.join(__dirname, '../public/assets/sprites');
const characters = ['kevin', 'kevin_p2', 'vini_dog', 'vini_dog_p2'];

function createJumpFrame(png, stage) {
    const output = new PNG({ width: png.width, height: png.height });
    
    // Stage 1: Crouch Launch (compress Y slightly)
    // Stage 2: Apex Spin (standard/elevated)
    // Stage 3: Descent (stretch Y slightly)
    const scaleY = stage === 1 ? 0.92 : stage === 3 ? 1.05 : 1.0;
    const offsetY = Math.round((png.height * (1 - scaleY)) / 2);

    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            const srcY = Math.max(0, Math.min(png.height - 1, Math.floor((y - offsetY) / scaleY)));
            const from = (srcY * png.width + x) * 4;
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
for (const charId of characters) {
    const srcFile = path.join(spritesDir, `${charId}_jump.png`);
    if (!fs.existsSync(srcFile)) continue;

    const png = PNG.sync.read(fs.readFileSync(srcFile));
    
    // Frame 1: Launch
    const j1 = createJumpFrame(png, 1);
    fs.writeFileSync(path.join(spritesDir, `${charId}_jump_1.png`), PNG.sync.write(j1));
    
    // Frame 2: Apex
    const j2 = createJumpFrame(png, 2);
    fs.writeFileSync(path.join(spritesDir, `${charId}_jump_2.png`), PNG.sync.write(j2));

    // Frame 3: Descent
    const j3 = createJumpFrame(png, 3);
    fs.writeFileSync(path.join(spritesDir, `${charId}_jump_3.png`), PNG.sync.write(j3));

    count += 3;
}

console.log(`✅ Geradas ${count} sprites de pulo fluido (jump_1, jump_2, jump_3) com sucesso!`);
