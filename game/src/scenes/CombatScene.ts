import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter';
import { Projectile } from '../entities/Projectile';
import { InputManager } from '../core/InputManager';
import { VirtualGamepad } from '../ui/VirtualGamepad';
import { CombatSystem } from '../engine/CombatSystem';
import { CharacterLoader } from '../core/CharacterLoader';
import { StageLoader } from '../core/StageLoader';
import { CameraSystem } from '../engine/CameraSystem';
import { VFXManager } from '../engine/VFXManager';
import { MatchManager } from '../engine/MatchManager';
import { HUD } from '../ui/HUD';
import { CPUController } from '../engine/CPUController';
import { AudioManager } from '../engine/AudioManager';
import { ARCADE } from '../ui/ArcadeTheme';

export class CombatScene extends Phaser.Scene {
    private player!: Fighter;
    private enemy!: Fighter;
    private inputManager!: InputManager;
    private secondPlayerInput?: InputManager;
    private projectiles!: Phaser.GameObjects.Group;
    private cameraSystem!: CameraSystem;
    private vfxManager!: VFXManager;
    private p1Shadow!: Phaser.GameObjects.Graphics;
    private p2Shadow!: Phaser.GameObjects.Graphics;

    private hud!: HUD;
    private matchManager!: MatchManager;
    private cpuController?: CPUController;
    private mode: string = '1p';
    private isPaused: boolean = false;
    private pauseMenuOverlay!: Phaser.GameObjects.Container;
    private floorY: number = 600;

    public arcadeStage?: number;
    private p1Key: string = 'kevin';
    private p2Key: string = 'vini_dog';

    constructor(key: string = 'CombatScene') {
        super({ key });
    }

    private stageKey: string = 'kevin_bathroom';

    init(data: { p1?: string; p2?: string; p1Name?: string; p2Name?: string; mode?: string; stage?: string; arcadeStage?: number }) {
        this.p1Key = data?.p1 ?? 'kevin';
        this.p2Key = data?.p2 ?? 'vini_dog';
        this.mode = data?.mode ?? '1p';
        this.arcadeStage = data?.arcadeStage ?? (this.mode === '1p' ? 1 : undefined);

        if (data?.stage) {
            this.stageKey = data.stage;
        } else if (this.mode === '1p') {
            // Na máquina (Arcade vs CPU): a luta ocorre no cenário do OPONENTE (P2)
            this.stageKey = this.p2Key.includes('vini') ? 'vini_tabacaria' : 'kevin_bathroom';
        } else {
            // Em modo desafio (2P / PVP): seleção aleatória de cenário
            const availableStages = ['kevin_bathroom', 'vini_tabacaria', 'combat_masters_hq'];
            this.stageKey = Phaser.Math.RND.pick(availableStages);
        }
        this.secondPlayerInput = undefined;
        this.cpuController = undefined;
    }

    preload() {
        const poses = [
            'idle', 'walk', 'walk_2', 'walk_3', 'walk_back',
            'run_1', 'run_2', 'run_3', 'run_back_1', 'run_back_2', 'run_back_3',
            'jump', 'jump_1', 'jump_2', 'jump_3',
            'air_punch', 'air_punch_2', 'air_kick', 'air_kick_2',
            'air_kick_up', 'air_kick_up_2', 'air_kick_diag', 'air_kick_diag_2',
            'crouch', 'crouch_punch', 'crouch_punch_2', 'sweep', 'sweep_2',
            'block', 'punch', 'punch_2', 'punch_l', 'punch_l_2', 'punch_r', 'punch_r_2',
            'kick', 'kick_2', 'kick_l', 'kick_l_2', 'kick_r', 'kick_r_2',
            'special', 'special_2', 'throw', 'throw_2', 'thrown',
            'hit', 'ko', 'win', 'win_alt'
        ];

        const charKeys = ['kevin', 'kevin_p2', 'vini_dog', 'vini_dog_p2'];
        charKeys.forEach(ck => {
            if (!this.textures.exists(ck)) this.load.image(ck, `assets/sprites/${ck}.png`);
            poses.forEach(p => {
                const key = `${ck}_${p}`;
                if (!this.textures.exists(key)) this.load.image(key, `assets/sprites/${key}.png`);
            });
        });

        if (!this.textures.exists('aura_beijo')) this.load.image('aura_beijo', 'assets/sprites/aura_beijo.png');
        if (!this.textures.exists('aura_cachorro')) this.load.image('aura_cachorro', 'assets/sprites/aura_cachorro.png');
        if (!this.textures.exists('banheiro_portatil')) this.load.image('banheiro_portatil', 'assets/sprites/banheiro_portatil.png');

        if (!this.textures.exists('stage_bg')) this.load.image('stage_bg', 'assets/sprites/stage_bg.png');
        if (!this.textures.exists('stage_kevin_bathroom')) this.load.image('stage_kevin_bathroom', 'assets/sprites/stage_kevin_bathroom.png');
        if (!this.textures.exists('stage_vini_tabacaria')) this.load.image('stage_vini_tabacaria', 'assets/sprites/stage_vini_tabacaria.png');
    }

    create() {
        AudioManager.getInstance().setScene(this);
        AudioManager.getInstance().playMusic('stage_combat_masters', true);

        // Foco automático no canvas para captura imediata de teclado
        if (this.sys.game.canvas) {
            this.sys.game.canvas.setAttribute('tabindex', '0');
            this.sys.game.canvas.focus();
        }
        this.input.on('pointerdown', () => {
            if (this.sys.game.canvas) {
                this.sys.game.canvas.focus();
            }
        });
        if (this.input.keyboard) {
            this.input.keyboard.enabled = true;
        }

        // ── CENÁRIO ──────────────────────────────────────────────
        const stageInfo = StageLoader.createStage(this, this.stageKey);
        this.floorY = stageInfo.groundY;

        // Chão (retângulo invisível para física)
        const floor = this.add.rectangle(stageInfo.width / 2, this.floorY + 60, stageInfo.width, 120, 0x8B6914);
        floor.setVisible(false);
        this.physics.add.existing(floor, true);

        this.cameraSystem = new CameraSystem(this);
        this.vfxManager = new VFXManager(this, this.cameraSystem);

        // ── PERSONAGENS ──────────────────────────────────────────
        this.inputManager = new InputManager(this, false, this.mode === '2p');
        this.projectiles = this.add.group();

        // Sombras
        this.p1Shadow = this.add.graphics();
        this.p1Shadow.setDepth(3);
        this.p1Shadow.fillStyle(0x000000, 0.4);
        this.p1Shadow.fillEllipse(0, 0, 70, 20);

        this.p2Shadow = this.add.graphics();
        this.p2Shadow.setDepth(3);
        this.p2Shadow.fillStyle(0x000000, 0.4);
        this.p2Shadow.fillEllipse(0, 0, 70, 20);

        const p1KeyToUse = this.p1Key;
        const p2KeyToUse = (this.p1Key === this.p2Key) ? `${this.p2Key}_p2` : this.p2Key;

        this.player = CharacterLoader.createFighter(this, 280, this.floorY, p1KeyToUse, this.inputManager);
        this.player.setDepth(5);
        this.player.setFlipX(false);
        this.physics.add.collider(this.player, floor);

        this.player.on('fire_special', (fighter: Fighter, isSuper?: boolean) => this.fireSpecial(fighter, isSuper));

        this.enemy = CharacterLoader.createFighter(this, stageInfo.width - 280, this.floorY, p2KeyToUse);
        this.enemy.setDepth(5);
        this.enemy.setFlipX(true);
        this.physics.add.collider(this.enemy, floor);
        
        this.enemy.on('fire_special', (fighter: Fighter, isSuper?: boolean) => this.fireSpecial(fighter, isSuper));
        
        // Attach AI
        if (this.mode === '2p') {
            this.secondPlayerInput = new InputManager(this, true, true);
            this.enemy.inputManager = this.secondPlayerInput;
        } else if (this.mode !== 'training') {
            this.cpuController = new CPUController(this.enemy, this.player);
            this.enemy.inputManager = this.cpuController;
        }

        // Projéteis
        this.physics.add.overlap(this.projectiles, this.enemy, (projObj) => {
            const proj = projObj as Projectile;
            this.resolveProjectileHit(proj, this.enemy);
        });

        this.physics.add.overlap(this.projectiles, this.player, (projObj) => {
            const proj = projObj as Projectile;
            this.resolveProjectileHit(proj, this.player);
        });

        // ── HUD ──────────────────────────────────────────────────
        this.hud = new HUD(this, this.player, this.enemy);

        // ── CONTROLES TOUCH ─────────────────────────────────────
        new VirtualGamepad(this, this.inputManager);

        // ── MATCH MANAGER ─────────────────────────────────────────
        this.matchManager = new MatchManager(this, this.player, this.enemy, this.hud, this.vfxManager, this.mode);
        this.matchManager.startRoundSequence();

        // ── PAUSE MENU ────────────────────────────────────────────
        this.createPauseMenu();

        const onEscape = () => {
            if (!this.matchManager.isMatchActive()) return;
            this.togglePause();
        };
        this.input.keyboard?.on('keydown-ESC', onEscape);
        this.events.once('shutdown', () => this.input.keyboard?.off('keydown-ESC', onEscape));
    }

    private createPauseMenu() {
        const { width, height } = this.scale;
        this.pauseMenuOverlay = this.add.container(0, 0).setDepth(2000).setVisible(false).setScrollFactor(0);

        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0, 0);
        this.pauseMenuOverlay.add(bg);

        const panel = this.add.graphics();
        panel.fillStyle(0x080b22, 0.95);
        panel.fillRect(width / 2 - 230, height / 2 - 150, 460, 300);
        panel.lineStyle(4, ARCADE.yellow, 1);
        panel.strokeRect(width / 2 - 230, height / 2 - 150, 460, 300);
        this.pauseMenuOverlay.add(panel);

        const title = this.add.text(width / 2, height / 2 - 100, 'PAUSE', {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '60px',
            color: '#fff8d6', stroke: '#d52821', strokeThickness: 6,
        }).setOrigin(0.5);
        this.pauseMenuOverlay.add(title);

        const btnResume = this.add.text(width / 2, height / 2 + 20, 'RESUME', {
            fontFamily: 'Impact, Arial Black', fontSize: '30px', color: '#ffe34d', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        btnResume.on('pointerdown', () => this.togglePause());
        this.pauseMenuOverlay.add(btnResume);

        const btnQuit = this.add.text(width / 2, height / 2 + 80, 'QUIT TO MENU', {
            fontFamily: 'Impact, Arial Black', fontSize: '30px', color: '#ff6b4f', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        btnQuit.on('pointerdown', () => {
            this.togglePause();
            // Espera o clique terminar para ele não selecionar TREINO no menu novo.
            this.time.delayedCall(80, () => this.scene.start('MainMenuScene'));
        });
        this.pauseMenuOverlay.add(btnQuit);
    }

    private resolveProjectileHit(proj: Projectile, target: Fighter) {
        if (!this.matchManager?.isMatchActive() || !proj.hitActive || proj.getOwner() === target) return;
        // A caixa Arcade é alta para os socos, mas projéteis baixos passam sob
        // um lutador que já ganhou altura suficiente no salto.
        const groundCenterY = this.floorY;
        if (!target.isOnGround() || target.y < groundCenterY - 40) return;
        proj.hitActive = false;
        const pushDir = proj.x < target.x ? 1 : -1;
        if (target.isBlocking || target.isHoldingBack) {
            target.hp = Math.max(0, target.hp - 3);
            target.setVelocityX(pushDir * 240); // Empurrão forte ao defender para afastar e dar janela de reação
            this.vfxManager.spawnBlockSpark(proj.x, proj.y);
            AudioManager.getInstance().playSFX('block');
        } else {
            target.takeDamage(proj.damage, 180, proj.x, proj.damageType);
            this.vfxManager.spawnHitSpark(proj.x, proj.y, 'heavy');
            AudioManager.getInstance().playSFX(proj.damageType === 'electric' ? 'electric_hit' : 'hit_heavy');
        }
        proj.destroy();
    }

    private fireSpecial(fighter: Fighter, isSuper: boolean = false, isMax2: boolean = false) {
        if (!this.matchManager?.isMatchActive()) return;

        // Limite de 1 projétil ativo por lutador na tela ao mesmo tempo (regra clássica KOF/SF)
        const activeProj = this.projectiles.getChildren().find(p => (p as Projectile).getOwner() === fighter);
        if (activeProj) return;

        const direction = fighter.flipX ? -1 : 1;
        const isKevin = fighter.characterId.includes('kevin');
        const special = this.cache.json.get(fighter.characterId.replace(/_p2$/, ''))?.specials?.[0];

        const damage = isMax2 ? 340 : isSuper ? 240 : (special?.damage ?? 80);
        const speed = isMax2 ? 820 : isSuper ? 720 : (special?.projectileSpeed ?? (isKevin ? 550 : 480));

        const projectile = new Projectile(
            this,
            fighter.x + (isKevin ? 85 : 95) * direction,
            fighter.y - 10,
            isKevin ? 'aura_beijo' : 'aura_cachorro',
            fighter,
            speed * direction,
            damage,
            isKevin ? 'electric' : 'normal'
        );
        
        const widthSize = isMax2 ? 300 : isSuper ? 240 : (isKevin ? 160 : 180);
        const heightSize = isMax2 ? 200 : isSuper ? 160 : 110;
        projectile.setDisplaySize(widthSize, heightSize);
        if (isMax2) projectile.setTint(0xff3366);
        else if (isSuper) projectile.setTint(0xffd700);

        const pBody = projectile.body as Phaser.Physics.Arcade.Body;
        pBody.setSize(widthSize * 0.75, heightSize * 0.65);
        pBody.setOffset(15, 18);
        projectile.setFlipX(direction < 0);
        projectile.setDepth(10);
        this.projectiles.add(projectile);
        
        if (isSuper) {
            this.vfxManager.screenFlash(150);
            this.vfxManager.cameraShake(0.02);
            AudioManager.getInstance().playVoice('fight');
            if (isMax2) {
                this.vfxManager.cameraShake(0.045);
                this.vfxManager.screenFlash(260);
            }
        } else {
            AudioManager.getInstance().playSFX(isKevin ? 'electric_cast' : 'dog_cast');
            if (isKevin) this.vfxManager.screenFlash(60);
        }
    }

    private togglePause() {
        this.isPaused = !this.isPaused;
        this.matchManager.setPaused(this.isPaused);
        if (this.isPaused) {
            this.physics.pause();
            this.anims.pauseAll();
            this.pauseMenuOverlay.setVisible(true);
        } else {
            this.physics.resume();
            this.anims.resumeAll();
            this.pauseMenuOverlay.setVisible(false);
        }
    }

    // ── GAME LOOP ────────────────────────────────────────────────
    update() {
        if (this.isPaused) {
            this.inputManager.update();
            this.secondPlayerInput?.update();
            InputManager.endFrame();
            return;
        }
        if (!this.matchManager.isMatchActive()) {
            this.inputManager.update();
            this.secondPlayerInput?.update();
            InputManager.endFrame();
            return;
        }

        // Hitstop freeze (KOF style)
        if (this.vfxManager.isHitStopping()) {
            this.vfxManager.updateHitStop();
            // Mantém os inputs atualizando para buffer (entrar com o especial logo após o hit)
            this.inputManager.update();
            this.secondPlayerInput?.update();
            InputManager.endFrame();
            return;
        }

        // O input precisa ser atualizado antes dos lutadores consumirem o frame.
        this.inputManager.update();
        this.secondPlayerInput?.update();
        this.cpuController?.update();
        this.player.update();
        this.enemy.update();
        InputManager.endFrame();

        // Mantém os pés na linha do cenário (floorY)
        const groundCenterY = this.floorY;
        for (const fighter of [this.player, this.enemy]) {
            if (fighter.y > groundCenterY && (fighter.body?.velocity.y ?? 0) >= 0) {
                fighter.y = groundCenterY;
                fighter.setVelocityY(0);
            }
        }
        this.hud.update();

        // Update shadows
        this.p1Shadow.x = this.player.x;
        this.p1Shadow.y = this.floorY;
        this.p2Shadow.x = this.enemy.x;
        this.p2Shadow.y = this.floorY;

        // ── MANUAL PUSHBOX COLLISION ──────────────────────────────────
        const distanceX = Math.abs(this.player.x - this.enemy.x);
        const minDistance = 75;
        if (distanceX < minDistance && this.player.y >= groundCenterY - 10 && this.enemy.y >= groundCenterY - 10) {
            const overlap = minDistance - distanceX;
            if (this.player.x < this.enemy.x) {
                this.player.x -= overlap / 2;
                this.enemy.x += overlap / 2;
            } else {
                this.player.x += overlap / 2;
                this.enemy.x -= overlap / 2;
            }
        }
        this.player.x = Phaser.Math.Clamp(this.player.x, 95, this.scale.width - 95);
        this.enemy.x = Phaser.Math.Clamp(this.enemy.x, 95, this.scale.width - 95);

        // Câmera dinâmica: aproxima quando o combate fecha, volta ao normal quando abrem
        this.cameraSystem.update(this.player, this.enemy);

        // Auto-Face (apenas em movimento livre para não interromper animações de ataque)
        const p1CanTurn = ['idle', 'walk', 'crouch', 'block', 'run', 'land'].includes(this.player.stateMachine.state);
        const p2CanTurn = ['idle', 'walk', 'crouch', 'block', 'run', 'land'].includes(this.enemy.stateMachine.state);
        if (p1CanTurn) this.player.setFlipX(this.player.x > this.enemy.x);
        if (p2CanTurn) this.enemy.setFlipX(this.enemy.x > this.player.x);

        // Check Box collisions
        this.resolveMeleeHit(this.player, this.enemy);
        this.resolveMeleeHit(this.enemy, this.player);

        // Pushbox resolve
        // Check Match Over
        this.matchManager.checkWinCondition();
    }

    /**
     * Resolve uma colisão hitbox→hurtbox entre atacante e defensor.
     * Trata agarrões, bloqueios, hitstun, hitstop, VFX e SFX.
     * (Antes este bloco estava duplicado para P1 e P2 — refactor DRY.)
     */
    private resolveMeleeHit(attacker: Fighter, defender: Fighter) {
        const isThrowAttempt = attacker.currentHitbox.hitType === 'throw';

        if (isThrowAttempt) {
            // Prioridade de agarrão (KOF): throws furam a invencibilidade do Roll
            const hb = attacker.currentHitbox;
            const hurt = defender.currentHurtbox;
            if (!hb.active || defender.isHit || !Phaser.Geom.Intersects.RectangleToRectangle(hb, hurt)) return;
        } else if (!CombatSystem.checkHitboxCollision(attacker.currentHitbox, defender.currentHurtbox)) {
            return;
        }

        if (isThrowAttempt) {
            if (CombatSystem.checkThrowRange(attacker, defender)) {
                defender.stateMachine.transition('thrown');
                this.vfxManager.cameraShake(0.02);
                AudioManager.getInstance().playSFX('throw');
            }
        } else {
            // Counter Hit: acertou o oponente durante o startup do golpe dele (KOF)
            const defState = defender.stateMachine.state;
            const isCounter = !defender.isHit &&
                (defState.startsWith('stand_') || defState.startsWith('crouch_')) &&
                !defender.attackContact;

            const result = CombatSystem.applyHit(attacker, defender, attacker.currentHitbox, isCounter);
            const dmg = attacker.currentHitbox.damage;
            const isHeavy = dmg >= 80;
            const isMedium = dmg >= 40 && dmg < 80;
            // Hitstop calibrado KOF: pesados congelam 10-14 frames; counter hit congela ainda mais
            const hitStopFrames = (isHeavy ? 12 : (isMedium ? 7 : 4)) + (isCounter ? 3 : 0);
            const shakeIntensity = isHeavy ? 0.02 : (isMedium ? 0.01 : 0.005);
            const sparkType = isHeavy ? 'heavy' : (isMedium ? 'medium' : 'light');

            if (result === 'blocked') {
                this.vfxManager.spawnBlockSpark(attacker.currentHitbox.x, attacker.currentHitbox.y);
                AudioManager.getInstance().playSFX('block');
                this.vfxManager.hitStop(Math.max(2, hitStopFrames - 2)); // Blockstun hitstop
            } else if (result === 'hit') {
                this.vfxManager.spawnHitSpark(attacker.currentHitbox.x, attacker.currentHitbox.y, sparkType);
                this.vfxManager.hitStop(hitStopFrames);
                this.vfxManager.cameraShake(shakeIntensity);
                AudioManager.getInstance().playSFX(attacker.currentHitbox.soundHit);
                if (isCounter) {
                    this.vfxManager.showCounterText(defender.x, defender.y - 180);
                    this.vfxManager.cameraShake(shakeIntensity * 2);
                }
            }
            if (result !== 'none') {
                attacker.attackContact = true;
            }
        }
        attacker.currentHitbox.active = false;
    }
}

