import Phaser from 'phaser';

/** Shared 1990s arcade presentation used by every non-combat screen. */
export const ARCADE = {
    navy: 0x090d2b,
    blue: 0x173d9b,
    red: 0xd52821,
    yellow: 0xffd429,
    white: '#fff8d6',
    ink: '#12152e',
};

export class ArcadeTheme {
    static background(scene: Phaser.Scene, accent: 'blue' | 'red' = 'blue') {
        const { width, height } = scene.scale;
        const g = scene.add.graphics().setDepth(-100);
        g.fillGradientStyle(0x07091c, accent === 'blue' ? 0x101c52 : 0x3a0d18, 0x13102b, 0x16070e, 1);
        g.fillRect(0, 0, width, height);
        g.fillStyle(0x050616, 0.5);
        for (let y = 0; y < height; y += 12) g.fillRect(0, y, width, 2);
        g.fillStyle(accent === 'blue' ? ARCADE.blue : ARCADE.red, 0.2);
        g.fillRect(0, 0, 16, height);
        g.fillRect(width - 16, 0, 16, height);
        g.fillStyle(ARCADE.red, 1);
        g.fillRect(0, 0, width, 7);
        g.fillRect(0, height - 7, width, 7);
        g.fillStyle(ARCADE.yellow, 1);
        g.fillRect(0, 7, width, 3);
        g.fillRect(0, height - 10, width, 3);
        scene.add.text(24, 18, 'C&M SOFTWARE // WORLD WARRIORS', {
            fontFamily: 'monospace', fontSize: '12px', color: '#8ea6d9', letterSpacing: 2,
        }).setDepth(-90);
        scene.add.text(width - 24, height - 28, 'INSERT COIN  •  1P / 2P', {
            fontFamily: 'monospace', fontSize: '12px', color: '#8ea6d9', letterSpacing: 1,
        }).setOrigin(1, 0).setDepth(-90);
    }

    static panel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, accent: number = ARCADE.blue) {
        const g = scene.add.graphics();
        g.fillStyle(0x050713, 0.88);
        g.fillRect(x, y, width, height);
        g.lineStyle(4, 0x050713, 1);
        g.strokeRect(x - 4, y - 4, width + 8, height + 8);
        g.lineStyle(2, accent, 1);
        g.strokeRect(x, y, width, height);
        g.lineStyle(1, ARCADE.yellow, 0.9);
        g.strokeRect(x + 7, y + 7, width - 14, height - 14);
        return g;
    }

    static title(scene: Phaser.Scene, text: string, x: number, y: number, size = 52) {
        return scene.add.text(x, y, text, {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: `${size}px`, color: ARCADE.white,
            stroke: '#101331', strokeThickness: Math.max(5, size / 8),
            shadow: { offsetX: 5, offsetY: 5, color: '#000000', blur: 0, stroke: true, fill: true },
        }).setOrigin(0.5);
    }

    static button(scene: Phaser.Scene, text: string, x: number, y: number, width = 360) {
        const g = scene.add.graphics();
        g.fillStyle(0x1b2f69, 1);
        g.fillRect(x - width / 2, y - 25, width, 50);
        g.lineStyle(3, ARCADE.yellow, 1);
        g.strokeRect(x - width / 2, y - 25, width, 50);
        return scene.add.text(x, y, text, {
            fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '28px',
            color: ARCADE.white, stroke: '#000000', strokeThickness: 4,
            padding: { x: 14, y: 5 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    }
}
