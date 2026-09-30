import Phaser from 'phaser';

export class CombatScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private enemy!: Phaser.Physics.Arcade.Sprite;

    constructor() {
        super({ key: 'CombatScene' });
    }

    preload() {
        // Fase 1: Sem sprites carregadas por pipeline externo, usaremos blocos provisórios
    }

    create() {
        this.add.text(10, 10, 'CMSW Fight - Fase 1: Motor Básico', { color: '#ffffff', fontSize: '24px' });

        // Chao
        const floor = this.add.rectangle(640, 680, 1280, 80, 0x444444);
        this.physics.add.existing(floor, true); // true = isStatic

        // Grafico para jogador
        const graphics = this.make.graphics({});
        graphics.fillStyle(0x00ff00, 1);
        graphics.fillRect(0, 0, 64, 128);
        graphics.generateTexture('player_placeholder', 64, 128);

        // Grafico para inimigo
        graphics.clear();
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(0, 0, 64, 128);
        graphics.generateTexture('enemy_placeholder', 64, 128);

        // Player (Esquerda)
        this.player = this.physics.add.sprite(300, 500, 'player_placeholder');
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, floor);

        // Inimigo (Direita)
        this.enemy = this.physics.add.sprite(980, 500, 'enemy_placeholder');
        this.enemy.setCollideWorldBounds(true);
        this.physics.add.collider(this.enemy, floor);
    }

    update() {
        // Controles básicos
        const cursors = this.input.keyboard?.createCursorKeys();
        
        if (cursors?.left.isDown) {
            this.player.setVelocityX(-300);
        } else if (cursors?.right.isDown) {
            this.player.setVelocityX(300);
        } else {
            this.player.setVelocityX(0);
        }

        if (cursors?.up.isDown && this.player.body?.touching.down) {
            this.player.setVelocityY(-700);
        }
    }
}
