import Phaser from 'phaser';
import { Fighter } from '../entities/Fighter';
import { HUD } from '../ui/HUD';
import { VFXManager } from './VFXManager';
import { AudioManager } from './AudioManager';

export class MatchManager {
    private scene: Phaser.Scene;
    private p1: Fighter;
    private p2: Fighter;
    private hud: HUD;
    private vfx: VFXManager;
    private mode: string;

    public p1Wins: number = 0;
    public p2Wins: number = 0;
    public currentRound: number = 1;
    public roundTime: number = 99;
    
    private matchActive: boolean = false;
    private timerEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, p1: Fighter, p2: Fighter, hud: HUD, vfx: VFXManager, mode: string = '1p') {
        this.scene = scene;
        this.p1 = p1;
        this.p2 = p2;
        this.hud = hud;
        this.vfx = vfx;
        this.mode = mode;
    }

    public isMatchActive(): boolean {
        return this.matchActive;
    }

    public setPaused(paused: boolean) {
        if (this.timerEvent) this.timerEvent.paused = paused;
    }

    public startRoundSequence() {
        this.matchActive = false; // Block inputs
        const groundY = this.scene.cache.json.get('cmsw_hq')?.groundY ?? 590;
        this.resetFighter(this.p1, 280, groundY - Fighter.CENTER_ABOVE_FLOOR);
        this.resetFighter(this.p2, this.scene.scale.width - 280, groundY - Fighter.CENTER_ABOVE_FLOOR);
        this.p1.hp = this.p1.maxHp;
        this.p2.hp = this.p2.maxHp;
        this.roundTime = 99;
        this.hud.setTime(this.roundTime);
        this.hud.setWins(this.p1Wins, this.p2Wins);
        this.hud.update(); // Initial fill

        const { width, height } = this.scene.scale;
        
        AudioManager.getInstance().playVoice(`round_${this.currentRound}`);

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
                AudioManager.getInstance().playVoice('fight');
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

    private resetFighter(fighter: Fighter, x: number, y: number) {
        fighter.setPosition(x, y);
        fighter.setVelocity(0, 0);
        fighter.setAngle(0);
        fighter.setAlpha(1);
        fighter.clearTint();
        fighter.isHit = false;
        fighter.isBlocking = false;
        fighter.currentHitbox.active = false;
        fighter.currentHurtbox.invincible = false;
        fighter.stateMachine.transition('idle');
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
            AudioManager.getInstance().playVoice('time_over');
        } else if (this.p2.hp > this.p1.hp) {
            this.p2Wins++;
            this.p2.stateMachine.transition('win');
            this.p1.stateMachine.transition('knockdown');
            AudioManager.getInstance().playVoice('time_over');
        } else {
            // Draw
            this.p1Wins++;
            this.p2Wins++;
            AudioManager.getInstance().playVoice('time_over');
        }

        this.roundEndSequence('TIME OVER');
    }

    private roundEndSequence(message: string) {
        this.matchActive = false;
        if (this.timerEvent) this.timerEvent.remove();

        this.vfx.hitStop(10);
        this.vfx.cameraShake(0.02);
        this.vfx.slowMotion(2000);

        if (message === 'K.O.' || message === 'DOUBLE KO') {
            AudioManager.getInstance().playVoice('ko');
        }

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
            if (this.p1Wins >= 2 || this.mode === '2p') {
                const winner = this.p1Wins >= 2 ? this.p1 : this.p2;
                const loser = winner === this.p1 ? this.p2 : this.p1;
                this.scene.scene.start('VictoryScene', {
                    winner: winner.characterId,
                    loser: loser.characterId,
                    p1Wins: this.p1Wins,
                    p2Wins: this.p2Wins,
                    mode: this.mode
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
