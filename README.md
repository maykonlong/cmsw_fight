# Combat Masters — Framework de Luta 2D

**Combat Masters** (nome fantasia: *Combat Martial Soul Warriors* / **CMSW**) é um jogo de luta 2D em tempo real para navegador, em estilo *Street Fighter II*, construído com **Phaser 3 + TypeScript + Vite**. Joga **2 jogadores locais**, com controle **p1 vs p2**, mais **CPU** e **multitouch** — com controle de *hitstop*, *guard cancel*, *super gauge*, *projectiles* e *particles*.

- **Plataformas:** Navegador (PC Chrome/Firefox/Safari, Mobile Chrome/Safari iOS)
- **Hospedagem:** GitHub Pages (`/combat_masters/`)
- **Tecnologias:** Phaser 4.2.x, TypeScript ~6, Vite 8, Rolldown (bundler), pngjs

---

## 📋 Índice

1. [Executando o projeto](#1-executando-o-projeto)
2. [Estrutura do repositório](#2-estrutura-do-repositório)
3. [Pipeline de sprites e animações](#3-pipeline-de-sprites-e-animações)
4. [Construção (build) e WDAC no Windows](#4-construção-build-e-wdac-no-windows)
5. [Validação de assets e testes](#5-validação-de-assets-e-testes)
6. [Depoimentos (Desenvolvimento)](#6-depoimentos-desenvolvimento)

---

## 1. Executando o projeto

### Windows (recomendado)
`iniciar.bat` inicia o servidor de desenvolvimento.

```bat
iniciar.bat
```

### Linux/macOS / WSL
`iniciar.sh` inicia o servidor de desenvolvimento.

```bash
chmod +x iniciar.sh
./iniciar.sh
```

### Comando manual
```bash
cd game
npm run dev      # servidor de dev (vite)
npm run build    # construção para produção (gh-pages)
npm run preview  # pré-visualização do build
```

O jogo fica disponível em `http://localhost:<port>` (padrão `5173`/base `/combat_masters/`).

---

## 2. Estrutura do repositório

```
.
├── iniciar.bat                 # dev server (Windows)
├── iniciar.sh                  # dev server (Unix)
├── procedimento_mestre.md      # procedimento mestre da Fase 10
├── status_projeto.md           # status do projeto
├── README.md                   # este arquivo
├── asset_check.txt             # auditoria de assets (64 sprites)
├── build_log.txt               # log do build (WDAC) — evidência
├── .gitignore
└── game/
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── src/
    │   ├── scenes/  BootScene, CombatScene, VictoryScene, etc.
    │   ├── entities/Fighter.ts
    │   ├── engine/AudioManager.ts, VFXManager.ts, CameraSystem.ts, ...
    │   └── ...
## 3. Pipeline de sprites e animações

### Estrutura das sprites
Cada personagem é composto de **frames individuais** `<char>_<pose>.png` com dimensão **500×520** e margem de segurança de 8px (verificado pelo `check_fighter_sprites.cjs`). Os arquivos gerados durante o desenvolvimento das poses são:

- **P1 (base):** `kevin_*.png`, `vini_dog_*.png`
- **P2 (reflexo/parallelismo):** `kevin_p2_*.png`, `vini_dog_p2_*.png`
- **Golpes develop:** `*_3.png` e `*_4.png` (animais de 4 quads)

#### Poses cobertas
- Movimento: `idle`, `walk`, `walk_2`, `walk_3`, `walk_back`
- Correr: `run_1..3`, `run_back_1..3`
- Saltos: `jump`, `jump_1..3`
- Atirar (aria): `air_punch`, `air_punch_2..4`, `air_kick`, `air_kick_2..4`, `air_kick_up`, `air_kick_up_2..4`, `air_kick_diag`, `air_kick_diag_2..4`
- Agachado: `crouch`, `crouch_punch`, `crouch_punch_2..4`
- Desenvolvimento: `sweep`, `sweep_2..4`
- Bloqueio/defesa: `block`
- Choque: `punch`, `punch_2..4`, `punch_l/r`, `punch_l_2..4`, `punch_r_2..4`, `kick`, `kick_2..4`, `kick_l/r`, `kick_l_2..4`, `kick_r_2..4`
- Especiais: `special`, `special_2..4`, `throw`, `throw_2`, `thrown`
- Resultado: `hit`, `ko`, `win`

### Geração de frames faltando (_3/_4)
As poses de ataque (*attacks*) que possuem apenas `base + _2` são estendidas para 4 frames por meio do script:

```bash
cd game
node scripts/complete_pose_frames.cjs
# gera <char>_<attack>_3.png e <char>_<attack>_4.png para todos os personagens
```

Isso é necessário porque `AttackState` anima cada golpe em 4 frames (`getPoseName`), e sem `_3/_4` o Phaser caía no fallback `"idle"` durante a fase ativa.

### Validação
```bash
cd game
npm run test:sprites          # node scripts/check_fighter_sprites.cjs
```

O script verifica **completude** (nenhum 404 no *boot*) e **qualidade** (poses-base em 500×520, sem tocar nas bordas). Deve sair com `0 poses faltando` e `30 poses base validadas`, pronto para o *build*.

### Placeholder de base P2
`kevin_p2.png` e `vini_dog_p2.png` são gerados com o script:

```bash
cd game


## 6. Depoimentos (Desenvolvimento)

### Estado atual (Fase 2 — *completion & validation*)
- ✅ **48 frames de ataque** (_3/_4) gerados para 6 golpes × 4 personagens.
- ✅ **Asset validation** passou limpo: `check_fighter_sprites.cjs` sem `0 poses faltando`.
- ✅ **Compile checks** `(tsc --noEmit)` passaram com **0 erros**.
- ✅ **Build Windows** fixado pelo WDAC: instalado `@rolldown/binding-wasm32-wasi`, e o Rolldown recaia no **caminho WASM** quando o `.node` nativo é bloqueado.
- ✅ **Docs** sincronizados com o pipeline de sprites: `README.md`, procedimento mestre, `status_projeto.md`.
- 🟡 **Audit final** dos **audio 404** e de outros **assets** em separado (see `asset_check.txt`).
- 🟡 **Finishing** de build e *playtest* local antes do último commit.

---

## 7. Dados de referência (Load order)

> Nenhum sprite/JSON é carregado fora desta ordem. O `BootScene` prepara as texturas e o `CombatScene` dispara o *combate* (FSM do personagem, hitstop, guard cancel, projectiles, particles, hitstop, *super gauge*, *hitstop*).

node scripts/make_p2_base_images.cjs
```

Eles servem como *fallback de diretório* no `CombatScene`/`BootScene`, mas a textura real usada na renderização é carregada a partir do JSON: `data.sprites.idle` (`kevin_p2_idle`, `vini_dog_p2_idle`).

---

## 4. Construção (build) e WDAC no Windows

### Problema relatado
O **`vite build`** (que usa **Rolldown** por trás dos panos) falha no Windows local com:

```
Error: Cannot find native binding. npm has a bug related to optional dependencies...
    cause: Cannot find module './rolldown-binding.win32-x64-msvc.node'
    cause: "Uma política de Controle de Aplicativo bloqueou este arquivo."
```

O consumo de `.node` nativo do Rolldown é bloqueado pela **política WDAC** (ApplicationControl) corporativa. O CI (Ubuntu) não tem esse bloqueio e **consegue buildar**.

### Solução: alternativa WASM (Windows)
Rolldown suporta build via **WASM** (`@rolldown/binding-wasm32-wasi`). Para Windows, instale a dependência WASM:

```bash
cd game
npm i @rolldown/binding-wasm32-wasi
```

Isso faz o Rolldown recair no caminho WASM quando o `.node` nativo é bloqueado. No CI (Ubuntu), o `.node` nativo é usado normalmente (sem WDAC) e o WASM é um fallback extra (inofensivo).

### Build diário
- **Windows:** `npm run build` dentro de `game` (se o `.node` nativo for bloqueado, use o caminho WASM acima).
- **Unix/macOS/WSL:** `npm run build` dentro de `game` (nativos funcionam).

### Scripts de inicialização
- `iniciar.bat` → `cd game; node node_modules\vite\bin\vite.js` (dev server)
- `iniciar.sh`  → mesma coisa, para shell Unix

> **Trusted-DEV:** se o seu WDAC bloquear ainda mais (ex: políticas de *code integrity*) e o `.node` não carregar mesmo com WASM, a opção mais estável para produção é rodar o **build no CI (Ubuntu)** e publicar a pasta `game/dist` para o GitHub Pages. O *dev server* no Windows ajuda a **depurar** o jogo (input, hitboxes, FX) sem depender de build nativo.

---

## 5. Validação de assets e testes

### Completude de sprites
```bash
cd game
npm run test:sprites
# Saída esperada:
#   30 fighter poses have complete, padded 500x520 frames.
#   0 sprites faltando
```

### Checklist de assets do jogo
*`asset_check.txt`* registra a presença/exatidão de todos os assets (sprite, audio, JSON). Uma vinculação:
- **Sprites:** `<char>_<pose>.png` (4 personagens, poses cobertas)
- **Audio:** 7 SFX no `public/assets/audio/sfx/`
- **JSON:** rosters, stages, characters

### Teste de compilação
```bash
cd game
npx tsc --noEmit   # deve sair com 0 erros
```

    ├── public/
    │   ├── assets/sprites/...   # sprites exportadas (500x520)
    │   ├── audio/sfx/...        # SFX only (7 arquivos)
    │   └── ...
    └── scripts/
        ├── check_fighter_sprites.cjs   # audit/validação de sprites
        ├── complete_pose_frames.cjs    # gera frames _3/_4 ausentes
        ├── make_p2_base_images.cjs     # placeholders base P2
        └── ...
```

### Personagens (v1.0)
| Personagem | Arquétipo | Especial 1 | Especial 2 | HP |
|---|---|---|---|---|
| **Kevin Manja** | Balanced | Beijo Elétrico (projétil) | Encontrão (anti-aéreo) | 1000 |
| **Vini Dog** | Rushdown | Aura do Cachorro (projétil) | Mordida Fatal (avanço) | 900 |

> O personagem P2 (`kevin_p2`, `vini_dog_p2`) usa as mesmas animações e reações do P1, com **tintas/reflexos aplicados no `CombatScene`** (canvas `scale`/`mirror`). As texturas de base `kevin_p2.png` e `vini_dog_p2.png` são placeholders de diretório (nunca renderizadas — a textura real vem do JSON `data.sprites.idle` = `kevin_p2_idle`, `vini_dog_p2_idle`).
