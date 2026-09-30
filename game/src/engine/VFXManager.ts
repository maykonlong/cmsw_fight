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

    public hitStop(frames: number) {
        this.scene.physics.world.isPaused = true;
        
        // Resume after N frames (approx 16ms per frame)
        this.scene.time.delayedCall(frames * 16, () => {
            this.scene.physics.world.isPaused = false;
        });
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

    public slowMotion(duration: number) {
        this.scene.time.timeScale = 0.15;
        this.scene.time.delayedCall(duration * 0.15, () => {
            this.scene.time.timeScale = 1.0;
        });
    }

    public showComboText(count: number, x: number, y: number) {
        const txt = this.scene.add.text(x, y, `${count} HIT!`, {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '32px',
            color: '#ff0000',
            stroke: '#ffffff',
            strokeThickness: 4,
            fontStyle: 'italic'
        }).setOrigin(0.5).setDepth(20);

        this.scene.tweens.add({
            targets: txt,
            y: y - 50,
            alpha: { from: 1, to: 0 },
            scale: { from: 1.5, to: 1 },
            duration: 800,
            ease: 'Cubic.easeOut',
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
