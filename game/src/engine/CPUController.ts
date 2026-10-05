import { Fighter } from '../entities/Fighter';
import type { IInputProvider } from '../interfaces/IInputProvider';
import { InputBuffer } from '../core/InputBuffer';

export class CPUController implements IInputProvider {
    private me: Fighter;
    private target: Fighter;

    private _left = false;
    private _right = false;
    private _up = false;
    private _down = false;
    private _upJust = false;
    private _lpJust = false;
    private _mpJust = false;
    private _hpJust = false;
    private _lkJust = false;
    private _mkJust = false;
    private _hkJust = false;
    private _specialJust = false;
    private _throwJust = false;

    private reactionDelay = 20;
    private attackCooldown = 80;
    private timer = 0;
    private actionCooldown = 0;
    public buffer = new InputBuffer();
    public currentFrame = 0;

    constructor(me: Fighter, target: Fighter) {
        this.me = me;
        this.target = target;
        const difficulty = Number(localStorage.getItem('cmsw_diff') ?? 1);
        this.reactionDelay = difficulty === 0 ? 36 : difficulty === 2 ? 16 : 28;
        this.attackCooldown = difficulty === 0 ? 112 : difficulty === 2 ? 50 : 80;
    }

    // ═══ IInputProvider Getters ═══
    get isLeftDown(): boolean { return this._left; }
    get isRightDown(): boolean { return this._right; }
    get isUpDown(): boolean { return this._up; }
    get isDownDown(): boolean { return this._down; }
    get isUpJustPressed(): boolean { return this._upJust; }
    get isLPJustPressed(): boolean { return this._lpJust; }
    get isMPJustPressed(): boolean { return this._mpJust; }
    get isHPJustPressed(): boolean { return this._hpJust; }
    get isLKJustPressed(): boolean { return this._lkJust; }
    get isMKJustPressed(): boolean { return this._mkJust; }
    get isHKJustPressed(): boolean { return this._hkJust; }
    get isSpecialJustPressed(): boolean { return this._specialJust; }
    get isThrowJustPressed(): boolean { return this._throwJust; }

    public update(): void {
        this.timer++;
        this.currentFrame++;

        // Reset just-pressed flags every frame
        this._lpJust = false;
        this._mpJust = false;
        this._hpJust = false;
        this._lkJust = false;
        this._mkJust = false;
        this._hkJust = false;
        this._specialJust = false;
        this._throwJust = false;
        this._upJust = false;

        if (this.actionCooldown > 0) {
            this.actionCooldown--;
            return;
        }

        if (this.timer % this.reactionDelay !== 0) return;

        const distanceX = Math.abs(this.me.x - this.target.x);
        const distanceY = Math.abs(this.me.y - this.target.y);
        const targetState = this.target.stateMachine?.state ?? '';
        const targetIsAttacking = targetState.startsWith('stand_') || targetState.startsWith('crouch_') || targetState.startsWith('air_') || targetState === 'special';

        // 1. Defesa (Block)
        if (targetIsAttacking && distanceX < 200 && Math.random() < 0.5) {
            this.moveAway();
            this.actionCooldown = 10;
            return;
        }

        // 2. Agarrão (Throw)
        // A arena separa lutadores no chão em pelo menos 75 px.
        if (distanceX < 95 && distanceY < 50 && Math.random() < 0.4) {
            this._throwJust = true;
            this.actionCooldown = 55;
            return;
        }

        // 3. Ataque normal (perto)
        if (distanceX >= 50 && distanceX < 130) {
            if (Math.random() < (this.reactionDelay === 16 ? 0.12 : 0.28)) {
                this.stopMoving();
                this.actionCooldown = 22;
                return;
            }
            const r = Math.random();
            if (r < 0.25) this._lpJust = true;
            else if (r < 0.45) this._mkJust = true;
            else if (r < 0.65) this._hpJust = true;
            else this._hkJust = true;
            this.actionCooldown = this.attackCooldown;
            return;
        }

        // 4. Especial (Longe / Projétil)
        if (distanceX > 200 && Math.random() < 0.15) {
            this._specialJust = true;
            this.actionCooldown = 90;
            return;
        }

        // 5. Pulo
        if (Math.random() < 0.04) {
            this._upJust = true;
            this._up = true;
            if (distanceX > 150) this.moveTowards();
            this.actionCooldown = 25;
            return;
        } else {
            this._up = false;
        }

        // 6. Movimento
        if (distanceX > 130) {
            this.moveTowards();
        } else {
            this.stopMoving();
        }
    }

    private moveTowards() {
        if (this.me.x < this.target.x) {
            this._right = true;
            this._left = false;
        } else {
            this._left = true;
            this._right = false;
        }
    }

    private moveAway() {
        if (this.me.x < this.target.x) {
            this._left = true;
            this._right = false;
        } else {
            this._right = true;
            this._left = false;
        }
    }

    private stopMoving() {
        this._left = false;
        this._right = false;
    }
}
