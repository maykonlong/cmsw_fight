const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const poses = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'special', 'hit', 'ko', 'win'];
const outputDir = path.resolve(__dirname, '../game/public/assets/sprites');

async function splitCharacter(character, source) {
    const image = await Jimp.read(source);
    const cellWidth = Math.floor(image.bitmap.width / poses.length);

    for (let index = 0; index < poses.length; index++) {
        const x = index * cellWidth;
        const width = index === poses.length - 1 ? image.bitmap.width - x : cellWidth;
        const frame = image.clone().crop({ x, y: 0, w: width, h: image.bitmap.height });
        const target = path.join(outputDir, `${character}_${poses[index]}.png`);
        await frame.write(target);
        console.log(`created ${target}`);
    }
}

async function main() {
    const [kevinSheet, viniSheet] = process.argv.slice(2);
    if (!kevinSheet || !viniSheet) {
        throw new Error('Usage: node split_generated_sheets.js <kevin-sheet.png> <vini-sheet.png>');
    }
    fs.mkdirSync(outputDir, { recursive: true });
    await splitCharacter('kevin', kevinSheet);
    await splitCharacter('vini_dog', viniSheet);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
