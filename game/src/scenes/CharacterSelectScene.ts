import Phaser from 'phaser';
import { AudioManager } from '../engine/AudioManager';

const CHARACTERS = [
    {
        key: 'kevin',
        textureKey: 'kevin_idle',
        name: 'KEVIN MANJA',
        specialty: 'Especial: Beijo Elétrico',
        color: 0x3399ff,
        colorHex: '#3399ff',
        locked: false,
    },
    {
        key: 'vini_dog',
        textureKey: 'vini_dog_idle',
        name: 'VINI DOG',
        specialty: 'Especial: Aura do Cachorro',
        color: 0xff4400,
        colorHex: '#ff4400',
        locked: false,
    },
    {
        key: 'unknown',
        textureKey: 'unknown',
        name: '???',
        specialty: '???',
        color: 0x444444,
        colorHex: '#444444',
        locked: true,
    },
    {
        key: 'unknown',
        textureKey: 'unknown',
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
        this.add.text(width / 2, 82, 'P1: ← → ENTER / CLIQUE NO PERSONAGEM', {
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

            const getTex = (cKey: string) => {
                if (this.textures.exists(cKey + '_idle')) return cKey + '_idle';
                if (this.textures.exists(cKey)) return cKey;
                return null;
            };

            const texName = getTex(char.key);
            if (!char.locked && texName) {
                const img = this.add.image(cx, cy - 10, texName)
                    .setDisplaySize(cardW - 30, cardH - 40);
                img.setInteractive({ useHandCursor: true });
                img.on('pointerdown', () => {
                    this.p1Index = i;
                    this.updateGridHighlights();
                    this.confirmP1();
                });
            } else {
                this.add.text(cx, cy, char.locked ? '?' : char.name[0], {
                    fontFamily: '"Arial Black"',
                    fontSize: '72px',
                    color: char.locked ? '#333333' : char.colorHex,
                }).setOrigin(0.5);
            }

            const label = this.add.text(cx, cy + cardH / 2 + 16, char.name, {
                fontFamily: '"Arial Black"',
                fontSize: '16px',
                color: char.locked ? '#444444' : '#ffffff',
            }).setOrigin(0.5);
            label.setInteractive({ useHandCursor: true });
            label.on('pointerdown', () => {
                if (!char.locked) {
                    this.p1Index = i;
                    this.updateGridHighlights();
                    this.confirmP1();
                }
            });
        });

        // Separador central
        this.add.text(width / 2, 410, 'VS', {
            fontFamily: '"Arial Black"',
            fontSize: '48px',
            color: '#ff2200',
            stroke: '#ffffff',
            strokeThickness: 4,
        }).setOrigin(0.5);

        const getP1Tex = () => {
            const k = CHARACTERS[this.p1Index].key;
            if (this.textures.exists(k + '_idle')) return k + '_idle';
            return k;
        };

        const getP2Tex = () => {
            const k = CHARACTERS[this.p2Index].key;
            if (this.textures.exists(k + '_idle')) return k + '_idle';
            return k;
        };

        // Previews dos personagens selecionados
        this.p1Preview = this.add.image(200, 530, getP1Tex())
            .setDisplaySize(160, 240);

        this.p2Preview = this.add.image(width - 200, 530, getP2Tex())
            .setDisplaySize(160, 240).setFlipX(true);

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

        this.updateGridHighlights();

        // Input P1: ← → ENTER
        this.input.keyboard!.on('keydown-LEFT', () => this.moveP1(-1));
        this.input.keyboard!.on('keydown-RIGHT', () => this.moveP1(1));
        this.input.keyboard!.on('keydown-ENTER', () => this.confirmP1());
        this.input.keyboard!.on('keydown-SPACE', () => this.confirmP1());

        // Input P2: A D
        this.input.keyboard!.on('keydown-A', () => this.moveP2(-1));
        this.input.keyboard!.on('keydown-D', () => this.moveP2(1));

        this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    private updateGridHighlights() {
        const p1Char = CHARACTERS[this.p1Index];
        const p2Char = CHARACTERS[this.p2Index];

        this.p1NameText?.setText(p1Char.name);
        this.p1SpecialText?.setText(p1Char.specialty);
        this.p2NameText?.setText(p2Char.name);
        this.p2SpecialText?.setText(p2Char.specialty);

        const p1Tex = this.textures.exists(p1Char.key + '_idle') ? p1Char.key + '_idle' : p1Char.key;
        const p2Tex = this.textures.exists(p2Char.key + '_idle') ? p2Char.key + '_idle' : p2Char.key;

        if (this.p1Preview && this.textures.exists(p1Tex)) {
            this.p1Preview.setTexture(p1Tex);
        }
        if (this.p2Preview && this.textures.exists(p2Tex)) {
            this.p2Preview.setTexture(p2Tex);
        }
    }

    private moveP1(dir: number) {
        if (this.p1Confirmed) return;
        const validChars = CHARACTERS.filter(c => !c.locked);
        this.p1Index = Phaser.Math.Wrap(this.p1Index + dir, 0, validChars.length);
        this.updateGridHighlights();
    }

    private moveP2(dir: number) {
        if (this.p2Confirmed) return;
        const validChars = CHARACTERS.filter(c => !c.locked);
        this.p2Index = Phaser.Math.Wrap(this.p2Index + dir, 0, validChars.length);
        this.updateGridHighlights();
    }

    private confirmP1() {
        if (this.p1Confirmed) return;
        this.p1Confirmed = true;
        this.p1NameText.setColor('#ffdd00');
        if (this.mode === '1p') {
            this.p2Confirmed = true;
        }
        this.checkBothConfirmed();
    }

    private checkBothConfirmed() {
        const bothDone = this.p1Confirmed && (this.mode === '1p' || this.p2Confirmed);
        if (bothDone) {
            this.time.delayedCall(400, () => {
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.time.delayedCall(320, () => {
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
