import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter';
import { Projectile } from '../entities/Projectile';
import { InputManager } from '../core/InputManager';
import { VirtualGamepad } from '../ui/VirtualGamepad';

export class CombatScene extends Phaser.Scene {
    private player!: Fighter;
    private enemy!: Fighter;
    private inputManager!: InputManager;
    private hpText!: Phaser.GameObjects.Text;
    private projectiles!: Phaser.GameObjects.Group;
    private matchOver: boolean = false;
    private koText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'CombatScene' });
    }

    preload() {
        this.load.image('kevin', 'assets/sprites/kevin.png');
        this.load.image('vini_dog', 'assets/sprites/vini_dog.png');
    }

    create() {
        this.add.text(10, 10, 'CMSW Fight - Fase 2: Máquina de Estados e Combate', { color: '#ffffff', fontSize: '24px' });
        this.add.text(10, 40, 'Controles: Setas p/ Mover | Baixo p/ Agachar | Z p/ Socar', { color: '#aaaaaa', fontSize: '16px' });

        const floor = this.add.rectangle(640, 680, 1280, 80, 0x444444);
        this.physics.add.existing(floor, true);

        const graphics = this.make.graphics({});
        graphics.fillStyle(0x00ff00, 1);
        graphics.fillRect(0, 0, 64, 128);
        graphics.generateTexture('player_placeholder', 64, 128);

        graphics.clear();
        graphics.fillStyle(0xff00ff, 1);
        graphics.fillCircle(16, 16, 16);
        graphics.generateTexture('aura_placeholder', 32, 32);

        this.inputManager = new InputManager(this);
        this.projectiles = this.add.group();

        this.player = new Fighter(this, 300, 500, 'kevin', this.inputManager);
        this.player.setScale(0.18);
        this.physics.add.collider(this.player, floor);

        // Ouvir o disparo do especial (Aura do beijo)
        this.player.on('fire_special', (fighter: Fighter) => {
            const dir = fighter.flipX ? -1 : 1;
            const proj = new Projectile(this, fighter.x + (50 * dir), fighter.y, 'aura_placeholder', fighter, 400 * dir, 30, 'electric');
            this.projectiles.add(proj);
        });

        // Inimigo sem InputManager (CPU/Dummy)
        this.enemy = new Fighter(this, 980, 500, 'vini_dog');
        this.enemy.setScale(0.18);
        this.enemy.setFlipX(true); // Vira pra esquerda
        this.physics.add.collider(this.enemy, floor);

        // HUD de vida provisório
        this.hpText = this.add.text(900, 20, 'Enemy HP: 1000', { color: '#ff0000', fontSize: '32px' });

        this.koText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'K.O.', { 
            font: '100px Arial', 
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 8
        }).setOrigin(0.5).setVisible(false);
        // Detecção de colisão (Hitbox do Player -> Corpo do Enemy)
        this.physics.add.overlap(this.player.hitbox, this.enemy, () => {
            const hitboxBody = this.player.hitbox.body as Phaser.Physics.Arcade.Body;
            // Se hitbox estiver ativo e o inimigo não estiver já em hit stun
            if (hitboxBody.enable && !this.enemy.isHit) {
                // Aplica 50 de dano e 400 de pushback
                this.enemy.takeDamage(50, 400, this.player.x);
                this.hpText.setText(`Enemy HP: ${this.enemy.hp}`);
            }
        });

        // Detecção de colisão (Projéteis -> Enemy)
        this.physics.add.overlap(this.projectiles, this.enemy, (enemyObj, projObj) => {
            const enemy = enemyObj as Fighter;
            const proj = projObj as Projectile;
            
            if (proj.hitActive && !enemy.isHit && proj.getOwner() !== enemy) {
                proj.hitActive = false; // Só acerta uma vez
                enemy.takeDamage(proj.damage, 0, proj.x, proj.damageType);
                this.hpText.setText(`Enemy HP: ${enemy.hp}`);
                proj.destroy(); // Destroi a aura ao acertar
            }
        });

        // Detecção de colisão (Projéteis -> Player se houver)
        this.physics.add.overlap(this.projectiles, this.player, (playerObj, projObj) => {
            const player = playerObj as Fighter;
            const proj = projObj as Projectile;
            if (proj.hitActive && !player.isHit && proj.getOwner() !== player) {
                proj.hitActive = false;
                player.takeDamage(proj.damage, 0, proj.x, proj.damageType);
                proj.destroy();
            }
        });

        // Inicializar controles Touch/Mobile (Aparece se for dispositivo Touch)
        new VirtualGamepad(this, this.inputManager);
    }

    update() {
        if (this.matchOver) return;

        this.player.update();
        this.enemy.update();
        
        // Limpar buffer do touch e ler estados do gamepad
        this.inputManager.update();

        // Checagem de Fim de Luta
        if (this.enemy.hp <= 0) {
            this.endMatch(this.player, this.enemy);
        } else if (this.player.hp <= 0) {
            this.endMatch(this.enemy, this.player);
        }
    }

    private endMatch(winner: Fighter, loser: Fighter) {
        this.matchOver = true;
        this.koText.setVisible(true);

        loser.stateMachine.transition('ko');
        winner.stateMachine.transition('win');

        // Um efeito dramático de câmera
        this.cameras.main.shake(500, 0.02);
    }
}
