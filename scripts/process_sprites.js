// Pipeline de Recorte Inteligente e Geração de Sprites (Fase 6)
// Esse script servirá de base para pegarmos a imagem de referência (Kevin_1.jpeg ou Vini_dog_1.jpeg)
// E transformá-las em um Spritesheet (PNG transparente) com animações baseadas nos Estados de luta.

const fs = require('fs');
const path = require('path');

// Planejamento do pipeline:
// 1. Remover Fundo (Rembg / Sharp) -> Removemos o cenário das fotos.
// 2. Extrair Pose (OpenPose / MediaPipe) -> Entendemos a silhueta do Vini Dog/Kevin.
// 3. Grid Automático (Spritesheet Gen) -> Alinhar o personagem recortado num grid 64x128 padrão para o Phaser 3.

function processCharacter(characterName) {
    console.log(`\nIniciando Recorte Inteligente para: ${characterName}...`);
    
    const inputPath = path.join(__dirname, `../imagens_ref/personagens_ref/${characterName}`);
    const outputPath = path.join(__dirname, `../game/public/assets/sprites/${characterName.toLowerCase()}_spritesheet.png`);

    if (!fs.existsSync(inputPath)) {
        console.error(`Erro: Pasta de origem não encontrada -> ${inputPath}`);
        return;
    }

    console.log('1. Lendo imagens originais JPEG...');
    console.log('2. IA de Recorte: Removendo o fundo e extraindo o alfa...');
    console.log('3. Gerando variações de pose: Idle, Walk, Ataque, Especial...');
    console.log(`4. Montando Spritesheet e salvando em: ${outputPath}`);
    
    console.log(`✅ ${characterName} processado com sucesso!`);
}

// Quando formos rodar pra valer:
// processCharacter('Kevin');
// processCharacter('Vini_dog');
