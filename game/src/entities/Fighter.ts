import Phaser from 'phaser';
import { StateMachine, State } from '../core/StateMachine';
import { IInputProvider } from '../interfaces/IInputProvider';
import { Hitbox } from '../engine/Hitbox';
import { Hurtbox } from '../engine/Hurtbox';
import { Pushbox } from '../engine/Pushbox';
import { BASE_MOVES, MoveData } from '../data/moves/base_moves';
import { CommandRecognizer } from '../core/CommandRecognizer';

export class Fighter extends Phaser.Physics.Arcade.Sprite {
    public stateMachine: StateMachine;
    public inputManager?: IInputProvider;
    public speed: number = 250;
    public jumpForce: number = 750;

    // Combat
    public hp: number = 1000;
    public maxHp: number = 1000;
    public stunMeter: number = 0;
    
    // Boxes
    public currentHitbox!: Hitbox;
    public currentHurtbox!: Hurtbox;
    public pushbox!: Pushbox;

    public isHit: boolean = false;
    public isBlocking: boolean = false;
    public hitStunTimer: number = 0;

    public throwRange: number = 60;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, inputManager?: IInputProvider) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.inputManager = inputManager;

        // Init Boxes
        this.currentHitbox = new Hitbox(0, 0, 0, 0);
        this.currentHurtbox = new Hurtbox(0, 0, 80, 160);
        this.currentHurtbox.offsetX = -40;
        this.currentHurtbox.offsetY = -160;

        this.pushbox = new Pushbox(0, 0, 60, 120);
        this.pushbox.offsetX = -30;
        this.pushbox.offsetY = -120;

        // Registrando estados usando MoveData base para normais
        this.stateMachine = new StateMachine('idle', {
            idle:        new IdleState(),
            walk:        new WalkState(),
            jump:        new JumpState(),
            crouch:      new CrouchState(),
            
            // Ataques de pé
            stand_LP:    new AttackState(BASE_MOVES['LP']),
            stand_MP:    new AttackState(BASE_MOVES['MP']),
            stand_HP:    new AttackState(BASE_MOVES['HP']),
            stand_LK:    new AttackState(BASE_MOVES['LK']),
            stand_MK:    new AttackState(BASE_MOVES['MK']),
            stand_HK:    new AttackState(BASE_MOVES['HK']),

            // Ataques agachados
            crouch_LP:   new AttackState(BASE_MOVES['cLP']),
            crouch_MP:   new AttackState(BASE_MOVES['cMP']),
            crouch_HP:   new AttackState(BASE_MOVES['cHP']),
            crouch_LK:   new AttackState(BASE_MOVES['cLK']),
            crouch_MK:   new AttackState(BASE_MOVES['cMK']),
            crouch_HK:   new AttackState(BASE_MOVES['cHK']),

            // Ataques aéreos
            air_LP:      new AttackState(BASE_MOVES['jLP']),
            air_MP:      new AttackState(BASE_MOVES['jMP']),
            air_HP:      new AttackState(BASE_MOVES['jHP']),
            air_LK:      new AttackState(BASE_MOVES['jLK']),
            air_MK:      new AttackState(BASE_MOVES['jMK']),
            air_HK:      new AttackState(BASE_MOVES['jHK']),

            // Outros
            block_high:  new BlockState('HIGH'),
            block_low:   new BlockState('LOW'),
            hit:         new HitState(),
            knockdown:   new KnockdownState(),
            wakeup:      new WakeupState(),
            dizzy:       new DizzyState(),
            ko:          new KOState(),
            win:         new WinState(),
            land:        new LandState(),
            throw:       new ThrowState(),
            thrown:      new ThrownState(),
            
            // Especial
            special:     new SpecialState(),
        }, [this]);
    }

    update() {
        this.stateMachine.step();
        
        // Atualiza a posição das boxes em relação ao personagem e se ele tá virado
        this.currentHurtbox.updatePosition(this.x, this.y, this.flipX);
        this.currentHitbox.updatePosition(this.x, this.y, this.flipX);
        this.pushbox.updatePosition(this.x, this.y, this.flipX);
    }

    public autoFaceOpponent(opponent: Fighter) {
        if (this.x < opponent.x) {
            this.setFlipX(false);
        } else {
            this.setFlipX(true);
        }
    }

    takeDamage(amount: number, pushbackForce: number, fromX: number, type: 'normal' | 'electric' = 'normal') {
        if (this.isHit) return;
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        const dir = this.x < fromX ? -1 : 1;
        this.setVelocityX(pushbackForce * dir);
        this.stateMachine.transition('hit', type);
    }
}

// ─────────────────────────────────────────────────────────────────
// IDLE
// ─────────────────────────────────────────────────────────────────
class IdleState extends State {
    execute(f: Fighter) {
        f.setVelocityX(0);
        if (!f.inputManager) return;
        const inp = f.inputManager;

        // Reconhecimento de comandos especiais
        const cmd = CommandRecognizer.checkCommands(inp.buffer, inp.currentFrame, f.flipX);
        if (cmd === '236P' || cmd === '623P' || cmd === '214K') {
            this.stateMachine.transition('special', cmd); return;
        }

        const isGrounded = f.body && ((f.body as any).blocked?.down || f.body.touching.down);
        if (inp.isUpJustPressed && isGrounded) {
            this.stateMachine.transition('jump'); return;
        }
        if (inp.isDownDown) {
            this.stateMachine.transition('crouch'); return;
        }
        if (inp.isLeftDown || inp.isRightDown) {
            this.stateMachine.transition('walk'); return;
        }
        
        const isFacingLeft = f.flipX;
        const holdBack = isFacingLeft ? inp.isRightDown : inp.isLeftDown;
        if (holdBack) {
            this.stateMachine.transition('block_high'); return;
        }

        if (inp.isThrowJustPressed) {
            this.stateMachine.transition('throw'); return;
        }

        // Ataques
        if (inp.isLPJustPressed && !inp.isLKJustPressed) { this.stateMachine.transition('stand_LP'); return; }
        if (inp.isMPJustPressed) { this.stateMachine.transition('stand_MP'); return; }
        if (inp.isHPJustPressed) { this.stateMachine.transition('stand_HP'); return; }
        if (inp.isLKJustPressed && !inp.isLPJustPressed) { this.stateMachine.transition('stand_LK'); return; }
        if (inp.isMKJustPressed) { this.stateMachine.transition('stand_MK'); return; }
        if (inp.isHKJustPressed) { this.stateMachine.transition('stand_HK'); return; }
    }
}

// ─────────────────────────────────────────────────────────────────
// WALK
// ─────────────────────────────────────────────────────────────────
class WalkState extends State {
    execute(f: Fighter) {
        if (!f.inputManager) return;
        const inp = f.inputManager;

        const cmd = CommandRecognizer.checkCommands(inp.buffer, inp.currentFrame, f.flipX);
        if (cmd === '236P' || cmd === '623P' || cmd === '214K') {
            this.stateMachine.transition('special', cmd); return;
        }

        const isGrounded = f.body && ((f.body as any).blocked?.down || f.body.touching.down);
        if (inp.isUpJustPressed && isGrounded) {
            this.stateMachine.transition('jump'); return;
        }
        if (inp.isDownDown) {
            this.stateMachine.transition('crouch'); return;
        }

        if (inp.isLeftDown) {
            f.setVelocityX(-f.speed);
            f.setFlipX(true);
        } else if (inp.isRightDown) {
            f.setVelocityX(f.speed);
            f.setFlipX(false);
        } else {
            this.stateMachine.transition('idle'); return;
        }

        if (inp.isThrowJustPressed) {
            this.stateMachine.transition('throw'); return;
        }

        if (inp.isLPJustPressed && !inp.isLKJustPressed) { this.stateMachine.transition('stand_LP'); return; }
        if (inp.isMPJustPressed) { this.stateMachine.transition('stand_MP'); return; }
        if (inp.isHPJustPressed) { this.stateMachine.transition('stand_HP'); return; }
        if (inp.isLKJustPressed && !inp.isLPJustPressed) { this.stateMachine.transition('stand_LK'); return; }
        if (inp.isMKJustPressed) { this.stateMachine.transition('stand_MK'); return; }
        if (inp.isHKJustPressed) { this.stateMachine.transition('stand_HK'); return; }
    }
}

// ─────────────────────────────────────────────────────────────────
// JUMP
// ─────────────────────────────────────────────────────────────────
class JumpState extends State {
    private airFrames = 0;
    enter(f: Fighter) {
        this.airFrames = 0;
        f.setVelocityY(-f.jumpForce);
        if (!f.inputManager) return;
        if (f.inputManager.isLeftDown)  f.setVelocityX(-f.speed * 0.85);
        else if (f.inputManager.isRightDown) f.setVelocityX(f.speed * 0.85);
    }

    execute(f: Fighter) {
        this.airFrames++;
        if (!f.inputManager) return;
        const inp = f.inputManager;

        // Aerial attacks
        if (inp.isLPJustPressed) { this.stateMachine.transition('air_LP'); return; }
        if (inp.isMPJustPressed) { this.stateMachine.transition('air_MP'); return; }
        if (inp.isHPJustPressed) { this.stateMachine.transition('air_HP'); return; }
        if (inp.isLKJustPressed) { this.stateMachine.transition('air_LK'); return; }
        if (inp.isMKJustPressed) { this.stateMachine.transition('air_MK'); return; }
        if (inp.isHKJustPressed) { this.stateMachine.transition('air_HK'); return; }

        if (this.airFrames > 8 && f.body && ((f.body as any).blocked?.down || f.body.touching.down)) {
            this.stateMachine.transition('land');
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// LAND
// ─────────────────────────────────────────────────────────────────
class LandState extends State {
    private duration = 0;
    enter(f: Fighter) {
        this.duration = 3; // 3 frames de aterrissagem
        f.setVelocityX(0);
    }
    execute(f: Fighter) {
        this.duration--;
        if (this.duration <= 0) {
            this.stateMachine.transition('idle');
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// CROUCH
// ─────────────────────────────────────────────────────────────────
class CrouchState extends State {
    enter(f: Fighter) {
        f.setVelocityX(0);
        f.setScale(f.scaleX, f.scaleY * 0.75);
        f.currentHurtbox.height = 100;
        f.currentHurtbox.offsetY = -100;
    }

    exit(f: Fighter) {
        f.setScale(f.scaleX, f.scaleY / 0.75);
        f.currentHurtbox.height = 160;
        f.currentHurtbox.offsetY = -160;
    }

    execute(f: Fighter) {
        if (!f.inputManager) return;
        const inp = f.inputManager;

        const cmd = CommandRecognizer.checkCommands(inp.buffer, inp.currentFrame, f.flipX);
        if (cmd === '236P' || cmd === '623P' || cmd === '214K') {
            this.stateMachine.transition('special', cmd); return;
        }

        if (!inp.isDownDown) {
            this.stateMachine.transition('idle'); return;
        }

        const isFacingLeft = f.flipX;
        const holdBack = isFacingLeft ? inp.isRightDown : inp.isLeftDown;
        if (holdBack) {
            this.stateMachine.transition('block_low'); return;
        }

        if (inp.isLPJustPressed) { this.stateMachine.transition('crouch_LP'); return; }
        if (inp.isMPJustPressed) { this.stateMachine.transition('crouch_MP'); return; }
        if (inp.isHPJustPressed) { this.stateMachine.transition('crouch_HP'); return; }
        if (inp.isLKJustPressed) { this.stateMachine.transition('crouch_LK'); return; }
        if (inp.isMKJustPressed) { this.stateMachine.transition('crouch_MK'); return; }
        if (inp.isHKJustPressed) { this.stateMachine.transition('crouch_HK'); return; }
    }
}

// ─────────────────────────────────────────────────────────────────
// ATTACK STATE GENÉRICO
// ─────────────────────────────────────────────────────────────────
class AttackState extends State {
    private duration = 0;
    private moveData: MoveData;

    constructor(moveData: MoveData) {
        super();
        this.moveData = moveData;
    }

    enter(f: Fighter) {
        this.duration = 0;
        f.currentHitbox.active = false;
        
        // Copiar dados pro hitbox atual
        f.currentHitbox.damage = this.moveData.damage;
        f.currentHitbox.type = this.moveData.type;
        f.currentHitbox.hitLevel = this.moveData.hitLevel;
        f.currentHitbox.knockback = this.moveData.knockback;
        f.currentHitbox.hitstun = this.moveData.hitstun;
        f.currentHitbox.blockstun = this.moveData.blockstun;
        
        f.currentHitbox.offsetX = this.moveData.hitboxOffset.x;
        f.currentHitbox.offsetY = this.moveData.hitboxOffset.y;
        f.currentHitbox.setTo(0, 0, this.moveData.hitboxOffset.w, this.moveData.hitboxOffset.h);

        f.setTint(0x4444ff); // Cor de feedback visual temporária
    }

    execute(f: Fighter) {
        this.duration++;

        // Ativa hitbox durante os frames active
        if (this.duration === this.moveData.startup + 1) {
            f.currentHitbox.active = true;
            f.setTint(0xff4444); // Active frame color
        }

        // Desativa hitbox
        if (this.duration === this.moveData.startup + this.moveData.active + 1) {
            f.currentHitbox.active = false;
            f.setTint(0x4444ff); // Recovery frame color
        }

        // Janela de Cancel
        if (this.moveData.cancelable && this.duration > this.moveData.startup + this.moveData.active) {
            if (f.inputManager) {
                const cmd = CommandRecognizer.checkCommands(f.inputManager.buffer, f.inputManager.currentFrame, f.flipX);
                if (cmd === '236P' || cmd === '623P' || cmd === '214K') {
                    f.currentHitbox.active = false;
                    f.clearTint();
                    this.stateMachine.transition('special', cmd);
                    return;
                }
            }
        }

        // Transition out
        if (this.duration >= this.moveData.startup + this.moveData.active + this.moveData.recovery) {
            f.currentHitbox.active = false;
            f.clearTint();
            
            if (this.moveData.hitLevel === 'AIR') {
                this.stateMachine.transition('jump');
            } else {
                this.stateMachine.transition(f.inputManager?.isDownDown ? 'crouch' : 'idle');
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// BLOCK (High/Low)
// ─────────────────────────────────────────────────────────────────
class BlockState extends State {
    private type: 'HIGH' | 'LOW';

    constructor(type: 'HIGH' | 'LOW') {
        super();
        this.type = type;
    }

    enter(f: Fighter) {
        f.setVelocityX(0);
        f.isBlocking = true;
        f.setTint(0x888888);
        if (this.type === 'LOW') {
            f.setScale(f.scaleX, f.scaleY * 0.75);
            f.currentHurtbox.height = 100;
            f.currentHurtbox.offsetY = -100;
        }
    }

    exit(f: Fighter) {
        f.isBlocking = false;
        f.clearTint();
        if (this.type === 'LOW') {
            f.setScale(f.scaleX, f.scaleY / 0.75);
            f.currentHurtbox.height = 160;
            f.currentHurtbox.offsetY = -160;
        }
    }

    execute(f: Fighter) {
        if (!f.inputManager) return;
        const inp = f.inputManager;
        const isFacingLeft = f.flipX;
        const holdBack = isFacingLeft ? inp.isRightDown : inp.isLeftDown;
        
        if (!holdBack) {
            this.stateMachine.transition(this.type === 'LOW' ? 'crouch' : 'idle');
        } else if (this.type === 'HIGH' && inp.isDownDown) {
            this.stateMachine.transition('block_low');
        } else if (this.type === 'LOW' && !inp.isDownDown) {
            this.stateMachine.transition('block_high');
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// SPECIAL (Provisório)
// ─────────────────────────────────────────────────────────────────
class SpecialState extends State {
    private duration = 0;
    private fired = false;
    private cmd: string = '';

    enter(f: Fighter, cmd: string = '236P') {
        f.setVelocityX(0);
        this.duration = 45;
        this.fired = false;
        this.cmd = cmd;
        f.setTint(0xff00ff);
    }

    execute(f: Fighter) {
        this.duration--;

        if (!this.fired && this.duration === 25) {
            this.fired = true;
            if (this.cmd === '623P') {
                // Dragon punch - add upward velocity and hitbox
                f.setVelocityY(-600);
            } else {
                // Fireball
                f.emit('fire_special', f);
            }
        }

        if (this.duration <= 0) {
            f.clearTint();
            this.stateMachine.transition('idle');
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// THROW & THROWN
// ─────────────────────────────────────────────────────────────────
class ThrowState extends State {
    private duration = 0;
    
    enter(f: Fighter) {
        f.setVelocityX(0);
        this.duration = 20; // 20 frames de animação de throw
        f.setTint(0x00ff00);
        
        // A lógica de aplicar o throw no oponente será processada pelo CombatSystem
        // Apenas criamos uma hitbox "UNBLOCKABLE" que se conecta imediatamente
        f.currentHitbox.active = true;
        f.currentHitbox.damage = 120;
        f.currentHitbox.type = 'throw';
        f.currentHitbox.hitLevel = 'UNBLOCKABLE';
        f.currentHitbox.knockback = 500;
        f.currentHitbox.setTo(0, 0, f.throwRange, 60);
        f.currentHitbox.offsetX = 0;
        f.currentHitbox.offsetY = -60;
    }

    execute(f: Fighter) {
        this.duration--;
        if (this.duration < 15) {
            f.currentHitbox.active = false; // Hitbox ativa só no começo
        }
        if (this.duration <= 0) {
            f.clearTint();
            this.stateMachine.transition('idle');
        }
    }
}

class ThrownState extends State {
    enter(f: Fighter) {
        f.isHit = true;
        f.setVelocityY(-300); // Jogado para o ar
        f.setTint(0xffaa00);
    }
    
    execute(f: Fighter) {
        if (f.body?.touching.down && f.body.velocity.y >= 0) {
            f.clearTint();
            this.stateMachine.transition('knockdown');
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// HIT, KNOCKDOWN, WAKEUP, DIZZY, KO, WIN
// ─────────────────────────────────────────────────────────────────
class HitState extends State {
    private type: 'normal' | 'electric' = 'normal';

    enter(f: Fighter, type: 'normal' | 'electric' = 'normal') {
        f.isHit = true;
        this.type = type;

        if (type === 'electric') {
            f.hitStunTimer = 50;
            f.setVelocityX(0);
        } else {
            f.hitStunTimer = 22;
            f.setTint(0xffffff);
        }
    }

    execute(f: Fighter) {
        f.hitStunTimer--;

        if (this.type === 'electric') {
            const yellow = f.hitStunTimer % 4 < 2;
            f.setTint(yellow ? 0xffff00 : 0x00ffff);
        } else {
            if (Math.abs(f.body!.velocity.x) > 5) {
                f.setVelocityX(f.body!.velocity.x * 0.75);
            }
        }

        if (f.hitStunTimer <= 0) {
            f.isHit = false;
            f.clearTint();
            this.stateMachine.transition('idle');
        }
    }
}

class KnockdownState extends State {
    private timer = 0;
    enter(f: Fighter) {
        f.isHit = true;
        this.timer = 50; // hard knockdown 50 frames
        f.setAngle(90);
    }
    execute(f: Fighter) {
        this.timer--;
        if (this.timer <= 0) {
            f.setAngle(0);
            this.stateMachine.transition('wakeup');
        }
    }
}

class WakeupState extends State {
    private timer = 0;
    enter(f: Fighter) {
        this.timer = 15;
        f.currentHurtbox.invincible = true;
        f.setAlpha(0.5); // visual feedback of invincibility
    }
    execute(f: Fighter) {
        this.timer--;
        if (this.timer <= 0) {
            f.currentHurtbox.invincible = false;
            f.setAlpha(1);
            f.isHit = false;
            this.stateMachine.transition('idle');
        }
    }
}

class DizzyState extends State {
    private timer = 0;
    enter(f: Fighter) {
        this.timer = 120;
        f.isHit = true; // treated as hit so they can't act
    }
    execute(f: Fighter) {
        this.timer--;
        // Could listen to buttons to reduce timer here
        if (this.timer <= 0) {
            f.isHit = false;
            f.stunMeter = 0;
            this.stateMachine.transition('idle');
        }
    }
}

class KOState extends State {
    enter(f: Fighter) {
        f.setVelocityX(0);
        f.isHit = true;
        f.setTint(0xff0000);
        f.setAngle(90);
    }
}

class WinState extends State {
    enter(f: Fighter) {
        f.setVelocityX(0);
        f.setTint(0x00ff88);
        f.setVelocityY(-400);
    }

    execute(f: Fighter) {
        if (f.body?.touching.down && f.body.velocity.y >= 0) {
            f.setVelocityY(-300);
        }
    }
}
