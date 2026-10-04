const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const sprites = path.resolve(__dirname, '../public/assets/sprites');
const poses = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'special', 'hit', 'ko', 'win'];
const settings = [
    { character: 'kevin', cropTop: 95 },
    { character: 'vini_dog', cropTop: 127 },
];
const height = 520;

for (const { character, cropTop } of settings) {
    for (const pose of poses) {
        const file = path.join(sprites, `${character}_${pose}.png`);
        const source = PNG.sync.read(fs.readFileSync(file));
        if (source.height === height) continue;
        if (source.height < cropTop + height) throw new Error(`Unexpected sprite dimensions: ${file}`);
        const result = new PNG({ width: source.width, height });
        for (let y = 0; y < height; y++) {
            const start = ((y + cropTop) * source.width) * 4;
            source.data.copy(result.data, y * source.width * 4, start, start + source.width * 4);
        }
        fs.writeFileSync(file, PNG.sync.write(result));
    }
}
