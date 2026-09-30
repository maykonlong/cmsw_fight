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
        const radius = 40;

        // D-PAD (Esquerda)
        this.createBtn(150, h - 150, radius, btnAlpha, 'left');
        this.createBtn(310, h - 150, radius, btnAlpha, 'right');
        this.createBtn(230, h - 230, radius, btnAlpha, 'up');
        this.createBtn(230, h - 70, radius, btnAlpha, 'down');

        // Botões de Ação (Direita) - 2 rows x 3 + special
        const btnX = w - 300;
        const btnY = h - 200;

        // Row 1: Punches
        this.createBtn(btnX, btnY, radius, btnAlpha, 'lp', 0xffcccc);
        this.createBtn(btnX + 100, btnY, radius, btnAlpha, 'mp', 0xff6666);
        this.createBtn(btnX + 200, btnY, radius, btnAlpha, 'hp', 0xff0000);

        // Row 2: Kicks
        this.createBtn(btnX, btnY + 100, radius, btnAlpha, 'lk', 0xccccff);
        this.createBtn(btnX + 100, btnY + 100, radius, btnAlpha, 'mk', 0x6666ff);
        this.createBtn(btnX + 200, btnY + 100, radius, btnAlpha, 'hk', 0x0000ff);

        // Special Button
        this.createBtn(btnX + 100, btnY - 100, radius, btnAlpha, 'special', 0xff00ff);
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
            case 'lk': 
                this.inputManager.virtualLK = isDown; 
                if (isDown) this.inputManager.virtualLKJustPressed = true;
                break;
            case 'mk': 
                this.inputManager.virtualMK = isDown; 
                if (isDown) this.inputManager.virtualMKJustPressed = true;
                break;
            case 'hk': 
                this.inputManager.virtualHK = isDown; 
                if (isDown) this.inputManager.virtualHKJustPressed = true;
                break;
            case 'special': 
                this.inputManager.virtualSpecial = isDown; 
                if (isDown) this.inputManager.virtualSpecialJustPressed = true;
                break;
        }
    }
}
