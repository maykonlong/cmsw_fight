import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter';
import { InputManager } from '../core/InputManager';
import { VirtualGamepad } from '../ui/VirtualGamepad';

export class CombatScene extends Phaser.Scene {
    private player!: Fighter;
    private enemy!: Fighter;
    private inputManager!: InputManager;
    private hpText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'CombatScene' });
    }

    preload() {}

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
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(0, 0, 64, 128);
        graphics.generateTexture('enemy_placeholder', 64, 128);

        this.inputManager = new InputManager(this);

        this.player = new Fighter(this, 300, 500, 'player_placeholder', this.inputManager);
        this.physics.add.collider(this.player, floor);

        // Inimigo sem InputManager (CPU/Dummy)
        this.enemy = new Fighter(this, 980, 500, 'enemy_placeholder');
        this.enemy.setFlipX(true); // Vira pra esquerda
        this.physics.add.collider(this.enemy, floor);

        // HUD de vida provisório
        this.hpText = this.add.text(900, 20, 'Enemy HP: 1000', { color: '#ff0000', fontSize: '32px' });

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

        // Inicializar controles Touch/Mobile (Aparece se for dispositivo Touch)
        new VirtualGamepad(this, this.inputManager);
    }

    update() {
        this.player.update();
        this.enemy.update();
        
        // Limpar buffer do touch e ler estados do gamepad
        this.inputManager.update();
    }
}
