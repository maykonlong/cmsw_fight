// Packs one complete pose into a shared 500x520 canvas. The fighter's feet
// always end at y=500, while compact jump/crouch poses retain their silhouette.
const fs = require('node:fs');
const { PNG } = require('pngjs');

const [sourcePath, targetPath, heightArg = '390', anchorArg = '0.5'] = process.argv.slice(2);
if (!sourcePath || !targetPath) {
    throw new Error('Usage: node normalize_fighter_pose.cjs SOURCE TARGET HEIGHT [ANCHOR_RATIO]');
}

const source = PNG.sync.read(fs.readFileSync(sourcePath));
let left = source.width, top = source.height, right = -1, bottom = -1;
for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
        if (source.data[(y * source.width + x) * 4 + 3] < 20) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
}
if (right < left) throw new Error('Source has no visible pixels');

const sourceWidth = right - left + 1;
const sourceHeight = bottom - top + 1;
const targetHeight = Number(heightArg);
const anchorRatio = Number(anchorArg);
const scale = Math.min(targetHeight / sourceHeight, 480 / sourceWidth);
const drawWidth = Math.round(sourceWidth * scale);
const drawHeight = Math.round(sourceHeight * scale);
const output = new PNG({ width: 500, height: 520 });
const offsetX = Math.max(10, Math.min(490 - drawWidth, Math.round(250 - drawWidth * anchorRatio)));
const offsetY = 500 - drawHeight;

for (let y = 0; y < drawHeight; y++) {
    for (let x = 0; x < drawWidth; x++) {
        const sourceX = left + Math.min(sourceWidth - 1, Math.floor(x / scale));
        const sourceY = top + Math.min(sourceHeight - 1, Math.floor(y / scale));
        const from = (sourceY * source.width + sourceX) * 4;
        const to = ((offsetY + y) * output.width + offsetX + x) * 4;
        source.data.copy(output.data, to, from, from + 4);
    }
}

fs.writeFileSync(targetPath, PNG.sync.write(output));
console.log(`${targetPath}: ${drawWidth}x${drawHeight} at ${offsetX},${offsetY}`);
