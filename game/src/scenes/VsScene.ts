import Phaser from 'phaser';
import { ArcadeTheme, ARCADE } from '../ui/ArcadeTheme';

interface VsData {
    p1: string;
    p2: string;
    p1Name: string;
    p2Name: string;
    mode: string;
}

export class VsScene extends Phaser.Scene {
    private data_: VsData = { p1: 'kevin', p2: 'vini_dog', p1Name: 'KEVIN MANJA', p2Name: 'VINI DOG', mode: '1p' };

    constructor() {
        super({ key: 'VsScene' });
    }

    init(data: VsData) {
        this.data_ = data;
    }

    create() {
        const { width, height } = this.scale;

        ArcadeTheme.background(this, 'red');

        const getTex = (key: string) => {
            if (this.textures.exists(key + '_idle')) return key + '_idle';
            return key;
        };

        const p1Tex = getTex(this.data_.p1);
        const p2Tex = getTex(this.data_.p2);

        // --- P1 lado esquerdo ---
        if (this.textures.exists(p1Tex)) {
            const p1Sprite = this.add.image(180, height / 2 + 30, p1Tex)
                .setDisplaySize(240, 360).setAlpha(0).setX(-200);
            this.tweens.add({ targets: p1Sprite, x: 220, alpha: 1, duration: 500, ease: 'Power3' });
        }

        const p1Bg = this.add.graphics();
        p1Bg.fillStyle(ARCADE.blue, 0.24);
        p1Bg.fillRect(0, 0, width / 2 - 60, height);

        this.add.text(180, height - 80, this.data_.p1Name, {
            fontFamily: '"Arial Black"',
            fontSize: '36px',
            color: '#3399ff',
            stroke: '#000000',
            strokeThickness: 5,
        }).setOrigin(0.5);

        this.add.text(180, 50, 'P1', {
            fontFamily: '"Arial Black"',
            fontSize: '52px',
            color: '#3399ff',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        // --- P2 lado direito ---
        if (this.textures.exists(p2Tex)) {
            const p2Sprite = this.add.image(width - 180, height / 2 + 30, p2Tex)
                .setDisplaySize(240, 360).setAlpha(0).setX(width + 200).setFlipX(true);
            this.tweens.add({ targets: p2Sprite, x: width - 220, alpha: 1, duration: 500, ease: 'Power3' });
        }

        const p2Bg = this.add.graphics();
        p2Bg.fillStyle(ARCADE.red, 0.24);
        p2Bg.fillRect(width / 2 + 60, 0, width / 2 - 60, height);

        this.add.text(width - 180, height - 80, this.data_.p2Name, {
            fontFamily: '"Arial Black"',
            fontSize: '36px',
            color: '#ff4400',
            stroke: '#000000',
            strokeThickness: 5,
        }).setOrigin(0.5);

        this.add.text(width - 180, 50, 'P2', {
            fontFamily: '"Arial Black"',
            fontSize: '52px',
            color: '#ff4400',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        // --- VS no centro ---
        const vsText = this.add.text(width / 2, height / 2, 'VS', {
            fontFamily: '"Arial Black"',
            fontSize: '130px',
            color: '#ffffff',
            stroke: '#ff2200',
            strokeThickness: 12,
        }).setOrigin(0.5).setScale(0);

        this.tweens.add({
            targets: vsText,
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            delay: 300,
            ease: 'Back.easeOut',
        });

        // Camera flash
        this.time.delayedCall(400, () => {
            this.cameras.main.flash(200, 255, 255, 255);
        });

        // Vai para o combate
        this.time.delayedCall(2200, () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.time.delayedCall(420, () => {
                this.scene.start('CombatScene', this.data_);
            });
        });
    }
}
