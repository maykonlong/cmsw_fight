import Phaser from 'phaser';
import { StateMachine, State } from '../core/StateMachine';
import { InputManager } from '../core/InputManager';

export class Fighter extends Phaser.Physics.Arcade.Sprite {
    public stateMachine: StateMachine;
    public inputManager: InputManager;
    public speed: number = 300;
    public jumpForce: number = 700;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, inputManager: InputManager) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.inputManager = inputManager;

        this.stateMachine = new StateMachine('idle', {
            idle: new IdleState(),
            walk: new WalkState(),
            jump: new JumpState(),
            crouch: new CrouchState(),
            attack: new AttackState()
        }, [this]);
    }

    update() {
        this.stateMachine.step();
    }
}

class IdleState extends State {
    execute(fighter: Fighter) {
        fighter.setVelocityX(0);

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
        if (fighter.inputManager.isUpJustPressed && fighter.body?.touching.down) {
            this.stateMachine.transition('jump');
            return;
        }
        
        if (fighter.inputManager.isLeftDown) {
            fighter.setVelocityX(-fighter.speed);
        } else if (fighter.inputManager.isRightDown) {
            fighter.setVelocityX(fighter.speed);
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
        // Air control básico
        if (fighter.inputManager.isLeftDown) {
            fighter.setVelocityX(-fighter.speed);
        } else if (fighter.inputManager.isRightDown) {
            fighter.setVelocityX(fighter.speed);
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
        if (!fighter.inputManager.isDownDown) {
            fighter.clearTint();
            this.stateMachine.transition('idle');
        }
    }
}

class AttackState extends State {
    private duration: number = 0;
    
    enter(fighter: Fighter) {
        fighter.setVelocityX(0);
        this.duration = 15; // Duração do golpe em frames
        fighter.setTint(0x0000ff); // Feedback visual azul para ataque
    }

    execute(fighter: Fighter) {
        this.duration--;
        if (this.duration <= 0) {
            fighter.clearTint();
            this.stateMachine.transition('idle');
        }
    }
}
