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
            scale: { start: 0.12, end: 0 },
            alpha: { start: 0.9, end: 0 },
            blendMode: 'ADD',
            lifespan: 2000,
            quantity: 1,
            frequency: 120,
            tint: [0xffd700, 0xffaa00, 0xffffff]
        });

        // Cena cinematográfica específica de cada lutador (tarefa 3 do handover)
        this.playVictoryCinematic(winTexKey, baseKey);

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

    /** Palco compartilhado: sombra, piso neon e textura de fumaça gerada em runtime. */
    private setupStage(): { centerX: number; floorY: number } {
        const { width } = this.scale;
        const centerX = width / 2;
        const floorY = 440;

        if (!this.textures.exists('victory_puff')) {
            const g = this.add.graphics();
            g.fillStyle(0xffffff, 0.55);
            g.fillCircle(32, 32, 26);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(26, 26, 14);
            g.generateTexture('victory_puff', 64, 64);
            g.destroy();
        }

        const shadow = this.add.ellipse(centerX, floorY + 6, 360, 26, 0x000000, 0.45);
        shadow.setDepth(1);

        const floorLine = this.add.rectangle(centerX, floorY + 14, 520, 3, 0x00ccff, 0.5);
        floorLine.setDepth(1);

        return { centerX, floorY };
    }

    private playVictoryCinematic(winTexKey: string, baseKey: string) {
        if (!this.textures.exists(winTexKey)) return;
        const { centerX, floorY } = this.setupStage();

        if (baseKey.includes('kevin')) {
            this.playKevinCinematic(winTexKey, centerX, floorY);
        } else {
            this.playViniDogCinematic(winTexKey, centerX, floorY);
        }
    }

    /** Kevin: banheiro químico — toma banho com o clone moreno entre vapores e bolhas. */
    private playKevinCinematic(winTexKey: string, centerX: number, floorY: number) {
        const toiletX = centerX + 150;
        const toiletTopY = floorY - 235;

        const toilet = this.add.image(toiletX, floorY - 118, 'banheiro_portatil').setDisplaySize(160, 250);
        toilet.setDepth(2);

        const kevin = this.add.image(centerX - 130, floorY - 118, winTexKey).setDisplaySize(230, 240);
        if (this.winnerId.includes('_p2')) kevin.setTint(0xffaa77);
        kevin.setDepth(3);

        this.add.text(centerX, 455, 'KEVIN FOI DIRETO PRO BANHEIRO QUÍMICO!', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '15px',
            color: '#7de3ff',
        }).setOrigin(0.5).setDepth(6);

        // Kevin caminha até o banheiro quicando
        this.tweens.add({
            targets: kevin,
            x: centerX + 20,
            duration: 1100,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                // Clone moreno surge do vapor dentro do banheiro
                const clone = this.add.image(toiletX - 5, floorY - 108, 'kevin').setDisplaySize(210, 220);
                clone.setTint(0x8a5a3a).setAlpha(0).setDepth(3);
                this.tweens.add({ targets: clone, alpha: 0.96, duration: 700 });

                // Vapor quente subindo do banheiro
                this.add.particles(0, 0, 'victory_puff', {
                    x: { min: toiletX - 55, max: toiletX + 55 },
                    y: toiletTopY,
                    scaleX: { min: 0.5, max: 1.1 },
                    scaleY: { min: 0.3, max: 0.7 },
                    alpha: { start: 0.5, end: 0 },
                    tint: [0xffffff, 0xbfefff],
                    lifespan: 1600,
                    frequency: 70,
                    speedY: { min: -90, max: -45 },
                    speedX: { min: -14, max: 14 },
                    blendMode: 'ADD'
                }).setDepth(4);

                // Bolhas de sabão
                this.add.particles(0, 0, 'victory_puff', {
                    x: { min: toiletX - 45, max: toiletX + 45 },
                    y: floorY - 90,
                    scale: { min: 0.12, max: 0.28 },
                    alpha: { start: 0.9, end: 0 },
                    tint: [0x9fe8ff, 0xffffff],
                    lifespan: 1300,
                    frequency: 180,
                    speedY: { min: -120, max: -60 },
                    speedX: { min: -30, max: 30 }
                }).setDepth(4);

                // Os dois quicam felizes dentro do vapor
                for (const bouncer of [kevin, clone]) {
                    this.tweens.add({
                        targets: bouncer,
                        y: bouncer.y - 16,
                        duration: 420,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        delay: Phaser.Math.Between(0, 180)
                    });
                }
                this.tweens.add({
                    targets: toilet,
                    scaleY: { from: toilet.scaleY, to: toilet.scaleY * 1.03 },
                    duration: 420,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        // Vapor de arrasto enquanto caminha
        this.add.particles(0, 0, 'victory_puff', {
            follow: kevin,
            y: 118,
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.4, end: 0 },
            tint: 0x9fe8ff,
            lifespan: 500,
            frequency: 90,
            speedY: { min: -30, max: -10 },
            blendMode: 'ADD'
        }).setDepth(4);
    }

    /** Vini Dog: vira de costas, traga o vape e a fumaça vira um cachorro que dispara pela tela. */
    private playViniDogCinematic(winTexKey: string, centerX: number, floorY: number) {
        const vini = this.add.image(centerX - 120, floorY - 118, winTexKey).setDisplaySize(230, 240);
        if (this.winnerId.includes('_p2')) vini.setTint(0xffaa77);
        vini.setDepth(3);

        this.add.text(centerX, 455, 'A FUMAÇA DO VAPE VIROU UM CACHORRO!', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '15px',
            color: '#7de3ff',
        }).setOrigin(0.5).setDepth(6);

        // Vira de costas (tira o chapéu pro rival)
        this.time.delayedCall(500, () => {
            const baseScaleX = Math.abs(vini.scaleX);
            this.tweens.chain({
                targets: vini,
                tweens: [
                    { scaleX: 0.02, duration: 160, ease: 'Sine.easeIn' },
                    { scaleX: baseScaleX, duration: 160, ease: 'Sine.easeOut', onStart: () => vini.setFlipX(true) }
                ]
            });
        });

        // Traga o vape: fumaça sobe da cabeça
        this.time.delayedCall(1150, () => {
            const headX = vini.x + (vini.flipX ? 18 : -18);
            const headY = vini.y - 130;

            const smoke = this.add.particles(0, 0, 'victory_puff', {
                x: { min: headX - 10, max: headX + 10 },
                y: headY,
                scaleX: { start: 0.25, end: 0.8 },
                scaleY: { start: 0.18, end: 0.6 },
                alpha: { start: 0.65, end: 0 },
                tint: [0xdddddd, 0xbfefff, 0xffffff],
                lifespan: 1500,
                frequency: 90,
                speedY: { min: -110, max: -70 },
                speedX: { min: -12, max: 12 },
                blendMode: 'ADD'
            }).setDepth(4);

            this.time.delayedCall(100, () => AudioManager.getInstance().playSFX('throw', 0.35));

            // A fumaça condensa num cachorro que dispara pela tela
            this.time.delayedCall(1500, () => {
                smoke.stop();
                this.tweens.add({ targets: smoke, alpha: 0, duration: 500 });

                const dog = this.add.image(headX, headY + 20, 'aura_cachorro');
                const dogScale = 300 / dog.width;
                dog.setScale(dogScale).setAlpha(0).setFlipX(true).setBlendMode(Phaser.BlendModes.ADD).setDepth(5);

                this.tweens.add({ targets: dog, alpha: { from: 0, to: 1 }, scale: dogScale * 1.25, duration: 350, ease: 'Back.easeOut' });
                this.time.delayedCall(420, () => AudioManager.getInstance().playSFX('electric_hit', 0.5));

                // Cachorro sai correndo até a borda e volta orgulhoso
                this.time.delayedCall(700, () => {
                    this.tweens.add({ targets: dog, flipX: false, x: { from: headX, to: this.scale.width + 180 }, duration: 900, ease: 'Quad.easeIn' });
                    this.time.delayedCall(1750, () => {
                        dog.setPosition(-160, headY + 20).setFlipX(true);
                        this.tweens.add({
                            targets: dog,
                            x: centerX,
                            duration: 1000,
                            ease: 'Sine.easeOut',
                            onComplete: () => {
                                // Fica latindo feliz ao lado do Vini
                                this.tweens.add({
                                    targets: dog,
                                    x: centerX - 40,
                                    duration: 500,
                                    yoyo: true,
                                    repeat: -1,
                                    ease: 'Sine.easeInOut'
                                });
                                this.tweens.add({
                                    targets: dog,
                                    angle: { from: -6, to: 6 },
                                    duration: 260,
                                    yoyo: true,
                                    repeat: -1
                                });
                            }
                        });
                    });
                });
            });
        });
    }
}

