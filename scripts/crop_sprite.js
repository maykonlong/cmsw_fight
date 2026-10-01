const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function crop(inputFile) {
    if (!fs.existsSync(inputFile)) return;
    const img = await Jimp.read(inputFile);
    
    // Supondo imagem 1024x1024 numa grid 4x2 ou 3x3, 
    // a primeira pose no topo esquerdo (idle) geralmente ocupa um espaço de 256x512
    img.crop({ x: 0, y: 0, w: 256, h: 512 });
    
    await img.write(inputFile);
    console.log(`Cropped: ${inputFile}`);
}

crop('game/public/assets/sprites/kevin.png');
crop('game/public/assets/sprites/vini_dog.png');
