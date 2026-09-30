import Phaser from 'phaser';
import { StateMachine, State } from '../core/StateMachine';
import { InputManager } from '../core/InputManager';

export class Fighter extends Phaser.Physics.Arcade.Sprite {
    public stateMachine: StateMachine;
    public inputManager?: InputManager;
    public speed: number = 300;
    public jumpForce: number = 700;
    
    // Combate
    public hp: number = 1000;
    public hitbox: Phaser.Physics.Arcade.Sprite;
    public isHit: boolean = false;
    public hitStunTimer: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, inputManager?: InputManager) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.inputManager = inputManager;

        // Hitbox de ataque (invisível fisicamente, sem gravidade)
        this.hitbox = scene.physics.add.sprite(x, y, '');
        this.hitbox.setSize(60, 40);
        this.hitbox.setVisible(false);
        const hitboxBody = this.hitbox.body as Phaser.Physics.Arcade.Body;
        hitboxBody.allowGravity = false;
        hitboxBody.enable = false; // Desabilitado por padrão

        this.stateMachine = new StateMachine('idle', {
            idle: new IdleState(),
            walk: new WalkState(),
            jump: new JumpState(),
            crouch: new CrouchState(),
            attack: new AttackState(),
            hit: new HitState()
        }, [this]);
    }

    update() {
        this.stateMachine.step();

        // Atualizar posição do hitbox
        const directionMultiplier = this.flipX ? -1 : 1;
        this.hitbox.setPosition(this.x + (40 * directionMultiplier), this.y - 10);
    }

    takeDamage(amount: number, pushbackForce: number, fromX: number) {
        if (this.isHit) return; // Invulnerabilidade de hit stun
        
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;

        // Pushback direction
        const dir = this.x < fromX ? -1 : 1;
        this.setVelocityX(pushbackForce * dir);
        
        this.stateMachine.transition('hit');
    }
}

class IdleState extends State {
    execute(fighter: Fighter) {
        fighter.setVelocityX(0);

        if (!fighter.inputManager) return; // CPU placeholder

        if (fighter.inputManager.isUpJustPressed && fighter.body?.touching.down) {
            this.stateMachine.transition('jump');
            return;
        }
        if (fighter.inputManager.isDownDown) {
            this.stateMachine.transition('crouch');
            return;
        }
        if (fighter.inputManager.isLeftDown || fighter.inputManager.isRightDown) {
            this.stateMachine.transition('walk');
            return;
        }
        if (fighter.inputManager.isLPJustPressed) {
            this.stateMachine.transition('attack');
            return;
        }
    }
}

class WalkState extends State {
    execute(fighter: Fighter) {
        if (!fighter.inputManager) return;

        if (fighter.inputManager.isUpJustPressed && fighter.body?.touching.down) {
            this.stateMachine.transition('jump');
            return;
        }
        
        if (fighter.inputManager.isLeftDown) {
            fighter.setVelocityX(-fighter.speed);
            fighter.setFlipX(true);
        } else if (fighter.inputManager.isRightDown) {
            fighter.setVelocityX(fighter.speed);
            fighter.setFlipX(false);
        } else {
            this.stateMachine.transition('idle');
            return;
        }
        
        if (fighter.inputManager.isLPJustPressed) {
            this.stateMachine.transition('attack');
            return;
        }
    }
}

class JumpState extends State {
    enter(fighter: Fighter) {
        fighter.setVelocityY(-fighter.jumpForce);
    }
    
    execute(fighter: Fighter) {
        if (!fighter.inputManager) return;

        // Air control básico
        if (fighter.inputManager.isLeftDown) {
            fighter.setVelocityX(-fighter.speed);
            fighter.setFlipX(true);
        } else if (fighter.inputManager.isRightDown) {
            fighter.setVelocityX(fighter.speed);
            fighter.setFlipX(false);
        }

        // Se aterrissar (y.velocity pode flutuar, checamos se está tocando o chão)
        if (fighter.body?.touching.down && fighter.body.velocity.y === 0) {
            this.stateMachine.transition('idle');
        }
    }
}

class CrouchState extends State {
    enter(fighter: Fighter) {
        fighter.setVelocityX(0);
        fighter.setTint(0x55ff55); // Feedback visual
    }

    execute(fighter: Fighter) {
        if (fighter.inputManager && !fighter.inputManager.isDownDown) {
            fighter.clearTint();
            this.stateMachine.transition('idle');
        }
    }
}

class AttackState extends State {
    private duration: number = 0;
    
    enter(fighter: Fighter) {
        fighter.setVelocityX(0);
        this.duration = 20; // Duração total do golpe em frames
        fighter.setTint(0x0000ff); // Feedback visual azul para ataque

        // Ativa a hitbox nos frames iniciais (startup -> active)
        const hitboxBody = fighter.hitbox.body as Phaser.Physics.Arcade.Body;
        hitboxBody.enable = true;
    }

    execute(fighter: Fighter) {
        this.duration--;

        // Desativa a hitbox nos frames finais (recovery)
        if (this.duration < 10) {
            const hitboxBody = fighter.hitbox.body as Phaser.Physics.Arcade.Body;
            hitboxBody.enable = false;
        }

        if (this.duration <= 0) {
            fighter.clearTint();
            this.stateMachine.transition('idle');
        }
    }
}

class HitState extends State {
    enter(fighter: Fighter) {
        fighter.isHit = true;
        fighter.hitStunTimer = 20; // 20 frames de hit stun
        fighter.setTint(0xffffff); // Pisca branco
    }

    execute(fighter: Fighter) {
        fighter.hitStunTimer--;
        
        // Desacelerar o pushback gradualmente (Fricção simplificada)
        if (Math.abs(fighter.body!.velocity.x) > 0) {
            fighter.setVelocityX(fighter.body!.velocity.x * 0.8);
        }

        if (fighter.hitStunTimer <= 0) {
            fighter.isHit = false;
            fighter.clearTint();
            this.stateMachine.transition('idle');
        }
    }
}
