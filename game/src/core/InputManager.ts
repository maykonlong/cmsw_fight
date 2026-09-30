import Phaser from 'phaser';

export class InputManager {
    private scene: Phaser.Scene;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys: { [key: string]: Phaser.Input.Keyboard.Key };
    
    // Rastrear botoes de gamepad do frame anterior para o "JustPressed"
    private prevPadState = { A: false, X: false, Y: false, up: false };

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        if (!scene.input.keyboard) throw new Error("Keyboard not available");
        this.cursors = scene.input.keyboard.createCursorKeys();
        
        // Mapeamento de botões de ataque estilo fighting game
        this.keys = {
            LP: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
            MP: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
            HP: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C)
        };
    }

    // Estados Virtuais
    public virtualLeft: boolean = false;
    public virtualRight: boolean = false;
    public virtualUp: boolean = false;
    public virtualDown: boolean = false;
    public virtualLP: boolean = false;
    public virtualMP: boolean = false;
    public virtualHP: boolean = false;

    // Estados Just Pressed Virtuais (Consumidos no mesmo frame)
    public virtualUpJustPressed: boolean = false;
    public virtualLPJustPressed: boolean = false;
    public virtualMPJustPressed: boolean = false;
    public virtualHPJustPressed: boolean = false;

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
        const padA = this.pad && this.pad.X; // Xbox X button
        const padJustA = padA && !this.prevPadState.X;
        return Phaser.Input.Keyboard.JustDown(this.keys.LP) || this.virtualLPJustPressed || padJustA; 
    }
    get isMPJustPressed() { 
        const padY = this.pad && this.pad.Y; // Xbox Y button
        const padJustY = padY && !this.prevPadState.Y;
        return Phaser.Input.Keyboard.JustDown(this.keys.MP) || this.virtualMPJustPressed || padJustY; 
    }
    get isHPJustPressed() { 
        const padRB = this.pad && this.pad.R1; // Xbox RB button
        const padJustRB = padRB && !this.prevPadState.A; // Reusing A logic or just simple check
        return Phaser.Input.Keyboard.JustDown(this.keys.HP) || this.virtualHPJustPressed || (this.pad && this.pad.R1); 
    }

    // Limpa os buffers de 1 frame do virtual pad no final do ciclo do Phaser
    public update() {
        this.virtualUpJustPressed = false;
        this.virtualLPJustPressed = false;
        this.virtualMPJustPressed = false;
        this.virtualHPJustPressed = false;

        if (this.pad) {
            this.prevPadState.up = this.pad.up || this.pad.axes[1].getValue() < -0.5;
            this.prevPadState.X = this.pad.X;
            this.prevPadState.Y = this.pad.Y;
            this.prevPadState.A = this.pad.R1;
        }
    }
}
