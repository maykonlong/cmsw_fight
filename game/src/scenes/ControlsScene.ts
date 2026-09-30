import Phaser from 'phaser';

export class ControlsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ControlsScene' });
    }

    create() {
        const { width, height } = this.scale;

        this.add.rectangle(0, 0, width, height, 0x111122).setOrigin(0, 0);

        this.add.text(width / 2, 80, 'CONTROLES', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '60px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const textStyle = { fontFamily: 'monospace', fontSize: '24px', color: '#dddddd', align: 'center' };

        const controls = [
            "  PLAYER 1 (TECLADO)  ",
            "----------------------",
            "Movimento : Setas     ",
            "Soco      : Z         ",
            "Chute     : X         ",
            "Especial  : C         ",
            "Agarrão   : V         ",
            "",
            "   DICAS DE LUTA      ",
            "----------------------",
            "Para Defender: Ande para trás",
            "enquanto o inimigo ataca.",
            "",
            "Para Agarrar: Chegue bem perto",
            "e aperte o botão de Agarrão."
        ];

        this.add.text(width / 2, 350, controls.join('\n'), textStyle).setOrigin(0.5);

        const btnBack = this.add.text(width / 2, height - 100, '[ VOLTAR ]', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '32px',
            color: '#ffdd00'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const goBack = () => this.scene.start('MainMenuScene');

        btnBack.on('pointerdown', goBack);
        this.input.keyboard?.once('keydown-ENTER', goBack);
        this.input.keyboard?.once('keydown-SPACE', goBack);
        this.input.keyboard?.once('keydown-ESC', goBack);
    }
}
