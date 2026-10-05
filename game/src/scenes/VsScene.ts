import Phaser from 'phaser';
import { ArcadeTheme, ARCADE } from '../ui/ArcadeTheme';
import { AudioManager } from '../engine/AudioManager';

interface VsData {
    p1: string;
    p2: string;
    p1Name: string;
    p2Name: string;
    mode: string;
    stage?: string;
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

        AudioManager.getInstance().setScene(this);

        // Fundo Arcade Retro
        ArcadeTheme.background(this, 'arcade');

        // Divisão Diagonal Estilizada (P1 Azul / P2 Vermelho)
        const splitGraphics = this.add.graphics();
        // Lado P1 (Triângulo Azul Cyan)
        splitGraphics.fillStyle(0x0055ff, 0.45);
        splitGraphics.fillTriangle(0, 0, width / 2 + 100, 0, width / 2 - 100, height);
        splitGraphics.fillTriangle(0, 0, width / 2 - 100, height, 0, height);

        // Lado P2 (Triângulo Vermelho Crimson)
        splitGraphics.fillStyle(0xdd1100, 0.45);
        splitGraphics.fillTriangle(width / 2 + 100, 0, width, 0, width, height);
        splitGraphics.fillTriangle(width / 2 + 100, 0, width, height, width / 2 - 100, height);

        // Linha divisória diagonal laser dourada
        splitGraphics.lineStyle(6, ARCADE.yellow, 1);
        splitGraphics.lineBetween(width / 2 + 100, 0, width / 2 - 100, height);

        const getTex = (key: string) => {
            if (this.textures.exists(key + '_idle')) return key + '_idle';
            return key;
        };

        const p1Tex = getTex(this.data_.p1);
        const p2Tex = getTex(this.data_.p2);

        // --- P1 Lado Esquerdo ---
        if (this.textures.exists(p1Tex)) {
            const p1Sprite = this.add.image(220, height / 2 + 20, p1Tex)
                .setDisplaySize(280, 420).setAlpha(0).setX(-300);
            this.tweens.add({ targets: p1Sprite, x: 240, alpha: 1, duration: 450, ease: 'Power3.easeOut' });
        }

        // Banner P1 Name
        const p1Banner = this.add.graphics();
        p1Banner.fillStyle(0x0033aa, 0.9);
        p1Banner.fillRect(0, height - 120, width / 2 - 40, 60);
        p1Banner.lineStyle(3, 0x0099ff, 1);
        p1Banner.strokeRect(0, height - 120, width / 2 - 40, 60);

        this.add.text(220, height - 90, this.data_.p1Name, {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '34px',
            fontStyle: 'italic',
            color: '#ffffff',
            stroke: '#0033aa',
            strokeThickness: 6,
        }).setOrigin(0.5);

        this.add.text(80, 50, 'P1', {
            fontFamily: 'Impact, "Arial Black"',
            fontSize: '64px',
            fontStyle: 'italic',
            color: '#00aaff',
            stroke: '#000000',
            strokeThickness: 8,
        }).setOrigin(0.5);

        // --- P2 Lado Direito ---
        if (this.textures.exists(p2Tex)) {
            const p2Sprite = this.add.image(width - 220, height / 2 + 20, p2Tex)
                .setDisplaySize(280, 420).setAlpha(0).setX(width + 300).setFlipX(true);
            this.tweens.add({ targets: p2Sprite, x: width - 240, alpha: 1, duration: 450, ease: 'Power3.easeOut' });
        }

        // Banner P2 Name
        const p2Banner = this.add.graphics();
        p2Banner.fillStyle(0xaa0000, 0.9);
        p2Banner.fillRect(width / 2 + 40, height - 120, width / 2 - 40, 60);
        p2Banner.lineStyle(3, 0xff3300, 1);
        p2Banner.strokeRect(width / 2 + 40, height - 120, width / 2 - 40, 60);

        this.add.text(width - 220, height - 90, this.data_.p2Name, {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '34px',
            fontStyle: 'italic',
            color: '#ffffff',
            stroke: '#aa0000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        this.add.text(width - 80, 50, 'P2', {
            fontFamily: 'Impact, "Arial Black"',
            fontSize: '64px',
            fontStyle: 'italic',
            color: '#ff3300',
            stroke: '#000000',
            strokeThickness: 8,
        }).setOrigin(0.5);

        // --- VS Central ---
        const vsBacking = this.add.circle(width / 2, height / 2, 95, 0x000000, 0.85)
            .setStrokeStyle(4, ARCADE.yellow).setScale(0);

        const vsText = this.add.text(width / 2, height / 2, 'VS', {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '150px',
            fontStyle: 'italic',
            color: '#fff5b8',
            stroke: '#d52821',
            strokeThickness: 14,
            shadow: { offsetX: 8, offsetY: 9, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5).setScale(3).setAlpha(0);

        this.tweens.add({
            targets: [vsBacking, vsText],
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 350,
            delay: 250,
            ease: 'Back.easeOut',
            onComplete: () => {
                AudioManager.getInstance().playSFX('swing');
                this.cameras.main.shake(180, 0.015);
                this.cameras.main.flash(250, 255, 255, 255);
            }
        });

        // Transição automática para o combate
        this.time.delayedCall(2200, () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.time.delayedCall(420, () => {
                if (this.data_.mode === 'training') {
                    this.scene.start('TrainingScene', this.data_);
                } else {
                    this.scene.start('CombatScene', this.data_);
                }
            });
        });
    }
}
