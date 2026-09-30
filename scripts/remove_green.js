const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = "C:\\Users\\MaykonSilva\\.gemini\\antigravity-ide\\brain\\4dfb1b37-41a0-43d1-9ba9-9978ae653a21";
const SPRITES_DIR = "C:\\Users\\MaykonSilva\\OneDrive - C&M SOFTWARE LICENCIAMENTO DE SISTEMAS LTDA\\Área de Trabalho\\Arquivos Gerais\\Automações\\cmsw_figth\\game\\public\\assets\\sprites";

async function removeWhiteBackground(inputPath, outputPath) {
    console.log(`Processando ${path.basename(inputPath)}...`);
    const image = await Jimp.read(inputPath);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        
        // Remove fundo branco e tons claros
        if (r > 230 && g > 230 && b > 230) {
            this.bitmap.data[idx + 3] = 0;
        }
        // Remove fundo verde (spritesheet antigo)
        if (g > 150 && r < 120 && b < 120) {
            this.bitmap.data[idx + 3] = 0;
        }
    });
    
    // Escala para tamanho adequado de lutador (200px de altura)
    image.resize({ w: 180, h: 300 });
    
    await image.write(outputPath);
    console.log(`✅ Salvo: ${path.basename(outputPath)}`);
}

async function copyBg(inputPath, outputPath) {
    fs.copyFileSync(inputPath, outputPath);
    console.log(`✅ Background copiado: ${path.basename(outputPath)}`);
}

async function run() {
    // Novos frames únicos (gerados agora)
    await removeWhiteBackground(
        path.join(ARTIFACTS_DIR, "kevin_idle_frame_1790799217598.png"),
        path.join(SPRITES_DIR, "kevin.png")
    );
    await removeWhiteBackground(
        path.join(ARTIFACTS_DIR, "vini_dog_idle_frame_1790799226659.png"),
        path.join(SPRITES_DIR, "vini_dog.png")
    );
    
    // Background do cenário
    await copyBg(
        path.join(ARTIFACTS_DIR, "stage_brazil_street_1790799207168.png"),
        path.join(SPRITES_DIR, "stage_bg.png")
    );
    
    console.log("\n🎮 Todos os assets processados com sucesso!");
}

run().catch(console.error);
