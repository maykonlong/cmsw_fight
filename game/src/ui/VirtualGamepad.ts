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
        // Só exibe os botões de touch em dispositivos com tela de toque.
        // (Evita crash caso a API `device.os.desktop` tenha mudado no Phaser 4.)
        const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (!hasTouch) {
            return;
        }

        const w = this.scene.scale.width;
        const h = this.scene.scale.height;

        // Estilo base dos botões na tela
        const btnAlpha = 0.65;
        const radius = 38;

        // D-PAD (Esquerda)
        this.createBtn(120, h - 140, radius, btnAlpha, 'left', 0xffffff, '←');
        this.createBtn(260, h - 140, radius, btnAlpha, 'right', 0xffffff, '→');
        this.createBtn(190, h - 210, radius, btnAlpha, 'up', 0xffffff, '↑');
        this.createBtn(190, h - 70, radius, btnAlpha, 'down', 0xffffff, '↓');

        // Botões de Ação (Direita) - 2 fileiras x 3 + SPECIAL
        const btnX = w - 280;
        const btnY = h - 180;

        // Punches (Fileira superior)
        this.createBtn(btnX, btnY, radius, btnAlpha, 'lp', 0xffaaaa, 'LP');
        this.createBtn(btnX + 90, btnY, radius, btnAlpha, 'mp', 0xff6666, 'MP');
        this.createBtn(btnX + 180, btnY, radius, btnAlpha, 'hp', 0xff2222, 'HP');

        // Kicks (Fileira inferior)
        this.createBtn(btnX, btnY + 90, radius, btnAlpha, 'lk', 0xaaaaff, 'LK');
        this.createBtn(btnX + 90, btnY + 90, radius, btnAlpha, 'mk', 0x6666ff, 'MK');
        this.createBtn(btnX + 180, btnY + 90, radius, btnAlpha, 'hk', 0x2222ff, 'HK');

        // Special Button (Topo)
        this.createBtn(btnX + 90, btnY - 90, radius, btnAlpha, 'special', 0xff00ff, 'SPEC');
    }

    private createBtn(x: number, y: number, r: number, alpha: number, action: string, color: number = 0xffffff, labelOverride?: string) {
        const btn = this.scene.add.circle(x, y, r, color, alpha).setScrollFactor(0).setDepth(2000);
        btn.setInteractive({ useHandCursor: true });

        const labelText = labelOverride ?? action.toUpperCase();
        this.scene.add.text(x, y, labelText, {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '18px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

        btn.on('pointerdown', () => {
            btn.setAlpha(0.95);
            btn.setScale(0.9);
            this.handleInput(action, true);
        });
        
        const pointerUp = () => {
            btn.setAlpha(alpha);
            btn.setScale(1.0);
            this.handleInput(action, false);
        };
        
        btn.on('pointerup', pointerUp);
        btn.on('pointerupoutside', pointerUp);
        btn.on('pointerout', pointerUp);
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

