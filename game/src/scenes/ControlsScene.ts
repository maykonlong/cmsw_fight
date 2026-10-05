import Phaser from 'phaser';
import { ArcadeTheme, ARCADE } from '../ui/ArcadeTheme';

export class ControlsScene extends Phaser.Scene {
    private onKeyDown?: (e: KeyboardEvent) => void;

    constructor() {
        super({ key: 'ControlsScene' });
    }

    create() {
        const { width, height } = this.scale;

        ArcadeTheme.background(this, 'blue');
        ArcadeTheme.panel(this, 55, 90, width - 110, height - 190, ARCADE.blue);

        ArcadeTheme.title(this, 'CONTROLES DO JOGO', width / 2, 62, 48);

        const heading = { fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '34px', color: '#ffe270', stroke: '#ab2435', strokeThickness: 4 };
        const keys = { fontFamily: '"Arial Black", Arial, sans-serif', fontSize: '25px', color: '#f5f2e8', lineSpacing: 10 };
        this.add.text(140, 150, 'JOGADOR 1', heading);
        this.add.text(140, 200, [
            'Mover     SETAS',
            'Soco      Z  X  C',
            'Chute     V  B  N',
            'Beijo     ESPAÇO',
            'Agarrão   Z + V',
            'Defesa    SEGURE TRÁS',
        ].join('\n'), keys);
        this.add.text(700, 150, 'JOGADOR 2', heading);
        this.add.text(700, 200, [
            'Mover     W A S D',
            'Soco      J  K  L',
            'Chute     U  I  O',
            'Cachorro  E',
            'Agarrão   J + U',
            'Defesa    SEGURE TRÁS',
        ].join('\n'), keys);
        this.add.text(width / 2, 520, 'CONTROLE: DIRECIONAL + X/Y/RB + A/B/RT · ESPECIAL LB', {
            fontFamily: '"Arial Black", Arial, sans-serif', fontSize: '24px', color: '#82dafa'
        }).setOrigin(0.5);
        this.add.text(width / 2, 565, 'TOUCH: DIRECIONAL + BOTÕES NA TELA     •     PAUSA: ESC', {
            fontFamily: '"Arial Black", Arial, sans-serif', fontSize: '24px', color: '#82dafa'
        }).setOrigin(0.5);

        const btnBack = this.add.text(width / 2, height - 70, '← VOLTAR AO MENU', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '36px',
            color: '#ffe34d',
            stroke: '#d52821',
            strokeThickness: 5,
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const goBack = () => {
            this.removeListeners();
            this.scene.start('MainMenuScene');
        };

        btnBack.on('pointerdown', goBack);
        btnBack.on('pointerover', () => btnBack.setScale(1.1));
        btnBack.on('pointerout', () => btnBack.setScale(1.0));

        this.onKeyDown = (e: KeyboardEvent) => {
            if (['Escape', 'Enter', ' ', 'Space', 'Backspace'].includes(e.key) || ['Escape', 'Enter', 'Space', 'Backspace'].includes(e.code)) {
                goBack();
            }
        };

        window.addEventListener('keydown', this.onKeyDown);
        this.events.once('shutdown', () => this.removeListeners());
        this.events.once('destroy', () => this.removeListeners());
    }

    private removeListeners() {
        if (this.onKeyDown) {
            window.removeEventListener('keydown', this.onKeyDown);
            this.onKeyDown = undefined;
        }
    }
}
