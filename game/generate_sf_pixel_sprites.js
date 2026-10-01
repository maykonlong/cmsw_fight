import { Jimp } from 'jimp';
import path from 'path';

const outDir = `c:\\Users\\MaykonSilva\\OneDrive - C&M SOFTWARE LICENCIAMENTO DE SISTEMAS LTDA\\Área de Trabalho\\Arquivos Gerais\\Automações\\cmsw_figth\\game\\public\\assets\\sprites`;

function drawRect(bitmap, rx, ry, rw, rh, r, g, b, a = 255) {
    for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) {
            if (x >= 0 && x < bitmap.width && y >= 0 && y < bitmap.height) {
                const idx = (bitmap.width * y + x) << 2;
                bitmap.data[idx + 0] = r;
                bitmap.data[idx + 1] = g;
                bitmap.data[idx + 2] = b;
                bitmap.data[idx + 3] = a;
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// GERADOR STREET FIGHTER PIXEL ART - KEVIN
// Homem Branco, Loiro, Regata Branca, Bermuda Escura
// ─────────────────────────────────────────────────────────────────
async function createKevinPose(pose) {
    const img = new Jimp({ width: 120, height: 180, color: 0x00000000 });
    const bm = img.bitmap;

    const skin = [255, 215, 180];
    const skinShadow = [210, 165, 130];
    const blonde = [255, 220, 40];
    const blondeShadow = [200, 165, 15];
    const whiteTop = [245, 245, 250];
    const whiteShadow = [190, 190, 210];
    const darkShorts = [25, 30, 45];
    const shoes = [240, 240, 245];

    if (pose === 'ko') {
        // Personagem caído no chão
        drawRect(bm, 10, 145, 90, 25, ...darkShorts);
        drawRect(bm, 25, 140, 60, 20, ...whiteTop);
        drawRect(bm, 75, 138, 25, 20, ...skin); // Rosto
        drawRect(bm, 82, 134, 18, 12, ...blonde); // Cabelo loiro no chão
        return img;
    }

    if (pose === 'hit') {
        // Animação sentindo o golpe (reculado)
        drawRect(bm, 30, 20, 24, 18, ...blonde);
        drawRect(bm, 28, 32, 28, 24, ...skin); // Rosto virado pra trás
        drawRect(bm, 24, 56, 36, 50, ...whiteTop); // Regata
        drawRect(bm, 22, 106, 40, 35, ...darkShorts);
        drawRect(bm, 20, 140, 14, 28, ...skin);
        drawRect(bm, 42, 140, 14, 28, ...skin);
        drawRect(bm, 16, 168, 20, 12, ...shoes);
        drawRect(bm, 40, 168, 20, 12, ...shoes);
        return img;
    }

    if (pose === 'crouch') {
        // Agachado em base de luta
        drawRect(bm, 48, 40, 24, 16, ...blonde);
        drawRect(bm, 46, 54, 28, 20, ...skin);
        drawRect(bm, 40, 74, 40, 40, ...whiteTop);
        drawRect(bm, 36, 114, 48, 35, ...darkShorts);
        drawRect(bm, 32, 148, 22, 18, ...shoes);
        drawRect(bm, 64, 148, 22, 18, ...shoes);
        return img;
    }

    if (pose === 'jump') {
        // No ar pulando
        drawRect(bm, 48, 10, 24, 18, ...blonde);
        drawRect(bm, 46, 26, 28, 22, ...skin);
        drawRect(bm, 40, 48, 40, 50, ...whiteTop);
        drawRect(bm, 38, 98, 44, 30, ...darkShorts);
        drawRect(bm, 32, 128, 16, 22, ...skin); // Joelhos dobrados
        drawRect(bm, 64, 128, 16, 22, ...skin);
        drawRect(bm, 28, 148, 22, 14, ...shoes);
        drawRect(bm, 64, 148, 22, 14, ...shoes);
        return img;
    }

    if (pose === 'walk') {
        // Avançando passo de luta
        drawRect(bm, 48, 12, 24, 18, ...blonde);
        drawRect(bm, 46, 28, 28, 22, ...skin);
        drawRect(bm, 40, 50, 40, 55, ...whiteTop);
        drawRect(bm, 38, 105, 44, 35, ...darkShorts);
        drawRect(bm, 32, 140, 16, 28, ...skin);
        drawRect(bm, 68, 140, 16, 28, ...skin);
        drawRect(bm, 26, 168, 22, 12, ...shoes);
        drawRect(bm, 68, 168, 22, 12, ...shoes);
        return img;
    }

    // Default Base (idle, punch, kick, special, win)
    drawRect(bm, 48, 12, 24, 18, ...blonde);
    drawRect(bm, 44, 18, 8, 12, ...blondeShadow);
    drawRect(bm, 46, 28, 28, 22, ...skin);
    drawRect(bm, 46, 46, 28, 6, ...skinShadow);
    drawRect(bm, 54, 36, 4, 4, 30, 30, 40);
    drawRect(bm, 64, 36, 4, 4, 30, 30, 40);
    drawRect(bm, 40, 50, 40, 55, ...whiteTop);
    drawRect(bm, 38, 55, 6, 45, ...whiteShadow);

    if (pose === 'punch') {
        drawRect(bm, 28, 55, 12, 30, ...skin);
        drawRect(bm, 80, 50, 40, 16, ...skin);
        drawRect(bm, 115, 48, 18, 20, ...skinShadow);
    } else if (pose === 'kick') {
        drawRect(bm, 30, 55, 12, 35, ...skin);
        drawRect(bm, 70, 95, 45, 16, ...skin);
        drawRect(bm, 110, 93, 20, 20, ...shoes);
    } else if (pose === 'special') {
        drawRect(bm, 28, 55, 12, 35, ...skin);
        drawRect(bm, 72, 40, 25, 14, ...skin);
        drawRect(bm, 92, 36, 16, 16, 255, 100, 180);
    } else {
        drawRect(bm, 28, 55, 12, 35, ...skin);
        drawRect(bm, 80, 55, 12, 35, ...skin);
    }

    drawRect(bm, 38, 105, 44, 35, ...darkShorts);
    drawRect(bm, 42, 140, 14, 28, ...skin);
    drawRect(bm, 64, 140, 14, 28, ...skin);
    drawRect(bm, 38, 168, 20, 12, ...shoes);
    drawRect(bm, 62, 168, 20, 12, ...shoes);

    return img;
}

// ─────────────────────────────────────────────────────────────────
// GERADOR STREET FIGHTER PIXEL ART - VINI DOG
// Homem Branco, Boné Virado pra trás, Camiseta Preta MCD + Racionais, Jeans Claro
// ─────────────────────────────────────────────────────────────────
async function createViniDogPose(pose) {
    const img = new Jimp({ width: 120, height: 180, color: 0x00000000 });
    const bm = img.bitmap;

    const skin = [255, 210, 175];
    const skinShadow = [210, 160, 125];
    const blackCap = [15, 15, 20];
    const blackShirt = [25, 25, 30];
    const logoText = [240, 240, 240];
    const lightJeans = [115, 155, 195];
    const darkShoes = [35, 35, 45];

    if (pose === 'ko') {
        drawRect(bm, 10, 145, 90, 25, ...lightJeans);
        drawRect(bm, 25, 140, 60, 20, ...blackShirt);
        drawRect(bm, 75, 138, 25, 20, ...skin);
        drawRect(bm, 85, 135, 20, 15, ...blackCap); // Boné caído
        return img;
    }

    if (pose === 'win') {
        // Vira de costas pra câmera revelando a calvície na coroa!
        drawRect(bm, 44, 12, 32, 20, ...skin);
        drawRect(bm, 52, 14, 16, 12, 255, 190, 160); // Coroa Calva
        drawRect(bm, 44, 26, 32, 10, 50, 35, 25);
        drawRect(bm, 38, 42, 44, 64, ...blackShirt);
        drawRect(bm, 80, 45, 14, 30, ...skin);
        drawRect(bm, 82, 30, 10, 16, 50, 200, 255); // Vape
        drawRect(bm, 75, 5, 30, 18, 220, 240, 255, 180); // Fumaça Cachorro
        drawRect(bm, 38, 106, 44, 62, ...lightJeans);
        drawRect(bm, 36, 168, 20, 12, ...darkShoes);
        drawRect(bm, 64, 168, 20, 12, ...darkShoes);
        return img;
    }

    if (pose === 'hit') {
        drawRect(bm, 30, 16, 32, 16, ...blackCap);
        drawRect(bm, 28, 30, 28, 22, ...skin);
        drawRect(bm, 24, 52, 40, 56, ...blackShirt);
        drawRect(bm, 22, 108, 44, 60, ...lightJeans);
        drawRect(bm, 18, 168, 20, 12, ...darkShoes);
        drawRect(bm, 44, 168, 20, 12, ...darkShoes);
        return img;
    }

    if (pose === 'crouch') {
        drawRect(bm, 44, 35, 32, 16, ...blackCap);
        drawRect(bm, 46, 49, 28, 20, ...skin);
        drawRect(bm, 38, 69, 44, 45, ...blackShirt);
        drawRect(bm, 36, 114, 48, 54, ...lightJeans);
        drawRect(bm, 32, 168, 22, 12, ...darkShoes);
        drawRect(bm, 64, 168, 22, 12, ...darkShoes);
        return img;
    }

    if (pose === 'jump') {
        drawRect(bm, 44, 10, 32, 16, ...blackCap);
        drawRect(bm, 46, 24, 28, 22, ...skin);
        drawRect(bm, 38, 46, 44, 55, ...blackShirt);
        drawRect(bm, 38, 101, 44, 45, ...lightJeans);
        drawRect(bm, 30, 146, 22, 14, ...darkShoes);
        drawRect(bm, 64, 146, 22, 14, ...darkShoes);
        return img;
    }

    if (pose === 'walk') {
        drawRect(bm, 44, 12, 32, 16, ...blackCap);
        drawRect(bm, 34, 20, 14, 6, 10, 10, 15);
        drawRect(bm, 46, 28, 28, 22, ...skin);
        drawRect(bm, 38, 50, 44, 58, ...blackShirt);
        drawRect(bm, 48, 65, 24, 6, ...logoText);
        drawRect(bm, 38, 108, 44, 60, ...lightJeans);
        drawRect(bm, 28, 168, 22, 12, ...darkShoes);
        drawRect(bm, 68, 168, 22, 12, ...darkShoes);
        return img;
    }

    // Default (idle, punch, kick, special)
    drawRect(bm, 44, 12, 32, 16, ...blackCap);
    drawRect(bm, 34, 20, 14, 6, 10, 10, 15);
    drawRect(bm, 46, 28, 28, 22, ...skin);
    drawRect(bm, 46, 46, 28, 6, ...skinShadow);
    drawRect(bm, 48, 44, 24, 6, 50, 40, 35);
    drawRect(bm, 38, 50, 44, 58, ...blackShirt);
    drawRect(bm, 48, 65, 24, 6, ...logoText);

    if (pose === 'punch') {
        drawRect(bm, 26, 55, 14, 30, ...skin);
        drawRect(bm, 80, 52, 42, 16, ...skin);
        drawRect(bm, 115, 48, 20, 22, 220, 30, 30);
    } else if (pose === 'kick') {
        drawRect(bm, 26, 55, 14, 32, ...skin);
        drawRect(bm, 75, 100, 45, 18, ...lightJeans);
        drawRect(bm, 112, 98, 22, 22, ...darkShoes);
    } else if (pose === 'special') {
        drawRect(bm, 26, 55, 14, 32, ...skin);
        drawRect(bm, 80, 48, 35, 18, ...skin);
        drawRect(bm, 110, 40, 25, 25, 50, 200, 255);
    } else {
        drawRect(bm, 26, 55, 14, 32, ...skin);
        drawRect(bm, 80, 55, 14, 32, ...skin);
    }

    drawRect(bm, 38, 108, 44, 60, ...lightJeans);
    drawRect(bm, 36, 168, 20, 12, ...darkShoes);
    drawRect(bm, 64, 168, 20, 12, ...darkShoes);

    return img;
}

async function main() {
    console.log('Generating complete Street Fighter 2D arcade pixel art sprite sets...');

    const poses = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'special', 'hit', 'ko', 'win'];

    // Kevin Poses (cada uma em uma imagem própria)
    for (const p of poses) {
        const sprite = await createKevinPose(p);
        const fileName = (p === 'idle') ? 'kevin.png' : `kevin_${p}.png`;
        await sprite.write(path.join(outDir, fileName));
        if (p === 'idle') {
            await sprite.write(path.join(outDir, 'kevin_idle.png'));
        }
        console.log(`✅ Generated Kevin Street Fighter 2D sprite: ${fileName}`);
    }

    // Vini Dog Poses (cada uma em uma imagem própria)
    for (const p of poses) {
        const sprite = await createViniDogPose(p);
        const fileName = (p === 'idle') ? 'vini_dog.png' : `vini_dog_${p}.png`;
        await sprite.write(path.join(outDir, fileName));
        if (p === 'idle') {
            await sprite.write(path.join(outDir, 'vini_dog_idle.png'));
        }
        console.log(`✅ Generated Vini Dog Street Fighter 2D sprite: ${fileName}`);
    }

    console.log('🎉 ALL STREET FIGHTER 2D SPRITES SUCCESSFULLY CREATED AND SAVED IN SEPARATE FILES!');
}

main().catch(err => console.error(err));
