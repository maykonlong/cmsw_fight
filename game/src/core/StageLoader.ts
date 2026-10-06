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

        return { groundY: data.groundY, width: data.width };
    }
}

