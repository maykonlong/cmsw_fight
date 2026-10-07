import Phaser from 'phaser';
import { CameraSystem } from './CameraSystem';

export class VFXManager {
    private scene: Phaser.Scene;
    private cameraSystem?: CameraSystem;

    constructor(scene: Phaser.Scene, cameraSystem?: CameraSystem) {
        this.scene = scene;
        this.cameraSystem = cameraSystem;
    }

    // Anima uma sequência de texturas em um único objeto (frames já desenhados)
    private animateFrames(img: Phaser.GameObjects.Image, frames: string[], frameDelay: number) {
        let idx = 0;
        const ev = this.scene.time.addEvent({
            delay: frameDelay,
            repeat: frames.length - 2,
            callback: () => {
                idx++;
                if (frames[idx] && this.scene.textures.exists(frames[idx])) img.setTexture(frames[idx]);
            }
        });
        img.once('destroy', () => ev.remove());
        return img;
    }

    public spawnHitSpark(x: number, y: number, type: 'light' | 'medium' | 'heavy') {
        const size = type === 'heavy' ? 170 : type === 'medium' ? 130 : 100;
        if (this.scene.textures.exists('spark_1')) {
            const spark = this.scene.add.image(x, y, 'spark_1')
                .setDepth(30)
                .setDisplaySize(size, size)
                .setBlendMode(Phaser.BlendModes.ADD)
                .setRotation(type === 'heavy' ? 0.3 : -0.2);
            this.animateFrames(spark, ['spark_1', 'spark_2', 'spark_3', 'spark_4'], 38);
            this.scene.tweens.add({
                targets: spark,
                scale: 1.25,
                alpha: 0,
                duration: 170,
                ease: 'Cubic.easeOut',
                onComplete: () => spark.destroy()
            });
            return;
        }
        const sparkSprite = this.scene.add.image(x, y, 'hit_spark')
            .setDisplaySize(size, size)
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
    }

    // Explosão do encontro de poderes: burst de 3 frames
    public spawnClash(x: number, y: number) {
        if (!this.scene.textures.exists('clash_1')) {
            this.spawnHitSpark(x, y, 'heavy');
            return;
        }
        const burst = this.scene.add.image(x, y, 'clash_1')
            .setDepth(40)
            .setDisplaySize(240, 240)
            .setBlendMode(Phaser.BlendModes.ADD);
        this.animateFrames(burst, ['clash_1', 'clash_2', 'clash_3'], 70);
        this.scene.tweens.add({
            targets: burst,
            scale: { from: 0.7, to: 1.6 },
            alpha: { from: 1, to: 0 },
            duration: 320,
            ease: 'Cubic.easeOut',
            onComplete: () => burst.destroy()
        });
    }

    // Anel de aura para casts de especial / ativação do Max Mode
    public spawnAuraRing(x: number, y: number, tint: number = 0xffd54a) {
        if (!this.scene.textures.exists('aura_ring_1')) return;
        const ringImg = this.scene.add.image(x, y, 'aura_ring_1')
            .setDepth(28)
            .setDisplaySize(340, 340) // envolve o lutador inteiro (340px)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setTint(tint);
        this.animateFrames(ringImg, ['aura_ring_1', 'aura_ring_2', 'aura_ring_3'], 60);
        this.scene.tweens.add({
            targets: ringImg,
            scale: { from: 0.5, to: 1.35 },
            alpha: { from: 1, to: 0 },
            duration: 380,
            ease: 'Cubic.easeOut',
            onComplete: () => ringImg.destroy()
        });
    }

    // Raio elétrico do beijo do Kevin ao eletrocutar
    public spawnElectricBolt(x: number, y: number) {
        if (!this.scene.textures.exists('electric_bolt_1')) return;
        const bolt = this.scene.add.image(x + Phaser.Math.Between(-30, 30), y, 'electric_bolt_1')
            .setDepth(32)
            .setDisplaySize(100, 230) // desce da cabeça até o chão do lutador
            .setBlendMode(Phaser.BlendModes.ADD);
        this.animateFrames(bolt, ['electric_bolt_1', 'electric_bolt_2', 'electric_bolt_3'], 60);
        this.scene.tweens.add({
            targets: bolt,
            alpha: { from: 1, to: 0 },
            y: y + 20,
            duration: 260,
            onComplete: () => bolt.destroy()
        });
    }

    public spawnBlockSpark(x: number, y: number) {
        // Escudo de guarda (KOF guard point) — cresce e some
        if (this.scene.textures.exists('guard_shield')) {
            const shield = this.scene.add.image(x, y, 'guard_shield')
                .setDepth(29)
                .setDisplaySize(120, 260) // cobre a altura de guarda do lutador
                .setBlendMode(Phaser.BlendModes.ADD)
                .setAlpha(0.95);
            this.scene.tweens.add({
                targets: shield,
                scale: { from: 0.75, to: 1.2 },
                alpha: 0,
                duration: 190,
                ease: 'Cubic.easeOut',
                onComplete: () => shield.destroy()
            });
        }

        // Escudo: flash azul + anel dourado expandindo
        if (this.scene.textures.exists('hit_spark')) {
            const guard = this.scene.add.image(x, y, 'hit_spark')
                .setDisplaySize(70, 70)
                .setDepth(30)
                .setTint(0x66d9ff)
                .setBlendMode(Phaser.BlendModes.ADD);
            this.scene.tweens.add({
                targets: guard,
                scale: 0.3,
                alpha: 0,
                duration: 130,
                ease: 'Cubic.easeOut',
                onComplete: () => guard.destroy()
            });
        }

        const ring = this.scene.add.circle(x, y, 10)
            .setStrokeStyle(3, 0xffce56, 0.95)
            .setDepth(29);
        this.scene.tweens.add({
            targets: ring,
            scale: 2.6,
            alpha: 0,
            duration: 220,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy()
        });

        for (let i = 0; i < 4; i++) {
            const shard = this.scene.add.circle(x, y, 4, 0xffe9a8);
            shard.setDepth(29);
            const angle = Phaser.Math.FloatBetween(-Math.PI, 0);
            this.scene.tweens.add({
                targets: shard,
                x: x + Math.cos(angle) * Phaser.Math.Between(30, 55),
                y: y + Math.sin(angle) * Phaser.Math.Between(20, 40),
                alpha: 0,
                duration: 260,
                onComplete: () => shard.destroy()
            });
        }
    }

    public spawnDustCloud(x: number, y: number) {
        const usePuff = this.scene.textures.exists('dust_puff');
        for (let i = 0; i < 4; i++) {
            if (usePuff) {
                const puff = this.scene.add.image(x + Phaser.Math.Between(-22, 22), y - 6, 'dust_puff')
                    .setDepth(9)
                    .setScale(Phaser.Math.FloatBetween(0.35, 0.6));
                this.scene.tweens.add({
                    targets: puff,
                    y: y - Phaser.Math.Between(14, 34),
                    x: puff.x + Phaser.Math.Between(-16, 16),
                    scale: puff.scale * 1.5,
                    alpha: 0,
                    duration: Phaser.Math.Between(320, 520),
                    onComplete: () => puff.destroy()
                });
            } else {
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

