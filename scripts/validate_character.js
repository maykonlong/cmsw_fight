const fs = require('fs');
const path = require('path');

const charName = process.argv[2];

if (!charName) {
    console.error("ERRO: Informe o nome do personagem. Ex: node validate_character.js kevin");
    process.exit(1);
}

const jsonPath = path.join(__dirname, '..', 'game', 'src', 'data', 'characters', `${charName}.json`);

if (!fs.existsSync(jsonPath)) {
    console.error(`ERRO: Arquivo ${jsonPath} não encontrado.`);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log(`[+] Validando personagem: ${data.name} (${charName})`);

// Validação de campos obrigatórios
const requiredFields = ['id', 'name', 'health', 'movement', 'sprites', 'specials'];
let passed = true;

for (const field of requiredFields) {
    if (!data[field]) {
        console.error(`[-] ERRO: Campo obrigatório '${field}' está faltando no JSON.`);
        passed = false;
    }
}

// Validação de Movement
if (data.movement) {
    const movReq = ['walkForward', 'walkBackward', 'jumpVelocityY', 'jumpVelocityX'];
    for (const m of movReq) {
        if (data.movement[m] === undefined) {
            console.error(`[-] ERRO: Atributo de movement '${m}' está faltando.`);
            passed = false;
        }
    }
}

// Validação de Sprites base
if (data.sprites) {
    const sprReq = ['idle', 'walk', 'crouch', 'jump', 'block', 'hit', 'ko'];
    for (const s of sprReq) {
        if (!data.sprites[s]) {
            console.warn(`[!] AVISO: Sprite map para animação básica '${s}' não encontrado. O jogo pode travar se o estado for ativado.`);
        }
    }
}

// Resumo
if (passed) {
    console.log(`[+] SUCESSO: Estrutura do JSON do personagem '${data.name}' está válida para uso no motor!`);
} else {
    console.error(`[-] FALHA: O JSON possui erros críticos.`);
    process.exit(1);
}
