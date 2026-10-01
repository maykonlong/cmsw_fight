const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function processImage(inputFile, outputFile) {
    if (!fs.existsSync(inputFile)) {
        console.log(`Arquivo não encontrado: ${inputFile}`);
        return;
    }
    console.log(`Processando ${path.basename(inputFile)}...`);
    const image = await Jimp.read(inputFile);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        // Vamos checar fundo branco (r>220, g>220, b>220), verde (r<50, g>200, b<50) ou magenta (r>180, g<80, b>180)
        if ((r > 220 && g > 220 && b > 220) || (r < 100 && g > 150 && b < 100) || (r > 180 && g < 80 && b > 180)) {
            this.bitmap.data[idx + 3] = 0;
        }
    });

    const dir = path.dirname(outputFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await image.write(outputFile);
    console.log(`✅ Salvo: ${outputFile}`);
}

const args = process.argv.slice(2);
if (args.length === 2) {
    processImage(args[0], args[1]).catch(console.error);
} else {
    console.log("Uso: node remove_green.js <input.png> <output.png>");
}
