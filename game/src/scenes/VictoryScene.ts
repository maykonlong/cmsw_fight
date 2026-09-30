import Phaser from 'phaser';
import { AudioManager } from '../engine/AudioManager';

export class VictoryScene extends Phaser.Scene {
    private winnerId!: string;
    private loserId!: string;
    private p1Wins!: number;
    private p2Wins!: number;

    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(data: { winner: string, loser: string, p1Wins: number, p2Wins: number }) {
        this.winnerId = data.winner || 'kevin';
        this.loserId = data.loser || 'vini_dog';
        this.p1Wins = data.p1Wins || 0;
        this.p2Wins = data.p2Wins || 0;
    }

    create() {
        const { width, height } = this.scale;

        AudioManager.getInstance().setScene(this);
        AudioManager.getInstance().playMusic('victory', false);

        // Fundo escurecido
        this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0, 0);

        // Winner Sprite (Placeholder/Actual)
        if (this.textures.exists(this.winnerId)) {
            this.add.image(width / 2, height / 2, this.winnerId).setDisplaySize(280, 420);
        } else {
            this.add.rectangle(width / 2, height / 2, 280, 420, 0x00ff00);
        }

        // Título
        this.add.text(width / 2, 80, 'VICTORY!', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '80px',
            color: '#ffdd00',
            stroke: '#ff0000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Stats Box
        const statsBg = this.add.graphics();
        statsBg.fillStyle(0x111111, 0.8);
        statsBg.fillRoundedRect(width / 2 - 200, height - 250, 400, 120, 8);
        statsBg.lineStyle(2, 0xffdd00, 1);
        statsBg.strokeRoundedRect(width / 2 - 200, height - 250, 400, 120, 8);

        this.add.text(width / 2, height - 220, `WINNER: ${this.winnerId.toUpperCase()}`, {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height - 180, `P1 WINS: ${this.p1Wins}  |  P2 WINS: ${this.p2Wins}`, {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '18px',
            color: '#dddddd'
        }).setOrigin(0.5);

        // Botões
        const playAgainBtn = this.add.text(width / 2 - 150, height - 80, 'REMATCH', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#ff0000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        playAgainBtn.on('pointerdown', () => {
            this.scene.start('CharacterSelectScene');
        });

        const menuBtn = this.add.text(width / 2 + 150, height - 80, 'MAIN MENU', {
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
