import Phaser from 'phaser';

/** Shared modern arcade presentation used by every non-combat screen. */
export const ARCADE = {
    navy: 0x070b1e,
    blue: 0x0066ff,
    red: 0xee2211,
    yellow: 0xffd700,
    gold: 0xffa500,
    white: '#ffffff',
    ink: '#050711',
};

export class ArcadeTheme {
    static background(scene: Phaser.Scene, accent: 'blue' | 'red' | 'arcade' | 'kof' = 'arcade') {
        const { width, height } = scene.scale;
        const g = scene.add.graphics().setDepth(-100);

        // Fundo com degradê escuro ultramoderno neon e faixas dinâmicas
        const topColor = accent === 'red' ? 0x24050e : accent === 'blue' ? 0x061536 : 0x12071f;
        const btmColor = accent === 'red' ? 0x0b0206 : accent === 'blue' ? 0x030718 : 0x06020c;

        g.fillGradientStyle(topColor, topColor, btmColor, btmColor, 1);
        g.fillRect(0, 0, width, height);

        // Faixas diagonais retro-futuristas iluminadas
        const laserColor = accent === 'red' ? 0xff2244 : accent === 'blue' ? 0x0099ff : 0x00e5ff;
        g.fillStyle(laserColor, 0.07);
        for (let i = -width; i < width * 2; i += 90) {
            g.fillTriangle(i, 0, i + 45, 0, i - 160, height);
            g.fillTriangle(i + 45, 0, i - 160, height, i - 115, height);
        }

        // Texture Grid sutil no fundo
        g.lineStyle(1, 0xffffff, 0.03);
        for (let x = 0; x < width; x += 40) {
            g.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y < height; y += 40) {
            g.lineBetween(0, y, width, y);
        }

        // Moldura Neon metálica superior e inferior
        g.fillStyle(0xffd700, 1);
        g.fillRect(0, 0, width, 5);
        g.fillRect(0, height - 5, width, 5);

        g.fillStyle(0x00ccff, 1);
        g.fillRect(0, 5, width, 3);
        g.fillRect(0, height - 8, width, 3);

        scene.add.text(24, 16, 'COMBAT MASTERS — ARCADE SPECIAL EDITION 2026', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '12px',
            color: '#ffd700',
            letterSpacing: 2,
        }).setDepth(-90);

        scene.add.text(width - 24, height - 24, 'COMBAT MARTIAL SOUL WARRIORS  •  1P / 2P', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '12px',
            color: '#00ccff',
            letterSpacing: 2,
        }).setOrigin(1, 0).setDepth(-90);
    }

    static panel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, accent: number = ARCADE.blue) {
        const g = scene.add.graphics();
        // Painel estilo Glassmorphism limpo e destacado
        g.fillStyle(0x060a1d, 0.88);
        g.fillRect(x, y, width, height);

        g.lineStyle(2, 0x000000, 0.9);
        g.strokeRect(x - 2, y - 2, width + 4, height + 4);

        g.lineStyle(2.5, accent, 0.95);
        g.strokeRect(x, y, width, height);

        g.lineStyle(1, 0xffd700, 0.5);
        g.strokeRect(x + 5, y + 5, width - 10, height - 10);
        return g;
    }

    static title(scene: Phaser.Scene, text: string, x: number, y: number, size = 64) {
        return scene.add.text(x, y, text, {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: `${size}px`,
            fontStyle: 'italic',
            color: '#ffffff',
            stroke: '#d52821',
            strokeThickness: Math.max(6, size / 7),
            shadow: { offsetX: 4, offsetY: 6, color: '#000000', blur: 4, stroke: true, fill: true },
        }).setOrigin(0.5);
    }
}
