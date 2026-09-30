import { Fighter } from '../entities/Fighter';

export class CPUController {
    private me: Fighter;
    private target: Fighter;
    
    public left: boolean = false;
    public right: boolean = false;
    public up: boolean = false;
    public down: boolean = false;
    
    private attackJustPressed: boolean = false;
    private specialJustPressed: boolean = false;
    private throwJustPressed: boolean = false;
    
    private reactionDelay: number = 15; // frames (normal difficulty)
    private timer: number = 0;
    
    // Memory
    private actionCooldown: number = 0;

    constructor(me: Fighter, target: Fighter) {
        this.me = me;
        this.target = target;
    }

    public update() {
        this.timer++;
        
        // Reset just pressed
        this.attackJustPressed = false;
        this.specialJustPressed = false;
        this.throwJustPressed = false;
        
        if (this.actionCooldown > 0) {
            this.actionCooldown--;
            return;
        }

        // Only decide every N frames to simulate reaction time
        if (this.timer % this.reactionDelay !== 0) return;

        // Base Decision Tree
        const distanceX = Math.abs(this.me.x - this.target.x);
        const distanceY = Math.abs(this.me.y - this.target.y);
        const targetIsAttacking = this.target.stateMachine.currentState.name === 'attack';
        const isFacingTarget = this.me.flipX ? this.me.x > this.target.x : this.me.x < this.target.x;
        
        // 1. Defesa (Block)
        if (targetIsAttacking && distanceX < 200 && Math.random() < 0.5) { // 50% block
            this.moveAway();
            this.actionCooldown = 10;
            return;
        }

        // 2. Throw (Agarrão)
        if (distanceX < 60 && distanceY < 50 && Math.random() < 0.4) {
            this.throwJustPressed = true;
            this.actionCooldown = 30;
            return;
        }

        // 3. Attack (Ataque Básico)
        if (distanceX > 60 && distanceX < 120 && Math.random() < 0.6) {
            this.attackJustPressed = true;
            this.actionCooldown = 20;
            return;
        }

        // 4. Special (Especial) - Se HP < 30% ou aleatório
        if (distanceX > 100 && distanceX < 300) {
            const hpRatio = this.me.hp / this.me.maxHp;
            if ((hpRatio < 0.3 && Math.random() < 0.6) || Math.random() < 0.1) {
                this.specialJustPressed = true;
                this.actionCooldown = 40;
                return;
            }
        }

        // 5. Jump (Pular)
        if (Math.random() < 0.05) { // Aleatório a cada 180f aprox
            this.up = true;
            if (distanceX > 150) this.moveTowards();
            this.actionCooldown = 20;
            return;
        } else {
            this.up = false;
        }

        // 6. Movement (Avançar / Recuar)
        if (distanceX > 120) {
            this.moveTowards();
        } else {
            this.stopMoving();
        }
    }

    private moveTowards() {
        if (this.me.x < this.target.x) {
            this.right = true;
            this.left = false;
        } else {
            this.left = true;
            this.right = false;
        }
    }

    private moveAway() {
        if (this.me.x < this.target.x) {
            this.left = true;
            this.right = false;
        } else {
            this.right = true;
            this.left = false;
        }
    }

    private stopMoving() {
        this.left = false;
        this.right = false;
    }

    // Compatibilidade com InputManager
    public isLeftPressed(): boolean { return this.left; }
    public isRightPressed(): boolean { return this.right; }
    public isUpPressed(): boolean { return this.up; }
    public isDownPressed(): boolean { return this.down; }
    public isAttackJustPressed(): boolean { return this.attackJustPressed; }
    public isSpecialJustPressed(): boolean { return this.specialJustPressed; }
    public isThrowJustPressed(): boolean { return this.throwJustPressed; }
}
