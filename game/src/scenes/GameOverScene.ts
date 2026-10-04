import Phaser from 'phaser';
import { AudioManager } from '../engine/AudioManager';
import { ArcadeTheme, ARCADE } from '../ui/ArcadeTheme';

export class GameOverScene extends Phaser.Scene {
    private countdown: number = 9;
    private timerEvent!: Phaser.Time.TimerEvent;
    private countText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const { width, height } = this.scale;

        AudioManager.getInstance().setScene(this);
        AudioManager.getInstance().playMusic('game_over', false);

        ArcadeTheme.background(this, 'red');
        ArcadeTheme.panel(this, width / 2 - 260, 60, 520, height - 120, ARCADE.red);

        const title = this.add.text(width / 2, 100, 'K.O.', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '80px',
            color: '#ffdd33',
            stroke: '#550000',
            strokeThickness: 10
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: title,
            alpha: 1,
            y: 150,
            duration: 1000,
            ease: 'Bounce.easeOut'
        });

        this.add.text(width / 2, 280, 'CONTINUE?', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '40px',
            color: '#fff8d6',
        }).setOrigin(0.5);

        this.countText = this.add.text(width / 2, 400, '9', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '120px',
            color: '#ffdd00'
        }).setOrigin(0.5);

        this.countdown = 9;
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.countdown--;
                if (this.countdown >= 0) {
                    this.countText.setText(this.countdown.toString());
                    this.tweens.add({
                        targets: this.countText,
                        scaleX: 1.5,
                        scaleY: 1.5,
                        duration: 100,
                        yoyo: true
                    });
                } else {
                    this.timerEvent.remove();
                    this.scene.start('MainMenuScene');
                }
            },
            loop: true
        });

        const btnContinue = this.add.text(width / 2, 600, '[ PRESS TO CONTINUE ]', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '30px',
            color: '#00ff00',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Pulse
        this.tweens.add({
            targets: btnContinue,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        const proceed = () => {
            this.timerEvent.remove();
            this.scene.start('CharacterSelectScene');
        };

        btnContinue.on('pointerdown', proceed);
        this.input.keyboard?.once('keydown-ENTER', proceed);
        this.input.keyboard?.once('keydown-SPACE', proceed);
    }
}
