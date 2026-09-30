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
            special: new SpecialState(),
            hit: new HitState()
        }, [this]);
    }

    update() {
        this.stateMachine.step();

        // Atualizar posição do hitbox
        const directionMultiplier = this.flipX ? -1 : 1;
        this.hitbox.setPosition(this.x + (40 * directionMultiplier), this.y - 10);
    }

    takeDamage(amount: number, pushbackForce: number, fromX: number, type: 'normal' | 'electric' = 'normal') {
        if (this.isHit) return; // Invulnerabilidade de hit stun
        
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;

        // Pushback direction
        const dir = this.x < fromX ? -1 : 1;
        this.setVelocityX(pushbackForce * dir);
        
        this.stateMachine.transition('hit', type);
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
        if (fighter.inputManager.isHPJustPressed) {
            this.stateMachine.transition('special');
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
        if (fighter.inputManager.isHPJustPressed) {
            this.stateMachine.transition('special');
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
    private type: 'normal' | 'electric' = 'normal';
    private originalX: number = 0;

    enter(fighter: Fighter, type: 'normal' | 'electric' = 'normal') {
        fighter.isHit = true;
        this.type = type;
        this.originalX = fighter.x;

        if (this.type === 'electric') {
            fighter.hitStunTimer = 40; // Choque dura mais (40 frames)
            fighter.setVelocityX(0); // Choque prende no lugar
        } else {
            fighter.hitStunTimer = 20; // Hit normal 20 frames
            fighter.setTint(0xffffff); // Pisca branco
        }
    }

    execute(fighter: Fighter) {
        fighter.hitStunTimer--;
        
        if (this.type === 'electric') {
            // Efeito visual de Eletrocussão (Strobe amarelo e azul, tremor)
            const isYellow = fighter.hitStunTimer % 4 < 2;
            fighter.setTint(isYellow ? 0xffff00 : 0x00ffff);
            
            // Tremor
            const shake = (Math.random() - 0.5) * 6;
            fighter.setX(this.originalX + shake);
        } else {
            // Desacelerar o pushback gradualmente
            if (Math.abs(fighter.body!.velocity.x) > 0) {
                fighter.setVelocityX(fighter.body!.velocity.x * 0.8);
            }
        }

        if (fighter.hitStunTimer <= 0) {
            fighter.isHit = false;
            fighter.clearTint();
            fighter.setX(this.originalX); // Alinhar após tremor
            this.stateMachine.transition('idle');
        }
    }
}

class SpecialState extends State {
    private duration: number = 0;
    
    enter(fighter: Fighter) {
        fighter.setVelocityX(0);
        this.duration = 40; // Especial demora mais pra castar
        fighter.setTint(0xff00ff); // Magenta para identificar especial
    }

    execute(fighter: Fighter) {
        this.duration--;

        // No frame 20, atira o projétil
        if (this.duration === 20) {
            fighter.emit('fire_special', fighter);
        }

        if (this.duration <= 0) {
            fighter.clearTint();
            this.stateMachine.transition('idle');
        }
    }
}
