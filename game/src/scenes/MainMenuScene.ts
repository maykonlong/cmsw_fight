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
        { label: '1 PLAYER  [ ARCADE ]', action: () => this.startGame('1p') },
        { label: '2 PLAYERS [ DESAFIO ]', action: () => this.startGame('2p') },
        { label: 'TREINO    [ PRÁTICA ]', action: () => this.scene.start('TrainingScene') },
        { label: 'CONTROLES [ Mapeamento ]', action: () => this.showControls() },
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

        // Fundo KOF Arcade
        ArcadeTheme.background(this, 'kof');

        // Silhuetas dinâmicas dos lutadores no fundo
        if (this.textures.exists('kevin_idle')) {
            const kevinBg = this.add.image(180, height - 20, 'kevin_idle')
                .setOrigin(0.5, 1)
                .setDisplaySize(260, 410)
                .setAlpha(0.28)
                .setTint(0x00aaff);
            this.tweens.add({
                targets: kevinBg,
                y: height - 30,
                duration: 2200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        if (this.textures.exists('vini_dog_idle')) {
            const viniBg = this.add.image(width - 180, height - 20, 'vini_dog_idle')
                .setOrigin(0.5, 1)
                .setDisplaySize(260, 410)
                .setAlpha(0.28)
                .setTint(0xff3300)
                .setFlipX(true);
            this.tweens.add({
                targets: viniBg,
                y: height - 30,
                duration: 2500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Moldura Central KOF
        ArcadeTheme.panel(this, width / 2 - 320, 80, 640, 590, ARCADE.blue);

        // Sub-título KOF Superior
        this.add.text(width / 2, 105, '★ THE KING OF FIGHTERS IDENTITY ★', {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '16px',
            color: '#ffcc00',
            letterSpacing: 4,
        }).setOrigin(0.5);

        // Título Principal CMSW
        const title = ArcadeTheme.title(this, 'CMSW', width / 2, 160, 96);
        this.tweens.add({
            targets: title,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(width / 2, 222, 'COMBAT MARTIAL SOUL WARRIORS', {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#d52821',
            strokeThickness: 5,
            letterSpacing: 4,
        }).setOrigin(0.5);

        this.add.text(width / 2, 256, '— PRESS START // SELECIONE O MODO —', {
            fontFamily: 'Impact, Arial Black',
            fontSize: '16px',
            color: '#ffa500',
            letterSpacing: 4,
        }).setOrigin(0.5);

        // Itens do menu estilizados em blocos recortados estilo KOF
        const startY = 310;
        const spacing = 68;
        this.menuItems = [];
        this.menuItemBoxes = [];
        this.pointerArrows = [];

        this.OPTIONS.forEach((opt, i) => {
            const boxY = startY + i * spacing;
            const box = this.add.graphics();
            this.menuItemBoxes.push(box);

            const arrow = this.add.text(width / 2 - 250, boxY, '►', {
                fontFamily: 'Impact, "Arial Black"',
                fontSize: '28px',
                color: '#ffd700',
            }).setOrigin(0.5).setAlpha(0);
            this.pointerArrows.push(arrow);

            const item = this.add.text(width / 2, boxY, opt.label, {
                fontFamily: 'Impact, "Arial Black", sans-serif',
                fontSize: '32px',
                color: '#cccccc',
                stroke: '#000000',
                strokeThickness: 4,
                padding: { x: 20, y: 4 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            const handlePointer = () => {
                this.selectedIndex = i;
                this.updateSelection();
                this.select();
            };

            item.on('pointerdown', handlePointer);
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
        const startY = 310;
        const spacing = 68;

        this.menuItems.forEach((item, i) => {
            const box = this.menuItemBoxes[i];
            const arrow = this.pointerArrows[i];
            const boxY = startY + i * spacing;

            box.clear();
            if (i === this.selectedIndex) {
                // Caixa destacada KOF Dourada/Vermelha
                box.fillStyle(0xd52821, 0.85);
                box.fillRect(width / 2 - 240, boxY - 24, 480, 48);
                box.lineStyle(3, 0xffd700, 1);
                box.strokeRect(width / 2 - 240, boxY - 24, 480, 48);

                item.setColor('#ffffff');
                item.setStroke('#000000', 5);
                item.setScale(1.08);

                arrow.setAlpha(1);
                arrow.setX(width / 2 - 215);
            } else {
                box.fillStyle(0x0c122b, 0.65);
                box.fillRect(width / 2 - 220, boxY - 20, 440, 40);
                box.lineStyle(1.5, 0x1f366d, 0.8);
                box.strokeRect(width / 2 - 220, boxY - 20, 440, 40);

                item.setColor('#aaaaaa');
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
