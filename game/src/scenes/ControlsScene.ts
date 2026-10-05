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

        ArcadeTheme.title(this, 'MAPEAMENTO DE CONTROLES', width / 2, 60, 48);

        const heading = { fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '32px', color: '#ffe270', stroke: '#ab2435', strokeThickness: 4 };
        const keys = { fontFamily: '"Arial Black", Arial, sans-serif', fontSize: '22px', color: '#f5f2e8', lineSpacing: 10 };
        
        this.add.text(140, 140, 'JOGADOR 1 (TECLADO)', heading);
        this.add.text(140, 190, [
            'Mover:          SETAS (← → ↑ ↓)',
            'Soco Leve/Med/F: Z / X / C',
            'Chute Leve/M/F:  V / B / N',
            'Esquiva Roll:    Z + V (Soco L + Chute L)',
            'Golpe Especial:  ESPAÇO ou 236 + P',
            'Super Especial:  ESPAÇO (Com 1+ Barra)',
            'Defesa:          SEGURAR PARA TRÁS',
        ].join('\n'), keys);

        this.add.text(700, 140, 'JOGADOR 2 (TECLADO)', heading);
        this.add.text(700, 190, [
            'Mover:          W A S D',
            'Soco Leve/Med/F: J / K / L',
            'Chute Leve/M/F:  U / I / O',
            'Esquiva Roll:    J + U (Soco L + Chute L)',
            'Golpe Especial:  E ou 214 + K',
            'Super Especial:  E (Com 1+ Barra)',
            'Defesa:          SEGURAR PARA TRÁS',
        ].join('\n'), keys);

        this.add.text(width / 2, 515, '🎮 CONTROLE GAMEPAD: DIRECIONAL/ANALÓGICO  •  X/Y/RB (SOCOS)  •  A/B/RT (CHUTES)  •  LB (ESPECIAL)', {
            fontFamily: '"Arial Black", Arial, sans-serif', fontSize: '18px', color: '#82dafa'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, 555, '📱 TOUCH / VIRTUAL GAMEPAD SUPORTADO EM DISPOSITIVOS MÓVEIS', {
            fontFamily: '"Arial Black", Arial, sans-serif', fontSize: '18px', color: '#ffd700'
        }).setOrigin(0.5);

        const btnBack = this.add.text(width / 2, height - 65, '← VOLTAR AO MENU', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '32px',
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
        btnBack.on('pointerover', () => btnBack.setScale(1.08));
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
