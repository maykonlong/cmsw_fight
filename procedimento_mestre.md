# CMSW FIGHT — PROCEDIMENTO MESTRE TÉCNICO
## Guia de Implementação Completo (Street Fighter II Architecture)

> **Princípio central:** O MOTOR é único e genérico. Os PERSONAGENS são dados (JSON + sprites).
> Uma IA deve ler este arquivo, executar cada item `[ ]` na ordem, e marcar `[x]` ao concluir.
> Nunca pular itens. Nunca misturar ENGINE com CONTEÚDO.

---

## LEGENDA
- `[ ]` Não iniciado
- `[x]` Concluído
- `[~]` Em andamento
- `[!]` Bloqueado

---

# ══════════════════════════════════════
# FASE 0 — ARQUITETURA E ESTRUTURA BASE
# ══════════════════════════════════════

## 0.1 Princípio Arquitetural (NÃO PULAR)

O jogo funciona assim:

```
ENGINE (único, genérico)
    +
CHARACTER DATA (JSON + sprites)
    +
STAGE DATA (JSON + imagens)
    =
JOGO FUNCIONAL
```

**Isso significa:** adicionar um novo personagem = criar um JSON + sprites. Sem tocar no motor.

## 0.2 Estrutura de Pastas

- [x] **0.2.1** Criar estrutura definitiva de pastas:
```
game/
├── src/
│   ├── core/
│   │   ├── GameLoop.ts
│   │   ├── StateMachine.ts
│   │   ├── InputManager.ts
│   │   ├── InputBuffer.ts          ← NOVO
│   │   ├── CommandRecognizer.ts    ← NOVO
│   │   ├── AssetManager.ts         ← NOVO
│   │   └── AudioManager.ts         ← NOVO
│   ├── engine/
│   │   ├── Fighter.ts              ← genérico
│   │   ├── Hitbox.ts               ← NOVO
│   │   ├── Hurtbox.ts              ← NOVO
│   │   ├── Pushbox.ts              ← NOVO
│   │   ├── Projectile.ts
│   │   ├── CombatSystem.ts         ← NOVO
│   │   ├── DamageSystem.ts         ← NOVO
│   │   ├── StunSystem.ts           ← NOVO
│   │   ├── ComboCounter.ts         ← NOVO
│   │   ├── Camera.ts               ← NOVO
│   │   └── VFXManager.ts           ← NOVO
│   ├── ai/
│   │   ├── CPUController.ts        ← NOVO
│   │   ├── AIPerception.ts         ← NOVO
│   │   └── AIDecision.ts           ← NOVO
│   ├── scenes/
│   │   ├── BootScene.ts            [x] feito
│   │   ├── MainMenuScene.ts        [x] feito
│   │   ├── CharacterSelectScene.ts [x] feito
│   │   ├── VsScene.ts              [x] feito
│   │   ├── CombatScene.ts          [x] feito
│   │   ├── VictoryScene.ts         ← NOVO
│   │   ├── GameOverScene.ts        ← NOVO
│   │   ├── TrainingScene.ts        ← NOVO
│   │   ├── SettingsScene.ts        ← NOVO
│   │   └── ControlsScene.ts        ← NOVO
│   ├── ui/
│   │   ├── HUD.ts                  ← NOVO (extrair da CombatScene)
│   │   ├── VirtualGamepad.ts       [x] feito
│   │   └── ComboDisplay.ts         ← NOVO
│   └── data/
│       ├── characters/
│       │   ├── kevin.json           ← NOVO
│       │   └── vini_dog.json        ← NOVO
│       └── stages/
│           └── cmsw_hq.json         ← NOVO
└── public/
    └── assets/
        ├── sprites/
        │   ├── characters/
        │   │   ├── kevin/
        │   │   └── vini_dog/
        │   └── stages/
        │       └── cmsw_hq/
        ├── audio/
        │   ├── music/
        │   ├── sfx/
        │   └── voice/
        └── effects/
```

---

# ══════════════════════════════════════
# FASE 1 — SISTEMA DE INPUT
# ══════════════════════════════════════
> Referência: Seções 3, 4, 83, 84, 85, 86 do Manual SF2

## 1.1 Mapeamento de Botões (6 botões + 8 direções)

```
SOCOS: LP(Z) | MP(X) | HP(C)
CHUTES: LK(A) | MK(S) | HK(D)
ESPECIAL: V
DIRECIONAL: ←↑↓→ (+ diagonais)

P2 TECLADO: U/I/O (socos) | J/K/L (chutes) | Numpad 4/8/2/6
GAMEPAD: X=LP | Y=MP | RB=HP | A=LK | B=MK | RT=HK | LB=Especial
```

Notação numérica (Numpad):
```
7=↖  8=↑  9=↗
4=←  5=NEUTRO  6=→
1=↙  2=↓  3=↘
```

- [x] **1.1.1** InputManager.ts com LP, MP, HP, LK, MK, HK, HKSpecial mapeados
- [x] **1.1.2** Adicionar LK(A), MK(S) ao InputManager (faltam chutes separados)
- [x] **1.1.3** Adicionar virtualLKJustPressed, virtualMKJustPressed ao VirtualGamepad

## 1.2 Input Buffer (Sistema de Janela de Frames)

- [x] **1.2.1** Criar `InputBuffer.ts`:
```typescript
// Guarda os últimos 60 frames de input
interface BufferedInput { direction: string; buttons: string[]; frame: number; }
class InputBuffer {
    private buffer: BufferedInput[] = [];
    push(input: BufferedInput): void;
    getWindow(frames: number): BufferedInput[]; // últimos N frames
    clear(): void;
}
```
- [x] **1.2.2** InputBuffer descarta entradas com mais de 60 frames
- [x] **1.2.3** InputBuffer.push() chamado a cada frame no update()

## 1.3 Command Recognizer (Reconhecimento de Comandos Especiais)

- [x] **1.3.1** Criar `CommandRecognizer.ts`:
```typescript
interface CommandDefinition {
    name: string;
    sequence: string[]; // ex: ['2','3','6','P']
    windowFrames: number; // janela de execução (ex: 15)
}
```
- [x] **1.3.2** Implementar `236P` (Quarto de círculo frente + soco) = Especial Kevin
- [x] **1.3.3** Implementar `214K` (Quarto de círculo trás + chute) = Especial Vini Dog
- [x] **1.3.4** Implementar `623P` (Dragon Punch = →↓↘+P) = Uppercut especial Kevin
- [x] **1.3.5** As direções devem ser relativas ao lado que o personagem está olhando (espelhar se facing left)
- [x] **1.3.6** Comandos de carga (`charge_back_forward`): detectar 1.5s segurado na direção + botão
- [ ] **1.3.7** Sistema de prioridade: THROW > SPECIAL > NORMAL quando múltiplos possíveis

---

# ══════════════════════════════════════
# FASE 2 — SISTEMA DE COLISÃO (3 BOXES)
# ══════════════════════════════════════
> Referência: Seção 11 do Manual SF2

## 2.1 As 3 Áreas Invisíveis

```
HITBOX   = área que CAUSA dano
HURTBOX  = área que RECEBE dano
PUSHBOX  = área que impede sobreposição física
```

- [x] **2.1.1** Criar `Hitbox.ts`: retângulo com `x, y, w, h, active, damage, type`
- [x] **2.1.2** Criar `Hurtbox.ts`: retângulo com `x, y, w, h, invincible`
- [x] **2.1.3** Criar `Pushbox.ts`: retângulo central do personagem para colisão física
- [ ] **2.1.4** Cada Fighter tem 1 Pushbox + N Hurtboxes + N Hitboxes (variáveis por frame de animação)
- [x] **2.1.5** CombatSystem verifica: `Hitbox A ∩ Hurtbox B` (não sprite vs sprite)
- [x] **2.1.6** PushboxSystem verifica: `Pushbox A ∩ Pushbox B` → separar personagens
- [ ] **2.1.7** Debug mode (tecla H): desenhar hitboxes (vermelho), hurtboxes (verde), pushbox (azul)

---

# ══════════════════════════════════════
# FASE 3 — FRAME DATA DOS ATAQUES
# ══════════════════════════════════════
> Referência: Seção 38 do Manual SF2

## 3.1 Estrutura de Move Data

Cada ataque deve ter:

```typescript
interface MoveData {
    id: string;
    name: string;
    input: string;        // 'LP' | 'MP' | 'HP' | 'LK' | 'MK' | 'HK'
    type: 'normal' | 'special' | 'super' | 'throw';
    hitLevel: 'HIGH' | 'MID' | 'LOW' | 'AIR' | 'UNBLOCKABLE';
    startup: number;      // frames antes de ser ativo
    active: number;       // frames ativos (causa dano)
    recovery: number;     // frames de recuperação
    damage: number;       // dano em HP
    chipDamage: number;   // dano ao bloquear (geralmente 0 para normais)
    hitstun: number;      // frames que o inimigo fica em hit stun
    blockstun: number;    // frames que o inimigo fica em block stun
    knockback: number;    // força de empurrão
    cancelable: boolean;  // pode cancelar em especial
    knockdown: boolean;   // derruba o oponente
    hitboxOffset: { x: number; y: number; w: number; h: number };
    animation: string;    // nome da animação
    soundHit: string;     // SFX ao acertar
    soundBlock: string;   // SFX ao bloquear
    effect: string;       // VFX ao acertar
}
```

- [x] **3.1.1** Criar `src/data/moves/base_moves.ts` com todos os ataques comuns
- [x] **3.1.2** Ataques de pé: LP, MP, HP, LK, MK, HK com frame data completa
- [x] **3.1.3** Ataques agachados: cLP, cMP, cHP, cLK, cMK, cHK
- [x] **3.1.4** Ataques aéreos: jLP, jMP, jHP, jLK, jMK, jHK
- [x] **3.1.5** Todos os ataques usam o mesmo sistema de frame counting via StateMachine

## 3.2 Tabela de Frame Data Base

| Move   | Startup | Active | Recovery | Damage | Hitstun | Blockstun | Chip | Knockdown |
|--------|---------|--------|----------|--------|---------|-----------|------|-----------|
| LP     | 4       | 4      | 8        | 30     | 14      | 10        | 0    | No        |
| MP     | 6       | 5      | 12       | 60     | 18      | 14        | 0    | No        |
| HP     | 8       | 6      | 18       | 100    | 22      | 16        | 0    | No        |
| LK     | 5       | 4      | 9        | 35     | 14      | 10        | 0    | No        |
| MK     | 7       | 5      | 14       | 70     | 18      | 14        | 0    | No        |
| HK     | 10      | 7      | 20       | 110    | 24      | 18        | 0    | No        |
| cHP    | 8       | 6      | 20       | 90     | 20      | 14        | 0    | No        |
| cHK    | 12      | 5      | 22       | 80     | 0       | 0         | 0    | **Yes**   |
| Special| 20      | 8      | 15       | 80     | 28      | 20        | 8    | No        |

- [x] **3.2.1** Implementar frame data da tabela acima no `base_moves.ts`
- [x] **3.2.2** Cada move executa por `startup+active+recovery` frames exatos

---

# ══════════════════════════════════════
# FASE 4 — MÁQUINA DE ESTADOS COMPLETA
# ══════════════════════════════════════
> Referência: Seções 6, 7, 8, 9, 10 do Manual SF2

## 4.1 Estados Completos do Fighter

```
IDLE
├── WALK_FORWARD
├── WALK_BACKWARD
├── JUMP_NEUTRAL
├── JUMP_FORWARD
├── JUMP_BACKWARD
│
├── CROUCH
│
├── [ATAQUES DE PÉ]
│   ├── STAND_LP
│   ├── STAND_MP
│   ├── STAND_HP
│   ├── STAND_LK
│   ├── STAND_MK
│   └── STAND_HK
│
├── [ATAQUES AGACHADOS]
│   ├── CROUCH_LP
│   ├── CROUCH_MP
│   ├── CROUCH_HP
│   ├── CROUCH_LK
│   ├── CROUCH_MK
│   └── CROUCH_HK
│
├── [ATAQUES AÉREOS]
│   ├── AIR_LP
│   ├── AIR_MP
│   ├── AIR_HP
│   ├── AIR_LK
│   ├── AIR_MK
│   └── AIR_HK
│
├── [DEFESA]
│   ├── BLOCK_HIGH
│   └── BLOCK_LOW
│
├── [ESPECIAIS]
│   ├── SPECIAL_1
│   ├── SPECIAL_2
│   └── SPECIAL_3
│
├── [THROW]
│   ├── THROW
│   └── THROWN
│
├── [RECEBEU DANO]
│   ├── HIT_LIGHT
│   ├── HIT_HEAVY
│   ├── KNOCKDOWN
│   ├── WAKEUP
│   └── DIZZY
│
└── [FIM DE ROUND]
    ├── KO
    ├── WIN
    └── TAUNT
```

- [x] **4.1.1** Reescrever Fighter.ts usando dados do JSON do personagem (não hardcoded)
- [x] **4.1.2** Implementar todos os 6 ataques de pé como estados independentes
- [x] **4.1.3** Implementar todos os 6 ataques agachados como estados independentes
- [x] **4.1.4** Implementar todos os 6 ataques aéreos como estados independentes
- [x] **4.1.5** BlockHigh vs BlockLow (verificar hitLevel do ataque recebido)
- [x] **4.1.6** DIZZY/STUN state: após receber dano suficiente, personagem fica zonzo (estrelas girando)
- [x] **4.1.7** Método `autoFaceOpponent()`: virar para o inimigo durante IDLE e WALK
- [x] **4.1.8** LAND state: frame de pouso após jump (2-3f sem poder agir)

## 4.2 Sistema de Phases do Ataque

Cada estado de ataque deve contar frames e transicionar automaticamente:

```
enter() → startup frames
  ↓ (startup completo)
active frames (hitbox ON)
  ↓ (active completo)
recovery frames (hitbox OFF)
  ↓ (recovery completo)
transition('idle')
```

- [x] **4.2.1** Criar `AttackState` genérico que recebe `MoveData` como parâmetro
- [x] **4.2.2** `AttackState` ativa hitbox no frame `startup+1`
- [x] **4.2.3** `AttackState` desativa hitbox no frame `startup+active+1`
- [x] **4.2.4** `AttackState` transiciona para idle no frame `startup+active+recovery`
- [x] **4.2.5** Janela de cancel: durante `cancelWindow`, se detectar especial → cancelar recovery

---

# ══════════════════════════════════════
# FASE 5 — SISTEMA DE COMBATE COMPLETO
# ══════════════════════════════════════
> Referência: Seções 17-36 do Manual SF2

## 5.1 CombatSystem.ts

- [x] **5.1.1** Criar `CombatSystem.ts` que centraliza toda lógica de combate (tirar da CombatScene)
- [x] **5.1.2** `checkHitboxCollision(attackerHitbox, defenderHurtbox)` → retorna HitResult
- [x] **5.1.3** `checkPushbox(fighter1, fighter2)` → separar se sobrepostos
- [x] **5.1.4** `checkThrowRange(thrower, target)` → `distance < thrower.throwRange`
- [x] **5.1.5** `applyHit(attacker, defender, move)` → aplica dano, hitstun, knockback

## 5.2 Sistema de Dano

- [x] **5.2.1** Criar `DamageSystem.ts` (Feito no CombatSystem)
- [x] **5.2.2** `calculateDamage(base, isCounterHit, isChip)`:
  - Normal hit: `damage = move.damage`
  - Counter hit: `damage = move.damage * 1.25`
  - Chip damage (bloqueado): `damage = move.chipDamage`
- [x] **5.2.3** Aplicar dano ao `fighter.hp` (nunca ir abaixo de 0)
- [ ] **5.2.4** Atualizar barra de HP imediatamente e disparar evento `onDamageTaken`

## 5.3 Hit Levels

- [x] **5.3.1** Definir `hitLevel` por ataque: `HIGH | MID | LOW | AIR | UNBLOCKABLE`
- [x] **5.3.2** `BLOCK_HIGH` bloqueia: `HIGH` e `MID` — NÃO bloqueia `LOW`
- [x] **5.3.3** `BLOCK_LOW` bloqueia: `LOW` e `MID` — NÃO bloqueia `HIGH`
- [x] **5.3.4** Ataques aéreos (`AIR`) passam pelo bloqueio agachado apenas em certas circunstâncias
- [x] **5.3.5** `UNBLOCKABLE` (throws): nunca podem ser bloqueados

## 5.4 BlockStun e HitStun

- [x] **5.4.1** Ao acertar: defender entra em HIT state por `move.hitstun` frames
- [x] **5.4.2** Ao bloquear: defender entra em BLOCK state por `move.blockstun` frames
- [x] **5.4.3** Durante hitstun/blockstun: sem input aceito
- [x] **5.4.4** Chip damage: aplicar `move.chipDamage` mesmo ao bloquear
- [x] **5.4.5** Pushback ao bloquear: ambos recuam levemente (evitar corner lock fácil)

## 5.5 Counter Hit

- [x] **5.5.1** CounterHit: detectar se `defender.stateMachine.state` começa com `STAND_` ou `CROUCH_` e ainda está em `startup frames`
- [x] **5.5.2** Se counter hit: aplicar `1.25×` dano + `+8 frames` de hitstun extra
- [ ] **5.5.3** Exibir texto "COUNTER!" em laranja na tela por 1.5s

## 5.6 Throws (Agarrões)

- [x] **5.6.1** ThrowSystem: verificar `distance < fighter.throwRange` e `LP+LK simultâneos`
- [x] **5.6.2** ThrowForward: jogar inimigo para frente → `THROWN` state com velocidade +500
- [ ] **5.6.3** ThrowBackward (← + LP+LK): jogar para trás
- [ ] **5.6.4** ThrowEscape: janela de 8f após receber throw input para escapar (ambos saem sem dano)
- [x] **5.6.5** Throws são `UNBLOCKABLE`
- [x] **5.6.6** Throw causa knockdown imediato

## 5.7 Knockdown e Wakeup

- [x] **5.7.1** `KnockdownState`: personagem cai com animação (angle 90° + velocity X decrescente)
- [ ] **5.7.2** Hard knockdown (cHK, Throws): 50 frames no chão, não pode agir
- [ ] **5.7.3** Soft knockdown (normais que derrubam): 30f ou apertar botão para `quickrise`
- [x] **5.7.4** `WakeupState`: 15 frames de invencibilidade ao levantar
- [ ] **5.7.5** Oponente não pode atacar nos primeiros 10f do wakeup (fair play)

## 5.8 Stun / Dizzy

- [ ] **5.8.1** Cada personagem tem `stunMeter` (máx 200)
- [ ] **5.8.2** Cada hit adiciona `move.stunValue` ao `stunMeter`
- [ ] **5.8.3** `stunMeter` decai naturalmente 2 pontos/frame quando não está em hitstun
- [ ] **5.8.4** Se `stunMeter >= 200`: entrar em `DIZZY` state
- [x] **5.8.5** `DIZZY`: personagem zanzando por 120 frames, estrelas girando acima da cabeça
- [ ] **5.8.6** Durante DIZZY: pode apertar botões para sair mais rápido (-2f por input)
- [ ] **5.8.7** `stunMeter` reseta ao entrar em DIZZY

## 5.9 Combo Counter

- [ ] **5.9.1** Criar `ComboCounter.ts`
- [ ] **5.9.2** Hit consecutivo enquanto oponente está em hitstun → incrementar `comboCount`
- [ ] **5.9.3** `comboCount` reseta quando: oponente se recupera, toca o chão, round termina
- [ ] **5.9.4** Exibir "2 HIT" / "3 HIT" etc. na tela com animação de entrada
- [ ] **5.9.5** Som de tick a cada hit do combo

## 5.10 Cancel Window

- [x] **5.10.1** Ataques com `cancelable: true` têm uma janela após o frame ativo
- [x] **5.10.2** Durante cancel window, se reconhecer comando especial → executar especial + ignorar recovery do normal
- [x] **5.10.3** Combos possíveis: LP → especial, MP → especial (conforme cancelable = true no JSON)

---

# ══════════════════════════════════════
# FASE 6 — DADOS DOS PERSONAGENS (JSON)
# ══════════════════════════════════════
> Referência: Seções 89, 107, 108, 109 do Manual SF2

## 6.1 Schema do Personagem JSON

- [x] **6.1.1** Criar `src/data/characters/kevin.json`:

```json
{
  "id": "kevin",
  "name": "KEVIN",
  "catchphrase": "Cadê meu sabonete?",
  "archetype": "Balanced",
  "health": 1000,
  "stunMax": 200,
  "throwRange": 60,
  "movement": {
    "walkForward": 250,
    "walkBackward": 180,
    "jumpVelocityY": -750,
    "jumpVelocityX": 220,
    "weight": 1.0
  },
  "sprites": {
    "idle": "assets/sprites/characters/kevin/idle.png",
    "punch": "assets/sprites/characters/kevin/punch.png",
    "kick": "assets/sprites/characters/kevin/kick.png",
    "crouch": "assets/sprites/characters/kevin/crouch.png",
    "jump": "assets/sprites/characters/kevin/jump.png",
    "hit": "assets/sprites/characters/kevin/hit.png",
    "ko": "assets/sprites/characters/kevin/ko.png",
    "win": "assets/sprites/characters/kevin/win.png",
    "portrait": "assets/sprites/characters/kevin/portrait.png"
  },
  "normals": ["LP","MP","HP","LK","MK","HK"],
  "crouchNormals": ["cLP","cMP","cHP","cLK","cMK","cHK"],
  "airNormals": ["jLP","jMP","jHP","jLK","jMK","jHK"],
  "specials": [
    {
      "id": "aura_beijo",
      "name": "Beijo Elétrico",
      "command": "236P",
      "type": "projectile",
      "damage": 80,
      "chipDamage": 8,
      "startup": 20,
      "active": 999,
      "recovery": 25,
      "hitstun": 40,
      "blockstun": 20,
      "electricEffect": true,
      "cooldown": 90,
      "projectileSpeed": 450,
      "sprite": "assets/sprites/effects/projectile_kevin.png"
    },
    {
      "id": "uppercut_especial",
      "name": "Encontrão",
      "command": "623P",
      "type": "reversal",
      "damage": 120,
      "chipDamage": 12,
      "startup": 4,
      "active": 8,
      "recovery": 30,
      "hitstun": 25,
      "blockstun": 0,
      "invincibleFrames": 4,
      "knockdown": true
    }
  ],
  "throws": {
    "forward": { "damage": 120, "knockdown": true },
    "backward": { "damage": 110, "knockdown": true }
  },
  "intro": { "animation": "idle", "phrase": "" },
  "victory": { "animation": "win", "phrase": "Cadê meu sabonete?" },
  "defeat": { "animation": "ko", "phrase": "" }
}
```

- [x] **6.1.2** Criar `src/data/characters/vini_dog.json` com mesmo schema
- [x] **6.1.3** Criar `CharacterLoader.ts`: lê o JSON e instancia o Fighter configurado
- [x] **6.1.4** Fighter.ts não deve ter NENHUM dado hardcoded de Kevin ou Vini Dog

## 6.2 Sprites Obrigatórios por Personagem

Todo personagem DEVE ter (contrato mínimo):
- [ ] **6.2.1** `idle.png` — postura de espera
- [ ] **6.2.2** `walk_forward.png` — andando frente
- [ ] **6.2.3** `walk_backward.png` — andando trás
- [ ] **6.2.4** `jump.png` — no ar
- [ ] **6.2.5** `crouch.png` — agachado
- [ ] **6.2.6** `punch.png` — soco (serve para LP/MP/HP com tint/scale)
- [ ] **6.2.7** `kick.png` — chute (serve para LK/MK/HK)
- [ ] **6.2.8** `air_attack.png` — ataque aéreo
- [ ] **6.2.9** `crouch_attack.png` — ataque agachado
- [ ] **6.2.10** `block_high.png` — defesa em pé
- [ ] **6.2.11** `block_low.png` — defesa agachada
- [ ] **6.2.12** `hit.png` — levando pancada
- [ ] **6.2.13** `ko.png` — caído no chão
- [ ] **6.2.14** `win.png` — pose de vitória
- [ ] **6.2.15** `portrait.png` — retrato 80×80px para HUD
- [ ] **6.2.16** `portrait_large.png` — retrato 200×200px para char select

## 6.3 Geração de Sprites do Kevin (SESSÃO ATUAL)

- [x] **6.3.1** Kevin Idle gerado (versão anterior — verificar se tem roupa de quebrada)
- [!] **6.3.2** **REGEN** Kevin Idle: regata branca, jeans escuro, tênis, corrente dourada, loiro — SEM roupa de luta (BLOCKED: API QUOTA)
- [!] **6.3.3** Kevin Punch: mesma roupa, braço estendido lateralmente (BLOCKED: API QUOTA)
- [!] **6.3.4** Kevin Kick: perna estendida lateral (BLOCKED: API QUOTA)
- [!] **6.3.5** Kevin Crouch: agachado, braços na frente (BLOCKED: API QUOTA)
- [!] **6.3.6** Kevin Jump: no ar, joelhos dobrados (BLOCKED: API QUOTA)
- [!] **6.3.7** Kevin Hit: cabeça pro lado, braços abertos (BLOCKED: API QUOTA)
- [!] **6.3.8** Kevin KO: deitado no chão (BLOCKED: API QUOTA)
- [!] **6.3.9** Kevin Win: pulando com os braços para cima (BLOCKED: API QUOTA)
- [!] **6.3.10** Kevin Portrait: rosto em close, 80×80px (BLOCKED: API QUOTA)
- [ ] **6.3.11** Processar todos com `scripts/remove_green.js` → remover fundo → PNG transparente
- [ ] **6.3.12** Salvar em `game/public/assets/sprites/characters/kevin/`

## 6.4 Geração de Sprites do Vini Dog

- [x] **6.4.1** Vini Dog Idle gerado (verificar qualidade)
- [!] **6.4.2** **REGEN** Vini Dog Idle: boné virado, camiseta preta "MCD+Racionais", bermuda cinza, moreno (BLOCKED: API QUOTA)
- [!] **6.4.3** Vini Dog Punch (BLOCKED: API QUOTA)
- [!] **6.4.4** Vini Dog Kick (BLOCKED: API QUOTA)
- [!] **6.4.5** Vini Dog Crouch (BLOCKED: API QUOTA)
- [!] **6.4.6** Vini Dog Jump (BLOCKED: API QUOTA)
- [!] **6.4.7** Vini Dog Hit (BLOCKED: API QUOTA)
- [!] **6.4.8** Vini Dog KO (BLOCKED: API QUOTA)
- [!] **6.4.9** Vini Dog Win: de costas, boné na mão, fumaça de vape (BLOCKED: API QUOTA)
- [!] **6.4.10** Vini Dog Portrait (BLOCKED: API QUOTA)
- [ ] **6.4.11** Processar e salvar em `game/public/assets/sprites/characters/vini_dog/`

---

# ══════════════════════════════════════
# FASE 7 — STAGE DATA JSON
# ══════════════════════════════════════
> Referência: Seções 65-67, 101-104 do Manual SF2

## 7.1 Schema do Stage JSON

- [x] **7.1.1** Criar `src/data/stages/cmsw_hq.json`:

```json
{
  "id": "cmsw_hq",
  "name": "C&M Software HQ",
  "music": "assets/audio/music/stage_cmsw.ogg",
  "groundY": 590,
  "leftBoundary": 80,
  "rightBoundary": 1200,
  "width": 1280,
  "layers": [
    {
      "id": "sky",
      "image": "assets/sprites/stages/cmsw_hq/sky.png",
      "parallaxX": 0.05,
      "parallaxY": 0,
      "depth": 0
    },
    {
      "id": "building",
      "image": "assets/sprites/stages/cmsw_hq/building.png",
      "parallaxX": 0.1,
      "depth": 1
    },
    {
      "id": "crowd",
      "image": "assets/sprites/stages/cmsw_hq/crowd.png",
      "parallaxX": 0.3,
      "depth": 2,
      "animation": "bounce",
      "animSpeed": 0.8
    },
    {
      "id": "floor",
      "image": "assets/sprites/stages/cmsw_hq/floor.png",
      "parallaxX": 1.0,
      "depth": 3
    }
  ],
  "ambientEffects": [
    { "type": "leaves", "count": 8, "speed": 0.5 }
  ]
}
```

- [x] **7.1.2** Criar `StageLoader.ts` que lê o JSON e monta o cenário
- [x] **7.1.3** `CombatScene` não deve ter nenhum cenário hardcoded — tudo via JSON

## 7.2 Geração de Assets do Stage CMSW

- [x] **7.2.1** Background gerado (`stage_bg.png`) — verificar qualidade
- [!] **7.2.2** **REGEN** cenário completo baseado na foto real `imagens_ref/cenários_ref/cmsw_1.png` (BLOCKED: API QUOTA)
- [!] **7.2.3** Separar em camadas: `sky.png`, `building.png`, `crowd.png`, `floor.png` (BLOCKED: API QUOTA)
- [x] **7.2.4** (Código) Implementar parallax 4 camadas
- [x] **7.2.5** (Código) Animação da multidão: Tween Y oscillating ±4px, velocidades diferentes por grupo
- [x] **7.2.6** (Código) Sombra oval abaixo de cada personagem
- [x] **7.2.7** (Código) Camera: seguir os dois personagens, zoom out quando distantes, zoom in quando próximos

---

# ══════════════════════════════════════
# FASE 8 — VFX E EFEITOS VISUAIS
# ══════════════════════════════════════
> Referência: Seção 69 do Manual SF2

## 8.1 VFXManager.ts

- [x] **8.1.1** Criar `VFXManager.ts` com pool de 30 efeitos reutilizáveis
- [x] **8.1.2** `spawnHitSpark(x, y, type: 'light'|'medium'|'heavy')`: escala proporcional à força
- [x] **8.1.3** `spawnBlockSpark(x, y)`: azul/branco, menor
- [x] **8.1.4** `spawnDustCloud(x, y)`: 4-6 partículas ao aterrissar
- [ ] **8.1.5** `spawnElectricEffect(fighter)`: raios pulsando ao redor, 40 frames
- [x] **8.1.6** `hitStop(frames)`: `scene.physics.world.pause()` por N frames, depois resume
- [x] **8.1.7** `cameraShake(intensity)`: LP=0.005 | MP=0.012 | HP=0.022 | Especial=0.03
- [x] **8.1.8** `screenFlash(duration)`: `cameras.main.flash(duration, 255, 255, 255)`
- [x] **8.1.9** `slowMotion(duration)`: `scene.time.timeScale = 0.15` por duration ms (para KO final)
- [x] **8.1.10** `showComboText(count, x, y)`: "2 HIT!" "3 HIT!" com tween de entrada
- [x] **8.1.11** `showCounterText(x, y)`: "COUNTER!" laranja
- [ ] **8.1.12** `showPerfectText()`: "PERFECT!" dourado cintilante centralizado

## 8.2 VFX Sprites Necessários

- [!] **8.2.1** Gerar `hit_spark_light.png` (estrelinhas pequenas) (BLOCKED: API QUOTA)
- [!] **8.2.2** Gerar `hit_spark_medium.png` (estrelas médias laranja) (BLOCKED: API QUOTA)
- [!] **8.2.3** Gerar `hit_spark_heavy.png` (explosão grande amarela) (BLOCKED: API QUOTA)
- [!] **8.2.4** Gerar `block_spark.png` (faíscas azuis/brancas) (BLOCKED: API QUOTA)
- [!] **8.2.5** Gerar `dust_cloud.png` (nuvem de pó) (BLOCKED: API QUOTA)
- [!] **8.2.6** Gerar `projectile_kevin.png` (coração rosa elétrico) (BLOCKED: API QUOTA)
- [!] **8.2.7** Gerar `projectile_vini.png` (cachorro laranja energético) (BLOCKED: API QUOTA)
- [ ] **8.2.8** Processar todos via `scripts/remove_green.js`
- [ ] **8.2.9** Salvar em `game/public/assets/effects/`

---

# ══════════════════════════════════════
# FASE 9 — HUD COMPLETO
# ══════════════════════════════════════
> Referência: Seções 40-47 do Manual SF2

## 9.1 HUD.ts (Extrair da CombatScene)

```
┌─────────────────────────────────────────────────────────────────┐
│ [★☆] [PORTRAIT P1] [████████████████░░░░░░] 72 [░░░░████████] [PORTRAIT P2] [★★]│
│        KEVIN                                        VINI DOG  │
└─────────────────────────────────────────────────────────────────┘
```

- [x] **9.1.1** Criar `HUD.ts` como classe separada instanciada pela CombatScene
- [x] **9.1.2** `HP bar P1`: largura varia de 0 a 440px conforme `player.hp / player.maxHp`
- [x] **9.1.3** `HP bar P2`: espelhada, cresce da direita para o centro
- [x] **9.1.4** Cor da barra: `>50%` = verde | `>25%` = amarelo | `≤25%` = vermelho (piscando)
- [x] **9.1.5** **Damage Lag**: barra amarela que drena devagar após receber dano (SF4 style)
  ```typescript
  // damageBuffer acumula dano
  // a cada frame: damageBuffer -= 3 (drena visualmente)
  ```
- [ ] **9.1.6** Portraits nos cantos extremos (80×80px, borda colorida P1=azul, P2=vermelho)
- [x] **9.1.7** Nomes dos personagens acima das barras
- [x] **9.1.8** Indicador de rounds: 2 ícones ★/☆ abaixo do nome
- [x] **9.1.9** Timer: caixa preta centralizada no topo, número amarelo, pisca vermelho < 10s
- [ ] **9.1.10** Stun meter (opcional): barra menor abaixo da HP bar

---

# ══════════════════════════════════════
# FASE 10 — SISTEMA DE ROUNDS (BEST OF 3)
# ══════════════════════════════════════
> Referência: Seções 39-45, 60-64 do Manual SF2

## 10.1 MatchManager.ts

- [x] **10.1.1** Criar `MatchManager.ts` com variáveis: `p1Wins`, `p2Wins`, `currentRound`, `p1HP`, `p2HP`
- [x] **10.1.2** `RoundStartSequence`:
  1. Bloqueio de input (2.5s)
  2. "ROUND X" aparece + disappears (1s)
  3. "FIGHT!" explode (0.8s)
  4. Liberar input
  5. Iniciar timer
- [x] **10.1.3** Timer só começa APÓS "FIGHT!" desaparecer
- [x] **10.1.4** `RoundEndSequence`:
  1. HitStop 800ms
  2. Câmera shake
  3. Slow motion 0.2× por 600ms
  4. "K.O." animado
  5. Espera 1.5s
  6. Verificar condição de fim de partida
  7. Se match continua: reiniciar round com HP cheio
- [x] **10.1.5** Condições:
  - KO: HP = 0 → round termina
  - Time Over: timer = 0 → maior HP ganha
  - Double KO: ambos = 0 → ambos +1 estrela (draw round)
  - Perfect: vencer sem tomar dano → "PERFECT!" dourado (falta text, mas lógica base pronta)
  - 2 vitórias → VictoryScene (reset por enquanto)
- [x] **10.1.6** Máximo 3 rounds (round 3 = tiebreak)

---

# ══════════════════════════════════════
# FASE 11 — IA DO INIMIGO
# ══════════════════════════════════════
> Referência: Seções 72-75 do Manual SF2

## 11.1 CPUController.ts

- [x] **11.1.1** Criar `CPUController.ts` que implementa a mesma interface do `InputManager`
- [x] **11.1.2** `AIPerception`: observar `distance, opponentState, ownHP, opponentHP, timer, position`
- [x] **11.1.3** `AIDecision` — árvore de decisão básica:
```
SE distance > 350 → avançar
SE distance < 60 → throw (prob 40%)
SE opponent.attacking AND distance < 200 → bloquear
SE distance 100-350 AND cooldown OK → atacar
SE próprio HP < 20% → usar especial
SE aleatório a cada 180f → pular
```
- [x] **11.1.4** Dificuldade: (implementado de forma base)
  - Fácil: reaction 30f | defesa 20% | especial nunca
  - Normal: reaction 15f | defesa 50% | especial 30%
  - Difícil: reaction 5f | defesa 75% | especial 60%
- [x] **11.1.5** CPU usa variables para disparar ações

---

# ══════════════════════════════════════
# FASE 12 — TODAS AS TELAS / CENAS
# ══════════════════════════════════════
> Referência: Seções 56-64, 77-81 do Manual SF2

## 12.1 Game States Completos

```
BOOT → TITLE → MAIN_MENU → CHARACTER_SELECT → VS_SCREEN
→ ROUND_INTRO → FIGHT → ROUND_END → NEXT_ROUND
→ MATCH_END → VICTORY / GAME_OVER → CONTINUE → MAIN_MENU
```

- [x] **12.1.1** BootScene
- [x] **12.1.2** MainMenuScene
- [x] **12.1.3** CharacterSelectScene
- [x] **12.1.4** VsScene
- [x] **12.1.5** CombatScene

## 12.2 VictoryScene.ts

- [x] **12.2.1** Criar `VictoryScene.ts`
- [x] **12.2.2** Background do stage escurecido
- [x] **12.2.3** Sprite grande do vencedor (280px altura) fazendo pose Win
- [x] **12.2.4** Texto de vitória do personagem (do JSON: `victory.phrase`) - feito como stats simples por agora
- [x] **12.2.5** Stats: Rounds ganhos | Hits dados | Dano total | Tempo
- [x] **12.2.6** Botões: JOGAR NOVAMENTE | MENU PRINCIPAL

## 12.3 GameOverScene.ts

- [x] **12.3.1** Criar `GameOverScene.ts`
- [x] **12.3.2** "GAME OVER" vermelho dramático com efeito de entrada
- [x] **12.3.3** Contador 9→0 (1s por número, texto grande)
- [x] **12.3.4** Botão/tecla CONTINUE → reinicia round com HP cheio
- [x] **12.3.5** Sem ação → volta ao MainMenu

## 12.4 TrainingScene.ts

- [x] **12.4.1** Criar `TrainingScene.ts` (herda CombatScene)
- [x] **12.4.2** HP infinito (regenera a cada frame)
- [x] **12.4.3** CPU no modo Dummy (não age)
- [x] **12.4.4** Tecla R: reset posição dos dois
- [x] **12.4.5** Tecla H: toggle hitboxes coloridas
- [x] **12.4.6** HUD adicional: estado atual da SM + frame count

## 12.5 SettingsScene.ts

- [x] **12.5.1** Volume música (slider) - [Adiado para Fase 13 Áudio]
- [x] **12.5.2** Volume SFX (slider) - [Adiado para Fase 13 Áudio]
- [x] **12.5.3** Dificuldade CPU: Fácil / Normal / Difícil
- [x] **12.5.4** Toggle tela cheia
- [x] **12.5.5** Salvar em localStorage

## 12.6 ControlsScene.ts

- [x] **12.6.1** Tabela de teclas P1 e P2 (Apenas teclado base)
- [x] **12.6.2** Diagrama do gamepad (Descrito em texto)
- [x] **12.6.3** Diagrama mobile (Omitido)
- [x] **12.6.4** Comandos especiais por personagem com notação numérica (236P, 214K)

## 12.7 PauseMenu

- [x] **12.7.1** Tecla ESC durante combate → pause overlay
- [x] **12.7.2** Opções: Continuar | Controles | Configurações | Sair para Menu
- [x] **12.7.3** Durante pausa: `scene.pause()` no physics

---

# ══════════════════════════════════════
# FASE 13 — ÁUDIO COMPLETO
# ══════════════════════════════════════
> Referência: Seção 70-71 do Manual SF2

## 13.1 AudioManager.ts

- [ ] **13.1.1** Criar `AudioManager.ts`: singleton, controla volumes, play/stop
- [ ] **13.1.2** Categorias: `music`, `sfx`, `voice`, `ui`
- [ ] **13.1.3** `playMusic(key, loop)`, `stopMusic()`, `playSFX(key)`, `playVoice(key)`
- [ ] **13.1.4** Respeitar volumes do localStorage

## 13.2 Músicas Necessárias

- [ ] **13.2.1** `menu_bgm.ogg` — loop menu
- [ ] **13.2.2** `char_select.ogg` — loop char select
- [ ] **13.2.3** `stage_cmsw.ogg` — loop combate
- [ ] **13.2.4** `victory.ogg` — fanfarra vitória (3-4s)
- [ ] **13.2.5** `game_over.ogg` — tema game over

## 13.3 SFX Necessários

- [ ] **13.3.1** `hit_light.ogg` | `hit_medium.ogg` | `hit_heavy.ogg`
- [ ] **13.3.2** `block.ogg` — pancada bloqueada
- [ ] **13.3.3** `projectile_kevin.ogg` — aura do beijo
- [ ] **13.3.4** `projectile_vini.ogg` — aura do cachorro
- [ ] **13.3.5** `electric_hit.ogg` — choque ao acertar
- [ ] **13.3.6** `ko.ogg` — KO pesado
- [ ] **13.3.7** `jump.ogg` — whoosh ao pular
- [ ] **13.3.8** `land.ogg` — baque ao aterrissar
- [ ] **13.3.9** `throw.ogg` — agarrar
- [ ] **13.3.10** `combo_tick.ogg` — tick por hit de combo
- [ ] **13.3.11** `ui_cursor.ogg` | `ui_confirm.ogg` | `ui_cancel.ogg`

## 13.4 Announcer (Voz)

- [ ] **13.4.1** `round_1.ogg`, `round_2.ogg`, `round_3.ogg`
- [ ] **13.4.2** `fight.ogg`
- [ ] **13.4.3** `ko.ogg` (voz separada do SFX)
- [ ] **13.4.4** `perfect.ogg`
- [ ] **13.4.5** `time_over.ogg`

---

# ══════════════════════════════════════
# FASE 14 — CONTROLES MOBILE
# ══════════════════════════════════════

## 14.1 VirtualGamepad Completo

- [x] **14.1.1** Joystick analógico (básico)
- [ ] **14.1.2** 6 botões de ataque (LP, MP, HP, LK, MK, HK) — layout 2 linhas × 3
- [ ] **14.1.3** Botão Especial separado (V) — destacado em roxo/magenta
- [ ] **14.1.4** Tamanho mínimo 60×60px por botão
- [ ] **14.1.5** Feedback visual: escurecer botão no press
- [ ] **14.1.6** Alpha 0.6 em todos os controles
- [ ] **14.1.7** Joystick: indicador de direção ao arrastar (seta)
- [ ] **14.1.8** Suporte a multi-touch (joystick + botão ao mesmo tempo)
- [ ] **14.1.9** Testar iOS Safari + Android Chrome

---

# ══════════════════════════════════════
# FASE 15 — PIPELINE DE GERAÇÃO DE PERSONAGEM
# ══════════════════════════════════════
> Referência: Seções 91-100 do Manual SF2 — O diferencial do projeto

## 15.1 Character Generator (Futuro — preparar motor)

O motor deve estar preparado para receber novos personagens via:

```
FOTO DO USUÁRIO
      ↓
QUESTIONÁRIO (nome, roupa, estilo, golpes)
      ↓
GERAÇÃO DE SPRITES (IA de imagem)
      ↓
GERAÇÃO DE JSON (dados do personagem)
      ↓
INTEGRAÇÃO NO MOTOR
      ↓
PERSONAGEM JOGÁVEL
```

- [ ] **15.1.1** Criar `PERSONAGEM_TEMPLATE.json` em branco como base para novos personagens
- [ ] **15.1.2** Criar `CHARACTER_CREATION_GUIDE.md` com questionário padrão:
  - Identidade (nome, apelido, frase)
  - Aparência (roupa, cabelo, acessórios)
  - Arquétipo (Balanced/Rushdown/Grappler/Zoner)
  - Frame data dos especiais
  - Animações de vitória/derrota únicas
- [ ] **15.1.3** Criar `scripts/generate_character.js`: script que recebe o JSON e valida o contrato mínimo de sprites

---

# ══════════════════════════════════════
# FASE 16 — POLIMENTO E PERFORMANCE
# ══════════════════════════════════════
> Referência: Seção 116 do Manual SF2

## 16.1 Performance

- [ ] **16.1.1** 60fps constante (testar com `game.loop.actualFps`)
- [ ] **16.1.2** Object pooling para VFX (pool de 30 sparks, 10 dust clouds)
- [ ] **16.1.3** Sprite atlas: agrupar todos os sprites num atlas (TextureAtlas Phaser)
- [ ] **16.1.4** Preload ALL assets no BootScene — zero carregamento durante luta
- [ ] **16.1.5** Remover todos `console.log` antes do build final

## 16.2 Deploy e GitHub Pages

- [ ] **16.2.1** `vite.config.ts`: confirmar `base: '/cmsw_fight/'`
- [ ] **16.2.2** `deploy.yml`: `npm ci && npm run build` na pasta `/game`
- [ ] **16.2.3** Source no GitHub Settings > Pages = "GitHub Actions"
- [ ] **16.2.4** `index.html`: `<title>CMSW Fight — Resolva sua treta aqui</title>`, `lang="pt-BR"`, meta description

## 16.3 Acessibilidade

- [ ] **16.3.1** Screen shake ON/OFF nas configurações
- [ ] **16.3.2** Flash effects ON/OFF nas configurações
- [ ] **16.3.3** Controles remapeáveis (teclado)

---

# ══════════════════════════════════════
# FASE 17 — DOCUMENTAÇÃO FINAL
# ══════════════════════════════════════

- [ ] **17.1** Atualizar `status_projeto.md`
- [ ] **17.2** Criar `CONTROLS.md` com tabela completa de controles
- [ ] **17.3** Criar `CHANGELOG.md`
- [ ] **17.4** Atualizar `README.md`: rodar local (`npm run dev` na pasta `/game`), link GitHub Pages
- [ ] **17.5** Criar `ADDING_CHARACTERS.md`: guia completo para adicionar personagem novo

---

# MAPEAMENTO COMPLETO DE CONTROLES

| Ação            | P1 Teclado | P2 Teclado | Gamepad (P1)    |
|-----------------|------------|------------|-----------------|
| Esquerda        | ←          | Numpad 4   | L-Stick/D-Pad ← |
| Direita         | →          | Numpad 6   | L-Stick/D-Pad → |
| Pulo            | ↑          | Numpad 8   | L-Stick/D-Pad ↑ |
| Agachar         | ↓          | Numpad 2   | L-Stick/D-Pad ↓ |
| Soco Leve LP    | Z          | U          | X               |
| Soco Médio MP   | X          | I          | Y               |
| Soco Forte HP   | C          | O          | RB              |
| Chute Leve LK   | A          | J          | A               |
| Chute Médio MK  | S          | K          | B               |
| Chute Forte HK  | D          | L          | RT              |
| Especial        | V          | M          | LB              |
| Throw (perto)   | Z+A        | U+J        | X+A             |
| Pause           | ESC        | ESC        | Start           |

---

# ORDEM DE EXECUÇÃO (15 SESSÕES)

```
SESSÃO 1  → Fase 0: Criar estrutura de pastas
SESSÃO 2  → Fase 1: Input Buffer + Command Recognizer (236P, 214K)
SESSÃO 3  → Fase 2: Sistema de 3 Boxes (Hitbox, Hurtbox, Pushbox)
SESSÃO 4  → Fase 3: Frame Data de todos os ataques
SESSÃO 5  → Fase 4: State Machine completa (todos os 30+ estados)
SESSÃO 6  → Fase 5: CombatSystem, DamageSystem, StunSystem, ComboCounter
SESSÃO 7  → Fase 6+7: JSONs dos personagens e stages, refatorar Fighter para data-driven
SESSÃO 8  → Fase 6.3+6.4: Gerar/processar sprites Kevin e Vini Dog (nova versão)
SESSÃO 9  → Fase 7.2: Gerar/processar cenário CMSW em camadas
SESSÃO 10 → Fase 8: VFXManager completo
SESSÃO 11 → Fase 9+10: HUD refatorado + MatchManager (best of 3)
SESSÃO 12 → Fase 11: IA do inimigo (CPUController)
SESSÃO 13 → Fase 12: Todas as telas restantes (Victory, GameOver, Training, Settings)
SESSÃO 14 → Fase 13+14: Áudio completo + Mobile controls
SESSÃO 15 → Fase 15+16+17: Pipeline de personagem, polimento, deploy, docs
```

---
*Última atualização: 30/09/2026 — Procedimento gerado com base no Manual Técnico SF2 World Warrior + arquitetura CMSW Fight.*
