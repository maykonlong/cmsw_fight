# Status Geral do Projeto: CMSW — Combat Martial Soul Warriors 🥊

*Documento de transição (Handover) - Mantido atualizado para sincronização entre máquinas.*

---

## 🎯 O Que Foi Pedido (Visão Geral)
1. **Conceito:** Um jogo de luta misturando o estilo de Street Fighter 2 e 4.
2. **Plataforma:** Jogado via navegador (Web) e hospedado gratuitamente no GitHub Pages.
3. **Controles (Mobile-First):** Suporte total a Tela de Toque (Celular), Teclado (PC) e Gamepad/Controle (em ambos).
4. **Sistema de Luta (Core):** Defesa alta/baixa, abaixar, rasteira, pulos verticais e diagonais com golpes, etc.
5. **Personagem "Kevin":** Branco, loiro. Especial: Beijo (Aura) que dá choque. Vitória: Banheiro portátil onde toma banho com um clone moreno.
6. **Personagem "Vini Dog":** Calvo na coroa, usa boné/bobe. Especial: Aura de cachorro correndo. Vitória: Tira o chapéu, vira de costas e traga um vape onde a fumaça vira um cachorro.
7. **Documentação:** Manter um arquivo de descrição de cada personagem em suas respectivas pastas.

---

## ✅ O Que Já Foi Feito (Fases 1 a 7)
- [x] **Infraestrutura:** Repositório configurado com `Vite`, `Phaser 3` e `TypeScript`. 
- [x] **Deploy Automático:** Arquivo `.github/workflows/deploy.yml` criado. O jogo é enviado ao GitHub Pages automaticamente a cada push.
- [x] **Controles Unificados (`InputManager.ts`):** Motor de captura de botões feito. O Joystick Virtual (Mobile) aparece sozinho no celular, mas o jogo também obedece teclado e gamepads físicos nativamente.
- [x] **Arquitetura (Máquina de Estados):** Lutadores operam via `StateMachine` com módulos independentes: `Idle`, `Walk`, `Jump`, `Crouch`, `Attack`, `Special`, `Hit`, `KO` e `Win`.
- [x] **Física e Combate (`CombatScene.ts`):** Adicionada gravidade, colisão de *Hitbox*, cálculos de dano (Hit stun, Pushback).
- [x] **Mecânicas Específicas do Kevin:** Projétil programado. Ao acertar o beijo (Dano Elétrico), o oponente entra no estado de Eletrocussão (fica preso no lugar, piscando azul/amarelo e tremendo).
- [x] **Fim de Jogo e Vitória:** O motor rastreia o HP constantemente. Se alguém zerar, o jogo congela, exibe K.O. e aciona o `WinState` do vencedor e o `KOState` do perdedor (rotação pro chão).
- [x] **Arquivos de Design:** `descricao.md` criado e detalhado dentro das pastas `imagens_ref/personagens_ref/Kevin` e `Vini_dog`.
- [x] **Mapeamento Universal:** Criado o documento `character_state_machine.md` com a base de pulos, defesas e rasteiras padrão para todos.
- [x] **Arte (Recorte Inteligente IA):** As fotos de referência foram transformadas pela IA em protótipos de Spritesheets (Street Fighter Pixel Art style). Um algoritmo de Node.js via código removeu o fundo verde (Green Screen) gerando arquivos transparentes `.png` diretamente em `game/public/assets/sprites/`.

---

## 🚀 O Que Falta Fazer (Próximos Passos na Outra Máquina)

1. **Recorte de Sprites (Animações no Phaser):**
   - Atualmente, as imagens `kevin.png` e `vini_dog.png` foram carregadas como imagem única. Nós precisamos usar o `this.load.spritesheet()` com o tamanho exato dos frames e programar as animações (criar blocos de `this.anims.create` para Idle, Walk, Soco e Dano).
   
2. **Implementar as Auras / VFX Específicas:**
   - Adicionar o sprite correto da Aura do Beijo (Kevin).
   - Adicionar o sprite correto da Aura do Cachorro Correndo (Vini Dog).

3. **Cenas Cinematográficas de Vitória:**
   - Substituir os retângulos coloridos (Mockups) usados no `WinState` do Kevin pelos Sprites oficiais do Banheiro Químico e do Clone Moreno.
   - Criar a sequência exata no `WinState` do Vini Dog (Remover chapéu, rodar o personagem, gerar a partícula de fumaça de vape subindo no formato de cachorro).

4. **Menus e Polimento:**
   - Criar `MainMenuScene` (Tela de Título).
   - Criar `CharacterSelectScene` (Seleção de Personagens).
   - Adicionar cenários (Backgrounds) para a luta.
   - Adicionar Áudio (Música de fundo, sons de soco, sons de magia, announcer falando "K.O.").

---
*Baixe (pull) o repositório na nova máquina e me chame informando que quer continuar a partir da Tarefa 1 do "O Que Falta Fazer".*
