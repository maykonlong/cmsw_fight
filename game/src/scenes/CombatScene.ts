import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter';
import { InputManager } from '../core/InputManager';
import { VirtualGamepad } from '../ui/VirtualGamepad';

export class CombatScene extends Phaser.Scene {
    private player!: Fighter;
    private enemy!: Phaser.Physics.Arcade.Sprite;
    private inputManager!: InputManager;

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

        this.enemy = this.physics.add.sprite(980, 500, 'enemy_placeholder');
        this.enemy.setCollideWorldBounds(true);
        this.physics.add.collider(this.enemy, floor);

        // Inicializar controles Touch/Mobile (Aparece se for dispositivo Touch)
        new VirtualGamepad(this, this.inputManager);
    }

    update() {
        this.player.update();
        
        // Limpar buffer do touch e ler estados do gamepad
        this.inputManager.update();
    }
}
