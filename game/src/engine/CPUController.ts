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
        this.reactionDelay = difficulty === 0 ? 34 : difficulty === 2 ? 14 : 24;
        this.attackCooldown = difficulty === 0 ? 100 : difficulty === 2 ? 45 : 70;
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
    public isLeftDoubleTapped: boolean = false;
    public isRightDoubleTapped: boolean = false;
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
        const targetIsJumping = targetState === 'jump' || targetState.startsWith('air_');
        const targetIsCastingSpecial = targetState === 'special' || targetState === 'super_special';
        const targetIsAttacking = targetState.startsWith('stand_') || targetState.startsWith('crouch_') || targetIsJumping || targetIsCastingSpecial;

        // 1. REAÇÃO ANTI-AÉREA (Inspirado em RL Footsies Models)
        // Se o oponente pulou em direção à CPU, executa chute anti-aéreo alto imediato
        if (targetIsJumping && distanceX < 190 && distanceY > 40) {
            this.stopMoving();
            this._hkJust = true; // Anti-Air Heavy Kick
            this.actionCooldown = 32;
            return;
        }

        // 2. RESPOSTA A PROJÉTEIS (Esquiva Roll AB ou Pulo Punição)
        // Se o jogador soltou magias/especial, a CPU rola por baixo com invulnerabilidade ou pula por cima
        if (targetIsCastingSpecial && distanceX > 130) {
            if (Math.random() < 0.6) {
                // AB Roll (Soco Leve + Chute Leve juntos)
                this._lpJust = true;
                this._lkJust = true;
                this.actionCooldown = 26;
            } else {
                // Pulo para a frente para punir a recuperação da magia
                this._upJust = true;
                this._up = true;
                this.moveTowards();
                this.actionCooldown = 28;
            }
            return;
        }

        // 3. EXECUÇÃO DE SUPER ESPECIAL (Desperation Move Punish)
        // Se a CPU tiver 1+ barra de poder e o jogador estiver perto ou em recuperação de golpe
        const hasSuper = (this.me.superStocks > 0 || this.me.superGauge >= 1000);
        if (hasSuper && distanceX < 230 && (targetIsAttacking || Math.random() < 0.35)) {
            this._specialJust = true;
            this.actionCooldown = 90;
            return;
        }

        // 4. DEFESA INTELIGENTE (Block Guard)
        if (targetIsAttacking && distanceX < 200 && Math.random() < 0.65) {
            this.moveAway();
            this.actionCooldown = 12;
            return;
        }

        // 5. AGARRÃO EM CURTA DISTÂNCIA (Throw Mixup)
        if (distanceX < 95 && distanceY < 50 && Math.random() < 0.45) {
            this._throwJust = true;
            this.actionCooldown = 50;
            return;
        }

        // 6. ATAQUE NORMAL & COMBOS (Footsies Mid/Close Range)
        if (distanceX >= 50 && distanceX < 135) {
            const r = Math.random();
            if (r < 0.25) this._lpJust = true;
            else if (r < 0.45) this._mkJust = true;
            else if (r < 0.65) this._hpJust = true;
            else this._hkJust = true;
            this.actionCooldown = this.attackCooldown;
            return;
        }

        // 7. ESPECIAL REGULAR (Pressão de Projétil à Distância)
        if (distanceX > 210 && Math.random() < 0.22 && this.me.specialCooldown <= 0) {
            this._specialJust = true;
            this.actionCooldown = 85;
            return;
        }

        // 8. PULO / APROXIMAÇÃO AÉREA
        if (Math.random() < 0.05) {
            this._upJust = true;
            this._up = true;
            if (distanceX > 150) this.moveTowards();
            this.actionCooldown = 25;
            return;
        } else {
            this._up = false;
        }

        // 9. MOVIMENTAÇÃO DE ARENA (Footsies Weaving)
        if (distanceX > 135) {
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
