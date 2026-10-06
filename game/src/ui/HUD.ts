import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter';
import { ARCADE } from './ArcadeTheme';

export class HUD {
    private scene: Phaser.Scene;
    private p1: Fighter;
    private p2: Fighter;
    
    // UI Elements
    private p1HpBar!: Phaser.GameObjects.Graphics;
    private p1DamageBar!: Phaser.GameObjects.Graphics;
    private p1SuperBar!: Phaser.GameObjects.Graphics;
    private p2HpBar!: Phaser.GameObjects.Graphics;
    private p2DamageBar!: Phaser.GameObjects.Graphics;
    private p2SuperBar!: Phaser.GameObjects.Graphics;
    
    private p1NameText!: Phaser.GameObjects.Text;
    private p2NameText!: Phaser.GameObjects.Text;
    private p1StockText!: Phaser.GameObjects.Text;
    private p2StockText!: Phaser.GameObjects.Text;
    
    private timerText!: Phaser.GameObjects.Text;
    
    private p1WinIcons: Phaser.GameObjects.Text[] = [];
    private p2WinIcons: Phaser.GameObjects.Text[] = [];
    
    // State
    private p1DamageHp: number;
    private p2DamageHp: number;
    private barWidth: number = 440;
    private barHeight: number = 30;

    constructor(scene: Phaser.Scene, p1: Fighter, p2: Fighter) {
        this.scene = scene;
        this.p1 = p1;
        this.p2 = p2;
        this.p1DamageHp = p1.hp;
        this.p2DamageHp = p2.hp;

        this.createHUD();
    }

    private createHUD() {
        const { width } = this.scene.scale;
        
        // P1 Bars
        const p1Bg = this.scene.add.graphics().setDepth(100).setScrollFactor(0);
        p1Bg.fillStyle(0x050713, 0.9);
        p1Bg.fillRect(50, 40, this.barWidth, this.barHeight);
        p1Bg.lineStyle(3, ARCADE.blue, 1);
        p1Bg.strokeRect(50, 40, this.barWidth, this.barHeight);

        // P1 Super Bar Background
        const p1SuperBg = this.scene.add.graphics().setDepth(100).setScrollFactor(0);
        p1SuperBg.fillStyle(0x050713, 0.9);
        p1SuperBg.fillRect(50, 74, 300, 14);
        p1SuperBg.lineStyle(2, 0xffd700, 1);
        p1SuperBg.strokeRect(50, 74, 300, 14);
        
        this.p1DamageBar = this.scene.add.graphics().setDepth(101).setScrollFactor(0);
        this.p1HpBar = this.scene.add.graphics().setDepth(102).setScrollFactor(0);
        this.p1SuperBar = this.scene.add.graphics().setDepth(102).setScrollFactor(0);
        
        // P2 Bars
        const p2Bg = this.scene.add.graphics().setDepth(100).setScrollFactor(0);
        p2Bg.fillStyle(0x050713, 0.9);
        p2Bg.fillRect(width - 50 - this.barWidth, 40, this.barWidth, this.barHeight);
        p2Bg.lineStyle(3, ARCADE.red, 1);
        p2Bg.strokeRect(width - 50 - this.barWidth, 40, this.barWidth, this.barHeight);

        // P2 Super Bar Background
        const p2SuperBg = this.scene.add.graphics().setDepth(100).setScrollFactor(0);
        p2SuperBg.fillStyle(0x050713, 0.9);
        p2SuperBg.fillRect(width - 50 - 300, 74, 300, 14);
        p2SuperBg.lineStyle(2, 0x00ccff, 1);
        p2SuperBg.strokeRect(width - 50 - 300, 74, 300, 14);
        
        this.p2DamageBar = this.scene.add.graphics().setDepth(101).setScrollFactor(0);
        this.p2HpBar = this.scene.add.graphics().setDepth(102).setScrollFactor(0);
        this.p2SuperBar = this.scene.add.graphics().setDepth(102).setScrollFactor(0);

        // Names & Super Stock Orbs
        this.p1NameText = this.scene.add.text(50, 10, this.p1.name, {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#0000ff',
            strokeThickness: 4
        }).setDepth(100).setScrollFactor(0);

        this.p1StockText = this.scene.add.text(360, 72, 'POWER ★ 0', {
            fontFamily: 'Impact, "Arial Black"',
            fontSize: '15px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        }).setDepth(100).setScrollFactor(0);

        this.p2NameText = this.scene.add.text(width - 50, 10, this.p2.name, {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#ff0000',
            strokeThickness: 4
        }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

        this.p2StockText = this.scene.add.text(width - 360, 72, 'POWER ★ 0', {
            fontFamily: 'Impact, "Arial Black"',
            fontSize: '15px',
            color: '#00ccff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

        // Timer
        const timerBg = this.scene.add.graphics().setDepth(100).setScrollFactor(0);
        timerBg.fillStyle(0x050713, 0.95);
        timerBg.fillRect(width / 2 - 40, 20, 80, 60);
        timerBg.lineStyle(3, ARCADE.yellow, 1);
        timerBg.strokeRect(width / 2 - 40, 20, 80, 60);

        this.timerText = this.scene.add.text(width / 2, 50, '99', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '40px',
            color: '#ffdd00',
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);

        // Win Icons
        for (let i = 0; i < 2; i++) {
            this.p1WinIcons.push(this.scene.add.text(50 + i * 20, 92, '☆', {
                fontSize: '18px', color: '#ffffff'
            }).setDepth(100).setScrollFactor(0));
            
            this.p2WinIcons.push(this.scene.add.text(width - 50 - i * 20, 92, '☆', {
                fontSize: '18px', color: '#ffffff'
            }).setOrigin(1, 0).setDepth(100).setScrollFactor(0));
        }

        // On-screen Key Guide Banner
        this.scene.add.text(width / 2, 689, 'MOVIMENTO: SETAS / WASD  •  ESQUIVA ROLL: Z+V / J+U  •  SOCO: Z X C / J K L  •  CHUTE: V B N / U I O  •  SUPER ESPECIAL: ESPAÇO / E', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#ffdd00',
            backgroundColor: '#000000cc',
            padding: { x: 10, y: 3 }
        }).setOrigin(0.5, 0).setDepth(150).setScrollFactor(0);

        this.updateBars();
    }

    public setWins(p1Wins: number, p2Wins: number) {
        this.p1DamageHp = this.p1.hp;
        this.p2DamageHp = this.p2.hp;
        for (let i = 0; i < 2; i++) {
            this.p1WinIcons[i].setText(i < p1Wins ? '★' : '☆');
            this.p2WinIcons[i].setText(i < p2Wins ? '★' : '☆');
        }
    }

    public setTime(time: number) {
        this.timerText.setText(time.toString());
        if (time <= 10) {
            this.timerText.setColor('#ff0000');
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

        // Super Stock Orbs Text Update
        this.p1StockText.setText(`POWER ★ ${this.p1.superStocks}`);
        this.p2StockText.setText(`POWER ★ ${this.p2.superStocks}`);

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

        // P1 HP Bar
        this.p1DamageBar.clear();
        this.p1DamageBar.fillStyle(0xffff00, 1);
        this.p1DamageBar.fillRect(50, 40, (this.p1DamageHp / this.p1.maxHp) * this.barWidth, this.barHeight);

        this.p1HpBar.clear();
        const p1Percent = this.p1.hp / this.p1.maxHp;
        this.p1HpBar.fillStyle(this.getBarColor(p1Percent), 1);
        this.p1HpBar.fillRect(50, 40, p1Percent * this.barWidth, this.barHeight);

        // P1 Super Bar
        this.p1SuperBar.clear();
        const p1SuperPercent = Math.min(1, (this.p1.superGauge || 0) / Fighter.MAX_SUPER_GAUGE);
        this.p1SuperBar.fillStyle(0xffd700, 1);
        this.p1SuperBar.fillRect(50, 74, p1SuperPercent * 300, 14);

        // P2 HP Bar
        this.p2DamageBar.clear();
        this.p2DamageBar.fillStyle(0xffff00, 1);
        const p2DamW = (this.p2DamageHp / this.p2.maxHp) * this.barWidth;
        this.p2DamageBar.fillRect(width - 50 - p2DamW, 40, p2DamW, this.barHeight);

        this.p2HpBar.clear();
        const p2Percent = this.p2.hp / this.p2.maxHp;
        const p2W = p2Percent * this.barWidth;
        this.p2HpBar.fillStyle(this.getBarColor(p2Percent), 1);
        this.p2HpBar.fillRect(width - 50 - p2W, 40, p2W, this.barHeight);

        // P2 Super Bar
        this.p2SuperBar.clear();
        const p2SuperPercent = Math.min(1, (this.p2.superGauge || 0) / Fighter.MAX_SUPER_GAUGE);
        const p2SuperW = p2SuperPercent * 300;
        this.p2SuperBar.fillStyle(0x00ccff, 1);
        this.p2SuperBar.fillRect(width - 50 - p2SuperW, 74, p2SuperW, 14);
    }

    private getBarColor(percent: number): number {
        if (percent > 0.5) return 0x00ff00; // Green
        if (percent > 0.25) return 0xffaa00; // Orange/Yellow
        return 0xff0000; // Red
    }
}

