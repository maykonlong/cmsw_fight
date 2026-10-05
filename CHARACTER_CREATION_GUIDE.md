# Guia de Criação de Personagens (CMSW — Combat Martial Soul Warriors)

Este guia define o fluxo para adicionar novos lutadores ao jogo. A arquitetura foi desenvolvida para ser totalmente orientada a dados (Data-Driven), ou seja, a criação de um personagem não exige programação avançada, apenas a inserção de imagens (Sprites) e a definição de um arquivo JSON.

## Passo 1: Preencher o Questionário (Para IA ou Artista)

Antes de gerar os assets, defina o perfil do lutador:

1. **Identidade**
   - Nome: (ex: Maykon)
   - Apelido/Título: (ex: O Mestre do Código)
   - Frase de Vitória: (ex: "Sua lógica falhou!")

2. **Aparência (Prompt Visual)**
   - Estilo de roupa: (ex: Terno elegante, óculos escuros)
   - Paleta de cores: (ex: Preto, Azul Neon)
   - Arma/Objeto (Opcional): (ex: Notebook da Dell)

3. **Arquétipo de Luta**
   - [ ] **Balanced (Ryu/Ken)**: Movimento médio, projétil, antiaéreo forte.
   - [ ] **Rushdown (Cammy/Chun-Li)**: Rápido, combos de perto, baixo HP.
   - [ ] **Zoner (Guile/Dhalsim)**: Movimento lento, alcance longo, muitos projéteis.
   - [ ] **Grappler (Zangief)**: Muito lento, muito HP, agarrões causam dano massivo.

4. **Golpe Especial**
   - Nome: (ex: Ctrl+Z)
   - Tipo: (Projectile, Rush, AntiAir, CommandGrab)
   - Descrição visual: (ex: Lança um teclado brilhante)

## Passo 2: Geração de Sprites

O sistema exige, no mínimo, as seguintes animações (podem ser single-frames na primeira iteração):

- `idle` (Parado)
- `walk` (Andando frente/trás)
- `crouch` (Abaixado)
- `jump` (Pulando)
- `block` (Defesa)
- `hit` (Tomando Dano)
- `knockdown` (Caído no chão)
- `ko` (Derrotado - deitado)
- Pelo menos um frame de soco/chute.

Salve todos os sprites gerados na pasta `assets/sprites/characters/<nome_do_char>/`.

## Passo 3: Geração do JSON

Faça uma cópia do `PERSONAGEM_TEMPLATE.json`, salve como `game/src/data/characters/<nome_do_char>.json` e preencha os valores:

- **health**: 1000 é a média. Grapplers têm 1200, Rushdowns 900.
- **movement**: `walkForward` (250 normal, 300 rápido, 150 lento).
- **sprites**: Associe as chaves do Phaser (ex: `"idle": "maykon_idle"`) definidas no carregamento.

## Passo 4: Validação

Rode o script validador para garantir que o JSON está formatado corretamente e nenhum sprite está faltando:

```bash
node scripts/validate_character.js <nome_do_char>
```

Se estiver verde, o personagem está pronto para lutar! Vá no `BootScene.ts` e carregue o JSON dele.
