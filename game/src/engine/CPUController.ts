import { Fighter } from '../entities/Fighter';
import type { IInputProvider } from '../interfaces/IInputProvider';
import { InputBuffer } from '../core/InputBuffer';

// Perfil por dificuldade: cada número vira um "jeito de jogar" diferente,
// não apenas números de velocidade — fácil hesita e erra, difícil pune tudo.
interface CPUProfile {
    reactionDelay: number;   // frames até reagir a uma ameaça
    thinkInterval: number;   // frames entre decisões
    blockChance: number;     // probabilidade de defender ameaças
    antiAirChance: number;
    comboChance: number;     // converte acerto em combo encadeado
    reversalChance: number;  // 623P invencível ao levantar
    quickMaxChance: number;  // Quick Max no hit confirm
    maxModeChance: number;   // Max Mode cru no neutro
    techRollChance: number;  // tech roll ao cair
    superChance: number;
    projectileChance: number;
    mistakeChance: number;   // golpes errados/whiff de propósito
    mashRate: number;        // frames entre mash quando dizzy
    aggression: number;      // 0..1 — aproximação e pressão
}

const PROFILES: CPUProfile[] = [
    { // FÁCIL — joga "de boa": reage tarde, erra, quase não converso combos
        reactionDelay: 30, thinkInterval: 24, blockChance: 0.3, antiAirChance: 0.45,
        comboChance: 0.12, reversalChance: 0, quickMaxChance: 0, maxModeChance: 0,
        techRollChance: 0.15, superChance: 0.25, projectileChance: 0.15,
        mistakeChance: 0.28, mashRate: 9, aggression: 0.5
    },
    { // NORMAL — jogador mediano: defende, anti-aéreo, combo às vezes
        reactionDelay: 19, thinkInterval: 17, blockChance: 0.55, antiAirChance: 0.7,
        comboChance: 0.45, reversalChance: 0.18, quickMaxChance: 0.15, maxModeChance: 0.25,
        techRollChance: 0.4, superChance: 0.5, projectileChance: 0.22,
        mistakeChance: 0.14, mashRate: 5, aggression: 0.7
    },
    { // DIFÍCIL — parece jogador de ranking: lê rápido, pune tudo, usa Max/Quick Max/reversal
        reactionDelay: 11, thinkInterval: 12, blockChance: 0.75, antiAirChance: 0.88,
        comboChance: 0.8, reversalChance: 0.45, quickMaxChance: 0.45, maxModeChance: 0.55,
        techRollChance: 0.7, superChance: 0.7, projectileChance: 0.25,
        mistakeChance: 0.05, mashRate: 3, aggression: 0.85
    }
];

type ThreatKind = 'attack' | 'jump' | 'projectile' | null;

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

    public buffer = new InputBuffer();
    public currentFrame = 0;

    private profile: CPUProfile;
    private timer = 0;
    private thinkTimer = 0;
    private actionCooldown = 0;

    // memória de jogador: ameaça vista e tempo de reação
    private threat: { kind: ThreatKind; seenAt: number } = { kind: null, seenAt: 0 };
    private jumpScript = 0;       // frames restantes segurando cima (hyper hop)
    private motion: string[] | null = null; // frames de movimento p/ 623P
    private pending: string[] = [];         // fila de botões de combo
    private mashTimer = 0;

    // flags emuladas de duplo toque
    public isLeftDoubleTapped = false;
    public isRightDoubleTapped = false;

    constructor(me: Fighter, target: Fighter) {
        this.me = me;
        this.target = target;
        const difficulty = Number(localStorage.getItem('COMBAT MASTERS_diff') ?? 1);
        this.profile = PROFILES[difficulty] ?? PROFILES[1];
    }

    // ═══ IInputProvider ═══
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

    private resetJustFlags() {
        this._lpJust = this._mpJust = this._hpJust = false;
        this._lkJust = this._mkJust = this._hkJust = false;
        this._specialJust = this._throwJust = this._upJust = false;
        this.isLeftDoubleTapped = this.isRightDoubleTapped = false;
    }

    private press(btn: string) {
        switch (btn) {
            case 'LP': this._lpJust = true; break;
            case 'MP': this._mpJust = true; break;
            case 'HP': this._hpJust = true; break;
            case 'LK': this._lkJust = true; break;
            case 'MK': this._mkJust = true; break;
            case 'HK': this._hkJust = true; break;
            case 'BC': this._mkJust = true; this._hpJust = true; break; // Max Mode
            case 'THROW': this._throwJust = true; break;
            case 'AB': this._lpJust = true; this._lkJust = true; break; // roll
            case 'CD': this._hpJust = true; this._hkJust = true; break; // blowback
        }
    }

    public update(): void {
        this.timer++;
        this.currentFrame++;
        this.resetJustFlags();

        // snapshot de input para o CommandRecognizer (motions de 623P etc.)
        const dir = this._down
            ? ((this._left && '1') || (this._right && '3') || '2')
            : (this._left ? '4' : this._right ? '6' : '5');
        const buttons: string[] = [];
        if (this._lpJust) buttons.push('LP');
        if (this._mpJust) buttons.push('MP');
        if (this._hpJust) buttons.push('HP');
        if (this._lkJust) buttons.push('LK');
        if (this._mkJust) buttons.push('MK');
        if (this._hkJust) buttons.push('HK');
        this.buffer.push({ direction: dir, buttons, frame: this.currentFrame });

        // Mash quando dizzy (todo jogador real martela botão)
        if (this.me.stateMachine.state === 'dizzy') {
            this.mashTimer++;
            if (this.mashTimer % this.profile.mashRate === 0) {
                this.press(['LP', 'LK', 'MP', 'LK'][this.timer % 4]);
            }
            return;
        }

        // Motion de 623P em andamento: empurra os frames de direção no buffer
        if (this.motion && this.motion.length) {
            const d = this.motion.shift()!;
            this.buffer.push({ direction: d, buttons: [], frame: this.currentFrame });
            if (this.motion.length === 0) {
                this.press('HP'); // terminou o movimento: soco forte (reversal)
                this.motion = null;
                this.actionCooldown = 40;
            }
            return;
        }

        // Combo pendente: um botão por vez, com respiração humana entre eles
        if (this.pending.length) {
            if (this.actionCooldown <= 0) {
                this.press(this.pending.shift()!);
                this.actionCooldown = 5;
            }
            return;
        }

        if (this.jumpScript > 0) {
            this.jumpScript--;
            if (this.jumpScript === 0) this._up = false; // solta cima: vira hop
            return;
        }

        if (this.actionCooldown > 0) { this.actionCooldown--; return; }

        this.thinkTimer++;
        if (this.thinkTimer < this.profile.thinkInterval) return;
        this.thinkTimer = 0;

        this.think();
    }

    private think() {
        const p = this.profile;
        const me = this.me, t = this.target;
        const dx = Math.abs(me.x - t.x);
        const ts = t.stateMachine?.state ?? '';
        const myState = me.stateMachine.state;

        // Só decide quando está em estado acionável (não "pensar" no meio de um golpe)
        const actionable = ['idle', 'walk', 'crouch', 'block_high', 'block_low', 'run', 'land'].includes(myState);
        if (!actionable) {
            // Realismo: caindo com tech roll se a queda veio de derrubada
            if (myState === 'knockdown' && Math.random() < p.techRollChance * 0.4 && (this._left || this._right || Math.random() < 0.5)) {
                this.moveTowards();
                this.actionCooldown = 10;
            }
            return;
        }

        const targetAttacking = ts.startsWith('stand_') || ts.startsWith('crouch_') || ts.startsWith('air_');
        const targetJumping = ts === 'jump' || ts.startsWith('air_') || ts === 'prejump';
        const targetCasting = ts === 'special' || ts === 'super_special' || ts.startsWith('air_special');
        const targetDowned = ts === 'knockdown' || ts === 'wakeup';
        const targetDizzy = ts === 'dizzy';
        const hasStock = me.superStocks > 0 || me.superGauge >= 1000;
        const lowHp = me.hp <= me.maxHp * 0.35;

        // ── MEMÓRIA DE AMEAÇA (tempo de reação humano) ──────────────
        let seen: ThreatKind = null;
        if (targetAttacking && dx < 240) seen = 'attack';
        else if (targetJumping && dx < 260) seen = 'jump';
        else if (targetCasting && dx > 120) seen = 'projectile';
        if (seen && this.threat.kind !== seen) this.threat = { kind: seen, seenAt: this.timer };
        if (!seen) this.threat.kind = null;
        const threatAge = this.threat.kind ? this.timer - this.threat.seenAt : 999;
        const reacted = threatAge >= p.reactionDelay;

        // ── 1. PUNIR DIZZY (todo jogador vai lá e faz o combo máximo) ──
        if (targetDizzy) {
            if (dx > 90) { this.moveTowards(); return; }
            const r = Math.random();
            this.press(r < 0.5 ? 'HP' : 'HK');
            if (Math.random() < p.comboChance) this.pending = ['MP', 'HP'];
            this.actionCooldown = Math.round(this.attackCooldown * 0.6);
            return;
        }

        // ── 2. PRESSÃO DE WAKEUP (oponente caindo/levantando) ────────
        if (targetDowned) {
            if (dx > 75) { this.moveTowards(); return; }
            // ponto a ponto: quando está levantando, mixup de rasteira/agarão/aguardar
            if (ts === 'wakeup' || ts === 'knockdown') {
                const r = Math.random();
                if (r < 0.35) { this._down = true; this._hkJust = true; this.actionCooldown = 40; return; } // rasteira meaty
                if (r < 0.5) { this.press('THROW'); this.actionCooldown = 40; return; }
                // senão espera com guarda
                this.moveAway();
                return;
            }
            return;
        }

        // ── 3. ANTI-AÉREO (com tempo de reação) ──────────────────────
        if (this.threat.kind === 'jump' && reacted && dx < 210 && Math.random() < p.antiAirChance) {
            this.stopMoving();
            if (Math.random() < p.reversalChance * 0.5) {
                this.startMotion623P(); // anti-aéreo de DP no difícil
            } else {
                this.press('HP');
                this.actionCooldown = 30;
            }
            this.threat.kind = null;
            return;
        }

        // ── 4. RESPOSTA A PROJÉTIL (roll / hyper hop / bloquear) ─────
        if (this.threat.kind === 'projectile' && reacted) {
            this.threat.kind = null;
            const r = Math.random();
            if (r < 0.35) { this.press('AB'); this.actionCooldown = 26; return; }      // roll por baixo
            if (r < 0.55) { this.hyperHop(); return; }                                  // hyper hop por cima
            this.moveAway();                                                            // bloquear
            this.actionCooldown = 20;
            return;
        }

        // ── 5. QUICK MAX NO HIT CONFIRM (jogador bom converte com BC) ──
        if (me.attackContact && me.isMaxMode === false && me.superStocks > 0 &&
            Math.random() < p.quickMaxChance && targetAttacking === false) {
            this.press('BC');
            this.actionCooldown = 4; // cancela na corrida imediatamente
            return;
        }

        // ── 6. CONVERSÃO DE COMBO (acertou → encadeia como jogador real) ──
        if (me.attackContact && (ts === 'hit' || ts === 'dizzy') && Math.random() < p.comboChance) {
            if (myState.startsWith('stand_') || myState.startsWith('crouch_')) {
                const cur = myState.split('_')[1];
                const isLight = cur.startsWith('L'), isMedium = cur.startsWith('M');
                if (isLight) { this.pending = [Math.random() < 0.5 ? 'MP' : 'MK']; this.actionCooldown = 3; return; }
                if (isMedium) { this.pending = ['HP']; this.actionCooldown = 3; return; }
                if (cur.startsWith('H') && me.superStocks > 0 && Math.random() < 0.5) {
                    this._specialJust = true; // cancela em especial/super
                    this.actionCooldown = 60;
                    return;
                }
            }
        }

        // ── 7. DEFESA COM TEMPO DE REAÇÃO ────────────────────────────
        if (this.threat.kind === 'attack' && reacted && dx < 220 && Math.random() < p.blockChance) {
            const low = t.stateMachine.state.startsWith('crouch_') || this._down;
            this.moveAway();
            this._down = low && Math.random() < 0.6;
            this.actionCooldown = 14;
            return;
        }

        // ── 8. GUARD CANCEL (bloqueando e tem stock: rola pra escapar) ──
        if (myState.startsWith('block') && me.superStocks > 0 && Math.random() < p.quickMaxChance * 0.6) {
            this.press('AB');
            this.actionCooldown = 20;
            return;
        }

        // ── 9. REVERSAL 623P AO LEVANTAR (dificuldade alta lê o wakeup) ──
        if (myState === 'wakeup' && dx < 160 && Math.random() < p.reversalChance) {
            this.startMotion623P();
            return;
        }

        // ── 10. SUPER / MAX2 (baixa vida + stock = desperation move) ────
        if (hasStock && dx < 300 && Math.random() < p.superChance * (lowHp ? 1.4 : 0.6)) {
            this._specialJust = true;
            this.actionCooldown = 80;
            return;
        }

        // ── 11. MAX MODE CRU NO NEUTRO (pressão com barra sobrando) ──────
        if (me.superStocks > 1 && !me.isMaxMode && Math.random() < p.maxModeChance * 0.35) {
            this.press('BC');
            this.actionCooldown = 8;
            return;
        }

        // ── 12. ERRO HUMANO (whiff de propósito no fácil) ────────────────
        if (Math.random() < p.mistakeChance * 0.35) {
            this.press(Math.random() < 0.5 ? 'HK' : 'HP');
            this.actionCooldown = this.attackCooldown;
            return;
        }

        // ── 13. GAMEPLAN POR DISTÂNCIA (com personalidade) ───────────────
        const aggro = p.aggression;
        if (dx > 320) {
            // longe: projétil, corrida com hyper hop ou caminhar
            if (Math.random() < p.projectileChance * 3 && me.specialCooldown <= 0) {
                this._specialJust = true;
                this.actionCooldown = 70;
                return;
            }
            if (Math.random() < aggro * 0.35) { this.hyperHop(); return; }
            this.moveTowards();
            return;
        }
        if (dx > 150) {
            // meia distância: footsies de verdade — anda, volta, pokes
            const r = Math.random();
            if (r < aggro * 0.5) { this.moveTowards(); return; }
            if (r < aggro * 0.5 + 0.15) { this.moveAway(); return; }
            if (r < aggro * 0.5 + 0.3) { this.press(Math.random() < 0.5 ? 'MK' : 'HK'); this.actionCooldown = this.attackCooldown; return; }
            this.stopMoving();
            return;
        }
        if (dx > 80) {
            // perto: poke ou agarão
            const r = Math.random();
            if (r < 0.3) { this._down = true; this._hkJust = true; this.actionCooldown = this.attackCooldown; return; } // rasteira
            if (r < 0.45) { this.press('THROW'); this.actionCooldown = 45; return; }
            if (r < 0.75) { this.press(Math.random() < 0.6 ? 'MP' : 'HP'); this.actionCooldown = this.attackCooldown; return; }
            this.stopMoving();
            return;
        }
        // colado: agarrão ou soco
        if (Math.random() < 0.5) { this.press('THROW'); this.actionCooldown = 45; return; }
        this.press('LP');
        this.actionCooldown = this.attackCooldown;
    }

    private attackCooldown = 70;

    // movimento 623P: empurra forward, down, down-forward no buffer + HP
    private startMotion623P() {
        const towardRight = this.me.x < this.target.x;
        this.motion = towardRight ? ['6', '2', '3'] : ['4', '2', '1'];
    }

    // hyper hop: corrida (duplo toque emulado) + pulo curto
    private hyperHop() {
        const towardRight = this.me.x < this.target.x;
        if (towardRight) this.isRightDoubleTapped = true;
        else this.isLeftDoubleTapped = true;
        this._upJust = true;
        this._up = true;
        this.jumpScript = 3; // solta cima rápido = hop, e a corrida engata o hyper hop
        this.moveTowards();
        this.actionCooldown = 30;
    }

    private moveTowards() {
        if (this.me.x < this.target.x) { this._right = true; this._left = false; }
        else { this._left = true; this._right = false; }
    }

    private moveAway() {
        if (this.me.x < this.target.x) { this._left = true; this._right = false; }
        else { this._right = true; this._left = false; }
    }

    private stopMoving() {
        this._left = false;
        this._right = false;
    }
}
