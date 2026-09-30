import Phaser from 'phaser';
import { InputBuffer, BufferedInput } from './InputBuffer';

export class InputManager {
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
        
        // Mapeamento de botões de ataque estilo fighting game
        this.keys = {
            LP: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z), // Soco leve
            MP: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X), // Soco médio
            HP: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C), // Soco forte
            LK: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A), // Chute leve
            MK: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S), // Chute médio
            HK: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D), // Chute forte
            Special: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V), // Especial
        };

        this.buffer = new InputBuffer();
    }

    // Estados Virtuais
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

    // Derived states
    public get isThrowJustPressed(): boolean {
        return this.isLPJustPressed && this.isLKJustPressed;
    }

    // Estados Just Pressed Virtuais (Consumidos no mesmo frame)
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

    get isLeftDown() { 
        return this.cursors.left.isDown || this.virtualLeft || (this.pad && (this.pad.left || this.pad.axes[0].getValue() < -0.5)) || false; 
    }
    get isRightDown() { 
        return this.cursors.right.isDown || this.virtualRight || (this.pad && (this.pad.right || this.pad.axes[0].getValue() > 0.5)) || false; 
    }
    get isUpDown() { 
        return this.cursors.up.isDown || this.virtualUp || (this.pad && (this.pad.up || this.pad.axes[1].getValue() < -0.5)) || false; 
    }
    get isDownDown() { 
        return this.cursors.down.isDown || this.virtualDown || (this.pad && (this.pad.down || this.pad.axes[1].getValue() > 0.5)) || false; 
    }
    
    get isUpJustPressed() { 
        const padUp = this.pad && (this.pad.up || this.pad.axes[1].getValue() < -0.5);
        const padJustUp = padUp && !this.prevPadState.up;
        return Phaser.Input.Keyboard.JustDown(this.cursors.up) || this.virtualUpJustPressed || padJustUp; 
    }
    get isLPJustPressed() { 
        const padX = this.pad && this.pad.X; // Xbox X button
        const padJustX = padX && !this.prevPadState.X;
        return Phaser.Input.Keyboard.JustDown(this.keys.LP) || this.virtualLPJustPressed || padJustX; 
    }
    get isMPJustPressed() { 
        const padY = this.pad && this.pad.Y; // Xbox Y button
        const padJustY = padY && !this.prevPadState.Y;
        return Phaser.Input.Keyboard.JustDown(this.keys.MP) || this.virtualMPJustPressed || padJustY; 
    }
    get isHPJustPressed() { 
        const padRB = this.pad && Boolean(this.pad.R1);
        const padJustRB = padRB && !this.prevPadState.RB;
        return Phaser.Input.Keyboard.JustDown(this.keys.HP) || this.virtualHPJustPressed || padJustRB; 
    }
    get isLKJustPressed() { 
        const padA = this.pad && this.pad.A; // Xbox A button
        const padJustA = padA && !this.prevPadState.A;
        return Phaser.Input.Keyboard.JustDown(this.keys.LK) || this.virtualLKJustPressed || padJustA; 
    }
    get isMKJustPressed() { 
        const padB = this.pad && this.pad.B; // Xbox B button
        const padJustB = padB && !this.prevPadState.B;
        return Phaser.Input.Keyboard.JustDown(this.keys.MK) || this.virtualMKJustPressed || padJustB; 
    }
    get isHKJustPressed() { 
        const padRT = this.pad && Boolean(this.pad.R2);
        const padJustRT = padRT && !this.prevPadState.RT;
        return Phaser.Input.Keyboard.JustDown(this.keys.HK) || this.virtualHKJustPressed || padJustRT; 
    }
    get isSpecialJustPressed() { // Especial
        const padLB = this.pad && Boolean(this.pad.L1);
        const padJustLB = padLB && !this.prevPadState.LB;
        return Phaser.Input.Keyboard.JustDown(this.keys.Special) || this.virtualSpecialJustPressed || padJustLB; 
    }

    // Limpa os buffers de 1 frame do virtual pad no final do ciclo do Phaser
    public update() {
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
