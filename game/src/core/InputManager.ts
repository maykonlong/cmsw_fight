import Phaser from 'phaser';

export class InputManager {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys: { [key: string]: Phaser.Input.Keyboard.Key };
    
    constructor(scene: Phaser.Scene) {
        if (!scene.input.keyboard) throw new Error("Keyboard not available");
        this.cursors = scene.input.keyboard.createCursorKeys();
        
        // Mapeamento de botões de ataque estilo fighting game
        this.keys = {
            LP: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
            MP: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
            HP: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C)
        };
    }

    get isLeftDown() { return this.cursors.left.isDown; }
    get isRightDown() { return this.cursors.right.isDown; }
    get isUpDown() { return this.cursors.up.isDown; }
    get isDownDown() { return this.cursors.down.isDown; }
    
    get isUpJustPressed() { return Phaser.Input.Keyboard.JustDown(this.cursors.up); }
    get isLPJustPressed() { return Phaser.Input.Keyboard.JustDown(this.keys.LP); }
    get isMPJustPressed() { return Phaser.Input.Keyboard.JustDown(this.keys.MP); }
    get isHPJustPressed() { return Phaser.Input.Keyboard.JustDown(this.keys.HP); }
}
