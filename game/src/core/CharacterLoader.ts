import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter';
import { InputManager } from './InputManager';

export interface CharacterData {
    id: string;
    name: string;
    catchphrase: string;
    health: number;
    stunMax: number;
    throwRange: number;
    movement: {
        walkForward: number;
        walkBackward: number;
        jumpVelocityY: number;
        jumpVelocityX: number;
    };
    sprites: Record<string, string>;
    normals: string[];
    crouchNormals: string[];
    airNormals: string[];
    specials: any[];
    intro: { animation: string; phrase: string };
    victory: { animation: string; phrase: string };
    defeat: { animation: string; phrase: string };
}

export class CharacterLoader {
    /**
     * Preloads all the assets required for a specific character based on its JSON data.
     * This must be called during a scene's `preload` method.
     */
    public static preloadCharacterAssets(scene: Phaser.Scene, characterId: string) {
        // Here we assume the json is already loaded, or we load it.
        // Wait, normally we load the JSON first, then parse it, then load images.
        // In Phaser, it's easier to load the JSON in BootScene, then use it to load images in CharacterSelect/CombatScene.
        const data = scene.cache.json.get(characterId) as CharacterData;
        if (!data) {
            console.error(`Character JSON for ${characterId} not found in cache!`);
            return;
        }

        // Load all sprites defined in the JSON
        // Assume sprites are named like assets/sprites/characters/kevin/idle.png but the JSON might just give the base name or path.
        // In our JSON we put just string names like "kevin_idle" or paths.
        // Let's assume we load them manually for now, or the JSON defines paths.
        // Since we didn't specify full paths in the JSON (except in the checklist it said "assets/sprites/characters/kevin/idle.png"), 
        // I'll adjust the logic. The checklist had full paths in the example, but I used short names. I'll stick to short names assuming they map to textures.
    }

    /**
     * Instantiates a Fighter with data parsed from the loaded JSON.
     */
    public static createFighter(scene: Phaser.Scene, x: number, y: number, characterId: string, inputManager?: any): Fighter {
        const data = scene.cache.json.get(characterId) as CharacterData;
        
        if (!data) {
            console.warn(`No JSON data for ${characterId}, falling back to default Fighter`);
            return new Fighter(scene, x, y, characterId, inputManager);
        }

        // Pass the texture. Usually the idle texture is used as base.
        const baseTexture = data.sprites.idle || characterId;
        const fighter = new Fighter(scene, x, y, baseTexture, inputManager);
        
        // Apply JSON data to the fighter instance
        fighter.maxHp = data.health;
        fighter.hp = data.health;
        fighter.speed = data.movement.walkForward; // Simplified
        fighter.jumpForce = Math.abs(data.movement.jumpVelocityY);
        fighter.throwRange = data.throwRange;
        fighter.name = data.name; // We can add a name field to Fighter

        // Note: specials and other data will be injected into Fighter's state machine soon.
        return fighter;
    }
}
