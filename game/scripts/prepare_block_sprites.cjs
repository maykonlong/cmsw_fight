const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const sources = process.argv.slice(2);
if (sources.length !== 2) throw new Error('Pass the Kevin and Vini source PNG paths.');

for (const [index, character] of ['kevin', 'vini_dog'].entries()) {
    const source = PNG.sync.read(fs.readFileSync(sources[index]));
    let left = source.width, top = source.height, right = 0, bottom = 0;
    for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
        if (source.data[(y * source.width + x) * 4 + 3] < 20) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    const sourceWidth = right - left + 1;
    const sourceHeight = bottom - top + 1;
    const scale = Math.min(205 / sourceWidth, 410 / sourceHeight);
    const drawWidth = Math.round(sourceWidth * scale);
    const drawHeight = Math.round(sourceHeight * scale);
    const output = new PNG({ width: 217, height: 520 });
    const offsetX = Math.floor((217 - drawWidth) / 2);
    const offsetY = 500 - drawHeight;

    for (let y = 0; y < drawHeight; y++) for (let x = 0; x < drawWidth; x++) {
        const sourceX = left + Math.min(sourceWidth - 1, Math.floor(x / scale));
        const sourceY = top + Math.min(sourceHeight - 1, Math.floor(y / scale));
        const from = (sourceY * source.width + sourceX) * 4;
        const to = ((offsetY + y) * output.width + offsetX + x) * 4;
        source.data.copy(output.data, to, from, from + 4);
    }
    const target = path.resolve(__dirname, `../public/assets/sprites/${character}_block.png`);
    fs.writeFileSync(target, PNG.sync.write(output));
    console.log(target);
}
