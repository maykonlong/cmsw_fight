import Phaser from 'phaser';
import { AudioManager } from '../engine/AudioManager';
import { ArcadeTheme, ARCADE } from '../ui/ArcadeTheme';

export class MainMenuScene extends Phaser.Scene {
    private selectedIndex: number = 0;
    private menuItems: Phaser.GameObjects.Text[] = [];
    private menuItemBoxes: Phaser.GameObjects.Graphics[] = [];
    private pointerArrows: Phaser.GameObjects.Text[] = [];
    private canSelect: boolean = true;
    private onKeyDown?: (e: KeyboardEvent) => void;

    private readonly OPTIONS = [
        { label: '🎮  1 PLAYER', sub: 'MODO ARCADE vs CPU', action: () => this.startGame('1p') },
        { label: '⚔️  2 PLAYERS', sub: 'DESAFIO PVP LOCAL', action: () => this.startGame('2p') },
        { label: '🥊  TREINO', sub: 'PRÁTICA COM SELEÇÃO DE CENÁRIO', action: () => this.scene.start('TrainingScene') },
        { label: '🕹️  CONTROLES', sub: 'MAPEAMENTO TECLADO & GAMEPAD', action: () => this.showControls() },
        { label: '⚙️  CONFIGURAÇÕES', sub: 'AJUSTES DE ÁUDIO & JOGO', action: () => this.scene.start('SettingsScene') },
    ];

    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const { width, height } = this.scale;
        this.canSelect = true;

        AudioManager.getInstance().setScene(this);
        AudioManager.getInstance().playMusic('menu_bgm', true);

        // Fundo Arcade Retro Neon
        ArcadeTheme.background(this, 'arcade');

        // Silhuetas dos lutadores de fundo com brilho
        if (this.textures.exists('kevin_idle')) {
            const kevinBg = this.add.image(190, height - 15, 'kevin_idle')
                .setOrigin(0.5, 1)
                .setDisplaySize(270, 420)
                .setAlpha(0.28)
                .setTint(0x00aaff);
            this.tweens.add({
                targets: kevinBg,
                y: height - 25,
                duration: 2200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        if (this.textures.exists('vini_dog_idle')) {
            const viniBg = this.add.image(width - 190, height - 15, 'vini_dog_idle')
                .setOrigin(0.5, 1)
                .setDisplaySize(270, 420)
                .setAlpha(0.28)
                .setTint(0xff3300)
                .setFlipX(true);
            this.tweens.add({
                targets: viniBg,
                y: height - 25,
                duration: 2500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Painel Central Moderno
        ArcadeTheme.panel(this, width / 2 - 340, 65, 680, 615, ARCADE.blue);

        // Header Badge
        this.add.text(width / 2, 90, '★ CMSW FIGHT ARCADE SYSTEM ★', {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '15px',
            color: '#ffd700',
            letterSpacing: 4,
        }).setOrigin(0.5);

        // Título Principal CMSW FIGHT
        const title = ArcadeTheme.title(this, 'CMSW FIGHT', width / 2, 145, 84);
        this.tweens.add({
            targets: title,
            scaleX: 1.04,
            scaleY: 1.04,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(width / 2, 204, 'COMBAT MARTIAL SOUL WARRIORS', {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '22px',
            color: '#ffffff',
            stroke: '#d52821',
            strokeThickness: 4,
            letterSpacing: 3,
        }).setOrigin(0.5);

        this.add.text(width / 2, 235, 'PRESSIONE ENTER OU CLIQUE PARA SELECIONAR', {
            fontFamily: 'Impact, Arial, sans-serif',
            fontSize: '14px',
            color: '#00ccff',
            letterSpacing: 2,
        }).setOrigin(0.5);

        // Opções do menu com design limpo e amplo
        const startY = 280;
        const spacing = 72;
        this.menuItems = [];
        this.menuItemBoxes = [];
        this.pointerArrows = [];

        this.OPTIONS.forEach((opt, i) => {
            const boxY = startY + i * spacing;
            const box = this.add.graphics();
            this.menuItemBoxes.push(box);

            const arrow = this.add.text(width / 2 - 275, boxY, '►', {
                fontFamily: 'Impact, "Arial Black"',
                fontSize: '26px',
                color: '#ffd700',
            }).setOrigin(0.5).setAlpha(0);
            this.pointerArrows.push(arrow);

            const containerText = this.add.text(width / 2, boxY - 6, opt.label, {
                fontFamily: 'Impact, "Arial Black", sans-serif',
                fontSize: '26px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            this.add.text(width / 2, boxY + 18, opt.sub, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px',
                color: '#aaaaaa',
            }).setOrigin(0.5);

            const handlePointer = () => {
                this.selectedIndex = i;
                this.updateSelection();
                this.select();
            };

            containerText.on('pointerdown', handlePointer);
            containerText.on('pointerover', () => {
                this.selectedIndex = i;
                this.updateSelection();
            });

            this.menuItems.push(containerText);
        });

        this.updateSelection();

        // Teclado
        this.onKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === 'arrowup' || key === 'w') this.move(-1);
            else if (key === 'arrowdown' || key === 's') this.move(1);
            else if (key === 'enter' || key === ' ' || key === 'z') this.select();
        };

        window.addEventListener('keydown', this.onKeyDown);
        this.events.once('shutdown', () => this.removeListeners());
        this.events.once('destroy', () => this.removeListeners());

        this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    private removeListeners() {
        if (this.onKeyDown) {
            window.removeEventListener('keydown', this.onKeyDown);
            this.onKeyDown = undefined;
        }
    }

    private move(dir: number) {
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.OPTIONS.length);
        AudioManager.getInstance().playUI('ui_cursor');
        this.updateSelection();
    }

    private updateSelection() {
        const { width } = this.scale;
        const startY = 280;
        const spacing = 72;

        this.menuItems.forEach((item, i) => {
            const box = this.menuItemBoxes[i];
            const arrow = this.pointerArrows[i];
            const boxY = startY + i * spacing;

            box.clear();
            if (i === this.selectedIndex) {
                // Card selecionado destacado com efeito neon dourado/vermelho
                box.fillStyle(0xd52821, 0.9);
                box.fillRect(width / 2 - 270, boxY - 26, 540, 56);
                box.lineStyle(3, 0xffd700, 1);
                box.strokeRect(width / 2 - 270, boxY - 26, 540, 56);

                item.setColor('#ffffff');
                item.setStroke('#000000', 5);
                item.setScale(1.05);

                arrow.setAlpha(1);
                arrow.setX(width / 2 - 245);
            } else {
                box.fillStyle(0x0a1029, 0.7);
                box.fillRect(width / 2 - 250, boxY - 22, 500, 48);
                box.lineStyle(1.5, 0x1d346b, 0.75);
                box.strokeRect(width / 2 - 250, boxY - 22, 500, 48);

                item.setColor('#bbbbbb');
                item.setStroke('#000000', 3);
                item.setScale(1.0);

                arrow.setAlpha(0);
            }
        });
    }

    private select() {
        if (!this.canSelect) return;
        this.canSelect = false;
        AudioManager.getInstance().playUI('ui_select');
        this.removeListeners();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(320, () => {
            this.OPTIONS[this.selectedIndex].action();
        });
    }

    private startGame(mode: string) {
        this.scene.start('CharacterSelectScene', { mode });
    }

    private showControls() {
        this.scene.start('ControlsScene');
    }
}
