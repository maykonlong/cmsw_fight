import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Carrega os assets necessários
        this.load.image('kevin', 'assets/sprites/kevin.png');
        this.load.image('vini_dog', 'assets/sprites/vini_dog.png');
        this.load.image('stage_bg', 'assets/sprites/stage_bg.png');
        this.load.image('stage_mg', 'assets/sprites/stage_mg.png');
        this.load.image('stage_fg', 'assets/sprites/stage_fg.png');

        // Carrega os JSONs dos personagens de public/data/
        this.load.json('kevin_data', 'data/characters/kevin.json');
        this.load.json('vini_dog_data', 'data/characters/vini_dog.json');
        this.load.json('cmsw_hq_data', 'data/stages/cmsw_hq.json');
    }

    create() {
        const { width, height } = this.scale;

        // Fallbacks programáticos de textura caso imagens reais não existam
        if (!this.textures.exists('kevin')) {
            const g = this.make.graphics({});
            g.fillStyle(0x3399ff, 1);
            g.fillRect(0, 0, 80, 160);
            g.generateTexture('kevin', 80, 160);
            g.destroy();
        }

        if (!this.textures.exists('vini_dog')) {
            const g = this.make.graphics({});
            g.fillStyle(0xff3333, 1);
            g.fillRect(0, 0, 80, 160);
            g.generateTexture('vini_dog', 80, 160);
            g.destroy();
        }

        if (!this.textures.exists('stage_bg')) {
            const g = this.make.graphics({});
            g.fillStyle(0x111122, 1);
            g.fillRect(0, 0, 1280, 720);
            g.generateTexture('stage_bg', 1280, 720);
            g.destroy();
        }

        // Fundo preto
        this.cameras.main.setBackgroundColor('#000000');

        // Logo do estúdio
        const studioText = this.add.text(width / 2, height / 2 - 50, 'C&M SOFTWARE', {
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
