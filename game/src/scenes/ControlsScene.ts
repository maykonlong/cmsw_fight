import Phaser from 'phaser';

export class ControlsScene extends Phaser.Scene {
    private onKeyDown?: (e: KeyboardEvent) => void;

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
            "  AÇÃO             TECLADO P1               GAMEPAD XBOX     TOUCH MOBILE",
            "--------------------------------------------------------------------------",
            "  Movimento        Setas / WASD             D-Pad / LS       D-Pad na Tela",
            "  Soco Leve (LP)   Z  ou  J                 Botão X          Botão LP",
            "  Soco Médio (MP)  X  ou  K                 Botão Y          Botão MP",
            "  Soco Forte (HP)  C  ou  L                 RB (R1)          Botão HP",
            "  Chute Leve (LK)  V  ou  U                 Botão A          Botão LK",
            "  Chute Médio (MK) B  ou  I                 Botão B          Botão MK",
            "  Chute Forte (HK) N  ou  O                 RT (R2)          Botão HK",
            "  Especial         ESPAÇO  ou  E            LB (L1)          Botão SPEC",
            "  Agarrão (Throw)  Z+V ou J+U (LP+LK)       X + A Juntos     LP + LK Juntos",
            "  Pausar           ESC                      Start            Botão Pause",
            "--------------------------------------------------------------------------",
            "  DICAS DE LUTA:",
            "  • Para Defender: Mantenha pressionado TRÁS (← ou A) enquanto o oponente ataca.",
            "  • Para Agarrar: Chegue bem perto do oponente e pressione Soco Leve + Chute Leve (Z+V)."
        ];

        this.add.text(width / 2, 340, controlsText.join('\n'), textStyle).setOrigin(0.5);

        const btnBack = this.add.text(width / 2, height - 70, '[ VOLTAR AO MENU ]', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '36px',
            color: '#ffdd00',
            stroke: '#ff0000',
            strokeThickness: 5,
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const goBack = () => {
            this.removeListeners();
            this.scene.start('MainMenuScene');
        };

        btnBack.on('pointerdown', goBack);
        btnBack.on('pointerup', goBack);
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
