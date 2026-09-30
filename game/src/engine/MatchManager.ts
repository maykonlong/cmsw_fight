import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter';
import { HUD } from '../ui/HUD';
import { VFXManager } from './VFXManager';

export class MatchManager {
    private scene: Phaser.Scene;
    private p1: Fighter;
    private p2: Fighter;
    private hud: HUD;
    private vfx: VFXManager;

    public p1Wins: number = 0;
    public p2Wins: number = 0;
    public currentRound: number = 1;
    public roundTime: number = 99;
    
    private matchActive: boolean = false;
    private timerEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, p1: Fighter, p2: Fighter, hud: HUD, vfx: VFXManager) {
        this.scene = scene;
        this.p1 = p1;
        this.p2 = p2;
        this.hud = hud;
        this.vfx = vfx;
    }

    public isMatchActive(): boolean {
        return this.matchActive;
    }

    public startRoundSequence() {
        this.matchActive = false; // Block inputs
        this.p1.stateMachine.transition('idle');
        this.p2.stateMachine.transition('idle');
        this.p1.hp = this.p1.maxHp;
        this.p2.hp = this.p2.maxHp;
        this.roundTime = 99;
        this.hud.setTime(this.roundTime);
        this.hud.setWins(this.p1Wins, this.p2Wins);
        this.hud.update(); // Initial fill

        const { width, height } = this.scene.scale;
        
        // ROUND X Text
        const roundText = this.scene.add.text(width / 2, height / 2, `ROUND ${this.currentRound}`, {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '80px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(200);

        this.scene.tweens.add({
            targets: roundText,
            scale: 1.2,
            duration: 1500,
            onComplete: () => {
                roundText.destroy();
                
                // FIGHT Text
                const fightText = this.scene.add.text(width / 2, height / 2, 'FIGHT!', {
                    fontFamily: '"Arial Black", Gadget, sans-serif',
                    fontSize: '100px',
                    color: '#ffdd00',
                    stroke: '#ff0000',
                    strokeThickness: 10
                }).setOrigin(0.5).setDepth(200).setScale(0.5);

                this.scene.tweens.add({
                    targets: fightText,
                    scale: 1.5,
                    alpha: 0,
                    duration: 800,
                    ease: 'Power2',
                    onComplete: () => {
                        fightText.destroy();
                        this.matchActive = true;
                        this.startTimer();
                    }
                });
            }
        });
    }

    private startTimer() {
        if (this.timerEvent) this.timerEvent.remove();
        
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.matchActive && this.roundTime > 0) {
                    this.roundTime--;
                    this.hud.setTime(this.roundTime);
                    if (this.roundTime <= 0) {
                        this.timeUp();
                    }
                }
            },
            loop: true
        });
    }

    public checkWinCondition() {
        if (!this.matchActive) return;

        if (this.p1.hp <= 0 && this.p2.hp <= 0) {
            this.roundEndSequence('DOUBLE KO');
        } else if (this.p1.hp <= 0) {
            this.p2Wins++;
            this.p1.stateMachine.transition('ko');
            this.p2.stateMachine.transition('win');
            this.roundEndSequence('K.O.');
        } else if (this.p2.hp <= 0) {
            this.p1Wins++;
            this.p2.stateMachine.transition('ko');
            this.p1.stateMachine.transition('win');
            this.roundEndSequence('K.O.');
        }
    }

    private timeUp() {
        if (!this.matchActive) return;
        this.matchActive = false;
        
        if (this.p1.hp > this.p2.hp) {
            this.p1Wins++;
            this.p1.stateMachine.transition('win');
            this.p2.stateMachine.transition('knockdown');
        } else if (this.p2.hp > this.p1.hp) {
            this.p2Wins++;
            this.p2.stateMachine.transition('win');
            this.p1.stateMachine.transition('knockdown');
        } else {
            // Draw
            this.p1Wins++;
            this.p2Wins++;
        }

        this.roundEndSequence('TIME OVER');
    }

    private roundEndSequence(message: string) {
        this.matchActive = false;
        if (this.timerEvent) this.timerEvent.remove();

        this.vfx.hitStop(10);
        this.vfx.cameraShake(0.02);
        this.vfx.slowMotion(2000);

        const { width, height } = this.scene.scale;
        
        const koText = this.scene.add.text(width / 2, height / 2, message, {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '120px',
            color: '#ff0000',
            stroke: '#ffffff',
            strokeThickness: 10
        }).setOrigin(0.5).setDepth(200).setAlpha(0);

        this.scene.tweens.add({
            targets: koText,
            alpha: 1,
            scale: 1.2,
            duration: 1000,
            onComplete: () => {
                this.scene.time.delayedCall(3000, () => {
                    koText.destroy();
                    this.nextRoundOrEndMatch();
                });
            }
        });
    }

    private nextRoundOrEndMatch() {
        if (this.p1Wins >= 2 || this.p2Wins >= 2) {
            // End Match
            if (this.p1Wins >= 2) {
                this.scene.scene.start('VictoryScene', {
                    winner: this.p1.texture.key,
                    loser: this.p2.texture.key,
                    p1Wins: this.p1Wins,
                    p2Wins: this.p2Wins
                });
            } else {
                this.scene.scene.start('GameOverScene');
            }
        } else {
            // Next round
            this.currentRound++;
            this.startRoundSequence();
        }
    }
}
