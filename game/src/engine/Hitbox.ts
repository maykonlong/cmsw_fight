import Phaser from 'phaser';

export class Hitbox extends Phaser.Geom.Rectangle {
    public active: boolean = false;
    public damage: number = 0;
    public type: string = 'normal'; // 'normal', 'special', 'throw'
    public hitLevel: 'HIGH' | 'MID' | 'LOW' | 'AIR' | 'UNBLOCKABLE' = 'MID';
    public knockback: number = 0;
    public hitstun: number = 0;
    public blockstun: number = 0;
    
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
