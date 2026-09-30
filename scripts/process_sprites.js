const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processCharacter(characterName) {
    console.log(`\n[1/3] Iniciando Recorte Inteligente para: ${characterName}...`);
    
    const inputDir = path.join(__dirname, `../imagens_ref/personagens_ref/${characterName}`);
    if (!fs.existsSync(inputDir)) {
        console.error(`Erro: Pasta de origem não encontrada -> ${inputDir}`);
        return;
    }

    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'));
    if (files.length === 0) {
        console.error(`Erro: Nenhuma imagem encontrada em ${inputDir}`);
        return;
    }

    const firstImage = path.join(inputDir, files[0]);
    const outDir = path.join(__dirname, `../game/public/assets/sprites`);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const bgRemovedPath = path.join(outDir, `${characterName.toLowerCase()}_raw.png`);
    const spritesheetPath = path.join(outDir, `${characterName.toLowerCase()}_placeholder.png`);

    console.log(`[2/3] Removendo Fundo da imagem ${files[0]} com IA... Isso pode demorar alguns segundos na primeira execução para baixar o modelo.`);
    
    try {
        const imageBuffer = fs.readFileSync(firstImage);
        // Utilizando Blob nativo do Node.js
        const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
        
        const resultBlob = await removeBackground(blob);
        const arrayBuffer = await resultBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Salva a versão com o fundo extraído com precisão
        fs.writeFileSync(bgRemovedPath, buffer);
        console.log(`-> Fundo extraído com sucesso! (Salvo em assets/sprites/${characterName.toLowerCase()}_raw.png)`);

        console.log(`[3/3] Normalizando pose no Grid do Phaser (64x128)...`);
        
        // Usamos o Sharp para centralizar a imagem num "Hitbox" padronizado
        await sharp(buffer)
            .resize({ 
                width: 64, 
                height: 128, 
                fit: 'contain', 
                background: { r: 0, g: 0, b: 0, alpha: 0 } 
            })
            .toFile(spritesheetPath);
        
        console.log(`✅ Sucesso! Spritesheet base gerado em: assets/sprites/${characterName.toLowerCase()}_placeholder.png`);
        
    } catch (e) {
        console.error('Erro durante o processamento da IA:', e);
    }
}

// Permite rodar via linha de comando: node process_sprites.js Kevin
const args = process.argv.slice(2);
if (args.length > 0) {
    processCharacter(args[0]);
} else {
    console.log("Uso: node process_sprites.js <NomeDoPersonagem>");
    console.log("Exemplo: node process_sprites.js Kevin");
}
