import { Jimp } from 'jimp';
import path from 'path';

const kevinPath = `c:\\Users\\MaykonSilva\\OneDrive - C&M SOFTWARE LICENCIAMENTO DE SISTEMAS LTDA\\Área de Trabalho\\Arquivos Gerais\\Automações\\cmsw_figth\\imagens_ref\\personagens_ref\\Kevin\\Kevin_1.jpeg`;
const viniPath = `c:\\Users\\MaykonSilva\\OneDrive - C&M SOFTWARE LICENCIAMENTO DE SISTEMAS LTDA\\Área de Trabalho\\Arquivos Gerais\\Automações\\cmsw_figth\\imagens_ref\\personagens_ref\\Vini_dog\\Vini_dog_1.jpeg`;
const outDir = `c:\\Users\\MaykonSilva\\OneDrive - C&M SOFTWARE LICENCIAMENTO DE SISTEMAS LTDA\\Área de Trabalho\\Arquivos Gerais\\Automações\\cmsw_figth\\game\\public\\assets\\sprites`;

async function processKevin() {
    const img = await Jimp.read(kevinPath);
    const w = img.bitmap.width;
    const h = img.bitmap.height;

    console.log(`Processing Kevin real reference photo (${w}x${h})...`);

    img.scan(0, 0, w, h, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];

        // Green turf grass / fence background detection
        const isGreenTurf = (g > r + 8 && g > b + 8 && g > 50);
        const isFenceGrid = (Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && 80 < r && r < 180 && (x < w * 0.25 || x > w * 0.75 || y < h * 0.28 || y > h * 0.88));
        const isTopCornerBg = (y < h * 0.35 && (x < w * 0.22 || x > w * 0.78) && (isGreenTurf || isFenceGrid || r < 100));

        if (isGreenTurf || isTopCornerBg || (isFenceGrid && (x < w * 0.2 || x > w * 0.8))) {
            this.bitmap.data[idx + 3] = 0; // Transparent
        }
    });

    const files = ['kevin.png', 'kevin_idle.png', 'kevin_punch.png', 'kevin_kick.png'];
    for (const file of files) {
        await img.write(path.join(outDir, file));
        console.log(`✅ Saved transparent Kevin reference photo sprite to ${file}`);
    }
}

async function processVini() {
    const img = await Jimp.read(viniPath);
    const w = img.bitmap.width;
    const h = img.bitmap.height;

    console.log(`Processing Vini Dog real reference photo (${w}x${h})...`);

    img.scan(0, 0, w, h, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];

        // Brick wall red/brown tones & white concrete ledge below
        const isBrick = (r > 80 && g < 160 && b < 135 && (r - g) > 5);
        const isLedge = (y > h * 0.72 && r > 150 && g > 150 && b > 150);
        const isMortar = (y < h * 0.72 && (x < w * 0.24 || x > w * 0.76) && Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && r > 110);

        if (isBrick || isLedge || isMortar) {
            this.bitmap.data[idx + 3] = 0; // Transparent
        }
    });

    const files = ['vini_dog.png', 'vini_dog_idle.png', 'vini_dog_punch.png', 'vini_dog_win.png'];
    for (const file of files) {
        await img.write(path.join(outDir, file));
        console.log(`✅ Saved transparent Vini Dog reference photo sprite to ${file}`);
    }
}

async function main() {
    await processKevin();
    await processVini();
    console.log('🎉 ALL REAL REFERENCE PHOTO CHARACTER SPRITES PROCESSED SUCCESSFULLY!');
}

main().catch(err => console.error(err));
