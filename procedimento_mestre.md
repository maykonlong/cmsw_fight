# C&M FIGTH — PROCEDIMENTO MESTRE v2.0
## Guia Definitivo para Reconstrução Completa

> **PARA A IA QUE VAI EXECUTAR:**
> 1. Leia este arquivo INTEIRO antes de escrever qualquer código.
> 2. Execute cada `[ ]` na ordem. Marque `[x]` ao concluir.
> 3. **NUNCA pule um item.** Se algo der erro, conserte ANTES de avançar.
> 4. Após cada FASE, o jogo DEVE funcionar no navegador. Teste. Se não funcionar, NÃO avance.
> 5. Após cada FASE, faça `git add . && git commit && git push`.

---

## LEGENDA
- `[ ]` Não iniciado
- `[x]` Concluído
- `[!]` Bloqueado (ex: falta asset)

---

# ═══════════════════════════════════════════════════════════════
# SEÇÃO A — CONTEXTO DO JOGO
# ═══════════════════════════════════════════════════════════════

## A.1 O Que É Este Jogo

- **Nome:** C&M Figth
- **Gênero:** Jogo de Luta 2D (estilo Street Fighter II)
- **Plataformas:** Navegador (PC Chrome/Firefox/Safari, Mobile Chrome/Safari iOS)
- **Hospedagem:** GitHub Pages (https://maykonlong.github.io/cmsw_fight/)
- **Controles:** Teclado, Gamepad (Xbox/PS), Touch (celular)
- **Resolução:** 1280×720, escala automática para qualquer tela
- **Tecnologia:** Phaser 3 + TypeScript + Vite

## A.2 Personagens (v1.0)

### Kevin Manja
- **Visual:** Mlk de quebrada — boné virado, regata, bermudão, tênis
- **Arquétipo:** Balanced (equilíbrio entre ataque e defesa)
- **Especial 1:** "Beijo Elétrico" (Projétil — comando: ↓↘→+Soco / 236P)
- **Especial 2:** "Encontrão" (Anti-aéreo — comando: →↓↘+Soco / 623P)
- **HP:** 1000
- **Velocidade de andar:** 250 px/s
- **Frase de vitória:** "Cadê meu sabonete?"

### Vini Dog
- **Visual:** Cachorro boxer humanóide com luvas de boxe, bermuda de luta
- **Arquétipo:** Rushdown (rápido, agressivo, combos de perto)
- **Especial 1:** "Aura do Cachorro" (Projétil — comando: ↓↙←+Chute / 214K)
- **Especial 2:** "Mordida Fatal" (Avanço — comando: →↓↘+Soco / 623P)
- **HP:** 900
- **Velocidade de andar:** 300 px/s
- **Frase de vitória:** "Au au, perdeu playboy!"

## A.3 Cenário (v1.0)

- **Nome:** C&M Software HQ
- **Descrição:** Rua brasileira ao pôr do sol, favela ao fundo, muro com grafite, carro velho estacionado, galera assistindo
- **3 Camadas Parallax:**
  - Background (céu/prédios distantes) — scrollFactor 0.1
  - Middleground (muro/carro/galera) — scrollFactor 0.4
  - Floor (chão de asfalto) — scrollFactor 1.0

## A.4 Mapeamento Completo de Controles

| Ação             | P1 Teclado | Gamepad Xbox  | Gamepad PS | Touch (Celular)   |
|------------------|------------|---------------|------------|-------------------|
| Esquerda         | ←          | D-Pad/LS ←    | D-Pad/LS ← | Botão ← no D-Pad |
| Direita          | →          | D-Pad/LS →    | D-Pad/LS → | Botão → no D-Pad |
| Pulo             | ↑          | D-Pad/LS ↑    | D-Pad/LS ↑ | Botão ↑ no D-Pad |
| Agachar          | ↓          | D-Pad/LS ↓    | D-Pad/LS ↓ | Botão ↓ no D-Pad |
| Soco Leve (LP)   | Z          | X             | □          | Botão LP          |
| Soco Médio (MP)  | X          | Y             | △          | Botão MP          |
| Soco Forte (HP)  | C          | RB            | R1         | Botão HP          |
| Chute Leve (LK)  | A          | A             | ✕          | Botão LK          |
| Chute Médio (MK) | S          | B             | ○          | Botão MK          |
| Chute Forte (HK) | D          | RT            | R2         | Botão HK          |
| Especial         | V          | LB            | L1         | Botão SPECIAL     |
| Throw (perto)    | Z+A juntos | X+A juntos    | □+✕ juntos | LP+LK juntos      |
| Pause            | ESC        | Start         | Options    | (botão pause)     |

## A.5 Fluxo de Telas

```
BootScene (Logo "C&M Software" por 2 segundos)
    ↓
MainMenuScene
    ├── 1 PLAYER → CharacterSelectScene → CombatScene → Victory/GameOver → MainMenu
    ├── TREINO   → TrainingScene (HP infinito, CPU parada)
    ├── CONTROLES → ControlsScene (tabela de botões)
    └── CONFIG   → SettingsScene (volume, dificuldade, tela cheia)
```

## A.6 Regras de Match (Igual Street Fighter II)

- **Best of 3:** Primeiro a ganhar 2 rounds vence o match
- **Timer:** 99 segundos por round (conta regressiva)
- **Timer zerou:** Quem tem mais HP ganha o round
- **Empate de HP:** Ambos ganham 1 round
- **Sequência de round:** "ROUND X" (1.5s) → "FIGHT!" (0.8s) → Luta → "K.O." (3s) → Próximo
- **Vitória:** P1 ganha → VictoryScene / P1 perde → GameOverScene

---

# ═══════════════════════════════════════════════════════════════
# SEÇÃO B — DIAGNÓSTICO DE BUGS DO PROJETO ATUAL
# ═══════════════════════════════════════════════════════════════

> **PARA A IA:** Se você está reconstruindo do zero, pule esta seção.
> Se está consertando o código existente, leia TUDO aqui.

### Bug 1: CPU NUNCA AGE (CRÍTICO)
- **Sintoma:** O inimigo fica parado, os personagens "passam um pelo outro"
- **Causa:** `CPUController` tem métodos `isUpPressed()` e `isLeftPressed()`, mas `Fighter.ts` chama propriedades `isUpJustPressed` e `isLeftDown`. Os nomes são diferentes → a CPU nunca recebe comandos.
- **Solução:** Criar interface `IInputProvider` com as propriedades EXATAS que o Fighter usa. Tanto `InputManager` quanto `CPUController` devem implementar essa interface.

### Bug 2: ATAQUES NÃO CONECTAM (CRÍTICO)
- **Sintoma:** Socos/chutes passam direto pelo inimigo sem causar dano
- **Causa:** `Hitbox.updatePosition()` calcula posição relativa mas `CombatSystem.checkHitboxCollision()` compara como se fossem posições absolutas. Os retângulos nunca se intersectam.
- **Solução:** No `updatePosition()`, calcular posição ABSOLUTA (world-space): `this.x = fighterX + (flipX ? -(offsetX + width) : offsetX)`

### Bug 3: PULO NÃO FUNCIONA (CRÍTICO)
- **Sintoma:** Apertar ↑ não faz nada, ou o personagem vibra no chão
- **Causa:** `JumpState.execute()` checa `f.body.touching.down` no mesmo frame que aplica o impulso. Como a física ainda não processou, o pé ainda toca o chão → cancela o pulo.
- **Solução:** Adicionar contador de frames. Só checar aterrissagem após 8+ frames no ar. Usar `f.body.blocked.down` em vez de `f.body.touching.down`.

### Bug 4: PROJÉTEIS ATRAVESSAM INIMIGOS (CRÍTICO)
- **Sintoma:** A magia passa direto pelo oponente
- **Causa:** `Projectile` é um `Phaser.Physics.Arcade.Sprite` mas as hurtboxes são `Phaser.Geom.Rectangle`. O `physics.add.overlap` não funciona entre sistemas diferentes.
- **Solução:** Checar colisão dos projéteis MANUALMENTE no update(), usando `Phaser.Geom.Intersects.RectangleToRectangle()` contra a hurtbox do oponente.

### Bug 5: BUILD QUEBRA NO GITHUB PAGES (CRÍTICO)
- **Sintoma:** A página no GitHub Pages fica em branco
- **Causa 1:** `package.json` usa `"build": "tsc && vite build"`. O path da pasta tem `&` que quebra o `tsc`.
- **Causa 2:** JSONs estão em `src/data/` que o Vite processa. No build, eles não ficam acessíveis via URL.
- **Solução:** Remover `tsc` do build (Vite já compila TS). Mover JSONs para `public/data/`.

### Bug 6: SPRITE MOSTRA GRID INTEIRO
- **Sintoma:** O personagem mostra todas as poses ao mesmo tempo (a sprite sheet inteira)
- **Causa:** A imagem gerada é um grid de poses, mas o código carrega como imagem única.
- **Solução:** Usar UMA IMAGEM POR POSE (idle.png, punch.png, etc.). Ou usar `this.load.spritesheet()` com frameWidth/frameHeight.

---

# ═══════════════════════════════════════════════════════════════
# SEÇÃO C — IMPLEMENTAÇÃO PASSO A PASSO
# ═══════════════════════════════════════════════════════════════

> **PARA A IA:** Execute na ordem. Cada FASE produz algo testável.

---

# ══════════════════════════════════════
# FASE 1 — SETUP DO PROJETO
# ══════════════════════════════════════

## 1.1 Criar Projeto Vite

- [ ] **1.1.1** Na pasta `game/`, rodar:
```bash
npx -y create-vite@latest ./ --template vanilla-ts
npm install phaser@3.80
```

**ATENÇÃO:** Usar **Phaser 3.x** (não 4.x). O Phaser 3 é estável e funciona em todos os navegadores.

## 1.2 Configurar vite.config.ts

- [ ] **1.2.1** Criar `game/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/cmsw_fight/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
```

## 1.3 Configurar package.json

- [ ] **1.3.1** O `scripts` do `game/package.json` DEVE ser:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**PROIBIDO:** Nunca usar `tsc && vite build`. O Vite já compila TypeScript sozinho via esbuild.

## 1.4 Configurar tsconfig.json

- [ ] **1.4.1** Criar `game/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "sourceMap": true
  },
  "include": ["src"]
}
```

## 1.5 Estrutura de Pastas

- [ ] **1.5.1** Criar EXATAMENTE esta estrutura:
```
game/
├── public/                          ← TUDO que o navegador acessa por URL
│   ├── data/
│   │   ├── characters/
│   │   │   ├── kevin.json
│   │   │   └── vini_dog.json
│   │   └── stages/
│   │       └── cmsw_hq.json
│   └── assets/
│       ├── sprites/
│       │   ├── kevin_idle.png       ← UMA POSE POR ARQUIVO
│       │   ├── kevin_punch.png
│       │   ├── kevin_kick.png
│       │   ├── kevin_crouch.png
│       │   ├── kevin_jump.png
│       │   ├── kevin_hit.png
│       │   ├── kevin_ko.png
│       │   ├── vini_dog_idle.png
│       │   ├── vini_dog_punch.png
│       │   ├── (... mesmas poses ...)
│       │   ├── stage_bg.png
│       │   ├── stage_mg.png
│       │   └── stage_fg.png
│       └── audio/                   ← Para quando tiver áudio
│           ├── music/
│           ├── sfx/
│           └── voice/
├── src/
│   ├── main.ts                      ← Ponto de entrada do jogo
│   ├── interfaces/
│   │   └── IInputProvider.ts        ← Interface unificada de input
│   ├── core/
│   │   ├── InputManager.ts          ← Teclado + Gamepad + Touch
│   │   ├── InputBuffer.ts           ← Buffer de 60 frames
│   │   └── CommandRecognizer.ts     ← Reconhece 236P, 623P, etc.
│   ├── entities/
│   │   ├── Fighter.ts               ← Lutador genérico + State Machine
│   │   └── Projectile.ts            ← Bola de energia
│   ├── engine/
│   │   ├── CombatSystem.ts          ← Lógica de hit, block, throw
│   │   ├── MatchManager.ts          ← Rounds, timer, vitória
│   │   ├── CPUController.ts         ← IA do inimigo
│   │   ├── CameraSystem.ts          ← Câmera segue os dois
│   │   └── VFXManager.ts            ← Efeitos visuais
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── MainMenuScene.ts
│   │   ├── CharacterSelectScene.ts
│   │   ├── CombatScene.ts           ← A CENA PRINCIPAL DE LUTA
│   │   ├── VictoryScene.ts
│   │   ├── GameOverScene.ts
│   │   ├── TrainingScene.ts
│   │   ├── SettingsScene.ts
│   │   └── ControlsScene.ts
│   ├── ui/
│   │   ├── HUD.ts                   ← Barra de HP, timer, nomes
│   │   └── VirtualGamepad.ts        ← Controles touch mobile
│   └── data/
│       └── moves.ts                 ← Frame data de todos os ataques
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

**REGRA CRÍTICA:** JSONs e imagens devem estar em `public/`. O Vite copia `public/` para `dist/` no build. Tudo em `src/` é empacotado e NÃO acessível via URL.

## 1.6 index.html

- [ ] **1.6.1** Criar `game/index.html`:
```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="description" content="C&M Figth — Jogo de luta 2D estilo Street Fighter. Resolva sua treta aqui!" />
  <title>C&M Figth — Resolva sua treta aqui</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    #app { width: 100%; height: 100%; }
    canvas { display: block; touch-action: none; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**O `touch-action: none` é OBRIGATÓRIO** para que o touch funcione no celular sem disparar scroll/zoom do navegador.

## 1.7 GitHub Actions Deploy

- [ ] **1.7.1** Criar `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: 'game/package-lock.json'
      - run: npm ci
        working-directory: ./game
      - run: npm run build
        working-directory: ./game
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './game/dist'
      - uses: actions/deploy-pages@v4
        id: deployment
```

## 1.8 VALIDAÇÃO DA FASE 1

- [ ] **1.8.1** `cd game && npm run dev` abre no navegador sem erros no console
- [ ] **1.8.2** `cd game && npm run build` completa sem erros
- [ ] **1.8.3** A pasta `game/dist/` contém `index.html` e a pasta `data/`
- [ ] **1.8.4** Git push → GitHub Action roda verde

---

# ══════════════════════════════════════
# FASE 2 — MOTOR DO JOGO (main.ts)
# ══════════════════════════════════════

## 2.1 main.ts

- [ ] **2.1.1** Criar `game/src/main.ts` com EXATAMENTE este conteúdo:
```typescript
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { CombatScene } from './scenes/CombatScene';
import { VictoryScene } from './scenes/VictoryScene';
import { GameOverScene } from './scenes/GameOverScene';
import { TrainingScene } from './scenes/TrainingScene';
import { SettingsScene } from './scenes/SettingsScene';
import { ControlsScene } from './scenes/ControlsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'app',
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1200 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    gamepad: true,
    touch: true
  },
  scene: [BootScene, MainMenuScene, CharacterSelectScene, CombatScene,
          TrainingScene, VictoryScene, GameOverScene, SettingsScene, ControlsScene]
};

new Phaser.Game(config);
```

## 2.2 BootScene.ts (Tela de Logo)

- [ ] **2.2.1** Criar `game/src/scenes/BootScene.ts`:
  - Preload: carregar TODAS as imagens e JSONs (ver lista completa na Seção A)
  - Criar texturas de fallback (retângulos coloridos) caso imagens não existam
  - Create: mostrar "C&M SOFTWARE" + "RESOLVA SUA TRETA AQUI" por 2s → fade → MainMenuScene

**Fallback obrigatório** — Gerar texturas programáticas se os PNGs não existirem:
```typescript
// BootScene.preload()
// Tenta carregar sprites reais
this.load.image('kevin_idle', 'assets/sprites/kevin_idle.png');
this.load.image('vini_dog_idle', 'assets/sprites/vini_dog_idle.png');
this.load.image('stage_bg', 'assets/sprites/stage_bg.png');

// Carrega JSONs de dados (ATENÇÃO: estão em public/data/)
this.load.json('kevin_data', 'data/characters/kevin.json');
this.load.json('vini_dog_data', 'data/characters/vini_dog.json');
this.load.json('cmsw_hq_data', 'data/stages/cmsw_hq.json');

// BootScene.create() — Fallbacks
if (!this.textures.exists('kevin_idle')) {
  const g = this.make.graphics({});
  g.fillStyle(0x3399ff); g.fillRect(0, 0, 80, 160);
  g.generateTexture('kevin_idle', 80, 160);
  g.destroy();
}
```

## 2.3 VALIDAÇÃO DA FASE 2

- [ ] **2.3.1** Tela preta aparece → Logo "C&M SOFTWARE" aparece → Fade → Menu
- [ ] **2.3.2** Console do navegador mostra "Phaser v3.x.x" sem erros vermelhos
- [ ] **2.3.3** No celular, a tela se ajusta sem scroll

---

# ══════════════════════════════════════
# FASE 3 — INTERFACE UNIFICADA DE INPUT
# ══════════════════════════════════════

> **ESTA É A FASE MAIS IMPORTANTE.** O bug principal do projeto é que o InputManager e o CPUController falam "línguas diferentes". O Fighter.ts chama `inp.isLeftDown` mas o CPUController tem `isLeftPressed()`.

## 3.1 IInputProvider.ts

- [ ] **3.1.1** Criar `game/src/interfaces/IInputProvider.ts`:
```typescript
export interface IInputProvider {
  // ═══ Direcionais (true enquanto segurado) ═══
  readonly isLeftDown: boolean;
  readonly isRightDown: boolean;
  readonly isUpDown: boolean;
  readonly isDownDown: boolean;

  // ═══ Direcionais (true apenas no frame que apertou) ═══
  readonly isUpJustPressed: boolean;

  // ═══ Ataques (true apenas no frame que apertou) ═══
  readonly isLPJustPressed: boolean;
  readonly isMPJustPressed: boolean;
  readonly isHPJustPressed: boolean;
  readonly isLKJustPressed: boolean;
  readonly isMKJustPressed: boolean;
  readonly isHKJustPressed: boolean;
  readonly isSpecialJustPressed: boolean;

  // ═══ Combinados ═══
  readonly isThrowJustPressed: boolean; // LP+LK simultâneo

  // ═══ Buffer de comandos especiais ═══
  readonly buffer: any;
  readonly currentFrame: number;

  // ═══ Chamado a cada frame ═══
  update(): void;
}
```

## 3.2 InputManager.ts

- [ ] **3.2.1** Criar `game/src/core/InputManager.ts`:
  - Classe `InputManager implements IInputProvider`
  - Lê: Teclado (via `Phaser.Input.Keyboard`)
  - Lê: Gamepad (via `this.scene.input.gamepad.pad1`)
  - Lê: Touch virtual (via propriedades `virtualXxx` setadas pelo VirtualGamepad)
  - Cada getter (`isLeftDown`, `isLPJustPressed`, etc.) faz OR entre teclado, gamepad e touch
  - O `update()` limpa os estados `JustPressed` do touch e atualiza o buffer

**Mapeamento de teclado:**
```
Setas ←↑↓→ = Direcionais
Z = LP (Soco Leve)
X = MP (Soco Médio)
C = HP (Soco Forte)
A = LK (Chute Leve)
S = MK (Chute Médio)
D = HK (Chute Forte)
V = Especial
```

**Mapeamento de gamepad Xbox:**
```
D-Pad/LeftStick = Direcionais (LS < -0.5 = esquerda, > 0.5 = direita)
X = LP, Y = MP, RB = HP
A = LK, B = MK, RT = HK
LB = Especial
```

**Detecção de JustPressed para gamepad:** Guardar estado anterior do frame e comparar:
```typescript
// prevPadState guardado no update anterior
const padX = this.pad?.X ?? false;
const padJustX = padX && !this.prevPadState.X;
// isLPJustPressed = keyboard JustDown(Z) || virtualLPJustPressed || padJustX
```

## 3.3 CPUController.ts

- [ ] **3.3.1** Criar `game/src/engine/CPUController.ts`:
  - Classe `CPUController implements IInputProvider`
  - **TODOS os getters devem ter EXATAMENTE os mesmos nomes** de `IInputProvider`
  - A lógica de IA decide quais flags ligar a cada N frames

```typescript
export class CPUController implements IInputProvider {
  private me: Fighter;
  private target: Fighter;

  // Estado interno — setado pela IA
  private _left = false;
  private _right = false;
  private _up = false;
  private _down = false;
  private _upJust = false;
  private _lpJust = false;
  private _mpJust = false;
  private _hpJust = false;
  private _lkJust = false;
  private _mkJust = false;
  private _hkJust = false;
  private _specialJust = false;
  private _throwJust = false;

  private reactionDelay = 15; // frames entre decisões
  private timer = 0;
  private actionCooldown = 0;
  public buffer = { inputs: [] as any[] };
  public currentFrame = 0;

  constructor(me: Fighter, target: Fighter) {
    this.me = me;
    this.target = target;
  }

  // ═══ IInputProvider — GETTERS (NOMES EXATOS) ═══
  get isLeftDown() { return this._left; }
  get isRightDown() { return this._right; }
  get isUpDown() { return this._up; }
  get isDownDown() { return this._down; }
  get isUpJustPressed() { return this._upJust; }
  get isLPJustPressed() { return this._lpJust; }
  get isMPJustPressed() { return this._mpJust; }
  get isHPJustPressed() { return this._hpJust; }
  get isLKJustPressed() { return this._lkJust; }
  get isMKJustPressed() { return this._mkJust; }
  get isHKJustPressed() { return this._hkJust; }
  get isSpecialJustPressed() { return this._specialJust; }
  get isThrowJustPressed() { return this._throwJust; }

  update() {
    this.timer++;
    this.currentFrame++;

    // RESET JUST PRESSED (obrigatório a cada frame!)
    this._lpJust = this._mpJust = this._hpJust = false;
    this._lkJust = this._mkJust = this._hkJust = false;
    this._specialJust = this._throwJust = this._upJust = false;

    if (this.actionCooldown > 0) { this.actionCooldown--; return; }
    if (this.timer % this.reactionDelay !== 0) return;

    // ═══ ÁRVORE DE DECISÃO ═══
    const dx = Math.abs(this.me.x - this.target.x);

    // Perto (60-130px): atacar
    if (dx >= 50 && dx < 130) {
      const r = Math.random();
      if (r < 0.25) this._lpJust = true;
      else if (r < 0.45) this._mkJust = true;
      else if (r < 0.65) this._hpJust = true;
      else this._hkJust = true;
      this.actionCooldown = 20;
      return;
    }

    // Muito perto (<50px): throw
    if (dx < 50) {
      this._throwJust = true;
      this.actionCooldown = 30;
      return;
    }

    // Longe (>130px): andar em direção ao oponente
    if (dx > 130) {
      this._left = this.me.x > this.target.x;
      this._right = this.me.x < this.target.x;

      // Pular de vez em quando
      if (Math.random() < 0.03) {
        this._upJust = true;
        this._up = true;
        this.actionCooldown = 25;
        return;
      }

      // Projétil de vez em quando se longe
      if (dx > 250 && Math.random() < 0.08) {
        this._specialJust = true;
        this.actionCooldown = 40;
        return;
      }
      return;
    }

    // Default: parar
    this._left = false;
    this._right = false;
  }
}
```

## 3.4 Fighter.ts usa IInputProvider

- [ ] **3.4.1** Em `Fighter.ts`, trocar `public inputManager?: any;` por:
```typescript
import { IInputProvider } from '../interfaces/IInputProvider';
// ...
public inputManager?: IInputProvider;
```

## 3.5 VALIDAÇÃO DA FASE 3

- [ ] **3.5.1** Buscar no projeto inteiro: NÃO pode existir `isUpPressed()` ou `isLeftPressed()` — só `isUpJustPressed` e `isLeftDown`
- [ ] **3.5.2** `CPUController` compila sem erros de TypeScript

---

# ══════════════════════════════════════
# FASE 4 — FIGHTER + STATE MACHINE + COLISÃO
# ══════════════════════════════════════

## 4.1 State Machine Genérica

- [ ] **4.1.1** Criar `game/src/core/StateMachine.ts` com padrão State:
```typescript
export abstract class State {
  protected stateMachine!: StateMachine;
  enter(fighter: Fighter, ...args: any[]): void {}
  execute(fighter: Fighter): void {}
  exit(fighter: Fighter): void {}
}

export class StateMachine {
  public currentState: State;
  private states: Record<string, State>;
  private context: Fighter[];

  constructor(initialState: string, states: Record<string, State>, context: Fighter[]) {
    this.states = states;
    this.context = context;
    for (const state of Object.values(states)) {
      (state as any).stateMachine = this;
    }
    this.currentState = states[initialState];
    this.currentState.enter(context[0]);
  }

  transition(newState: string, ...args: any[]) {
    if (!this.states[newState]) return;
    this.currentState.exit(this.context[0]);
    this.currentState = this.states[newState];
    this.currentState.enter(this.context[0], ...args);
  }

  step() {
    this.currentState.execute(this.context[0]);
  }
}
```

## 4.2 Fighter.ts — Estados Completos

- [ ] **4.2.1** Criar `game/src/entities/Fighter.ts` com:
  - Propriedades: `hp`, `maxHp`, `speed`, `jumpForce`, `isHit`, `isBlocking`, `hitStunTimer`, `throwRange`, `flipX`
  - State Machine com estados: `idle`, `walk`, `jump`, `land`, `crouch`, `stand_LP/MP/HP`, `stand_LK/MK/HK`, `crouch_LP/MP/HP/cLK/cMK/cHK`, `air_LP/MP/HP/LK/MK/HK`, `block_high`, `block_low`, `hit`, `knockdown`, `wakeup`, `dizzy`, `ko`, `win`, `throw`, `thrown`, `special`
  - Hitbox, Hurtbox, Pushbox como propriedades

**Lista de estados com código EXATO:**

### IdleState
```typescript
class IdleState extends State {
  enter(f: Fighter) {
    f.setVelocityX(0);
    f.setTexture(f.spriteMap?.idle ?? f.texture.key);
    f.clearTint();
  }
  execute(f: Fighter) {
    if (!f.inputManager) return;
    const inp = f.inputManager;

    if (inp.isUpJustPressed) { this.stateMachine.transition('jump'); return; }
    if (inp.isDownDown) { this.stateMachine.transition('crouch'); return; }
    if (inp.isLeftDown || inp.isRightDown) { this.stateMachine.transition('walk'); return; }
    if (inp.isThrowJustPressed) { this.stateMachine.transition('throw'); return; }
    if (inp.isSpecialJustPressed) { this.stateMachine.transition('special', '236P'); return; }
    if (inp.isLPJustPressed) { this.stateMachine.transition('stand_LP'); return; }
    if (inp.isMPJustPressed) { this.stateMachine.transition('stand_MP'); return; }
    if (inp.isHPJustPressed) { this.stateMachine.transition('stand_HP'); return; }
    if (inp.isLKJustPressed) { this.stateMachine.transition('stand_LK'); return; }
    if (inp.isMKJustPressed) { this.stateMachine.transition('stand_MK'); return; }
    if (inp.isHKJustPressed) { this.stateMachine.transition('stand_HK'); return; }
  }
}
```

### JumpState (COM FIX DO BUG DE PULO)
```typescript
class JumpState extends State {
  private airFrames = 0;

  enter(f: Fighter) {
    this.airFrames = 0;
    f.setVelocityY(-f.jumpForce);
    if (f.inputManager?.isLeftDown) f.setVelocityX(-f.speed * 0.8);
    else if (f.inputManager?.isRightDown) f.setVelocityX(f.speed * 0.8);
    else f.setVelocityX(0);
  }

  execute(f: Fighter) {
    this.airFrames++;

    // Ataques aéreos
    const inp = f.inputManager;
    if (inp?.isLPJustPressed) { this.stateMachine.transition('air_LP'); return; }
    if (inp?.isMPJustPressed) { this.stateMachine.transition('air_MP'); return; }
    if (inp?.isHPJustPressed) { this.stateMachine.transition('air_HP'); return; }
    if (inp?.isLKJustPressed) { this.stateMachine.transition('air_LK'); return; }
    if (inp?.isMKJustPressed) { this.stateMachine.transition('air_MK'); return; }
    if (inp?.isHKJustPressed) { this.stateMachine.transition('air_HK'); return; }

    // SÓ checar aterrissagem após 8 frames (CORRIGE O BUG DE PULO)
    if (this.airFrames > 8 && f.body && (f.body as any).blocked?.down) {
      this.stateMachine.transition('land');
    }
  }
}
```

### AttackState (Genérico para TODOS os ataques)
```typescript
class AttackState extends State {
  private frame = 0;
  private moveData: MoveData;

  constructor(moveData: MoveData) {
    super();
    this.moveData = moveData;
  }

  enter(f: Fighter) {
    this.frame = 0;
    f.currentHitbox.active = false;
    f.currentHitbox.damage = this.moveData.damage;
    f.currentHitbox.type = this.moveData.type;
    f.currentHitbox.hitLevel = this.moveData.hitLevel;
    f.currentHitbox.knockback = this.moveData.knockback;
    f.currentHitbox.hitstun = this.moveData.hitstun;
    f.currentHitbox.blockstun = this.moveData.blockstun;
    f.currentHitbox.offsetX = this.moveData.hitboxOffset.x;
    f.currentHitbox.offsetY = this.moveData.hitboxOffset.y;
    f.currentHitbox.width = this.moveData.hitboxOffset.w;
    f.currentHitbox.height = this.moveData.hitboxOffset.h;
    f.setTint(0x4444ff); // Startup
  }

  execute(f: Fighter) {
    this.frame++;

    // Frame startup+1: ativar hitbox
    if (this.frame === this.moveData.startup + 1) {
      f.currentHitbox.active = true;
      f.setTint(0xff4444); // Active
    }

    // Frame startup+active+1: desativar hitbox
    if (this.frame === this.moveData.startup + this.moveData.active + 1) {
      f.currentHitbox.active = false;
      f.setTint(0x4444ff); // Recovery
    }

    // Frame total: sair do ataque
    if (this.frame >= this.moveData.startup + this.moveData.active + this.moveData.recovery) {
      f.currentHitbox.active = false;
      f.clearTint();
      this.stateMachine.transition('idle');
    }
  }
}
```

## 4.3 Hitbox/Hurtbox em WORLD-SPACE

- [ ] **4.3.1** Criar `Hitbox.ts` e `Hurtbox.ts`:
```typescript
// Hitbox.ts
export class Hitbox extends Phaser.Geom.Rectangle {
  public active = false;
  public damage = 0;
  public type: string = 'normal';
  public hitLevel: string = 'HIGH';
  public knockback = 100;
  public hitstun = 14;
  public blockstun = 10;
  public offsetX = 0;
  public offsetY = 0;

  updatePosition(fighterX: number, fighterY: number, flipX: boolean) {
    // WORLD-SPACE: calcula posição ABSOLUTA
    const finalOffsetX = flipX ? -(this.offsetX + this.width) : this.offsetX;
    this.x = fighterX + finalOffsetX;
    this.y = fighterY + this.offsetY;
  }
}
```

## 4.4 Pushbox Manual (NÃO usar physics.add.collider entre fighters)

- [ ] **4.4.1** No `update()` da `CombatScene`, ANTES de checar hitboxes:
```typescript
// Pushbox — Impede que passem um pelo outro
const dx = this.player.x - this.enemy.x;
const absDx = Math.abs(dx);
const MIN_DIST = 70;

if (absDx < MIN_DIST) {
  const push = (MIN_DIST - absDx) / 2;
  if (dx > 0) { this.player.x += push; this.enemy.x -= push; }
  else { this.player.x -= push; this.enemy.x += push; }
}

// Auto-Face — Sempre encaram um ao outro
if (!this.player.isHit) this.player.setFlipX(this.player.x > this.enemy.x);
if (!this.enemy.isHit) this.enemy.setFlipX(this.enemy.x > this.player.x);
```

## 4.5 Colisão de Hitbox (CombatSystem.ts)

- [ ] **4.5.1** Criar `CombatSystem.ts`:
```typescript
export class CombatSystem {
  static checkHit(hitbox: Hitbox, hurtbox: Hurtbox): boolean {
    if (!hitbox.active || hurtbox.invincible) return false;
    return Phaser.Geom.Intersects.RectangleToRectangle(hitbox, hurtbox);
  }

  static applyHit(attacker: Fighter, defender: Fighter, hitbox: Hitbox) {
    if (defender.isHit) return;

    const dir = attacker.x < defender.x ? 1 : -1;

    // Checar bloqueio
    if (defender.isBlocking) {
      defender.hitStunTimer = hitbox.blockstun;
      defender.setVelocityX(hitbox.knockback * 0.5 * dir);
      return; // Bloqueou
    }

    // Hit limpo
    defender.hp -= hitbox.damage;
    if (defender.hp < 0) defender.hp = 0;
    defender.setVelocityX(hitbox.knockback * dir);
    defender.hitStunTimer = hitbox.hitstun;
    defender.stateMachine.transition('hit');
    hitbox.active = false; // Evitar multi-hit
  }
}
```

## 4.6 VALIDAÇÃO DA FASE 4

- [ ] **4.6.1** Apertar ↑ faz o personagem subir e descer naturalmente
- [ ] **4.6.2** Dois personagens NÃO passam um pelo outro
- [ ] **4.6.3** Apertar Z (LP) faz o personagem mudar de cor (startup→active→recovery→idle)
- [ ] **4.6.4** Se o personagem atacante chegar perto do inimigo durante o "active frame" (vermelho), a barra de vida do inimigo diminui
- [ ] **4.6.5** A CPU anda em direção ao jogador e ataca

---

# ══════════════════════════════════════
# FASE 5 — PROJÉTEIS
# ══════════════════════════════════════

## 5.1 Projétil com Colisão Manual

- [ ] **5.1.1** Criar `Projectile.ts`:
  - Extende `Phaser.Physics.Arcade.Sprite`
  - `allowGravity = false`
  - `velocityX` definido ao criar (300 px/s)
  - `hitActive = true` (false após acertar alguém)
  - Autodestroí após 3 segundos

- [ ] **5.1.2** No `update()` da CombatScene, checar colisão MANUALMENTE:
```typescript
this.projectiles.getChildren().forEach((child) => {
  const proj = child as Projectile;
  if (!proj.active || !proj.hitActive) return;

  const target = proj.getOwner() === this.player ? this.enemy : this.player;
  const projRect = new Phaser.Geom.Rectangle(proj.x - 20, proj.y - 20, 40, 40);

  if (!target.isHit && !target.currentHurtbox.invincible &&
      Phaser.Geom.Intersects.RectangleToRectangle(projRect, target.currentHurtbox)) {
    target.hp -= proj.damage;
    if (target.hp < 0) target.hp = 0;
    target.stateMachine.transition('hit');
    proj.hitActive = false;
    proj.destroy();
  }
});
```

## 5.2 VALIDAÇÃO DA FASE 5

- [ ] **5.2.1** Apertar V dispara um projétil que viaja na horizontal
- [ ] **5.2.2** O projétil causa dano se acertar o inimigo
- [ ] **5.2.3** O projétil NÃO acerta quem atirou
- [ ] **5.2.4** O projétil desaparece após acertar ou após 3 segundos

---

# ══════════════════════════════════════
# FASE 6 — HUD + MATCH MANAGER
# ══════════════════════════════════════

## 6.1 HUD.ts

- [ ] **6.1.1** Barra de HP do P1 (esquerda, cor verde→amarela→vermelha conforme HP)
- [ ] **6.1.2** Barra de HP do P2 (direita, mesma lógica, cresce da direita para a esquerda)
- [ ] **6.1.3** "Damage lag": barra amarela que acompanha o dano com delay
- [ ] **6.1.4** Timer no centro (99 segundos, fica vermelho nos últimos 10s)
- [ ] **6.1.5** Nome dos personagens acima das barras
- [ ] **6.1.6** Estrelas de vitória: ☆☆ → ★☆ → ★★
- [ ] **6.1.7** Todos os elementos com `setScrollFactor(0)` e `setDepth(100+)`

## 6.2 MatchManager.ts

- [ ] **6.2.1** Best of 3 rounds
- [ ] **6.2.2** Sequência: "ROUND X" → "FIGHT!" → luta → "K.O." → próximo ou fim
- [ ] **6.2.3** Timer 99s → quem tem mais HP ganha o round
- [ ] **6.2.4** P1 ganha 2 → VictoryScene / P1 perde 2 → GameOverScene

## 6.3 VALIDAÇÃO DA FASE 6

- [ ] **6.3.1** Barras de HP aparecem e diminuem ao tomar dano
- [ ] **6.3.2** Timer conta regressivamente
- [ ] **6.3.3** "ROUND 1" e "FIGHT!" aparecem no início
- [ ] **6.3.4** "K.O." aparece quando HP chega a 0

---

# ══════════════════════════════════════
# FASE 7 — TELAS DO JOGO
# ══════════════════════════════════════

## 7.1 MainMenuScene
- [ ] **7.1.1** Título "C&M FIGTH" grande, pulsante
- [ ] **7.1.2** Opções: 1 PLAYER | TREINO | CONTROLES | CONFIGURAÇÕES
- [ ] **7.1.3** Navegação por setas ↑↓ + ENTER (teclado) ou toque (mobile)

## 7.2 CharacterSelectScene
- [ ] **7.2.1** Grid de personagens (Kevin Manja, Vini Dog, ??? travados)
- [ ] **7.2.2** P1 seleciona com ←→ + ENTER
- [ ] **7.2.3** Preview do personagem selecionado (imagem grande)
- [ ] **7.2.4** Após confirmar → CombatScene

## 7.3 VictoryScene
- [ ] **7.3.1** Personagem vencedor no centro
- [ ] **7.3.2** Frase de vitória do personagem
- [ ] **7.3.3** Botão "VOLTAR AO MENU"

## 7.4 GameOverScene
- [ ] **7.4.1** Texto "GAME OVER"
- [ ] **7.4.2** Botão "CONTINUE" e "MENU"

## 7.5 TrainingScene
- [ ] **7.5.1** HP infinito (regenera)
- [ ] **7.5.2** CPU não age (dummy)
- [ ] **7.5.3** Tecla R: reset posições

## 7.6 SettingsScene
- [ ] **7.6.1** Dificuldade CPU: Fácil / Normal / Difícil
- [ ] **7.6.2** Toggle tela cheia
- [ ] **7.6.3** Salvar em localStorage

## 7.7 ControlsScene
- [ ] **7.7.1** Tabela de controles (teclado + gamepad)
- [ ] **7.7.2** Diagrama visual dos botões

## 7.8 VALIDAÇÃO DA FASE 7
- [ ] **7.8.1** Todas as telas navegáveis sem travar
- [ ] **7.8.2** Fluxo completo: Menu → Select → Luta → Vitória → Menu

---

# ══════════════════════════════════════
# FASE 8 — CONTROLES MOBILE (VirtualGamepad)
# ══════════════════════════════════════

## 8.1 Layout

- [ ] **8.1.1** D-Pad (canto inferior esquerdo): 4 botões ←↑↓→, raio 35px, alpha 0.6
- [ ] **8.1.2** Ataques (canto inferior direito): 6 botões em 2 fileiras (LP MP HP / LK MK HK)
- [ ] **8.1.3** Botão SPECIAL separado (acima dos ataques, roxo)
- [ ] **8.1.4** Todos com `setScrollFactor(0)`, `setDepth(2000)`, `setInteractive()`
- [ ] **8.1.5** Feedback visual: escurecer + diminuir escala ao apertar
- [ ] **8.1.6** Só criar se `this.sys.game.device.input.touch === true`

## 8.2 VALIDAÇÃO DA FASE 8

- [ ] **8.2.1** No celular: D-Pad controla o personagem
- [ ] **8.2.2** No celular: botões de ataque disparam ataques
- [ ] **8.2.3** No PC: controles touch NÃO aparecem
- [ ] **8.2.4** Multi-touch funciona (D-Pad + ataque ao mesmo tempo)

---

# ══════════════════════════════════════
# FASE 9 — SPRITES E CENÁRIO
# ══════════════════════════════════════

## 9.1 Regra de Sprites

- **UMA IMAGEM POR POSE.** Nomes: `kevin_idle.png`, `kevin_punch.png`, etc.
- Se não houver sprite, usar retângulo colorido como fallback (já criado no BootScene)
- Sprites devem ter fundo transparente (PNG)
- Tamanho sugerido: ~200x300 pixels por pose

## 9.2 Troca de Sprite por Estado

- [ ] **9.2.1** No Fighter, adicionar `spriteMap: Record<string, string>` carregado do JSON
- [ ] **9.2.2** Cada estado chama `f.setTexture(f.spriteMap.idle)` no `enter()`

## 9.3 Cenário Parallax

- [ ] **9.3.1** Background: `this.add.image(640, 360, 'stage_bg').setScrollFactor(0.1).setDepth(0)`
- [ ] **9.3.2** Middleground: scrollFactor 0.4, depth 1
- [ ] **9.3.3** Floor: scrollFactor 1.0, depth 2
- [ ] **9.3.4** Personagens: depth 10
- [ ] **9.3.5** HUD: depth 100+

## 9.4 VALIDAÇÃO DA FASE 9

- [ ] **9.4.1** Sprites aparecem (ou retângulos coloridos como fallback)
- [ ] **9.4.2** Sprite muda ao atacar/pular/agachar
- [ ] **9.4.3** Parallax funciona: camadas se movem em velocidades diferentes

---

# ══════════════════════════════════════
# FASE 10 — POLISH E DEPLOY
# ══════════════════════════════════════

## 10.1 VFX
- [ ] **10.1.1** Hit spark (flash branco no ponto de impacto)
- [ ] **10.1.2** Camera shake ao acertar HP/HK
- [ ] **10.1.3** Slow motion no KO final (timeScale = 0.15 por 2s)

## 10.2 Performance
- [ ] **10.2.1** 60fps constante
- [ ] **10.2.2** Remover todos os `console.log` antes do build

## 10.3 Deploy
- [ ] **10.3.1** `npm run build` compila sem erros
- [ ] **10.3.2** GitHub Pages exibe o jogo
- [ ] **10.3.3** Funciona no Chrome PC, Firefox PC, Chrome Mobile, Safari iOS

---

# ═══════════════════════════════════════════════════════════════
# SEÇÃO D — FRAME DATA COMPLETA (REFERÊNCIA)
# ═══════════════════════════════════════════════════════════════

| Move   | Startup | Active | Recovery | Damage | Hitstun | Blockstun | Knockback | Cancel | KD  | Hit Level |
|--------|---------|--------|----------|--------|---------|-----------|-----------|--------|-----|-----------|
| LP     | 4       | 4      | 8        | 30     | 14      | 10        | 100       | Yes    | No  | HIGH      |
| MP     | 6       | 5      | 12       | 60     | 18      | 14        | 150       | Yes    | No  | HIGH      |
| HP     | 8       | 6      | 18       | 100    | 22      | 16        | 200       | No     | No  | HIGH      |
| LK     | 5       | 4      | 9        | 35     | 14      | 10        | 120       | Yes    | No  | HIGH      |
| MK     | 7       | 5      | 14       | 70     | 18      | 14        | 160       | Yes    | No  | HIGH      |
| HK     | 10      | 7      | 20       | 110    | 24      | 18        | 220       | No     | No  | HIGH      |
| cLP    | 4       | 4      | 8        | 30     | 14      | 10        | 100       | Yes    | No  | MID       |
| cMP    | 6       | 5      | 12       | 60     | 18      | 14        | 150       | Yes    | No  | MID       |
| cHP    | 8       | 6      | 20       | 90     | 20      | 14        | 200       | No     | No  | HIGH      |
| cLK    | 5       | 4      | 9        | 35     | 14      | 10        | 120       | Yes    | No  | LOW       |
| cMK    | 7       | 5      | 14       | 70     | 18      | 14        | 160       | Yes    | No  | LOW       |
| cHK    | 12      | 5      | 22       | 80     | 0       | 0         | 250       | No     | Yes | LOW       |
| jLP    | 4       | 10     | 0        | 40     | 15      | 11        | 100       | No     | No  | AIR       |
| jMP    | 6       | 8      | 0        | 70     | 19      | 15        | 150       | No     | No  | AIR       |
| jHP    | 8       | 6      | 0        | 110    | 23      | 17        | 200       | No     | No  | AIR       |
| jLK    | 5       | 10     | 0        | 45     | 15      | 11        | 120       | No     | No  | AIR       |
| jMK    | 7       | 8      | 0        | 80     | 19      | 15        | 160       | No     | No  | AIR       |
| jHK    | 10      | 6      | 0        | 120    | 24      | 19        | 220       | No     | No  | AIR       |
| Throw  | 2       | 3      | 20       | 120    | —       | —         | 500       | No     | Yes | UNBLOCK   |
| Spec1  | 20      | 999    | 25       | 80     | 40      | 20        | 300       | No     | No  | HIGH      |
| Spec2  | 4       | 8      | 30       | 120    | 25      | 0         | 400       | No     | Yes | HIGH      |

---

# ═══════════════════════════════════════════════════════════════
# SEÇÃO E — CHECKLIST FINAL (TUDO QUE DEVE FUNCIONAR)
# ═══════════════════════════════════════════════════════════════

### Combate
- [ ] Socos leves, médios e fortes funcionam (Z, X, C)
- [ ] Chutes leves, médios e fortes funcionam (A, S, D)
- [ ] Ataques agachados funcionam (↓ + ataque)
- [ ] Ataques aéreos funcionam (pulo + ataque)
- [ ] Projétil funciona e acerta o inimigo
- [ ] Defesa funciona (segurar ← quando levando hit)
- [ ] Agarrão funciona (LP+LK perto)
- [ ] Barra de vida diminui ao tomar hit

### Movimentação
- [ ] Andar para frente e para trás
- [ ] Pular (neutro, frente, trás)
- [ ] Agachar
- [ ] Personagens não se atravessam
- [ ] Personagens sempre se encaram
- [ ] Personagens não saem da tela

### IA (CPU)
- [ ] CPU anda em direção ao jogador
- [ ] CPU ataca quando perto
- [ ] CPU pula de vez em quando
- [ ] CPU usa projétil quando longe

### Controles
- [ ] Teclado funciona
- [ ] Gamepad Xbox/PS funciona
- [ ] Touch funciona no celular

### UI
- [ ] Barra de HP P1 e P2
- [ ] Timer
- [ ] "ROUND X" e "FIGHT!"
- [ ] "K.O."
- [ ] Menu de pausa (ESC)

### Deploy
- [ ] `npm run build` sem erros
- [ ] GitHub Pages funciona
- [ ] Funciona no Chrome, Firefox, Safari (PC e Mobile)

---

*Última atualização: 01/10/2026 — v2.0 — Reescrito com base na análise real do código-fonte e diagnóstico de todos os bugs.*
