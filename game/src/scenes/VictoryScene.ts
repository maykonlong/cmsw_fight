import Phaser from 'phaser';
import { AudioManager } from '../engine/AudioManager';
import { ArcadeTheme, ARCADE } from '../ui/ArcadeTheme';

export class VictoryScene extends Phaser.Scene {
    private winnerId!: string;
    private p1Wins!: number;
    private p2Wins!: number;
    private mode: string = '1p';

    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(data: { winner: string, loser: string, p1Wins: number, p2Wins: number, mode?: string }) {
        this.winnerId = data.winner || 'kevin';
        this.p1Wins = data.p1Wins || 0;
        this.p2Wins = data.p2Wins || 0;
        this.mode = data.mode || '1p';
    }

    create() {
        const { width, height } = this.scale;

        AudioManager.getInstance().setScene(this);
        AudioManager.getInstance().playMusic('victory', false);

        ArcadeTheme.background(this, 'blue');
        ArcadeTheme.panel(this, width / 2 - 285, 50, 570, height - 100, ARCADE.yellow);

        // Winner Sprite (Placeholder/Actual)
        if (this.textures.exists(`${this.winnerId}_win`)) {
            this.add.image(width / 2, height / 2, `${this.winnerId}_win`).setDisplaySize(280, 420);
        } else {
            this.add.rectangle(width / 2, height / 2, 280, 420, 0x00ff00);
        }

        // Título
        ArcadeTheme.title(this, this.mode === '2p' ? 'VENCEDOR!' : 'VITÓRIA!', width / 2, 80, 70);

        // Stats Box
        const statsBg = this.add.graphics();
        statsBg.fillStyle(0x050713, 0.92);
        statsBg.fillRoundedRect(width / 2 - 200, height - 250, 400, 120, 8);
        statsBg.lineStyle(3, ARCADE.yellow, 1);
        statsBg.strokeRoundedRect(width / 2 - 200, height - 250, 400, 120, 8);

        this.add.text(width / 2, height - 220, this.winnerId === 'kevin' ? 'KEVIN MANJA É O CAMPEÃO' : 'VINI DOG É O CAMPEÃO', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '26px',
            color: '#ffe279',
            stroke: '#af2231',
            strokeThickness: 3,
        }).setOrigin(0.5);

        this.add.text(width / 2, height - 180, `RODADAS  ${this.p1Wins}  ×  ${this.p2Wins}`, {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '24px',
            color: '#dddddd'
        }).setOrigin(0.5);

        // Botões
        const playAgainBtn = this.add.text(width / 2 - 150, height - 80, 'REVANCHE', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#ff0000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        playAgainBtn.on('pointerdown', () => {
            this.scene.start('CharacterSelectScene', { mode: this.mode });
        });

        const menuBtn = this.add.text(width / 2 + 150, height - 80, 'MENU', {
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
