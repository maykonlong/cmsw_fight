const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const ARTIFACTS = "C:\\Users\\MaykonSilva\\.gemini\\antigravity-ide\\brain\\4dfb1b37-41a0-43d1-9ba9-9978ae653a21";
const SPRITES = "C:\\Users\\MaykonSilva\\OneDrive - C&M SOFTWARE LICENCIAMENTO DE SISTEMAS LTDA\\Área de Trabalho\\Arquivos Gerais\\Automações\\cmsw_figth\\game\\public\\assets\\sprites";

async function processCharacter(inputFile, outputFile) {
    console.log(`Processando ${path.basename(inputFile)}...`);
    const image = await Jimp.read(inputFile);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        // Remove fundo branco puro e próximo de branco
        if (r > 220 && g > 220 && b > 220) {
            this.bitmap.data[idx + 3] = 0;
        }
    });

    await image.write(outputFile);
    console.log(`✅ ${path.basename(outputFile)}`);
}

async function copyFile(src, dst) {
    fs.copyFileSync(src, dst);
    console.log(`✅ Background copiado: ${path.basename(dst)}`);
}

async function run() {
    await processCharacter(
        path.join(ARTIFACTS, "kevin_character_art_1790799967541.png"),
        path.join(SPRITES, "kevin.png")
    );
    await processCharacter(
        path.join(ARTIFACTS, "vini_dog_character_art_1790799977174.png"),
        path.join(SPRITES, "vini_dog.png")
    );
    await copyFile(
        path.join(ARTIFACTS, "stage_cmsw_animated_1790799958557.png"),
        path.join(SPRITES, "stage_bg.png")
    );
    console.log("\n🎮 Todos os assets prontos!");
}

run().catch(console.error);
