const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const directory = path.resolve(__dirname, '../public/assets/sprites');
const poses = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'special', 'hit', 'ko', 'win'];

for (const character of ['kevin', 'vini_dog']) {
    for (const pose of poses) {
        const file = path.join(directory, `${character}_${pose}.png`);
        const png = PNG.sync.read(fs.readFileSync(file));
        const { width, height, data } = png;
        const labels = new Int32Array(width * height);
        const sizes = [0];
        let label = 0;

        for (let start = 0; start < labels.length; start++) {
            if (labels[start] || data[start * 4 + 3] < 32) continue;
            label++;
            const queue = [start];
            labels[start] = label;
            for (let head = 0; head < queue.length; head++) {
                const index = queue[head];
                const x = index % width;
                const y = Math.floor(index / width);
                for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                    const next = ny * width + nx;
                    if (labels[next] || data[next * 4 + 3] < 32) continue;
                    labels[next] = label;
                    queue.push(next);
                }
            }
            sizes[label] = queue.length;
        }

        const largest = sizes.indexOf(Math.max(...sizes));
        for (let index = 0; index < labels.length; index++) {
            if (labels[index] !== largest) data[index * 4 + 3] = 0;
        }
        console.log(`${character}_${pose}: kept ${sizes[largest]} pixels; removed ${sizes.slice(1).reduce((sum, size, index) => sum + (index + 1 === largest ? 0 : size), 0)}`);
        fs.writeFileSync(file, PNG.sync.write(png));
    }
}
