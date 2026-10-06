import Phaser from 'phaser';
import { AudioManager } from '../engine/AudioManager';
import { ArcadeTheme, ARCADE } from '../ui/ArcadeTheme';

export class VictoryScene extends Phaser.Scene {
    private winnerId!: string;
    private p1Wins!: number;
    private p2Wins!: number;
    private mode: string = '1p';
    private arcadeStage: number = 1;

    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(data: { winner: string, loser: string, p1Wins: number, p2Wins: number, mode?: string, arcadeStage?: number }) {
        this.winnerId = data.winner || 'kevin';
        this.p1Wins = data.p1Wins || 0;
        this.p2Wins = data.p2Wins || 0;
        this.mode = data.mode || '1p';
        this.arcadeStage = data.arcadeStage || 1;
    }

    create() {
        const { width, height } = this.scale;

        AudioManager.getInstance().setScene(this);
        AudioManager.getInstance().playMusic('victory', false);

        ArcadeTheme.background(this, 'blue');
        ArcadeTheme.panel(this, width / 2 - 285, 45, 570, height - 90, ARCADE.yellow);

        const baseKey = this.winnerId.replace(/_p2$/, '');
        const winTexKey = this.textures.exists(`${this.winnerId}_win`)
            ? `${this.winnerId}_win`
            : (this.textures.exists(`${baseKey}_win`)
                ? `${baseKey}_win`
                : (this.textures.exists(`${this.winnerId}_idle`) ? `${this.winnerId}_idle` : baseKey));

        // Particles for victory background (efeito auto-gerenciado pela cena)
        // Usa 'hit_spark' (carregado no BootScene), não 'spark' (não-existente)
        this.add.particles(0, 0, 'hit_spark', {
            x: width / 2,
            y: height / 2,
            speed: { min: -100, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 2000,
            quantity: 2,
            tint: [0xffd700, 0xffaa00, 0xffffff]
        });

        // Winner Sprite (Heroic display)
        let winImg;
        if (this.textures.exists(winTexKey)) {
            winImg = this.add.image(width / 2, height / 2 - 20, winTexKey).setDisplaySize(340, 510);
            if (this.winnerId.includes('_p2')) {
                winImg.setTint(0xffaa77);
            }
            this.tweens.add({
                targets: winImg,
                y: height / 2 - 35,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        const isCampaign = this.mode === '1p' && this.p1Wins >= 2;
        const isCampaignComplete = isCampaign && this.arcadeStage >= 2;

        // Título
        const titleText = isCampaignComplete
            ? 'CAMPANHA ZERADA!'
            : (isCampaign ? `ETAPA ${this.arcadeStage} COMPLETA!` : (this.mode === '2p' ? 'VENCEDOR!' : 'VITÓRIA!'));

        ArcadeTheme.title(this, titleText, width / 2, 75, isCampaignComplete ? 52 : 64);

        // Stats Box
        const statsBg = this.add.graphics();
        statsBg.fillStyle(0x050713, 0.92);
        statsBg.fillRoundedRect(width / 2 - 220, height - 250, 440, 120, 8);
        statsBg.lineStyle(3, ARCADE.yellow, 1);
        statsBg.strokeRoundedRect(width / 2 - 220, height - 250, 440, 120, 8);

        const displayName = baseKey.includes('kevin') ? 'KEVIN MANJA' : 'VINI DOG';
        const subText = isCampaignComplete
            ? 'CAMPEÃO ABSOLUTO DO COMBAT MASTERS 2026! 🏆'
            : (isCampaign ? 'RIVAL DERROTADO! PRÓXIMO DESAFIO AGUARDA!' : `${displayName} É O CAMPEÃO!`);

        this.add.text(width / 2, height - 222, subText, {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '20px',
            color: '#ffe279',
            stroke: '#af2231',
            strokeThickness: 3,
        }).setOrigin(0.5);

        this.add.text(width / 2, height - 180, `RODADAS  ${this.p1Wins}  ×  ${this.p2Wins}`, {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '24px',
            color: '#dddddd'
        }).setOrigin(0.5);

        // Botões principais
        if (isCampaign && !isCampaignComplete) {
            // Botão Avançar para a próxima Etapa da Campanha
            const nextStageBtn = this.add.text(width / 2 - 140, height - 80, 'PRÓXIMO ADVERSÁRIO ➔', {
                fontFamily: '"Arial Black", Gadget, sans-serif',
                fontSize: '20px',
                color: '#ffffff',
                backgroundColor: '#00aa00',
                padding: { x: 18, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            nextStageBtn.on('pointerdown', () => {
                const nextStageNum = this.arcadeStage + 1;
                this.scene.start('VsScene', {
                    p1: 'kevin',
                    p2: 'vini_dog_p2',
                    p1Name: 'KEVIN MANJA',
                    p2Name: 'VINI DOG (RIVAL)',
                    mode: '1p',
                    stage: 'combat_masters_hq',
                    arcadeStage: nextStageNum
                });
            });
        } else {
            const playAgainBtn = this.add.text(width / 2 - 140, height - 80, 'REVANCHE', {
                fontFamily: '"Arial Black", Gadget, sans-serif',
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: '#ff0000',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            playAgainBtn.on('pointerdown', () => {
                this.scene.start('CharacterSelectScene', { mode: this.mode });
            });
        }

        const menuBtn = this.add.text(width / 2 + 140, height - 80, 'MENU', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#0000ff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerdown', () => {
            this.scene.start('MainMenuScene');
        });
    }
}

