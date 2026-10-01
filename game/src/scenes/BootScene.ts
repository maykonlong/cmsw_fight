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
        this.load.image('stage_mg', 'assets/sprites/stage_mg.png');
        this.load.image('stage_fg', 'assets/sprites/stage_fg.png');

        // Carrega os JSONs dos personagens
        this.load.json('kevin', 'src/data/characters/kevin.json');
        this.load.json('vini_dog', 'src/data/characters/vini_dog.json');

        // Carrega os JSONs dos stages
        this.load.json('cmsw_hq', 'src/data/stages/cmsw_hq.json');
    }

    create() {
        const { width, height } = this.scale;

        // Fundo preto
        this.cameras.main.setBackgroundColor('#000000');

        // Logo do estúdio
        const studioText = this.add.text(width / 2, height / 2 - 50, 'CMSW SOFTWARE', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '64px',
            color: '#ffffff',
            stroke: '#ff0000',
            strokeThickness: 8,
        }).setOrigin(0.5).setAlpha(0);

        const subText = this.add.text(width / 2, height / 2 + 50, 'RESOLVA SUA TRETA AQUI', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '28px',
            color: '#ffdd00',
            stroke: '#ff0000',
            strokeThickness: 5,
            letterSpacing: 6,
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
