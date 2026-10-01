import Phaser from 'phaser';

export class ControlsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ControlsScene' });
    }

    create() {
        const { width, height } = this.scale;

        this.add.rectangle(0, 0, width, height, 0x0d0221).setOrigin(0, 0);

        this.add.text(width / 2, 60, 'CONTROLES DO JOGO', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '50px',
            color: '#ffdd00',
            stroke: '#ff0000',
            strokeThickness: 6
        }).setOrigin(0.5);

        const textStyle = { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', align: 'left' as const };

        const controlsText = [
            "  AÇÃO             TECLADO P1       GAMEPAD XBOX     TOUCH MOBILE",
            "------------------------------------------------------------------",
            "  Movimento        Setas ← ↑ ↓ →   D-Pad / LS       D-Pad na Tela",
            "  Soco Leve (LP)   Z               Botão X          Botão LP",
            "  Soco Médio (MP)  X               Botão Y          Botão MP",
            "  Soco Forte (HP)  C               RB (R1)          Botão HP",
            "  Chute Leve (LK)  A               Botão A          Botão LK",
            "  Chute Médio (MK) S               Botão B          Botão MK",
            "  Chute Forte (HK) D               RT (R2)          Botão HK",
            "  Especial         V               LB (L1)          Botão SPECIAL",
            "  Agarrão (Throw)  Z + A Juntos    X + A Juntos     LP + LK Juntos",
            "  Pausar           ESC             Start            Botão Pause",
            "------------------------------------------------------------------",
            "  DICAS DE LUTA:",
            "  • Para Defender: Mantenha pressionado para TRÁS enquanto o inimigo ataca.",
            "  • Para Agarrar: Chegue bem perto do oponente e aperte Z+A (LP+LK)."
        ];

        this.add.text(width / 2, 340, controlsText.join('\n'), textStyle).setOrigin(0.5);

        const btnBack = this.add.text(width / 2, height - 70, '[ VOLTAR AO MENU ]', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '32px',
            color: '#ffdd00',
            stroke: '#ff0000',
            strokeThickness: 5
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const goBack = () => this.scene.start('MainMenuScene');

        btnBack.on('pointerdown', goBack);
        btnBack.on('pointerover', () => btnBack.setScale(1.1));
        btnBack.on('pointerout', () => btnBack.setScale(1.0));

        this.input.keyboard?.once('keydown-ENTER', goBack);
        this.input.keyboard?.once('keydown-SPACE', goBack);
        this.input.keyboard?.once('keydown-ESC', goBack);
    }
}
