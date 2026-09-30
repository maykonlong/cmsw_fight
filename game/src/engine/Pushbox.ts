import Phaser from 'phaser';

export class Pushbox extends Phaser.Geom.Rectangle {
    // Offset relative to character position
    public offsetX: number = 0;
    public offsetY: number = 0;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, width, height);
    }
    
    public updatePosition(charX: number, charY: number, flipX: boolean) {
        // Pushbox is typically perfectly centered, but just in case:
        this.x = charX + (flipX ? -this.offsetX - this.width : this.offsetX);
        this.y = charY + this.offsetY;
    }
}
