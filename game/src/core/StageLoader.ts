import Phaser from 'phaser';

export interface StageLayer {
    id: string;
    image: string;
    parallaxX: number;
    parallaxY: number;
    depth: number;
    animation?: string;
    animSpeed?: number;
}

export interface StageData {
    id: string;
    name: string;
    music: string;
    groundY: number;
    leftBoundary: number;
    rightBoundary: number;
    width: number;
    layers: StageLayer[];
    ambientEffects?: any[];
}

export class StageLoader {
    public static createStage(scene: Phaser.Scene, stageId: string): { groundY: number, width: number } {
        const data = scene.cache.json.get(stageId) as StageData;
        
        if (!data) {
            console.warn(`No JSON data for stage ${stageId}, creating default stage.`);
            // Default stage
            const bg = scene.add.image(scene.scale.width/2, scene.scale.height/2, 'stage_bg');
            bg.setDisplaySize(scene.scale.width, scene.scale.height);
            bg.setDepth(0);
            return { groundY: 590, width: scene.scale.width };
        }

        // Loop through layers and add them with parallax
        for (const layer of data.layers) {
            const img = scene.add.image(0, 0, layer.image);
            img.setOrigin(0, 0);
            img.setDepth(layer.depth);
            // In a real implementation we would set up scrollFactor based on parallaxX/Y
            img.setScrollFactor(layer.parallaxX, layer.parallaxY);
            
            // If it's a floor, we don't scale it if we want repeating or specific size, but we'll scale to fit height for now.
            // For a fighting game, usually the height is fixed to screen height or slightly larger for jumping.
            img.setDisplaySize(data.width, scene.scale.height);

            // Handle animation (like crowd bounce)
            if (layer.animation === 'bounce') {
                scene.tweens.add({
                    targets: img,
                    y: img.y - 4,
                    duration: 500 / (layer.animSpeed || 1),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        }

        // Set camera bounds
        scene.cameras.main.setBounds(0, 0, data.width, scene.scale.height);

        // Efeitos ambientes (folhas, fumaça, vapor, faíscas digitais)
        if (data.ambientEffects?.length) {
            this.spawnAmbientEffects(scene, data.ambientEffects);
        }

        return { groundY: data.groundY, width: data.width };
    }

    private static ensureEffectTextures(scene: Phaser.Scene) {
        if (!scene.textures.exists('fx_leaf')) {
            const g = scene.make.graphics({ x: 0, y: 0 }, false);
            g.fillStyle(0x6fdf4a, 1);
            g.fillEllipse(8, 6, 14, 7);
            g.generateTexture('fx_leaf', 16, 12);
            g.destroy();
        }
        if (!scene.textures.exists('fx_dot')) {
            const g = scene.make.graphics({ x: 0, y: 0 }, false);
            g.fillStyle(0xffffff, 1);
            g.fillCircle(6, 6, 6);
            g.generateTexture('fx_dot', 12, 12);
            g.destroy();
        }
    }

    private static spawnAmbientEffects(scene: Phaser.Scene, effects: any[]) {
        this.ensureEffectTextures(scene);
        const { width, height } = scene.scale;

        for (const fx of effects) {
            switch (fx.type) {
                case 'leaves':
                    scene.add.particles(0, 0, 'fx_leaf', {
                        x: { min: -40, max: width + 40 },
                        y: -20,
                        lifespan: 9000,
                        speedX: { min: 20, max: 60 },
                        speedY: { min: 25, max: 55 },
                        rotate: { start: 0, end: 360 },
                        scale: { min: 0.8, max: 1.7 },
                        alpha: { start: 0.85, end: 0.2 },
                        quantity: 1,
                        frequency: 1400 / (fx.speed || 1)
                    }).setDepth(2);
                    break;
                case 'smoke':
                    scene.add.particles(0, 0, 'fx_dot', {
                        x: { min: 0, max: width },
                        y: height - 70,
                        lifespan: 6500,
                        speedY: { min: -35, max: -15 },
                        speedX: { min: -12, max: 12 },
                        scaleX: { start: 0.8, end: 2.6 },
                        scaleY: { start: 0.8, end: 3.2 },
                        alpha: { start: 0.15, end: 0 },
                        tint: 0xbfc9d6,
                        quantity: 1,
                        frequency: 900
                    }).setDepth(2);
                    break;
                case 'steam':
                    scene.add.particles(0, 0, 'fx_dot', {
                        x: { min: -20, max: width + 20 },
                        y: { min: height - 120, max: height - 40 },
                        lifespan: 4500,
                        speedY: { min: -70, max: -35 },
                        speedX: { min: -16, max: 16 },
                        scaleX: { start: 0.6, end: 1.8 },
                        scaleY: { start: 0.5, end: 1.4 },
                        alpha: { start: 0.22, end: 0 },
                        tint: 0xeaf6ff,
                        quantity: 1,
                        frequency: 700
                    }).setDepth(2);
                    break;
                case 'sparks':
                    scene.add.particles(0, 0, 'fx_dot', {
                        x: { min: 0, max: width },
                        y: { min: 120, max: height - 100 },
                        lifespan: 4000,
                        speedY: { min: -22, max: -8 },
                        speedX: { min: -10, max: 10 },
                        scale: { start: 0.4, end: 0 },
                        alpha: { start: 0.8, end: 0 },
                        tint: [0x00e5ff, 0x7de3ff, 0xffd700],
                        quantity: 1,
                        frequency: 380,
                        blendMode: 'ADD'
                    }).setDepth(2);
                    break;
                case 'crowd': {
                    // Torcida animada: silhuetas vibrando no fundo
                    if (!scene.textures.exists('crowd_1')) break;
                    const stripY = typeof fx.y === 'number' ? fx.y : height - 96;
                    for (let i = 0; i < 3; i++) {
                        const cx = width / 2 + (i - 1) * 420;
                        const crowd = scene.add.image(cx, stripY, 'crowd_1').setDepth(1);
                        crowd.setScale(fx.scale ?? 1.7);
                        scene.time.addEvent({
                            delay: 340 + i * 40,
                            loop: true,
                            callback: () => crowd.setTexture(crowd.texture.key === 'crowd_1' ? 'crowd_2' : 'crowd_1')
                        });
                    }
                    break;
                }
                case 'neon': {
                    // Letreiro neon piscando (às vezes apaga, estilo bar retrô)
                    if (!scene.textures.exists('neon_open_1')) break;
                    const nx = typeof fx.x === 'number' ? fx.x : width / 2;
                    const ny = typeof fx.y === 'number' ? fx.y : 120;
                    const sign = scene.add.image(nx, ny, 'neon_open_1').setDepth(2);
                    if (fx.scale) sign.setScale(fx.scale);
                    scene.time.addEvent({
                        delay: 620,
                        loop: true,
                        callback: () => {
                            const flick = Math.random();
                            if (flick < 0.12) sign.setTexture('neon_open_2');
                            else if (flick < 0.22) sign.setVisible(false);
                            else { sign.setTexture('neon_open_1'); sign.setVisible(true); }
                        }
                    });
                    break;
                }
            }
        }
    }
}

