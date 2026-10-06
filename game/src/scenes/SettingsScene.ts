import Phaser from 'phaser';
import { AudioManager } from '../engine/AudioManager';
import { ArcadeTheme, ARCADE } from '../ui/ArcadeTheme';

export class SettingsScene extends Phaser.Scene {
    private selectedIndex: number = 0;
    private menuItems: Phaser.GameObjects.Text[] = [];
    
    private diffLevels = ['EASY', 'NORMAL', 'HARD'];
    private currentDiff: number = 1;
    private fullscreen: boolean = false;
    
    private audioManager!: AudioManager;
    private onKeyDown?: (e: KeyboardEvent) => void;

    constructor() {
        super({ key: 'SettingsScene' });
    }

    create() {
        const { width } = this.scale;

        ArcadeTheme.background(this, 'red');
        ArcadeTheme.panel(this, width / 2 - 330, 110, 660, 500, ARCADE.red);

        ArcadeTheme.title(this, 'CONFIGURAÇÕES', width / 2, 80, 54);

        this.audioManager = AudioManager.getInstance();
        this.audioManager.setScene(this);

        const savedDiff = localStorage.getItem('COMBAT MASTERS_diff');
        if (savedDiff !== null) this.currentDiff = parseInt(savedDiff, 10);

        const startY = 220;
        const spacing = 75;

        const options = [
            { label: () => `DIFICULDADE CPU: < ${this.diffLevels[this.currentDiff]} >`, action: () => this.adjust(1) },
            { label: () => `VOLUME MÚSICA: < ${Math.round(this.audioManager.musicVolume * 10)} >`, action: () => this.adjust(1) },
            { label: () => `VOLUME EFEITOS: < ${Math.round(this.audioManager.sfxVolume * 10)} >`, action: () => this.adjust(1) },
            { label: () => `TELA CHEIA: ${this.fullscreen ? 'ON' : 'OFF'}`, action: () => this.toggleFullscreen() },
            { label: () => '[ VOLTAR AO MENU ]', action: () => this.goBack() }
        ];

        this.menuItems = [];
        options.forEach((opt, i) => {
            const item = this.add.text(width / 2, startY + i * spacing, opt.label(), {
                fontFamily: '"Arial Black", Gadget, sans-serif',
                fontSize: '32px',
                color: '#cccccc',
                stroke: '#000000',
                strokeThickness: 4,
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            const handlePointer = () => {
                this.selectedIndex = i;
                this.updateSelection();
                opt.action();
            };

            item.on('pointerdown', handlePointer);

            item.on('pointerover', () => {
                this.selectedIndex = i;
                this.updateSelection();
            });

            this.menuItems.push(item);
        });

        this.updateSelection();

        this.onKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === 'arrowup' || key === 'w') this.move(-1);
            else if (key === 'arrowdown' || key === 's') this.move(1);
            else if (key === 'arrowleft' || key === 'a') this.adjust(-1);
            else if (key === 'arrowright' || key === 'd') this.adjust(1);
            else if (key === 'enter' || key === ' ' || key === 'z') this.select(options);
            else if (key === 'escape' || key === 'backspace') this.goBack();
        };

        window.addEventListener('keydown', this.onKeyDown);
        this.events.once('shutdown', () => this.removeListeners());
        this.events.once('destroy', () => this.removeListeners());

        this.events.on('update', () => {
            options.forEach((opt, i) => {
                if (this.menuItems[i]) {
                    this.menuItems[i].setText(opt.label());
                }
            });
        });
    }

    private removeListeners() {
        if (this.onKeyDown) {
            window.removeEventListener('keydown', this.onKeyDown);
            this.onKeyDown = undefined;
        }
    }

    private goBack() {
        this.removeListeners();
        this.audioManager.saveSettings();
        this.scene.start('MainMenuScene');
    }

    private move(dir: number) {
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.menuItems.length);
        this.updateSelection();
    }

    private adjust(dir: number) {
        if (this.selectedIndex === 0) {
            this.currentDiff = Phaser.Math.Wrap(this.currentDiff + dir, 0, this.diffLevels.length);
            localStorage.setItem('COMBAT MASTERS_diff', this.currentDiff.toString());
        } else if (this.selectedIndex === 1) {
            this.audioManager.musicVolume = Phaser.Math.Clamp(this.audioManager.musicVolume + (dir * 0.1), 0, 1);
        } else if (this.selectedIndex === 2) {
            this.audioManager.sfxVolume = Phaser.Math.Clamp(this.audioManager.sfxVolume + (dir * 0.1), 0, 1);
            this.audioManager.voiceVolume = this.audioManager.sfxVolume;
            if (dir !== 0) this.audioManager.playUI('ui_cursor');
        } else if (this.selectedIndex === 3) {
            this.toggleFullscreen();
        } else if (this.selectedIndex === 4) {
            this.goBack();
        }
    }

    private toggleFullscreen() {
        this.fullscreen = !this.fullscreen;
        if (this.scale.isFullscreen) {
            this.scale.stopFullscreen();
        } else {
            this.scale.startFullscreen();
        }
    }

    private updateSelection() {
        this.menuItems.forEach((item, i) => {
            if (i === this.selectedIndex) {
                item.setColor('#ffdd00');
                item.setStroke('#ff0000', 5);
                item.setScale(1.1);
            } else {
                item.setColor('#cccccc');
                item.setStroke('#000000', 4);
                item.setScale(1);
            }
        });
    }

    private select(options: any[]) {
        options[this.selectedIndex].action();
    }
}
