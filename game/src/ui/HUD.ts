import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter';

export class HUD {
    private scene: Phaser.Scene;
    private p1: Fighter;
    private p2: Fighter;
    
    // UI Elements
    private p1HpBar!: Phaser.GameObjects.Graphics;
    private p1DamageBar!: Phaser.GameObjects.Graphics;
    private p2HpBar!: Phaser.GameObjects.Graphics;
    private p2DamageBar!: Phaser.GameObjects.Graphics;
    
    private p1NameText!: Phaser.GameObjects.Text;
    private p2NameText!: Phaser.GameObjects.Text;
    
    private timerText!: Phaser.GameObjects.Text;
    
    private p1WinIcons: Phaser.GameObjects.Text[] = [];
    private p2WinIcons: Phaser.GameObjects.Text[] = [];
    
    // State
    private p1DamageHp: number;
    private p2DamageHp: number;
    private maxHp: number = 1000;
    private barWidth: number = 440;
    private barHeight: number = 30;

    constructor(scene: Phaser.Scene, p1: Fighter, p2: Fighter) {
        this.scene = scene;
        this.p1 = p1;
        this.p2 = p2;
        this.p1DamageHp = p1.hp;
        this.p2DamageHp = p2.hp;
        this.maxHp = p1.maxHp;

        this.createHUD();
    }

    private createHUD() {
        const { width } = this.scene.scale;
        
        // P1 Bars
        const p1Bg = this.scene.add.graphics().setDepth(100).setScrollFactor(0);
        p1Bg.fillStyle(0x000000, 0.8);
        p1Bg.fillRect(50, 40, this.barWidth, this.barHeight);
        
        this.p1DamageBar = this.scene.add.graphics().setDepth(101).setScrollFactor(0);
        this.p1HpBar = this.scene.add.graphics().setDepth(102).setScrollFactor(0);
        
        // P2 Bars
        const p2Bg = this.scene.add.graphics().setDepth(100).setScrollFactor(0);
        p2Bg.fillStyle(0x000000, 0.8);
        p2Bg.fillRect(width - 50 - this.barWidth, 40, this.barWidth, this.barHeight);
        
        this.p2DamageBar = this.scene.add.graphics().setDepth(101).setScrollFactor(0);
        this.p2HpBar = this.scene.add.graphics().setDepth(102).setScrollFactor(0);

        // Names
        this.p1NameText = this.scene.add.text(50, 10, this.p1.name, {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#0000ff',
            strokeThickness: 4
        }).setDepth(100).setScrollFactor(0);

        this.p2NameText = this.scene.add.text(width - 50, 10, this.p2.name, {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#ff0000',
            strokeThickness: 4
        }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

        // Timer
        const timerBg = this.scene.add.graphics().setDepth(100).setScrollFactor(0);
        timerBg.fillStyle(0x000000, 0.9);
        timerBg.fillRect(width / 2 - 40, 20, 80, 60);

        this.timerText = this.scene.add.text(width / 2, 50, '99', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '40px',
            color: '#ffdd00',
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);

        // Win Icons
        for (let i = 0; i < 2; i++) {
            this.p1WinIcons.push(this.scene.add.text(50 + i * 20, 75, '☆', {
                fontSize: '20px', color: '#ffffff'
            }).setDepth(100).setScrollFactor(0));
            
            this.p2WinIcons.push(this.scene.add.text(width - 50 - i * 20, 75, '☆', {
                fontSize: '20px', color: '#ffffff'
            }).setOrigin(1, 0).setDepth(100).setScrollFactor(0));
        }

        // On-screen Key Guide Banner
        this.scene.add.text(width / 2, 16, 'CONTROLES: [←↑↓→ / WASD] Movimento  |  [Z,X,C / J,K,L] Socos  |  [V,B,N / U,I,O] Chutes  |  [ESPAÇO / E] Especial', {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#ffdd00',
            backgroundColor: '#000000cc',
            padding: { x: 10, y: 3 }
        }).setOrigin(0.5, 0).setDepth(150).setScrollFactor(0);

        this.updateBars();
    }

    public setWins(p1Wins: number, p2Wins: number) {
        for (let i = 0; i < 2; i++) {
            this.p1WinIcons[i].setText(i < p1Wins ? '★' : '☆');
            this.p2WinIcons[i].setText(i < p2Wins ? '★' : '☆');
        }
    }

    public setTime(time: number) {
        this.timerText.setText(time.toString());
        if (time <= 10) {
            this.timerText.setColor('#ff0000');
            // make it pulse
            if (time % 2 === 0) this.timerText.setScale(1.1);
            else this.timerText.setScale(1.0);
        }
    }

    public update() {
        if (this.p1.name && this.p1NameText.text !== this.p1.name) {
            this.p1NameText.setText(this.p1.name);
        }
        if (this.p2.name && this.p2NameText.text !== this.p2.name) {
            this.p2NameText.setText(this.p2.name);
        }

        // Damage Lag logic
        if (this.p1DamageHp > this.p1.hp) {
            this.p1DamageHp -= 3;
            if (this.p1DamageHp < this.p1.hp) this.p1DamageHp = this.p1.hp;
        }
        
        if (this.p2DamageHp > this.p2.hp) {
            this.p2DamageHp -= 3;
            if (this.p2DamageHp < this.p2.hp) this.p2DamageHp = this.p2.hp;
        }

        this.updateBars();
    }

    private updateBars() {
        const { width } = this.scene.scale;

        // P1
        this.p1DamageBar.clear();
        this.p1DamageBar.fillStyle(0xffff00, 1);
        this.p1DamageBar.fillRect(50, 40, (this.p1DamageHp / this.maxHp) * this.barWidth, this.barHeight);

        this.p1HpBar.clear();
        const p1Percent = this.p1.hp / this.maxHp;
        this.p1HpBar.fillStyle(this.getBarColor(p1Percent), 1);
        this.p1HpBar.fillRect(50, 40, p1Percent * this.barWidth, this.barHeight);

        // P2 (Grows from right to left, so X is shifted)
        this.p2DamageBar.clear();
        this.p2DamageBar.fillStyle(0xffff00, 1);
        const p2DamW = (this.p2DamageHp / this.maxHp) * this.barWidth;
        this.p2DamageBar.fillRect(width - 50 - p2DamW, 40, p2DamW, this.barHeight);

        this.p2HpBar.clear();
        const p2Percent = this.p2.hp / this.maxHp;
        const p2W = p2Percent * this.barWidth;
        this.p2HpBar.fillStyle(this.getBarColor(p2Percent), 1);
        this.p2HpBar.fillRect(width - 50 - p2W, 40, p2W, this.barHeight);
    }

    private getBarColor(percent: number): number {
        if (percent > 0.5) return 0x00ff00; // Green
        if (percent > 0.25) return 0xffaa00; // Orange/Yellow
        return 0xff0000; // Red
    }
}
