const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const poses = [
    'idle', 'walk', 'jump', 'air_punch', 'air_kick', 'crouch',
    'crouch_punch', 'sweep', 'block', 'punch', 'kick', 'special',
    'hit', 'ko', 'win',
];
const root = path.resolve(__dirname, '../public/assets/sprites');
let checked = 0;

for (const fighter of ['kevin', 'vini_dog']) {
    for (const pose of poses) {
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
