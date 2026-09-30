import Phaser from 'phaser';
import { Fighter } from './Fighter';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
    private owner: Fighter;
    public damage: number;
    public damageType: 'normal' | 'electric';
    public hitActive: boolean = true;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, owner: Fighter, velocityX: number, damage: number, damageType: 'normal' | 'electric' = 'normal') {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.owner = owner;
        this.damage = damage;
        this.damageType = damageType;

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.allowGravity = false;
        
        this.setVelocityX(velocityX);
        
        // Destruir automaticamente após 3 segundos
        scene.time.delayedCall(3000, () => {
            if (this.active) this.destroy();
        });
    }

    getOwner() {
        return this.owner;
    }
}
