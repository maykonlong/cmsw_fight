import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Carrega os assets necessários para o menu
        this.load.image('kevin', 'assets/sprites/kevin.png');
        this.load.image('vini_dog', 'assets/sprites/vini_dog.png');
        this.load.image('stage_bg', 'assets/sprites/stage_bg.png');
    }

    create() {
        const { width, height } = this.scale;

        // Fundo preto
        this.cameras.main.setBackgroundColor('#000000');

        // Logo do estúdio
        const studioText = this.add.text(width / 2, height / 2 - 40, 'CMSW SOFTWARE', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '52px',
            color: '#ffffff',
            stroke: '#ff0000',
            strokeThickness: 6,
        }).setOrigin(0.5).setAlpha(0);

        const subText = this.add.text(width / 2, height / 2 + 40, 'APRESENTA', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#cccccc',
            letterSpacing: 12,
        }).setOrigin(0.5).setAlpha(0);

        // Fade in → espera → Fade out → vai pro menu
        this.tweens.add({
            targets: [studioText, subText],
            alpha: 1,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: [studioText, subText],
                        alpha: 0,
                        duration: 600,
                        onComplete: () => this.scene.start('MainMenuScene')
                    });
                });
            }
        });
    }
}
