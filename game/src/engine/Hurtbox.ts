import Phaser from 'phaser';

export class Hurtbox extends Phaser.Geom.Rectangle {
    public invincible: boolean = false;
    
    // Offset relative to character position
    public offsetX: number = 0;
    public offsetY: number = 0;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, width, height);
    }
    
    public updatePosition(charX: number, charY: number, flipX: boolean) {
        this.x = charX + (flipX ? -this.offsetX - this.width : this.offsetX);
        this.y = charY + this.offsetY;
    }
}

