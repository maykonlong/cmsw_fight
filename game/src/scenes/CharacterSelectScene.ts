import Phaser from 'phaser';
import { AudioManager } from '../engine/AudioManager';

const CHARACTERS = [
    {
        key: 'kevin',
        name: 'KEVIN MANJA',
        specialty: 'Especial: Beijo Elétrico',
        color: 0x3399ff,
        colorHex: '#3399ff',
        locked: false,
    },
    {
        key: 'vini_dog',
        name: 'VINI DOG',
        specialty: 'Especial: Aura do Cachorro',
        color: 0xff4400,
        colorHex: '#ff4400',
        locked: false,
    },
    {
        key: 'unknown',
        name: '???',
        specialty: '???',
        color: 0x444444,
        colorHex: '#444444',
        locked: true,
    },
    {
        key: 'unknown',
        name: '???',
        specialty: '???',
        color: 0x444444,
        colorHex: '#444444',
        locked: true,
    },
];

export class CharacterSelectScene extends Phaser.Scene {
    private p1Index: number = 0;
    private p2Index: number = 1;
    private p1Confirmed: boolean = false;
    private p2Confirmed: boolean = false;
    private p1Preview!: Phaser.GameObjects.Image;
    private p2Preview!: Phaser.GameObjects.Image;
    private p1NameText!: Phaser.GameObjects.Text;
    private p2NameText!: Phaser.GameObjects.Text;
    private p1SpecialText!: Phaser.GameObjects.Text;
    private p2SpecialText!: Phaser.GameObjects.Text;
    private mode: string = '1p';

    constructor() {
        super({ key: 'CharacterSelectScene' });
    }

    init(data: { mode: string }) {
        this.mode = data?.mode ?? '1p';
        this.p1Index = 0;
        this.p2Index = 1;
        this.p1Confirmed = false;
        this.p2Confirmed = false;
    }

    create() {
        const { width, height } = this.scale;

        AudioManager.getInstance().setScene(this);
        AudioManager.getInstance().playMusic('char_select', true);

        // Fundo escuro
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e, 1);
        bg.fillRect(0, 0, width, height);

        // Título da tela
        this.add.text(width / 2, 36, 'ESCOLHA SEU LUTADOR', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '38px',
            color: '#ffdd00',
            stroke: '#ff2200',
            strokeThickness: 6,
        }).setOrigin(0.5);

        // Instruções
        this.add.text(width / 2, 82, 'P1: ← → ENTER    P2: A D ESPAÇO', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#aaaaaa',
        }).setOrigin(0.5);

        // Grid de personagens
        const gridX = width / 2;
        const gridY = 220;
        const cardW = 180;
        const cardH = 160;
        const cols = 4;
        const totalWidth = cols * (cardW + 20) - 20;
        const startX = gridX - totalWidth / 2;

        CHARACTERS.forEach((char, i) => {
            const col = i % cols;
            const cx = startX + col * (cardW + 20) + cardW / 2;
            const cy = gridY;

            // Card background
            const card = this.add.graphics();
            card.lineStyle(3, char.locked ? 0x333333 : char.color, 1);
            card.fillStyle(char.locked ? 0x111111 : 0x1a1a2e, 1);
            card.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10);
            card.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10);

            if (!char.locked && this.textures.exists(char.key)) {
                this.add.image(cx, cy, char.key)
                    .setDisplaySize(cardW - 20, cardH - 20);
            } else {
                this.add.text(cx, cy, char.locked ? '?' : char.name[0], {
                    fontFamily: '"Arial Black"',
                    fontSize: '72px',
                    color: char.locked ? '#333333' : char.colorHex,
                }).setOrigin(0.5);
            }

            this.add.text(cx, cy + cardH / 2 + 16, char.name, {
                fontFamily: '"Arial Black"',
                fontSize: '16px',
                color: char.locked ? '#444444' : '#ffffff',
            }).setOrigin(0.5);
        });

        // Separador central
        const sep = this.add.graphics();
        sep.fillStyle(0xff2200, 1);
        sep.fillRect(width / 2 - 2, 420, 4, 220);
        this.add.text(width / 2, 410, 'VS', {
            fontFamily: '"Arial Black"',
            fontSize: '48px',
            color: '#ff2200',
            stroke: '#ffffff',
            strokeThickness: 4,
        }).setOrigin(0.5);

        // Previews dos personagens selecionados
        this.p1Preview = this.add.image(200, 540, CHARACTERS[this.p1Index].key)
            .setDisplaySize(180, 260).setVisible(this.textures.exists(CHARACTERS[this.p1Index].key));

        this.p2Preview = this.add.image(width - 200, 540, CHARACTERS[this.p2Index].key)
            .setDisplaySize(180, 260).setFlipX(true).setVisible(this.textures.exists(CHARACTERS[this.p2Index].key));

        // Nomes e especiais abaixo dos previews
        this.p1NameText = this.add.text(200, 660, CHARACTERS[this.p1Index].name, {
            fontFamily: '"Arial Black"',
            fontSize: '26px',
            color: '#3399ff',
        }).setOrigin(0.5);
        this.p1SpecialText = this.add.text(200, 692, CHARACTERS[this.p1Index].specialty, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#aaaaaa',
        }).setOrigin(0.5);

        this.p2NameText = this.add.text(width - 200, 660, CHARACTERS[this.p2Index].name, {
            fontFamily: '"Arial Black"',
            fontSize: '26px',
            color: '#ff4400',
        }).setOrigin(0.5);
        this.p2SpecialText = this.add.text(width - 200, 692, CHARACTERS[this.p2Index].specialty, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#aaaaaa',
        }).setOrigin(0.5);

        // Labels P1 / P2
        this.add.text(200, 400, 'JOGADOR 1', {
            fontFamily: '"Arial Black"',
            fontSize: '20px',
            color: '#3399ff',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);
        this.add.text(width - 200, 400, 'JOGADOR 2', {
            fontFamily: '"Arial Black"',
            fontSize: '20px',
            color: '#ff4400',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        // Indicadores de seleção no grid
        this.updateGridHighlights();

        // Input P1: ← → ENTER
        this.input.keyboard!.on('keydown-LEFT', () => this.moveP1(-1));
        this.input.keyboard!.on('keydown-RIGHT', () => this.moveP1(1));
        this.input.keyboard!.on('keydown-ENTER', () => this.confirmP1());

        // Input P2: A D ESPAÇO
        this.input.keyboard!.on('keydown-A', () => this.moveP2(-1));
        this.input.keyboard!.on('keydown-D', () => this.moveP2(1));
        this.input.keyboard!.on('keydown-SPACE', () => this.confirmP2());

        this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    private updateGridHighlights() {
        // Redraw highlights seria complexo; simplificamos indicando com texto de label abaixo
        this.p1NameText?.setText(CHARACTERS[this.p1Index].name);
        this.p1SpecialText?.setText(CHARACTERS[this.p1Index].specialty);
        this.p2NameText?.setText(CHARACTERS[this.p2Index].name);
        this.p2SpecialText?.setText(CHARACTERS[this.p2Index].specialty);

        if (this.textures.exists(CHARACTERS[this.p1Index].key)) {
            this.p1Preview?.setTexture(CHARACTERS[this.p1Index].key).setVisible(true);
        }
        if (this.textures.exists(CHARACTERS[this.p2Index].key)) {
            this.p2Preview?.setTexture(CHARACTERS[this.p2Index].key).setVisible(true);
        }
    }

    private moveP1(dir: number) {
        if (this.p1Confirmed) return;
        this.p1Index = Phaser.Math.Wrap(this.p1Index + dir, 0, CHARACTERS.filter(c => !c.locked).length);
        this.updateGridHighlights();
    }

    private moveP2(dir: number) {
        if (this.p2Confirmed) return;
        this.p2Index = Phaser.Math.Wrap(this.p2Index + dir, 0, CHARACTERS.filter(c => !c.locked).length);
        this.updateGridHighlights();
    }

    private confirmP1() {
        if (this.p1Confirmed) return;
        this.p1Confirmed = true;
        this.p1NameText.setColor('#ffdd00');
        this.checkBothConfirmed();
    }

    private confirmP2() {
        if (this.p2Confirmed) return;
        this.p2Confirmed = true;
        this.p2NameText.setColor('#ffdd00');
        this.checkBothConfirmed();
    }

    private checkBothConfirmed() {
        const bothDone = this.p1Confirmed && (this.mode === '1p' || this.p2Confirmed);
        if (bothDone) {
            this.time.delayedCall(500, () => {
                this.cameras.main.fadeOut(400, 0, 0, 0);
                this.time.delayedCall(420, () => {
                    this.scene.start('VsScene', {
                        p1: CHARACTERS[this.p1Index].key,
                        p2: CHARACTERS[this.p2Index].key,
                        p1Name: CHARACTERS[this.p1Index].name,
                        p2Name: CHARACTERS[this.p2Index].name,
                        mode: this.mode,
                    });
                });
            });
        }
    }
}
