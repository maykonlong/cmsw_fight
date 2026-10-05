const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const spritesDir = path.join(__dirname, '../public/assets/sprites');
const poses = ['idle', 'walk', 'jump', 'air_punch', 'air_kick', 'crouch', 'crouch_punch', 'sweep', 'block', 'punch', 'kick', 'special', 'hit', 'ko', 'win'];

function shiftColors(png, fighterId) {
    const output = new PNG({ width: png.width, height: png.height });
    for (let i = 0; i < png.data.length; i += 4) {
        let r = png.data[i];
        let g = png.data[i + 1];
        let b = png.data[i + 2];
        const a = png.data[i + 3];

        if (a > 15) {
            if (fighterId === 'kevin') {
                // Shift blue/denim clothing to Crimson / Red
                if (b > r + 15 && b > g) {
                    const temp = b;
                    b = g;
                    g = r;
                    r = temp;
                }
            } else if (fighterId === 'vini_dog') {
                // Shift red shirt/cap to Emerald Green
                if (r > g + 20 && r > b + 20) {
                    const temp = r;
                    r = b;
                    b = g;
                    g = temp;
                }
            }
        }

        output.data[i] = r;
        output.data[i + 1] = g;
        output.data[i + 2] = b;
        output.data[i + 3] = a;
    }
    return output;
}

let count = 0;
for (const fighter of ['kevin', 'vini_dog']) {
    for (const pose of poses) {
        const srcFile = path.join(spritesDir, `${fighter}_${pose}.png`);
        if (!fs.existsSync(srcFile)) continue;

        const png = PNG.sync.read(fs.readFileSync(srcFile));
        const p2Png = shiftColors(png, fighter);
        const dstFile = path.join(spritesDir, `${fighter}_p2_${pose}.png`);
        fs.writeFileSync(dstFile, PNG.sync.write(p2Png));
        count++;
    }
}

console.log(`✅ Geradas ${count} sprites P2 com sucesso!`);
