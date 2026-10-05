import Phaser from 'phaser';
import type { IInputProvider } from '../interfaces/IInputProvider';
import { InputBuffer } from './InputBuffer';

export class InputManager implements IInputProvider {
    private scene: Phaser.Scene;
    private playerTwo: boolean;
    private splitControls: boolean;
    
    // Rastrear botoes de gamepad do frame anterior para o "JustPressed"
    private prevPadState = { A: false, B: false, X: false, Y: false, RB: false, RT: false, LB: false, up: false };
    // Mantém os eventos deste frame disponíveis até os lutadores atualizarem.
    private framePress: Record<string, boolean> | null = null;

    public buffer: InputBuffer;
    public currentFrame: number = 0;

    // Estado global de teclas DOM nativas para garantia de funcionamento no navegador
    private static downKeys: Set<string> = new Set();
    private static justPressedKeys: Set<string> = new Set();
    private static listenersAttached: boolean = false;

    constructor(scene: Phaser.Scene, playerTwo: boolean = false, splitControls: boolean = false) {
        this.scene = scene;
        this.playerTwo = playerTwo;
        this.splitControls = splitControls;
        this.buffer = new InputBuffer();
        this.attachDOMListeners();
    }

    private attachDOMListeners() {
        if (InputManager.listenersAttached) return;
        InputManager.listenersAttached = true;

        window.addEventListener('keydown', (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const code = e.code.toLowerCase();

            // Prevenir rolagem de tela no navegador para setas e barra de espaço durante o jogo
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'space'].includes(key) || ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].includes(code)) {
                if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                }
            }

            if (!InputManager.downKeys.has(key) && !InputManager.downKeys.has(code)) {
                InputManager.justPressedKeys.add(key);
                InputManager.justPressedKeys.add(code);
            }
            InputManager.downKeys.add(key);
            InputManager.downKeys.add(code);
        });

        window.addEventListener('keyup', (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const code = e.code.toLowerCase();
            InputManager.downKeys.delete(key);
            InputManager.downKeys.delete(code);
        });

        // Limpar teclas em perda de foco da janela
        window.addEventListener('blur', () => {
            InputManager.downKeys.clear();
            InputManager.justPressedKeys.clear();
        });
    }

    private isDown(...keys: string[]): boolean {
        for (const k of keys) {
            if (InputManager.downKeys.has(k.toLowerCase())) return true;
        }
        return false;
    }

    private isJustPressed(...keys: string[]): boolean {
        for (const k of keys) {
            if (InputManager.justPressedKeys.has(k.toLowerCase())) return true;
        }
        return false;
    }

    // Estados Virtuais (Touch / UI)
    public virtualLeft: boolean = false;
    public virtualRight: boolean = false;
    public virtualUp: boolean = false;
    public virtualDown: boolean = false;
    public virtualLP: boolean = false;
    public virtualMP: boolean = false;
    public virtualHP: boolean = false;
    public virtualLK: boolean = false;
    public virtualMK: boolean = false;
    public virtualHK: boolean = false;
    public virtualSpecial: boolean = false;

    // Estados Just Pressed Virtuais
    public virtualUpJustPressed: boolean = false;
    public virtualLPJustPressed: boolean = false;
    public virtualMPJustPressed: boolean = false;
    public virtualHPJustPressed: boolean = false;
    public virtualLKJustPressed: boolean = false;
    public virtualMKJustPressed: boolean = false;
    public virtualHKJustPressed: boolean = false;
    public virtualSpecialJustPressed: boolean = false;

    get pad() {
        if (this.playerTwo) return null;
        const raw = (this.scene.input as any)?.gamepad?.pad1;
        if (!raw) return null;
        // Normaliza para um objeto seguro, evitando crash se a API do gamepad mudar entre versões do Phaser.
        const axis = (i: number) => (raw.axes && raw.axes[i] && typeof raw.axes[i].getValue === 'function') ? raw.axes[i].getValue() : 0;
        return {
            left: Boolean(raw.left),
            right: Boolean(raw.right),
            up: Boolean(raw.up),
            down: Boolean(raw.down),
            A: Boolean(raw.A),
            B: Boolean(raw.B),
            X: Boolean(raw.X),
            Y: Boolean(raw.Y),
            R1: Boolean(raw.R1),
            R2: Boolean(raw.R2),
            L1: Boolean(raw.L1),
            axes: {
                0: { getValue: () => axis(0) },
                1: { getValue: () => axis(1) },
            }
        };
    }

    get isLeftDown(): boolean { 
        return (this.playerTwo ? this.isDown('a', 'keya') : this.splitControls ? this.isDown('arrowleft') : this.isDown('arrowleft', 'a', 'keya')) ||
               this.virtualLeft || 
               Boolean(this.pad && (this.pad.left || this.pad.axes[0].getValue() < -0.5)); 
    }
    get isRightDown(): boolean { 
        return (this.playerTwo ? this.isDown('d', 'keyd') : this.splitControls ? this.isDown('arrowright') : this.isDown('arrowright', 'd', 'keyd')) ||
               this.virtualRight || 
               Boolean(this.pad && (this.pad.right || this.pad.axes[0].getValue() > 0.5)); 
    }
    get isUpDown(): boolean { 
        return (this.playerTwo ? this.isDown('w', 'keyw') : this.splitControls ? this.isDown('arrowup') : this.isDown('arrowup', 'w', 'keyw')) ||
               this.virtualUp || 
               Boolean(this.pad && (this.pad.up || this.pad.axes[1].getValue() < -0.5)); 
    }
    get isDownDown(): boolean { 
        return (this.playerTwo ? this.isDown('s', 'keys') : this.splitControls ? this.isDown('arrowdown') : this.isDown('arrowdown', 's', 'keys')) ||
               this.virtualDown || 
               Boolean(this.pad && (this.pad.down || this.pad.axes[1].getValue() > 0.5)); 
    }
    
    get isUpJustPressed(): boolean { 
        const padUp = Boolean(this.pad && (this.pad.up || this.pad.axes[1].getValue() < -0.5));
        const padJustUp = padUp && !this.prevPadState.up;
        return (this.playerTwo ? this.isJustPressed('w', 'keyw') : this.splitControls ? this.isJustPressed('arrowup') : this.isJustPressed('arrowup', 'w', 'keyw')) ||
               this.virtualUpJustPressed || padJustUp || Boolean(this.framePress?.up);
    }
    get isLPJustPressed(): boolean { 
        const padX = Boolean(this.pad && this.pad.X);
        const padJustX = padX && !this.prevPadState.X;
        return (this.playerTwo ? this.isJustPressed('j', 'keyj') : this.splitControls ? this.isJustPressed('z', 'keyz') : this.isJustPressed('z', 'keyz', 'j', 'keyj')) ||
               this.virtualLPJustPressed || padJustX || Boolean(this.framePress?.lp);
    }
    get isMPJustPressed(): boolean { 
        const padY = Boolean(this.pad && this.pad.Y);
        const padJustY = padY && !this.prevPadState.Y;
        return (this.playerTwo ? this.isJustPressed('k', 'keyk') : this.splitControls ? this.isJustPressed('x', 'keyx') : this.isJustPressed('x', 'keyx', 'k', 'keyk')) ||
               this.virtualMPJustPressed || padJustY || Boolean(this.framePress?.mp);
    }
    get isHPJustPressed(): boolean { 
        const padRB = Boolean(this.pad && this.pad.R1);
        const padJustRB = padRB && !this.prevPadState.RB;
        return (this.playerTwo ? this.isJustPressed('l', 'keyl') : this.splitControls ? this.isJustPressed('c', 'keyc') : this.isJustPressed('c', 'keyc', 'l', 'keyl')) ||
               this.virtualHPJustPressed || padJustRB || Boolean(this.framePress?.hp);
    }
    get isLKJustPressed(): boolean { 
        const padA = Boolean(this.pad && this.pad.A);
        const padJustA = padA && !this.prevPadState.A;
        return (this.playerTwo ? this.isJustPressed('u', 'keyu') : this.splitControls ? this.isJustPressed('v', 'keyv') : this.isJustPressed('v', 'keyv', 'u', 'keyu')) ||
               this.virtualLKJustPressed || padJustA || Boolean(this.framePress?.lk);
    }
    get isMKJustPressed(): boolean { 
        const padB = Boolean(this.pad && this.pad.B);
        const padJustB = padB && !this.prevPadState.B;
        return (this.playerTwo ? this.isJustPressed('i', 'keyi') : this.splitControls ? this.isJustPressed('b', 'keyb') : this.isJustPressed('b', 'keyb', 'i', 'keyi')) ||
               this.virtualMKJustPressed || padJustB || Boolean(this.framePress?.mk);
    }
    get isHKJustPressed(): boolean { 
        const padRT = Boolean(this.pad && this.pad.R2);
        const padJustRT = padRT && !this.prevPadState.RT;
        return (this.playerTwo ? this.isJustPressed('o', 'keyo') : this.splitControls ? this.isJustPressed('n', 'keyn') : this.isJustPressed('n', 'keyn', 'o', 'keyo')) ||
               this.virtualHKJustPressed || padJustRT || Boolean(this.framePress?.hk);
    }
    get isSpecialJustPressed(): boolean { 
        const padLB = Boolean(this.pad && this.pad.L1);
        const padJustLB = padLB && !this.prevPadState.LB;
        return (this.playerTwo ? this.isJustPressed('e', 'keye') : this.splitControls ? this.isJustPressed(' ', 'space') : this.isJustPressed(' ', 'space', 'e', 'keye')) ||
               this.virtualSpecialJustPressed || padJustLB || Boolean(this.framePress?.special);
    }

    get isThrowJustPressed(): boolean {
        return this.isLPJustPressed && this.isLKJustPressed;
    }

    private prevLeftState: boolean = false;
    private prevRightState: boolean = false;
    private lastLeftPressTime: number = 0;
    private lastRightPressTime: number = 0;
    public isLeftDoubleTapped: boolean = false;
    public isRightDoubleTapped: boolean = false;

    public update(): void {
        this.currentFrame++;
        const leftNow = this.isLeftDown;
        const rightNow = this.isRightDown;
        const now = Date.now();

        const leftJustPressed = leftNow && !this.prevLeftState;
        const rightJustPressed = rightNow && !this.prevRightState;

        this.isLeftDoubleTapped = false;
        this.isRightDoubleTapped = false;

        if (leftJustPressed) {
            if (now - this.lastLeftPressTime < 300) {
                this.isLeftDoubleTapped = true;
            }
            this.lastLeftPressTime = now;
        }

        if (rightJustPressed) {
            if (now - this.lastRightPressTime < 300) {
                this.isRightDoubleTapped = true;
            }
            this.lastRightPressTime = now;
        }

        this.prevLeftState = leftNow;
        this.prevRightState = rightNow;

        this.framePress = null;
        this.framePress = {
            up: this.isUpJustPressed,
            lp: this.isLPJustPressed, mp: this.isMPJustPressed, hp: this.isHPJustPressed,
            lk: this.isLKJustPressed, mk: this.isMKJustPressed, hk: this.isHKJustPressed,
            special: this.isSpecialJustPressed,
        };
        
        // Registrar input no buffer
        const currentInputs: string[] = [];
        if (this.isLPJustPressed) currentInputs.push('LP');
        if (this.isMPJustPressed) currentInputs.push('MP');
        if (this.isHPJustPressed) currentInputs.push('HP');
        if (this.isLKJustPressed) currentInputs.push('LK');
        if (this.isMKJustPressed) currentInputs.push('MK');
        if (this.isHKJustPressed) currentInputs.push('HK');
        if (this.isSpecialJustPressed) currentInputs.push('Special');

        // Calcular direção em formato numpad (1-9)
        let dir = '5';
        const left = this.isLeftDown;
        const right = this.isRightDown;
        const up = this.isUpDown;
        const down = this.isDownDown;
        
        if (up && left) dir = '7';
        else if (up && right) dir = '9';
        else if (down && left) dir = '1';
        else if (down && right) dir = '3';
        else if (up) dir = '8';
        else if (down) dir = '2';
        else if (left) dir = '4';
        else if (right) dir = '6';

        this.buffer.push({
            direction: dir,
            buttons: currentInputs,
            frame: this.currentFrame
        });

        this.virtualUpJustPressed = false;
        this.virtualLPJustPressed = false;
        this.virtualMPJustPressed = false;
        this.virtualHPJustPressed = false;
        this.virtualLKJustPressed = false;
        this.virtualMKJustPressed = false;
        this.virtualHKJustPressed = false;
        this.virtualSpecialJustPressed = false;

        if (this.pad) {
            this.prevPadState.up = Boolean(this.pad.up || this.pad.axes[1].getValue() < -0.5);
            this.prevPadState.X = Boolean(this.pad.X);
            this.prevPadState.Y = Boolean(this.pad.Y);
            this.prevPadState.A = Boolean(this.pad.A);
            this.prevPadState.B = Boolean(this.pad.B);
            this.prevPadState.RB = Boolean(this.pad.R1);
            this.prevPadState.RT = Boolean(this.pad.R2);
            this.prevPadState.LB = Boolean(this.pad.L1);
        }

    }

    public static endFrame(): void {
        InputManager.justPressedKeys.clear();
    }
}
