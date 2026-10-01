import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter';

export class CameraSystem {
    private camera: Phaser.Cameras.Scene2D.Camera;
    private minZoom: number = 0.8;
    private maxZoom: number = 1.2;
    private padding: number = 200; // Extra space to keep characters in view

    constructor(scene: Phaser.Scene) {
        this.camera = scene.cameras.main;
    }

    public update(p1: Fighter, p2: Fighter) {
        // Find midpoint
        const midX = (p1.x + p2.x) / 2;
        
        // Calculate distance between players
        const distance = Math.abs(p1.x - p2.x);
        
        // Calculate required zoom to keep both on screen
        const requiredWidth = distance + this.padding * 2;
        let targetZoom = this.camera.width / requiredWidth;
        
        // Clamp zoom
        targetZoom = Phaser.Math.Clamp(targetZoom, this.minZoom, this.maxZoom);

        // Smoothly interpolate camera properties (Lerp)
        this.camera.zoom = Phaser.Math.Linear(this.camera.zoom, targetZoom, 0.1);
        this.camera.scrollX = Phaser.Math.Linear(this.camera.scrollX, midX - (this.camera.width / 2), 0.1);

        // Keep camera within world bounds if set
        if (this.camera.useBounds) {
            const bounds = this.camera.getBounds();
            if (bounds) {
                this.camera.scrollX = Phaser.Math.Clamp(
                    this.camera.scrollX, 
                    bounds.x, 
                    bounds.right - this.camera.width
                );
            }
        }
    }

    public shake(intensity: number, duration: number) {
        this.camera.shake(duration, intensity);
    }
}
