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

export class CombatScene extends Phaser.Scene {
    private player!: Fighter;
    private enemy!: Fighter;
    private inputManager!: InputManager;
    private projectiles!: Phaser.GameObjects.Group;
    private matchOver: boolean = false;
    private cameraSystem!: CameraSystem;
    private vfxManager!: VFXManager;
    private p1Shadow!: Phaser.GameObjects.Graphics;
    private p2Shadow!: Phaser.GameObjects.Graphics;

    private hud!: HUD;
    private matchManager!: MatchManager;
    private cpuController!: CPUController;
    private isPaused: boolean = false;
    private pauseMenuOverlay!: Phaser.GameObjects.Container;

    // Dados dos personagens
    private p1Key: string = 'kevin';
    private p2Key: string = 'vini_dog';
    private p1Name: string = 'KEVIN';
    private p2Name: string = 'VINI DOG';

    constructor(key: string = 'CombatScene') {
        super({ key });
    }

    init(data: { p1?: string; p2?: string; p1Name?: string; p2Name?: string }) {
        this.p1Key = data?.p1 ?? 'kevin';
        this.p2Key = data?.p2 ?? 'vini_dog';
        this.p1Name = data?.p1Name ?? 'KEVIN';
        this.p2Name = data?.p2Name ?? 'VINI DOG';
        this.matchOver = false;
        this.roundTime = 99;
    }

    preload() {
        if (!this.textures.exists('kevin')) this.load.image('kevin', 'assets/sprites/kevin.png');
        if (!this.textures.exists('vini_dog')) this.load.image('vini_dog', 'assets/sprites/vini_dog.png');
        if (!this.textures.exists('stage_bg')) this.load.image('stage_bg', 'assets/sprites/stage_bg.png');
    }

    create() {
        const { width, height } = this.scale;

        // ── CENÁRIO ──────────────────────────────────────────────
        const stageInfo = StageLoader.createStage(this, 'cmsw_hq');
        const FLOOR_Y = stageInfo.groundY;

        // Chão (retângulo invisível para física)
        const floor = this.add.rectangle(stageInfo.width / 2, FLOOR_Y + 60, stageInfo.width, 120, 0x8B6914);
        floor.setVisible(false); // Fica invisível, apenas para colisão
        this.physics.add.existing(floor, true);

        this.cameraSystem = new CameraSystem(this);
        this.vfxManager = new VFXManager(this, this.cameraSystem);

        // ── PERSONAGENS ──────────────────────────────────────────
        const graphics = this.make.graphics({});
        graphics.fillStyle(0xff00ff, 1);
        graphics.fillCircle(20, 20, 20);
        graphics.generateTexture('aura_placeholder', 40, 40);
        graphics.destroy();

        this.inputManager = new InputManager(this);
        this.projectiles = this.add.group();

        // Sombras
        this.p1Shadow = this.add.graphics();
        this.p1Shadow.fillStyle(0x000000, 0.4);
        this.p1Shadow.fillEllipse(0, 0, 70, 20);

        this.p2Shadow = this.add.graphics();
        this.p2Shadow.fillStyle(0x000000, 0.4);
        this.p2Shadow.fillEllipse(0, 0, 70, 20);

        this.player = CharacterLoader.createFighter(this, 280, FLOOR_Y - 80, this.p1Key, this.inputManager);
        this.player.setDisplaySize(120, 180);
        this.physics.add.collider(this.player, floor);

        this.player.on('fire_special', (fighter: Fighter) => {
            const dir = fighter.flipX ? -1 : 1;
            const proj = new Projectile(this, fighter.x + (70 * dir), fighter.y, 'aura_placeholder', fighter, 500 * dir, 30, 'electric');
            this.projectiles.add(proj);
        });

        this.enemy = CharacterLoader.createFighter(this, stageInfo.width - 280, FLOOR_Y - 80, this.p2Key);
        this.enemy.setDisplaySize(120, 180);
        this.enemy.setFlipX(true);
        this.physics.add.collider(this.enemy, floor);
        
        // Attach AI
        this.cpuController = new CPUController(this.enemy, this.player);
        this.enemy.inputManager = this.cpuController;

        // Colisões de combate (Agora gerenciadas via CombatSystem no update)

        this.physics.add.overlap(this.projectiles, this.enemy, (_enemyObj, projObj) => {
            const proj = projObj as Projectile;
            if (proj.hitActive && !this.enemy.isHit && proj.getOwner() !== this.enemy) {
                proj.hitActive = false;
                this.enemy.takeDamage(proj.damage, 0, proj.x, proj.damageType);
                proj.destroy();
            }
        });

        this.physics.add.overlap(this.projectiles, this.player, (_playerObj, projObj) => {
            const proj = projObj as Projectile;
            if (proj.hitActive && !this.player.isHit && proj.getOwner() !== this.player) {
                proj.hitActive = false;
                this.player.takeDamage(proj.damage, 0, proj.x, proj.damageType);
                proj.destroy();
            }
        });

        // ── HUD ──────────────────────────────────────────────────
        this.hud = new HUD(this, this.player, this.enemy);

        // ── CONTROLES TOUCH ─────────────────────────────────────
        new VirtualGamepad(this, this.inputManager);

        // ── MATCH MANAGER ─────────────────────────────────────────
        this.matchManager = new MatchManager(this, this.player, this.enemy, this.hud, this.vfxManager);
        this.matchManager.startRoundSequence();

        // ── PAUSE MENU ────────────────────────────────────────────
        this.createPauseMenu();

        this.input.keyboard?.on('keydown-ESC', () => {
            if (!this.matchManager.isMatchActive()) return;
            this.togglePause();
        });
    }

    private createPauseMenu() {
        const { width, height } = this.scale;
        this.pauseMenuOverlay = this.add.container(0, 0).setDepth(2000).setVisible(false).setScrollFactor(0);

        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0, 0);
        this.pauseMenuOverlay.add(bg);

        const title = this.add.text(width / 2, height / 2 - 100, 'PAUSED', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '60px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.pauseMenuOverlay.add(title);

        const btnResume = this.add.text(width / 2, height / 2 + 20, 'RESUME', {
            fontFamily: 'Arial Black', fontSize: '30px', color: '#00ff00'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        btnResume.on('pointerdown', () => this.togglePause());
        this.pauseMenuOverlay.add(btnResume);

        const btnQuit = this.add.text(width / 2, height / 2 + 80, 'QUIT TO MENU', {
            fontFamily: 'Arial Black', fontSize: '30px', color: '#ff0000'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        btnQuit.on('pointerdown', () => {
            this.togglePause();
            this.scene.start('MainMenuScene');
        });
        this.pauseMenuOverlay.add(btnQuit);
    }

    private togglePause() {
        this.isPaused = !this.isPaused;
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
        if (this.isPaused) return;
        if (!this.matchManager.isMatchActive()) return;

        this.player.update();
        this.cpuController.update();
        this.enemy.update();
        this.inputManager.update();
        this.hud.update();

        // Update shadows
        this.p1Shadow.x = this.player.x;
        this.p1Shadow.y = this.player.y + 90; // Approx feet position
        this.p2Shadow.x = this.enemy.x;
        this.p2Shadow.y = this.enemy.y + 90;
        
        // Scale shadow based on height (jump)
        const p1Height = (this.player.y + 90) - this.p1Shadow.y; // If not flat
        
        // Update camera
        this.cameraSystem.update(this.player, this.enemy);

        // Check Box collisions
        if (CombatSystem.checkHitboxCollision(this.player.currentHitbox, this.enemy.currentHurtbox)) {
            if (this.player.currentHitbox.type === 'throw') {
                if (CombatSystem.checkThrowRange(this.player, this.enemy)) {
                    this.enemy.stateMachine.transition('thrown');
                    this.vfxManager.cameraShake(0.02);
                }
            } else {
                CombatSystem.applyHit(this.player, this.enemy, this.player.currentHitbox, false);
                if (this.enemy.isBlocking) {
                    this.vfxManager.spawnBlockSpark(this.player.currentHitbox.x, this.player.currentHitbox.y);
                } else {
                    this.vfxManager.spawnHitSpark(this.player.currentHitbox.x, this.player.currentHitbox.y, 'heavy');
                    this.vfxManager.hitStop(4);
                    this.vfxManager.cameraShake(0.01);
                }
            }
            // Evitar multi-hit no mesmo ataque
            this.player.currentHitbox.active = false;
        }

        if (CombatSystem.checkHitboxCollision(this.enemy.currentHitbox, this.player.currentHurtbox)) {
            if (this.enemy.currentHitbox.type === 'throw') {
                if (CombatSystem.checkThrowRange(this.enemy, this.player)) {
                    this.player.stateMachine.transition('thrown');
                    this.vfxManager.cameraShake(0.02);
                }
            } else {
                CombatSystem.applyHit(this.enemy, this.player, this.enemy.currentHitbox, false);
                if (this.player.isBlocking) {
                    this.vfxManager.spawnBlockSpark(this.enemy.currentHitbox.x, this.enemy.currentHitbox.y);
                } else {
                    this.vfxManager.spawnHitSpark(this.enemy.currentHitbox.x, this.enemy.currentHitbox.y, 'heavy');
                    this.vfxManager.hitStop(4);
                    this.vfxManager.cameraShake(0.01);
                }
            }
            this.enemy.currentHitbox.active = false;
        }

        // Pushbox resolve
        CombatSystem.resolvePushbox(this.player.pushbox, this.enemy.pushbox, this.player, this.enemy);

        // Check Match Over
        this.matchManager.checkWinCondition();
    }
}
