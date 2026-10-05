import Phaser from 'phaser';

/** Shared 1990s KOF arcade presentation used by every non-combat screen. */
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
    static background(scene: Phaser.Scene, accent: 'blue' | 'red' | 'kof' = 'kof') {
        const { width, height } = scene.scale;
        const g = scene.add.graphics().setDepth(-100);

        // Fundo estilo KOF '98 / 2002 UM com gradiente metálico e faixas cortadas
        const topColor = accent === 'red' ? 0x2b060d : accent === 'blue' ? 0x07153b : 0x14061a;
        const btmColor = accent === 'red' ? 0x0f0205 : accent === 'blue' ? 0x040818 : 0x07020d;

        g.fillGradientStyle(topColor, topColor, btmColor, btmColor, 1);
        g.fillRect(0, 0, width, height);

        // Faixas diagonais retro-futuristas estilizadas (KOF laser stripes)
        g.fillStyle(accent === 'red' ? 0xff2200 : 0x0099ff, 0.08);
        for (let i = -width; i < width * 2; i += 90) {
            g.fillTriangle(i, 0, i + 45, 0, i - 160, height);
            g.fillTriangle(i + 45, 0, i - 160, height, i - 115, height);
        }

        // Scanlines finas estilo monitor tubo Arcade (CRT)
        g.fillStyle(0x000000, 0.35);
        for (let y = 0; y < height; y += 4) {
            g.fillRect(0, y, width, 1);
        }

        // Bordas duplas metálicas superior e inferior estilo cabinet KOF
        g.fillStyle(0xffd700, 1);
        g.fillRect(0, 0, width, 6);
        g.fillRect(0, height - 6, width, 6);

        g.fillStyle(0xd52821, 1);
        g.fillRect(0, 6, width, 4);
        g.fillRect(0, height - 10, width, 4);

        g.fillStyle(0x0066ff, 1);
        g.fillRect(0, 10, width, 2);
        g.fillRect(0, height - 12, width, 2);

        scene.add.text(24, 18, 'CMSW — THE KING OF FIGHTERS IDENTITY', {
            fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '13px', color: '#ffd700', letterSpacing: 3,
        }).setDepth(-90);

        scene.add.text(width - 24, height - 28, 'SNK/NEO-GEO ARCADE STYLE  •  1P / 2P', {
            fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '13px', color: '#ff4400', letterSpacing: 2,
        }).setOrigin(1, 0).setDepth(-90);
    }

    static panel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, accent: number = ARCADE.blue) {
        const g = scene.add.graphics();
        // Fundo escuro semitransparente com bisel metálico
        g.fillStyle(0x060919, 0.92);
        g.fillRect(x, y, width, height);

        g.lineStyle(4, 0x000000, 1);
        g.strokeRect(x - 3, y - 3, width + 6, height + 6);

        g.lineStyle(3, accent, 1);
        g.strokeRect(x, y, width, height);

        g.lineStyle(1.5, ARCADE.yellow, 0.9);
        g.strokeRect(x + 6, y + 6, width - 12, height - 12);
        return g;
    }

    static title(scene: Phaser.Scene, text: string, x: number, y: number, size = 64) {
        return scene.add.text(x, y, text, {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: `${size}px`,
            fontStyle: 'italic',
            color: '#fff5b8',
            stroke: '#b81206',
            strokeThickness: Math.max(6, size / 7),
            shadow: { offsetX: 6, offsetY: 7, color: '#030209', blur: 0, stroke: true, fill: true },
        }).setOrigin(0.5);
    }
}

