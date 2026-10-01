import Phaser from 'phaser';
import type { IInputProvider } from '../interfaces/IInputProvider';
import { InputBuffer } from './InputBuffer';

export class InputManager implements IInputProvider {
    private scene: Phaser.Scene;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys: { [key: string]: Phaser.Input.Keyboard.Key };
    
    // Rastrear botoes de gamepad do frame anterior para o "JustPressed"
    private prevPadState = { A: false, B: false, X: false, Y: false, RB: false, RT: false, LB: false, up: false };

    public buffer: InputBuffer;
    public currentFrame: number = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        if (!scene.input.keyboard) throw new Error("Keyboard not available");
        this.cursors = scene.input.keyboard.createCursorKeys();
        
        // Cada KeyCode é registrado EXATAMENTE UMA VEZ para evitar sobrescrever ouvintes
        this.keys = {
            // Movimento WASD
            W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),

            // Socos (Z, X, C ou J, K, L)
            Z: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
            X: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
            C: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
            J: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
            K: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
            L: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),

            // Chutes (V, B, N ou U, I, O)
            V: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V),
            B: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B),
            N: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N),
            U: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U),
            I: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
            O: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),

            // Especial (ESPAÇO ou E)
            SPACE: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            E: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        };

        this.buffer = new InputBuffer();
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
        return this.scene.input.gamepad?.pad1;
    }

    get isLeftDown(): boolean { 
        return this.cursors.left.isDown || 
               this.keys.A.isDown ||
               this.virtualLeft || 
               Boolean(this.pad && (this.pad.left || this.pad.axes[0].getValue() < -0.5)); 
    }
    get isRightDown(): boolean { 
        return this.cursors.right.isDown || 
               this.keys.D.isDown ||
               this.virtualRight || 
               Boolean(this.pad && (this.pad.right || this.pad.axes[0].getValue() > 0.5)); 
    }
    get isUpDown(): boolean { 
        return this.cursors.up.isDown || 
               this.keys.W.isDown ||
               this.virtualUp || 
               Boolean(this.pad && (this.pad.up || this.pad.axes[1].getValue() < -0.5)); 
    }
    get isDownDown(): boolean { 
        return this.cursors.down.isDown || 
               this.keys.S.isDown ||
               this.virtualDown || 
               Boolean(this.pad && (this.pad.down || this.pad.axes[1].getValue() > 0.5)); 
    }
    
    get isUpJustPressed(): boolean { 
        const padUp = Boolean(this.pad && (this.pad.up || this.pad.axes[1].getValue() < -0.5));
        const padJustUp = padUp && !this.prevPadState.up;
        return Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
               Phaser.Input.Keyboard.JustDown(this.keys.W) ||
               this.virtualUpJustPressed || padJustUp; 
    }
    get isLPJustPressed(): boolean { 
        const padX = Boolean(this.pad && this.pad.X);
        const padJustX = padX && !this.prevPadState.X;
        return Phaser.Input.Keyboard.JustDown(this.keys.Z) || 
               Phaser.Input.Keyboard.JustDown(this.keys.J) ||
               this.virtualLPJustPressed || padJustX; 
    }
    get isMPJustPressed(): boolean { 
        const padY = Boolean(this.pad && this.pad.Y);
        const padJustY = padY && !this.prevPadState.Y;
        return Phaser.Input.Keyboard.JustDown(this.keys.X) || 
               Phaser.Input.Keyboard.JustDown(this.keys.K) ||
               this.virtualMPJustPressed || padJustY; 
    }
    get isHPJustPressed(): boolean { 
        const padRB = Boolean(this.pad && this.pad.R1);
        const padJustRB = padRB && !this.prevPadState.RB;
        return Phaser.Input.Keyboard.JustDown(this.keys.C) || 
               Phaser.Input.Keyboard.JustDown(this.keys.L) ||
               this.virtualHPJustPressed || padJustRB; 
    }
    get isLKJustPressed(): boolean { 
        const padA = Boolean(this.pad && this.pad.A);
        const padJustA = padA && !this.prevPadState.A;
        return Phaser.Input.Keyboard.JustDown(this.keys.V) || 
               Phaser.Input.Keyboard.JustDown(this.keys.U) ||
               this.virtualLKJustPressed || padJustA; 
    }
    get isMKJustPressed(): boolean { 
        const padB = Boolean(this.pad && this.pad.B);
        const padJustB = padB && !this.prevPadState.B;
        return Phaser.Input.Keyboard.JustDown(this.keys.B) || 
               Phaser.Input.Keyboard.JustDown(this.keys.I) ||
               this.virtualMKJustPressed || padJustB; 
    }
    get isHKJustPressed(): boolean { 
        const padRT = Boolean(this.pad && this.pad.R2);
        const padJustRT = padRT && !this.prevPadState.RT;
        return Phaser.Input.Keyboard.JustDown(this.keys.N) || 
               Phaser.Input.Keyboard.JustDown(this.keys.O) ||
               this.virtualHKJustPressed || padJustRT; 
    }
    get isSpecialJustPressed(): boolean { 
        const padLB = Boolean(this.pad && this.pad.L1);
        const padJustLB = padLB && !this.prevPadState.LB;
        return Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || 
               Phaser.Input.Keyboard.JustDown(this.keys.E) ||
               this.virtualSpecialJustPressed || padJustLB; 
    }

    get isThrowJustPressed(): boolean {
        return this.isLPJustPressed && this.isLKJustPressed;
    }

    public update(): void {
        this.currentFrame++;
        
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
}
