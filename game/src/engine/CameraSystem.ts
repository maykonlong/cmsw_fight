import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter';

export class CameraSystem {
    private camera: Phaser.Cameras.Scene2D.Camera;
    private minZoom: number = 1.0;   // nunca revela as bordas do cenário (largura = tela)
    private maxZoom: number = 1.12;  // zoom-in dramático no combate fechado
    private closeAt: number = 850;   // distância onde começa o zoom
    private nearAt: number = 220;    // distância de zoom máximo

    constructor(scene: Phaser.Scene) {
        this.camera = scene.cameras.main;
    }

    public update(p1: Fighter, p2: Fighter) {
        // Rampa suave: aberto = zoom normal, combate colado = zoom máximo
        const distance = Math.abs(p1.x - p2.x);
        const t = Phaser.Math.Clamp((this.closeAt - distance) / (this.closeAt - this.nearAt), 0, 1);
        const targetZoom = this.minZoom + t * (this.maxZoom - this.minZoom);

        // Smoothly interpolate camera properties (Lerp)
        this.camera.zoom = Phaser.Math.Linear(this.camera.zoom, targetZoom, 0.06);

        // Mantém dentro dos bounds do cenário (cenário = largura da tela -> scroll 0)
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

