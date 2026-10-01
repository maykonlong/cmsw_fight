import Phaser from 'phaser';
import { AudioManager } from '../engine/AudioManager';

export class MainMenuScene extends Phaser.Scene {
    private selectedIndex: number = 0;
    private menuItems: Phaser.GameObjects.Text[] = [];
    private canSelect: boolean = true;
    private onKeyDown?: (e: KeyboardEvent) => void;

    private readonly OPTIONS = [
        { label: '1 PLAYER', action: () => this.startGame('1p') },
        { label: '2 PLAYERS', action: () => this.startGame('2p') },
        { label: 'TREINO', action: () => this.scene.start('TrainingScene') },
        { label: 'CONTROLES', action: () => this.showControls() },
        { label: 'CONFIGURAÇÕES', action: () => this.scene.start('SettingsScene') },
    ];

    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const { width, height } = this.scale;
        this.canSelect = true;

        AudioManager.getInstance().setScene(this);
        AudioManager.getInstance().playMusic('menu_bgm', true);

        // Fundo gradiente escuro com overlay
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0d0221, 0x0d0221, 0x1a0533, 0x1a0533, 1);
        bg.fillRect(0, 0, width, height);

        // Sprites dos lutadores ao fundo (silhuetas)
        if (this.textures.exists('kevin')) {
            const kevinBg = this.add.image(200, height - 10, 'kevin')
                .setOrigin(0.5, 1)
                .setScale(0.85)
                .setAlpha(0.2)
                .setTint(0x4488ff);
            this.tweens.add({
                targets: kevinBg,
                y: height - 20,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        if (this.textures.exists('vini_dog')) {
            const viniBg = this.add.image(width - 200, height - 10, 'vini_dog')
                .setOrigin(0.5, 1)
                .setScale(0.85)
                .setAlpha(0.2)
                .setTint(0xff4444)
                .setFlipX(true);
            this.tweens.add({
                targets: viniBg,
                y: height - 20,
                duration: 2200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Linha decorativa superior e inferior
        const topLine = this.add.graphics();
        topLine.fillStyle(0xff2200, 1);
        topLine.fillRect(0, 0, width, 6);

        const btmLine = this.add.graphics();
        btmLine.fillStyle(0xff2200, 1);
        btmLine.fillRect(0, height - 6, width, 6);

        // Título principal
        const title = this.add.text(width / 2, 140, 'C&M FIGTH', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '96px',
            color: '#ffffff',
            stroke: '#ff2200',
            strokeThickness: 10,
        }).setOrigin(0.5);

        this.tweens.add({
            targets: title,
            scaleX: 1.04,
            scaleY: 1.04,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(width / 2, 230, '— SELECIONE —', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ff8800',
            letterSpacing: 8,
        }).setOrigin(0.5);

        // Items do menu
        const startY = 300;
        const spacing = 72;
        this.menuItems = [];

        this.OPTIONS.forEach((opt, i) => {
            const item = this.add.text(width / 2, startY + i * spacing, opt.label, {
                fontFamily: '"Arial Black", Gadget, sans-serif',
                fontSize: '40px',
                color: '#cccccc',
                stroke: '#000000',
                strokeThickness: 4,
                padding: { x: 20, y: 5 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            const handlePointer = () => {
                this.selectedIndex = i;
                this.updateSelection();
                this.select();
            };

            item.on('pointerdown', handlePointer);
            item.on('pointerup', handlePointer);

            item.on('pointerover', () => {
                this.selectedIndex = i;
                this.updateSelection();
            });

            this.menuItems.push(item);
        });

        this.updateSelection();

        // Listener de teclado nativo DOM
        this.onKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === 'arrowup' || key === 'w') this.move(-1);
            else if (key === 'arrowdown' || key === 's') this.move(1);
            else if (key === 'enter' || key === ' ' || key === 'z') this.select();
        };

        window.addEventListener('keydown', this.onKeyDown);
        this.events.once('shutdown', () => this.removeListeners());
        this.events.once('destroy', () => this.removeListeners());

        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    private removeListeners() {
        if (this.onKeyDown) {
            window.removeEventListener('keydown', this.onKeyDown);
            this.onKeyDown = undefined;
        }
    }

    private move(dir: number) {
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.OPTIONS.length);
        this.updateSelection();
    }

    private updateSelection() {
        this.menuItems.forEach((item, i) => {
            if (i === this.selectedIndex) {
                item.setColor('#ffdd00');
                item.setStroke('#ff2200', 5);
                item.setScale(1.12);
            } else {
                item.setColor('#cccccc');
                item.setStroke('#000000', 4);
                item.setScale(1);
            }
        });
    }

    private select() {
        if (!this.canSelect) return;
        this.canSelect = false;
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
