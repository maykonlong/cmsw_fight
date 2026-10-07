import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { VsScene } from './scenes/VsScene';
import { CombatScene } from './scenes/CombatScene';
import { VictoryScene } from './scenes/VictoryScene';
import { GameOverScene } from './scenes/GameOverScene';
import { TrainingScene } from './scenes/TrainingScene';
import { SettingsScene } from './scenes/SettingsScene';
import { ControlsScene } from './scenes/ControlsScene';
import './style.css';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'app',
    backgroundColor: '#000000',
    render: {
        // Prioriza GPU dedicada e render direto (fluidez em qualquer dispositivo)
        powerPreference: 'high-performance',
        antialias: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 1200 },
            debug: false // Sem debug visual
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
        keyboard: true,
        gamepad: true
    },
    scene: [BootScene, MainMenuScene, CharacterSelectScene, VsScene, CombatScene, TrainingScene, VictoryScene, GameOverScene, SettingsScene, ControlsScene]
};

const game = new Phaser.Game(config);
(window as any).__game = game; // handle de depuracao

// PWA: registra o service worker (cache offline + recarga instantânea) apenas em produção
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {
            // PWA é aprimoramento: sem SW o jogo segue funcionando online
        });
    });
}

