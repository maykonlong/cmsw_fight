import Phaser from 'phaser';
import { ArcadeTheme } from '../ui/ArcadeTheme';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        const poses = ['idle', 'walk', 'jump', 'crouch', 'punch', 'kick', 'special', 'hit', 'ko', 'win'];

        // Carrega todas as imagens de poses individuais do Kevin
        this.load.image('kevin', 'assets/sprites/kevin.png');
        poses.forEach(p => {
            this.load.image(`kevin_${p}`, `assets/sprites/kevin_${p}.png`);
        });

        // Carrega todas as imagens de poses individuais do Vini Dog
        this.load.image('vini_dog', 'assets/sprites/vini_dog.png');
        poses.forEach(p => {
            this.load.image(`vini_dog_${p}`, `assets/sprites/vini_dog_${p}.png`);
        });

        // Efeitos especiais e itens
        this.load.image('aura_beijo', 'assets/sprites/aura_beijo.png');
        this.load.image('aura_cachorro', 'assets/sprites/aura_cachorro.png');
        this.load.image('banheiro_portatil', 'assets/sprites/banheiro_portatil.png');

        // Cenários
        this.load.image('stage_bg', 'assets/sprites/stage_bg.png');
        this.load.image('stage_mg', 'assets/sprites/stage_mg.png');
        this.load.image('stage_fg', 'assets/sprites/stage_fg.png');

        // Carrega JSONs de dados (chaves idênticas aos IDs dos personagens)
        this.load.json('kevin', 'data/characters/kevin.json');
        this.load.json('vini_dog', 'data/characters/vini_dog.json');
        this.load.json('cmsw_hq', 'data/stages/cmsw_hq.json');
    }

    create() {
        const { width, height } = this.scale;

        ArcadeTheme.background(this, 'red');

        const studioText = this.add.text(width / 2, height / 2 - 50, 'C&M SOFTWARE', {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '64px',
            color: '#ffffff',
            stroke: '#d52821',
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

        this.tweens.add({
            targets: [studioText, subText],
            alpha: 1,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                this.time.delayedCall(1000, () => {
                    this.tweens.add({
                        targets: [studioText, subText],
                        alpha: 0,
                        duration: 500,
                        onComplete: () => this.scene.start('MainMenuScene')
                    });
                });
            }
        });
    }
}
