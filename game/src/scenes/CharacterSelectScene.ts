import Phaser from 'phaser';
import { AudioManager } from '../engine/AudioManager';
import { ArcadeTheme, ARCADE } from '../ui/ArcadeTheme';

const CHARACTERS = [
    {
        key: 'kevin',
        textureKey: 'kevin_idle',
        name: 'KEVIN MANJA',
        specialty: 'Especial: Beijo Elétrico',
        color: 0x0099ff,
        colorHex: '#0099ff',
        locked: false,
    },
    {
        key: 'vini_dog',
        textureKey: 'vini_dog_idle',
        name: 'VINI DOG',
        specialty: 'Especial: Aura do Cachorro',
        color: 0xff3300,
        colorHex: '#ff3300',
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
    private gridCards: Phaser.GameObjects.Graphics[] = [];
    private mode: string = '1p';
    private onKeyDown?: (e: KeyboardEvent) => void;

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
        const { width } = this.scale;

        AudioManager.getInstance().setScene(this);
        AudioManager.getInstance().playMusic('char_select', true);

        // Fundo KOF Arcade
        ArcadeTheme.background(this, 'kof');

        // Painel Superior de seleção
        ArcadeTheme.panel(this, 30, 95, width - 60, 265, ARCADE.blue);
        // Painel Inferior de previews
        ArcadeTheme.panel(this, 30, 385, width - 60, 305, ARCADE.red);

        // Botão VOLTAR
        const btnBack = this.add.text(50, 34, '[ ◄ VOLTAR ]', {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '22px',
            color: '#ffd700',
            stroke: '#ff0000',
            strokeThickness: 4,
            padding: { x: 10, y: 5 }
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        const goBack = () => {
            AudioManager.getInstance().playUI('ui_cancel');
            this.removeListeners();
            this.scene.start('MainMenuScene');
        };

        btnBack.on('pointerdown', goBack);

        // Título da tela KOF
        this.add.text(width / 2, 34, 'SELECT YOUR FIGHTER — SELECT MEMBER', {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '34px',
            fontStyle: 'italic',
            color: '#ffffff',
            stroke: '#d52821',
            strokeThickness: 6,
        }).setOrigin(0.5);

        // Instruções
        this.add.text(width / 2, 74, this.mode === '2p'
            ? 'P1: ← → ENTER  |  P2: A D J  |  CONFIRME OS DOIS LUTADORES'
            : 'P1: ← → ENTER / CLIQUE DIRETO NO PORTRAIT', {
            fontFamily: 'Impact, Arial, sans-serif',
            fontSize: '16px',
            color: '#ffd700',
            letterSpacing: 2,
        }).setOrigin(0.5);

        // Grid KOF de personagens
        const gridX = width / 2;
        const gridY = 225;
        const cardW = 180;
        const cardH = 160;
        const cols = 4;
        const totalWidth = cols * (cardW + 24) - 24;
        const startX = gridX - totalWidth / 2;

        this.gridCards = [];

        CHARACTERS.forEach((char, i) => {
            const col = i % cols;
            const cx = startX + col * (cardW + 24) + cardW / 2;
            const cy = gridY;

            const cardGraphics = this.add.graphics();
            this.gridCards.push(cardGraphics);

            const getTex = (cKey: string) => {
                if (this.textures.exists(cKey + '_idle')) return cKey + '_idle';
                if (this.textures.exists(cKey)) return cKey;
                return null;
            };

            const texName = getTex(char.key);
            if (!char.locked && texName) {
                const img = this.add.image(cx, cy - 10, texName)
                    .setDisplaySize(cardW - 24, cardH - 36);
                img.setInteractive({ useHandCursor: true });
                const handleSelect = () => {
                    this.p1Index = i;
                    AudioManager.getInstance().playUI('ui_cursor');
                    this.updateGridHighlights();
                    this.confirmP1();
                };
                img.on('pointerdown', handleSelect);
            } else {
                this.add.text(cx, cy - 10, '?', {
                    fontFamily: 'Impact, "Arial Black"',
                    fontSize: '68px',
                    color: '#444444',
                }).setOrigin(0.5);
            }

            const label = this.add.text(cx, cy + cardH / 2 - 18, char.name, {
                fontFamily: 'Impact, "Arial Black"',
                fontSize: '16px',
                color: char.locked ? '#444444' : '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
            }).setOrigin(0.5);

            if (!char.locked) {
                label.setInteractive({ useHandCursor: true });
                const handleSelect = () => {
                    this.p1Index = i;
                    AudioManager.getInstance().playUI('ui_cursor');
                    this.updateGridHighlights();
                    this.confirmP1();
                };
                label.on('pointerdown', handleSelect);
            }
        });

        // Emblem VS Central KOF Slashed
        this.add.text(width / 2, 400, 'VS', {
            fontFamily: 'Impact, "Arial Black"',
            fontSize: '56px',
            fontStyle: 'italic',
            color: '#ffffff',
            stroke: '#ff0000',
            strokeThickness: 8,
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

        // Molduras laterais de Preview
        this.p1Preview = this.add.image(200, 530, getP1Tex())
            .setDisplaySize(180, 260);

        this.p2Preview = this.add.image(width - 200, 530, getP2Tex())
            .setDisplaySize(180, 260).setFlipX(true);

        this.p1NameText = this.add.text(200, 655, CHARACTERS[this.p1Index].name, {
            fontFamily: 'Impact, "Arial Black"',
            fontSize: '28px',
            color: '#0099ff',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        this.p1SpecialText = this.add.text(200, 685, CHARACTERS[this.p1Index].specialty, {
            fontFamily: 'Impact, Arial',
            fontSize: '15px',
            color: '#ffd700',
        }).setOrigin(0.5);

        this.p2NameText = this.add.text(width - 200, 655, CHARACTERS[this.p2Index].name, {
            fontFamily: 'Impact, "Arial Black"',
            fontSize: '28px',
            color: '#ff3300',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        this.p2SpecialText = this.add.text(width - 200, 685, CHARACTERS[this.p2Index].specialty, {
            fontFamily: 'Impact, Arial',
            fontSize: '15px',
            color: '#ffd700',
        }).setOrigin(0.5);

        this.add.text(200, 400, 'PLAYER 1', {
            fontFamily: 'Impact, "Arial Black"',
            fontSize: '22px',
            color: '#0099ff',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        this.add.text(width - 200, 400, 'PLAYER 2', {
            fontFamily: 'Impact, "Arial Black"',
            fontSize: '22px',
            color: '#ff3300',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        this.updateGridHighlights();

        this.onKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === 'arrowleft') this.moveP1(-1);
            else if (key === 'arrowright') this.moveP1(1);
            else if (key === 'a') this.moveP2(-1);
            else if (key === 'd') this.moveP2(1);
            else if (key === 'enter' || key === ' ' || key === 'z') this.confirmP1();
            else if (this.mode === '2p' && (key === 'j' || key === 'e')) this.confirmP2();
            else if (key === 'escape' || key === 'backspace') goBack();
        };

        window.addEventListener('keydown', this.onKeyDown);
        this.events.once('shutdown', () => this.removeListeners());
        this.events.once('destroy', () => this.removeListeners());

        this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    private removeListeners() {
        if (this.onKeyDown) {
            window.removeEventListener('keydown', this.onKeyDown);
            this.onKeyDown = undefined;
        }
    }

    private updateGridHighlights() {
        const { width } = this.scale;
        const gridX = width / 2;
        const gridY = 225;
        const cardW = 180;
        const cardH = 160;
        const cols = 4;
        const totalWidth = cols * (cardW + 24) - 24;
        const startX = gridX - totalWidth / 2;

        CHARACTERS.forEach((char, i) => {
            const col = i % cols;
            const cx = startX + col * (cardW + 24) + cardW / 2;
            const cy = gridY;
            const card = this.gridCards[i];

            if (!card) return;
            card.clear();

            const isP1 = i === this.p1Index;
            const isP2 = i === this.p2Index;

            let borderCol = char.locked ? 0x333333 : char.color;
            let borderWidth = 3;

            if (isP1 && isP2) {
                borderCol = 0xffff00; // P1 e P2 no mesmo personagem
                borderWidth = 5;
            } else if (isP1) {
                borderCol = 0x0099ff;
                borderWidth = 5;
            } else if (isP2) {
                borderCol = 0xff3300;
                borderWidth = 5;
            }

            card.fillStyle(char.locked ? 0x080808 : 0x121733, 0.9);
            card.fillRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH);

            card.lineStyle(borderWidth, borderCol, 1);
            card.strokeRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH);

            if (isP1 || isP2) {
                card.lineStyle(1.5, 0xffffd4, 0.8);
                card.strokeRect(cx - cardW / 2 + 4, cy - cardH / 2 + 4, cardW - 8, cardH - 8);
            }
        });

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
        AudioManager.getInstance().playUI('ui_cursor');
        this.updateGridHighlights();
    }

    private moveP2(dir: number) {
        if (this.p2Confirmed) return;
        const validChars = CHARACTERS.filter(c => !c.locked);
        this.p2Index = Phaser.Math.Wrap(this.p2Index + dir, 0, validChars.length);
        AudioManager.getInstance().playUI('ui_cursor');
        this.updateGridHighlights();
    }

    private confirmP1() {
        if (this.p1Confirmed) return;
        this.p1Confirmed = true;
        AudioManager.getInstance().playUI('ui_select');
        this.p1NameText.setColor('#ffd700');
        if (this.mode === '1p') {
            this.p2Confirmed = true;
        }
        this.checkBothConfirmed();
    }

    private confirmP2() {
        if (this.p2Confirmed) return;
        this.p2Confirmed = true;
        AudioManager.getInstance().playUI('ui_select');
        this.p2NameText.setColor('#ffd700');
        this.checkBothConfirmed();
    }

    private checkBothConfirmed() {
        const bothDone = this.p1Confirmed && (this.mode === '1p' || this.mode === 'training' || this.p2Confirmed);
        if (bothDone) {
            this.removeListeners();
            if (this.mode === 'training') {
                this.showStageSelectOverlay();
            } else {
                this.startVsWithStage();
            }
        }
    }

    private startVsWithStage(stageKey?: string) {
        this.time.delayedCall(400, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.time.delayedCall(320, () => {
                this.scene.start('VsScene', {
                    p1: CHARACTERS[this.p1Index].key,
                    p2: CHARACTERS[this.p2Index].key,
                    p1Name: CHARACTERS[this.p1Index].name,
                    p2Name: CHARACTERS[this.p2Index].name,
                    mode: this.mode,
                    stage: stageKey
                });
            });
        });
    }

    private showStageSelectOverlay() {
        const { width, height } = this.scale;
        const container = this.add.container(0, 0).setDepth(3000);
        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.88).setOrigin(0, 0);
        container.add(bg);

        const panel = this.add.graphics();
        panel.fillStyle(0x070c24, 0.96);
        panel.fillRect(width / 2 - 330, height / 2 - 210, 660, 420);
        panel.lineStyle(4, 0xffd700, 1);
        panel.strokeRect(width / 2 - 330, height / 2 - 210, 660, 420);
        container.add(panel);

        const title = this.add.text(width / 2, height / 2 - 160, 'SELECIONE O CENÁRIO DE TREINO', {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '32px',
            color: '#ffe34d',
            stroke: '#d52821',
            strokeThickness: 6
        }).setOrigin(0.5);
        container.add(title);

        const stages = [
            { key: 'kevin_bathroom', label: '🛁 BANHEIRO ARCO-ÍRIS (KEVIN)' },
            { key: 'vini_tabacaria', label: '💨 TABACARIA & HOOKAH (VINI)' },
            { key: 'cmsw_hq', label: '🏢 C&M SOFTWARE HQ' }
        ];

        stages.forEach((stg, i) => {
            const btn = this.add.text(width / 2, height / 2 - 45 + i * 70, stg.label, {
                fontFamily: 'Impact, Arial Black',
                fontSize: '26px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 5,
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            btn.on('pointerover', () => {
                btn.setColor('#ffe34d');
                AudioManager.getInstance().playUI('ui_cursor');
            });
            btn.on('pointerout', () => btn.setColor('#ffffff'));
            btn.on('pointerdown', () => {
                AudioManager.getInstance().playUI('ui_select');
                container.destroy();
                this.startVsWithStage(stg.key);
            });
            container.add(btn);
        });
    }
}
