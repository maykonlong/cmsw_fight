import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter';
import { Projectile } from '../entities/Projectile';
import { InputManager } from '../core/InputManager';
import { VirtualGamepad } from '../ui/VirtualGamepad';
import { CombatSystem } from '../engine/CombatSystem';

export class CombatScene extends Phaser.Scene {
    private player!: Fighter;
    private enemy!: Fighter;
    private inputManager!: InputManager;
    private projectiles!: Phaser.GameObjects.Group;
    private matchOver: boolean = false;

    // HUD
    private p1HpBar!: Phaser.GameObjects.Graphics;
    private p2HpBar!: Phaser.GameObjects.Graphics;
    private p1HpMax: number = 1000;
    private p2HpMax: number = 1000;
    private timerText!: Phaser.GameObjects.Text;
    private roundTime: number = 99;
    private koText!: Phaser.GameObjects.Text;
    private fightText!: Phaser.GameObjects.Text;
    private timerEvent!: Phaser.Time.TimerEvent;

    // Dados dos personagens
    private p1Key: string = 'kevin';
    private p2Key: string = 'vini_dog';
    private p1Name: string = 'KEVIN';
    private p2Name: string = 'VINI DOG';

    constructor() {
        super({ key: 'CombatScene' });
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
        const FLOOR_Y = 590;

        // ── CENÁRIO ──────────────────────────────────────────────
        if (this.textures.exists('stage_bg')) {
            this.add.image(width / 2, height / 2, 'stage_bg')
                .setDisplaySize(width, height);
        } else {
            // Fallback: gradient de céu
            const bgGfx = this.add.graphics();
            bgGfx.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x4682b4, 0x4682b4, 1);
            bgGfx.fillRect(0, 0, width, height);
        }

        // Chão (retângulo invisível para física)
        const floor = this.add.rectangle(width / 2, FLOOR_Y + 60, width, 120, 0x8B6914);
        this.physics.add.existing(floor, true);

        // Sombra do chão
        const floorTop = this.add.graphics();
        floorTop.fillStyle(0x000000, 0.3);
        floorTop.fillRect(0, FLOOR_Y, width, 4);

        // ── PERSONAGENS ──────────────────────────────────────────
        const graphics = this.make.graphics({});
        graphics.fillStyle(0xff00ff, 1);
        graphics.fillCircle(20, 20, 20);
        graphics.generateTexture('aura_placeholder', 40, 40);
        graphics.destroy();

        this.inputManager = new InputManager(this);
        this.projectiles = this.add.group();

        this.player = new Fighter(this, 280, FLOOR_Y - 80, this.p1Key, this.inputManager);
        this.player.setDisplaySize(120, 180);
        this.physics.add.collider(this.player, floor);

        this.player.on('fire_special', (fighter: Fighter) => {
            const dir = fighter.flipX ? -1 : 1;
            const proj = new Projectile(this, fighter.x + (70 * dir), fighter.y, 'aura_placeholder', fighter, 500 * dir, 30, 'electric');
            this.projectiles.add(proj);
        });

        this.enemy = new Fighter(this, width - 280, FLOOR_Y - 80, this.p2Key);
        this.enemy.setDisplaySize(120, 180);
        this.enemy.setFlipX(true);
        this.physics.add.collider(this.enemy, floor);

        // Colisões de combate (Agora gerenciadas via CombatSystem no update)

        this.physics.add.overlap(this.projectiles, this.enemy, (_enemyObj, projObj) => {
            const proj = projObj as Projectile;
            if (proj.hitActive && !this.enemy.isHit && proj.getOwner() !== this.enemy) {
                proj.hitActive = false;
                this.enemy.takeDamage(proj.damage, 0, proj.x, proj.damageType);
                this.updateHpBars();
                proj.destroy();
            }
        });

        this.physics.add.overlap(this.projectiles, this.player, (_playerObj, projObj) => {
            const proj = projObj as Projectile;
            if (proj.hitActive && !this.player.isHit && proj.getOwner() !== this.player) {
                proj.hitActive = false;
                this.player.takeDamage(proj.damage, 0, proj.x, proj.damageType);
                this.updateHpBars();
                proj.destroy();
            }
        });

        // ── HUD ──────────────────────────────────────────────────
        this.createHUD();

        // ── CONTROLES TOUCH ─────────────────────────────────────
        new VirtualGamepad(this, this.inputManager);

        // ── FIGHT! INTRO ─────────────────────────────────────────
        this.fightText = this.add.text(width / 2, height / 2, 'FIGHT!', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '100px',
            color: '#ffdd00',
            stroke: '#ff2200',
            strokeThickness: 10,
        }).setOrigin(0.5).setDepth(100);

        this.cameras.main.fadeIn(300, 0, 0, 0);
        this.tweens.add({
            targets: this.fightText,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0,
            duration: 900,
            delay: 600,
            onComplete: () => this.fightText.destroy()
        });

        // Timer regressivo
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (!this.matchOver) {
                    this.roundTime--;
                    this.timerText.setText(String(this.roundTime).padStart(2, '0'));
                    if (this.roundTime <= 0) this.timeUp();
                }
            },
            loop: true
        });

        // K.O. text (hidden)
        this.koText = this.add.text(width / 2, height / 2, 'K.O.', {
            fontFamily: '"Arial Black"',
            fontSize: '130px',
            color: '#ff0000',
            stroke: '#ffffff',
            strokeThickness: 10,
        }).setOrigin(0.5).setDepth(200).setVisible(false);
    }

    // ── HUD ───────────────────────────────────────────────────────
    private createHUD() {
        const { width } = this.scale;
        const barW = 440;
        const barH = 28;
        const barY = 44;
        const barPad = 6;

        // Fundo do HUD (faixa superior)
        const hudBg = this.add.graphics().setDepth(50);
        hudBg.fillStyle(0x000000, 0.75);
        hudBg.fillRect(0, 0, width, 90);

        // ── Barra P1 (esquerda) ──
        const p1BgBar = this.add.graphics().setDepth(51);
        p1BgBar.fillStyle(0x333333, 1);
        p1BgBar.fillRect(barPad, barY, barW, barH);

        this.p1HpBar = this.add.graphics().setDepth(52);

        // ── Barra P2 (direita, invertida) ──
        const p2BgBar = this.add.graphics().setDepth(51);
        p2BgBar.fillStyle(0x333333, 1);
        p2BgBar.fillRect(width - barPad - barW, barY, barW, barH);

        this.p2HpBar = this.add.graphics().setDepth(52);

        // Nomes
        this.add.text(barPad, barY - 20, this.p1Name, {
            fontFamily: '"Arial Black"',
            fontSize: '18px',
            color: '#3399ff',
            stroke: '#000000',
            strokeThickness: 4,
        }).setDepth(53);

        this.add.text(width - barPad, barY - 20, this.p2Name, {
            fontFamily: '"Arial Black"',
            fontSize: '18px',
            color: '#ff4400',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(1, 0).setDepth(53);

        // Timer
        const timerBg = this.add.graphics().setDepth(51);
        timerBg.fillStyle(0x111111, 1);
        timerBg.fillRoundedRect(width / 2 - 42, barY - 6, 84, 48, 8);
        timerBg.lineStyle(3, 0xffdd00, 1);
        timerBg.strokeRoundedRect(width / 2 - 42, barY - 6, 84, 48, 8);

        this.timerText = this.add.text(width / 2, barY + 18, '99', {
            fontFamily: '"Arial Black"',
            fontSize: '36px',
            color: '#ffdd00',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(53);

        // Round text (local, just visual)
        this.add.text(width / 2, 78, 'ROUND 1', {
            fontFamily: '"Arial Black"',
            fontSize: '14px',
            color: '#ffffff',
            letterSpacing: 4,
        }).setOrigin(0.5).setDepth(53);

        // Preencher barras inicial
        this.updateHpBars();
    }

    private updateHpBars() {
        const { width } = this.scale;
        const barW = 440;
        const barH = 28;
        const barY = 44;
        const barPad = 6;

        // Cor baseada no HP
        const p1Pct = this.player.hp / this.p1HpMax;
        const p2Pct = this.enemy.hp / this.p2HpMax;

        const getBarColor = (pct: number) => {
            if (pct > 0.5) return 0x00dd00;
            if (pct > 0.25) return 0xffaa00;
            return 0xff2200;
        };

        this.p1HpBar.clear();
        this.p1HpBar.fillStyle(getBarColor(p1Pct), 1);
        this.p1HpBar.fillRect(barPad, barY, barW * p1Pct, barH);

        this.p2HpBar.clear();
        this.p2HpBar.fillStyle(getBarColor(p2Pct), 1);
        // Barra P2 cresce da direita para o centro
        const p2Width = barW * p2Pct;
        this.p2HpBar.fillRect(width - barPad - barW + (barW - p2Width), barY, p2Width, barH);
    }

    // ── GAME LOOP ────────────────────────────────────────────────
    update() {
        if (this.matchOver) return;

        this.player.update();
        this.enemy.update();
        this.inputManager.update();

        // Check Box collisions
        if (CombatSystem.checkHitboxCollision(this.player.currentHitbox, this.enemy.currentHurtbox)) {
            if (this.player.currentHitbox.type === 'throw') {
                if (CombatSystem.checkThrowRange(this.player, this.enemy)) {
                    this.enemy.stateMachine.transition('thrown');
                }
            } else {
                CombatSystem.applyHit(this.player, this.enemy, this.player.currentHitbox, false);
                this.updateHpBars();
            }
            // Evitar multi-hit no mesmo ataque
            this.player.currentHitbox.active = false;
        }

        if (CombatSystem.checkHitboxCollision(this.enemy.currentHitbox, this.player.currentHurtbox)) {
            if (this.enemy.currentHitbox.type === 'throw') {
                if (CombatSystem.checkThrowRange(this.enemy, this.player)) {
                    this.player.stateMachine.transition('thrown');
                }
            } else {
                CombatSystem.applyHit(this.enemy, this.player, this.enemy.currentHitbox, false);
                this.updateHpBars();
            }
            this.enemy.currentHitbox.active = false;
        }

        // Pushbox resolve
        CombatSystem.resolvePushbox(this.player.pushbox, this.enemy.pushbox, this.player, this.enemy);

        if (this.enemy.hp <= 0) {
            this.endMatch(this.player, this.enemy);
        } else if (this.player.hp <= 0) {
            this.endMatch(this.enemy, this.player);
        }
    }

    private timeUp() {
        // Quem tem mais HP ganha
        if (this.player.hp >= this.enemy.hp) {
            this.endMatch(this.player, this.enemy);
        } else {
            this.endMatch(this.enemy, this.player);
        }
    }

    private endMatch(winner: Fighter, loser: Fighter) {
        this.matchOver = true;
        this.timerEvent.remove();

        loser.stateMachine.transition('ko');
        winner.stateMachine.transition('win');

        this.cameras.main.shake(600, 0.025);
        this.cameras.main.flash(150, 255, 255, 255);

        this.time.delayedCall(300, () => {
            this.koText.setVisible(true);
            this.tweens.add({
                targets: this.koText,
                scaleX: 1.15,
                scaleY: 1.15,
                duration: 300,
                yoyo: true,
                repeat: 2,
            });
        });

        // Volta ao menu depois de 4s
        this.time.delayedCall(4500, () => {
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.time.delayedCall(820, () => this.scene.start('MainMenuScene'));
        });
    }
}
