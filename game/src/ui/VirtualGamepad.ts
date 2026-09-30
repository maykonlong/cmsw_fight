import Phaser from 'phaser';
import { InputManager } from '../core/InputManager';

export class VirtualGamepad {
    private scene: Phaser.Scene;
    private inputManager: InputManager;

    constructor(scene: Phaser.Scene, inputManager: InputManager) {
        this.scene = scene;
        this.inputManager = inputManager;
        this.createControls();
    }

    private createControls() {
        // Apenas criar se for mobile ou touch habilitado
        if (!this.scene.sys.game.device.input.touch) return;

        const w = this.scene.scale.width;
        const h = this.scene.scale.height;

        // Estilo base dos botões
        const btnAlpha = 0.5;
        const radius = 50;

        // D-PAD (Esquerda)
        this.createBtn(150, h - 150, radius, btnAlpha, 'left');
        this.createBtn(350, h - 150, radius, btnAlpha, 'right');
        this.createBtn(250, h - 250, radius, btnAlpha, 'up');
        this.createBtn(250, h - 50, radius, btnAlpha, 'down');

        // Botões de Ação (Direita)
        this.createBtn(w - 250, h - 150, radius, btnAlpha, 'lp', 0xff0000); // Soco Fraco
        this.createBtn(w - 150, h - 250, radius, btnAlpha, 'mp', 0x00ff00); // Soco Médio
        this.createBtn(w - 100, h - 120, radius, btnAlpha, 'hp', 0x0000ff); // Soco Forte
    }

    private createBtn(x: number, y: number, r: number, alpha: number, action: string, color: number = 0xffffff) {
        const btn = this.scene.add.circle(x, y, r, color, alpha).setScrollFactor(0);
        btn.setInteractive();

        btn.on('pointerdown', () => this.handleInput(action, true));
        btn.on('pointerup', () => this.handleInput(action, false));
        btn.on('pointerout', () => this.handleInput(action, false));
    }

    private handleInput(action: string, isDown: boolean) {
        switch(action) {
            case 'left': this.inputManager.virtualLeft = isDown; break;
            case 'right': this.inputManager.virtualRight = isDown; break;
            case 'up': 
                this.inputManager.virtualUp = isDown; 
                if (isDown) this.inputManager.virtualUpJustPressed = true;
                break;
            case 'down': this.inputManager.virtualDown = isDown; break;
            case 'lp': 
                this.inputManager.virtualLP = isDown; 
                if (isDown) this.inputManager.virtualLPJustPressed = true;
                break;
            case 'mp': 
                this.inputManager.virtualMP = isDown; 
                if (isDown) this.inputManager.virtualMPJustPressed = true;
                break;
            case 'hp': 
                this.inputManager.virtualHP = isDown; 
                if (isDown) this.inputManager.virtualHPJustPressed = true;
                break;
        }
    }
}
