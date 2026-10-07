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

        // Animação do projétil: beijo pulsa, cachorro corre (frames do pacote VFX)
        const anim: Record<string, string[]> = {
            'aura_beijo': ['beijo_1', 'beijo_2', 'beijo_3'],
            'aura_cachorro': ['dog_run_1', 'dog_run_2', 'dog_run_3']
        };
        const frames = anim[texture];
        if (frames && scene.textures.exists(frames[0])) {
            let fi = 0;
            const animEv = scene.time.addEvent({
                delay: 90,
                loop: true,
                callback: () => {
                    fi = (fi + 1) % frames.length;
                    if (this.active && scene.textures.exists(frames[fi])) this.setTexture(frames[fi]);
                }
            });
            this.once('destroy', () => animEv.remove());
        }

        // Destruir automaticamente após 3 segundos
        scene.time.delayedCall(3000, () => {
            if (this.active) this.destroy();
        });
    }

    getOwner() {
        return this.owner;
    }
}

