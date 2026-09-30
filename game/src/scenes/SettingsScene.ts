import Phaser from 'phaser';
import { AudioManager } from '../engine/AudioManager';

export class SettingsScene extends Phaser.Scene {
    private selectedIndex: number = 0;
    private menuItems: Phaser.GameObjects.Text[] = [];
    
    // Configurações
    private diffLevels = ['EASY', 'NORMAL', 'HARD'];
    private currentDiff: number = 1; // NORMAL
    private fullscreen: boolean = false;
    
    private audioManager!: AudioManager;

    constructor() {
        super({ key: 'SettingsScene' });
    }

    create() {
        const { width, height } = this.scale;

        this.add.rectangle(0, 0, width, height, 0x111122).setOrigin(0, 0);

        this.add.text(width / 2, 80, 'CONFIGURAÇÕES', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '60px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.audioManager = AudioManager.getInstance();
        this.audioManager.setScene(this);

        // Load configs if any
        const savedDiff = localStorage.getItem('cmsw_diff');
        if (savedDiff !== null) this.currentDiff = parseInt(savedDiff);

        // Options
        const startY = 250;
        const spacing = 80;

        const options = [
            { label: () => `DIFICULDADE CPU: < ${this.diffLevels[this.currentDiff]} >`, action: () => this.toggleDiff() },
            { label: () => `VOLUME MÚSICA: < ${Math.round(this.audioManager.musicVolume * 10)} >`, action: () => {} },
            { label: () => `VOLUME EFEITOS: < ${Math.round(this.audioManager.sfxVolume * 10)} >`, action: () => {} },
            { label: () => `TELA CHEIA: ${this.fullscreen ? 'ON' : 'OFF'}`, action: () => this.toggleFullscreen() },
            { label: () => 'VOLTAR', action: () => {
                this.audioManager.saveSettings();
                this.scene.start('MainMenuScene');
            }}
        ];

        options.forEach((opt, i) => {
            const item = this.add.text(width / 2, startY + i * spacing, opt.label(), {
                fontFamily: '"Arial Black", Gadget, sans-serif',
                fontSize: '32px',
                color: '#cccccc'
            }).setOrigin(0.5);
            this.menuItems.push(item);
        });

        this.updateSelection();

        this.input.keyboard?.on('keydown-UP', () => this.move(-1));
        this.input.keyboard?.on('keydown-DOWN', () => this.move(1));
        this.input.keyboard?.on('keydown-LEFT', () => this.adjust(-1));
        this.input.keyboard?.on('keydown-RIGHT', () => this.adjust(1));
        this.input.keyboard?.on('keydown-ENTER', () => this.select(options));
        this.input.keyboard?.on('keydown-SPACE', () => this.select(options));

        // Update labels dynamically
        this.events.on('update', () => {
            options.forEach((opt, i) => {
                this.menuItems[i].setText(opt.label());
            });
        });
    }

    private move(dir: number) {
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.menuItems.length);
        this.updateSelection();
    }

    private adjust(dir: number) {
        if (this.selectedIndex === 0) { // Difficulty
            this.currentDiff = Phaser.Math.Wrap(this.currentDiff + dir, 0, this.diffLevels.length);
            localStorage.setItem('cmsw_diff', this.currentDiff.toString());
        } else if (this.selectedIndex === 1) { // Music
            this.audioManager.musicVolume = Phaser.Math.Clamp(this.audioManager.musicVolume + (dir * 0.1), 0, 1);
        } else if (this.selectedIndex === 2) { // SFX
            this.audioManager.sfxVolume = Phaser.Math.Clamp(this.audioManager.sfxVolume + (dir * 0.1), 0, 1);
            this.audioManager.voiceVolume = this.audioManager.sfxVolume; // Link voice to SFX for now
            if (dir !== 0) this.audioManager.playUI('ui_cursor'); // Play test sound
        }
    }

    private toggleDiff() {
        this.adjust(1);
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
                item.setScale(1.1);
            } else {
                item.setColor('#cccccc');
                item.setScale(1);
            }
        });
    }

    private select(options: any[]) {
        options[this.selectedIndex].action();
    }
}
