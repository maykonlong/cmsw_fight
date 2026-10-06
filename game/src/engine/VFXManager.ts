import Phaser from 'phaser';
import { CameraSystem } from './CameraSystem';

export class VFXManager {
    private scene: Phaser.Scene;
    private cameraSystem?: CameraSystem;

    constructor(scene: Phaser.Scene, cameraSystem?: CameraSystem) {
        this.scene = scene;
        this.cameraSystem = cameraSystem;
    }

    public spawnHitSpark(x: number, y: number, type: 'light' | 'medium' | 'heavy') {
        if (this.scene.textures.exists('hit_spark')) {
            const sparkSprite = this.scene.add.image(x, y, 'hit_spark')
                .setDisplaySize(type === 'heavy' ? 110 : 78, type === 'heavy' ? 110 : 78)
                .setDepth(30)
                .setBlendMode(Phaser.BlendModes.ADD);
            this.scene.tweens.add({
                targets: sparkSprite,
                scale: 0.25,
                alpha: 0,
                angle: type === 'heavy' ? 18 : -12,
                duration: 150,
                ease: 'Cubic.easeOut',
                onComplete: () => sparkSprite.destroy()
            });
            return;
        }
        const sizeMap = { light: 0.5, medium: 1.0, heavy: 1.5 };
        const spark = this.scene.add.circle(x, y, 20 * sizeMap[type], 0xffa500);
        spark.setDepth(10);
        
        this.scene.tweens.add({
            targets: spark,
            scale: 1.5,
            alpha: 0,
            duration: 150,
            onComplete: () => spark.destroy()
        });
    }

    public spawnBlockSpark(x: number, y: number) {
        const spark = this.scene.add.circle(x, y, 15, 0x00ffff);
        spark.setDepth(10);
        
        this.scene.tweens.add({
            targets: spark,
            scale: 1.2,
            alpha: 0,
            duration: 100,
            onComplete: () => spark.destroy()
        });
    }

    public spawnDustCloud(x: number, y: number) {
        for (let i = 0; i < 4; i++) {
            const dust = this.scene.add.circle(x + Phaser.Math.Between(-20, 20), y, 10, 0xaaaaaa);
            dust.setDepth(9);
            this.scene.tweens.add({
                targets: dust,
                y: y - Phaser.Math.Between(10, 30),
                x: dust.x + Phaser.Math.Between(-15, 15),
                alpha: 0,
                duration: Phaser.Math.Between(300, 500),
                onComplete: () => dust.destroy()
            });
        }
    }

    public spawnAfterImage(sprite: Phaser.GameObjects.Sprite, tint: number = 0x00ffff) {
        const afterImage = this.scene.add.sprite(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name);
        afterImage.setFlipX(sprite.flipX);
        afterImage.setDisplaySize(sprite.displayWidth, sprite.displayHeight);
        afterImage.setOrigin(sprite.originX, sprite.originY);
        afterImage.setTint(tint);
        afterImage.setAlpha(0.5);
        afterImage.setDepth(sprite.depth - 1);
        afterImage.setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
            targets: afterImage,
            alpha: 0,
            scaleX: afterImage.scaleX * 1.05,
            scaleY: afterImage.scaleY * 1.05,
            duration: 250,
            ease: 'Sine.easeOut',
            onComplete: () => afterImage.destroy()
        });
    }

    private hitStopTimer: number = 0;

    public hitStop(frames: number) {
        this.hitStopTimer = frames;
        this.scene.physics.world.isPaused = true;
    }

    public isHitStopping(): boolean {
        return this.hitStopTimer > 0;
    }

    public updateHitStop() {
        if (this.hitStopTimer > 0) {
            this.hitStopTimer--;
            if (this.hitStopTimer <= 0) {
                this.scene.physics.world.isPaused = false;
            }
        }
    }

    public cameraShake(intensity: number) {
        if (this.cameraSystem) {
            this.cameraSystem.shake(intensity, 100);
        } else {
            this.scene.cameras.main.shake(100, intensity);
        }
    }

    public screenFlash(duration: number) {
        this.scene.cameras.main.flash(duration, 255, 255, 255);
    }

    public darkenScreen(duration: number) {
        const overlay = this.scene.add.rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0x000000, 0.7);
        overlay.setOrigin(0, 0).setDepth(25);
        this.scene.tweens.add({
            targets: overlay,
            alpha: 0,
            delay: duration * 16,
            duration: 300,
            onComplete: () => overlay.destroy()
        });
    }

    public slowMotion(duration: number) {
        this.scene.time.timeScale = 0.15;
        this.scene.time.delayedCall(duration * 0.15, () => {
            this.scene.time.timeScale = 1.0;
        });
    }

    public showComboText(count: number, x: number, y: number, comboName?: string) {
        const textStr = comboName ? `${count} HITS!\n${comboName}` : `${count} HITS COMBO!`;
        const txt = this.scene.add.text(x, y - 40, textStr, {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '36px',
            color: '#ffd429',
            stroke: '#d52821',
            strokeThickness: 6,
            fontStyle: 'italic',
            align: 'center',
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(150);

        this.scene.tweens.add({
            targets: txt,
            y: y - 100,
            scale: { from: 1.6, to: 1.0 },
            alpha: { from: 1, to: 0 },
            duration: 1000,
            ease: 'Back.easeOut',
            onComplete: () => txt.destroy()
        });
    }

    public showCounterText(x: number, y: number) {
        const txt = this.scene.add.text(x, y, 'COUNTER!', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '24px',
            color: '#ffa500',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(20);

        this.scene.tweens.add({
            targets: txt,
            y: y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => txt.destroy()
        });
    }
}
