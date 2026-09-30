import Phaser from 'phaser';
import { StateMachine, State } from '../core/StateMachine';
import { InputManager } from '../core/InputManager';

// ─────────────────────────────────────────────────────────────────
// FIGHTER ENTITY
// ─────────────────────────────────────────────────────────────────
export class Fighter extends Phaser.Physics.Arcade.Sprite {
    public stateMachine: StateMachine;
    public inputManager?: InputManager;
    public speed: number = 250;
    public jumpForce: number = 750;

    // Combat
    public hp: number = 1000;
    public maxHp: number = 1000;
    public hitbox: Phaser.Physics.Arcade.Sprite;
    public isHit: boolean = false;
    public isBlocking: boolean = false;
    public hitStunTimer: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, inputManager?: InputManager) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.inputManager = inputManager;

        // Hitbox de ataque invisível
        this.hitbox = scene.physics.add.sprite(x, y, '');
        this.hitbox.setVisible(false);
        const hitboxBody = this.hitbox.body as Phaser.Physics.Arcade.Body;
        hitboxBody.allowGravity = false;
        hitboxBody.enable = false;

        this.stateMachine = new StateMachine('idle', {
            idle:        new IdleState(),
            walk:        new WalkState(),
            jump:        new JumpState(),
            jumpAttack:  new JumpAttackState(),
            crouch:      new CrouchState(),
            crouchAtk:   new CrouchAttackState(),
            punch:       new PunchState(),
            kick:        new KickState(),
            special:     new SpecialState(),
            block:       new BlockState(),
            hit:         new HitState(),
            ko:          new KOState(),
            win:         new WinState(),
        }, [this]);
    }

    update() {
        this.stateMachine.step();
        const dir = this.flipX ? -1 : 1;
        this.hitbox.setPosition(this.x + 55 * dir, this.y - 10);
    }

    takeDamage(amount: number, pushbackForce: number, fromX: number, type: 'normal' | 'electric' = 'normal') {
        if (this.isHit || this.isBlocking) return;
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        const dir = this.x < fromX ? -1 : 1;
        this.setVelocityX(pushbackForce * dir);
        this.stateMachine.transition('hit', type);
    }
}

// ─────────────────────────────────────────────────────────────────
// HELPER: enable/disable hitbox
// ─────────────────────────────────────────────────────────────────
function enableHitbox(fighter: Fighter, w = 80, h = 60) {
    const body = fighter.hitbox.body as Phaser.Physics.Arcade.Body;
    fighter.hitbox.setSize(w, h);
    body.enable = true;
}
function disableHitbox(fighter: Fighter) {
    const body = fighter.hitbox.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
}

// ─────────────────────────────────────────────────────────────────
// IDLE
// ─────────────────────────────────────────────────────────────────
class IdleState extends State {
    execute(f: Fighter) {
        f.setVelocityX(0);
        if (!f.inputManager) return;
        const inp = f.inputManager;

        if (inp.isUpJustPressed && f.body?.touching.down) {
            this.stateMachine.transition('jump'); return;
        }
        if (inp.isDownDown) {
            this.stateMachine.transition('crouch'); return;
        }
        if (inp.isLeftDown || inp.isRightDown) {
            this.stateMachine.transition('walk'); return;
        }
        // Defesa: segurar a direção de trás
        const isFacingLeft = f.flipX;
        const holdBack = isFacingLeft ? inp.isRightDown : inp.isLeftDown;
        if (holdBack) {
            this.stateMachine.transition('block'); return;
        }
        if (inp.isLPJustPressed) {
            this.stateMachine.transition('punch'); return;
        }
        if (inp.isHPJustPressed) {
            this.stateMachine.transition('kick'); return;
        }
        if (inp.isHKJustPressed) {
            this.stateMachine.transition('special'); return;
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// WALK
// ─────────────────────────────────────────────────────────────────
class WalkState extends State {
    execute(f: Fighter) {
        if (!f.inputManager) return;
        const inp = f.inputManager;

        if (inp.isUpJustPressed && f.body?.touching.down) {
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

        if (inp.isLPJustPressed) { this.stateMachine.transition('punch'); return; }
        if (inp.isHPJustPressed) { this.stateMachine.transition('kick'); return; }
        if (inp.isHKJustPressed) { this.stateMachine.transition('special'); return; }
    }
}

// ─────────────────────────────────────────────────────────────────
// JUMP  (vertical + diagonal)
// ─────────────────────────────────────────────────────────────────
class JumpState extends State {
    enter(f: Fighter) {
        f.setVelocityY(-f.jumpForce);
        if (!f.inputManager) return;
        // Diagonal momentum
        if (f.inputManager.isLeftDown)  f.setVelocityX(-f.speed * 0.85);
        else if (f.inputManager.isRightDown) f.setVelocityX(f.speed * 0.85);
    }

    execute(f: Fighter) {
        if (!f.inputManager) return;
        const inp = f.inputManager;

        // Slight air control
        if (inp.isLeftDown) {
            f.setVelocityX(Math.max(f.body!.velocity.x - 15, -f.speed));
            f.setFlipX(true);
        } else if (inp.isRightDown) {
            f.setVelocityX(Math.min(f.body!.velocity.x + 15, f.speed));
            f.setFlipX(false);
        }

        // Aerial attack
        if (inp.isLPJustPressed || inp.isHPJustPressed) {
            this.stateMachine.transition('jumpAttack'); return;
        }

        // Land
        if (f.body?.touching.down && f.body.velocity.y >= 0) {
            this.stateMachine.transition('idle');
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// JUMP ATTACK
// ─────────────────────────────────────────────────────────────────
class JumpAttackState extends State {
    private duration = 0;

    enter(f: Fighter) {
        this.duration = 25;
        enableHitbox(f, 70, 55);
        f.setTint(0xff8800);
    }

    execute(f: Fighter) {
        this.duration--;
        if (this.duration < 12) disableHitbox(f);

        // Allow landing
        if (f.body?.touching.down && f.body.velocity.y >= 0) {
            f.clearTint();
            disableHitbox(f);
            this.stateMachine.transition('idle');
            return;
        }
        if (this.duration <= 0) {
            f.clearTint();
            disableHitbox(f);
            this.stateMachine.transition('jump');
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
    }

    exit(f: Fighter) {
        f.setScale(f.scaleX, f.scaleY / 0.75);
    }

    execute(f: Fighter) {
        if (!f.inputManager) return;
        const inp = f.inputManager;
        if (!inp.isDownDown) {
            this.stateMachine.transition('idle'); return;
        }
        if (inp.isLPJustPressed || inp.isHPJustPressed) {
            this.stateMachine.transition('crouchAtk');
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// CROUCH ATTACK (Rasteira)
// ─────────────────────────────────────────────────────────────────
class CrouchAttackState extends State {
    private duration = 0;

    enter(f: Fighter) {
        this.duration = 22;
        enableHitbox(f, 100, 35);
        f.setTint(0x00ffff);
    }

    execute(f: Fighter) {
        this.duration--;
        if (this.duration < 10) disableHitbox(f);
        if (this.duration <= 0) {
            f.clearTint();
            disableHitbox(f);
            this.stateMachine.transition('idle');
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// PUNCH
// ─────────────────────────────────────────────────────────────────
class PunchState extends State {
    private duration = 0;

    enter(f: Fighter) {
        this.duration = 18;
        enableHitbox(f, 75, 55);
        f.setTint(0x4444ff);
    }

    execute(f: Fighter) {
        this.duration--;
        if (this.duration < 8) disableHitbox(f);
        if (this.duration <= 0) {
            f.clearTint();
            disableHitbox(f);
            this.stateMachine.transition('idle');
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// KICK
// ─────────────────────────────────────────────────────────────────
class KickState extends State {
    private duration = 0;

    enter(f: Fighter) {
        this.duration = 24;
        enableHitbox(f, 90, 65);
        f.setTint(0xff4400);
    }

    execute(f: Fighter) {
        this.duration--;
        if (this.duration < 10) disableHitbox(f);
        if (this.duration <= 0) {
            f.clearTint();
            disableHitbox(f);
            this.stateMachine.transition('idle');
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// BLOCK (Defesa)
// ─────────────────────────────────────────────────────────────────
class BlockState extends State {
    enter(f: Fighter) {
        f.setVelocityX(0);
        f.isBlocking = true;
        f.setTint(0x888888);
    }

    exit(f: Fighter) {
        f.isBlocking = false;
        f.clearTint();
    }

    execute(f: Fighter) {
        if (!f.inputManager) return;
        const inp = f.inputManager;
        const isFacingLeft = f.flipX;
        const holdBack = isFacingLeft ? inp.isRightDown : inp.isLeftDown;
        if (!holdBack) {
            this.stateMachine.transition('idle');
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// SPECIAL
// ─────────────────────────────────────────────────────────────────
class SpecialState extends State {
    private duration = 0;
    private fired = false;

    enter(f: Fighter) {
        f.setVelocityX(0);
        this.duration = 45;
        this.fired = false;
        f.setTint(0xff00ff);
    }

    execute(f: Fighter) {
        this.duration--;

        // Dispara o projétil no meio da animação
        if (!this.fired && this.duration === 25) {
            this.fired = true;
            f.emit('fire_special', f);
        }

        if (this.duration <= 0) {
            f.clearTint();
            this.stateMachine.transition('idle');
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// HIT (Dano recebido)
// ─────────────────────────────────────────────────────────────────
class HitState extends State {
    private type: 'normal' | 'electric' = 'normal';
    private snapX = 0;

    enter(f: Fighter, type: 'normal' | 'electric' = 'normal') {
        f.isHit = true;
        this.type = type;
        this.snapX = f.x;

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
            f.setX(this.snapX + (Math.random() - 0.5) * 8);
        } else {
            if (Math.abs(f.body!.velocity.x) > 5) {
                f.setVelocityX(f.body!.velocity.x * 0.75);
            }
        }

        if (f.hitStunTimer <= 0) {
            f.isHit = false;
            f.clearTint();
            if (this.type === 'electric') f.setX(this.snapX);
            this.stateMachine.transition('idle');
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// KO
// ─────────────────────────────────────────────────────────────────
class KOState extends State {
    enter(f: Fighter) {
        f.setVelocityX(0);
        f.isHit = true;
        f.setTint(0xff0000);
        f.setAngle(90);
    }
}

// ─────────────────────────────────────────────────────────────────
// WIN (Animação de Vitória)
// ─────────────────────────────────────────────────────────────────
class WinState extends State {
    enter(f: Fighter) {
        f.setVelocityX(0);
        f.setTint(0x00ff88);
        // Pulo de comemoração
        f.setVelocityY(-400);
    }

    execute(f: Fighter) {
        // Fica pulando de comemoração
        if (f.body?.touching.down && f.body.velocity.y >= 0) {
            f.setVelocityY(-300);
        }
    }
}
