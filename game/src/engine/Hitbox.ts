import Phaser from 'phaser';

export class Hitbox extends Phaser.Geom.Rectangle {
    public active: boolean = false;
    public damage: number = 0;
    public hitType: string = 'normal'; // 'normal', 'special', 'throw'
    public hitLevel: 'HIGH' | 'MID' | 'LOW' | 'AIR' | 'UNBLOCKABLE' = 'MID';
    public knockback: number = 0;
    public knockdown: boolean = false;
    public hitstun: number = 0;
    public blockstun: number = 0;
    public soundHit: string = 'hit_medium';
    
    // Offset relative to character position
    public offsetX: number = 0;
    public offsetY: number = 0;

    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        super(x, y, width, height);
    }
    
    public updatePosition(charX: number, charY: number, flipX: boolean) {
        this.x = charX + (flipX ? -this.offsetX - this.width : this.offsetX);
        this.y = charY + this.offsetY;
    }
}
