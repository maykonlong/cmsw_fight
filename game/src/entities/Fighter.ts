import Phaser from 'phaser';
import { StateMachine, State } from '../core/StateMachine';
import type { IInputProvider } from '../interfaces/IInputProvider';
import { Hitbox } from '../engine/Hitbox';
import { Hurtbox } from '../engine/Hurtbox';
import { Pushbox } from '../engine/Pushbox';
import { BASE_MOVES } from '../data/moves/base_moves';
import type { MoveData } from '../data/moves/base_moves';
import { CommandRecognizer } from '../core/CommandRecognizer';
import { AudioManager } from '../engine/AudioManager';

export class Fighter extends Phaser.Physics.Arcade.Sprite {
    public static readonly DISPLAY_WIDTH = 180;
    public static readonly DISPLAY_HEIGHT = 340;
    public static readonly CENTER_ABOVE_FLOOR = 0;
    public stateMachine: StateMachine;
    public inputManager?: IInputProvider;
    public speed: number = 250;
    public jumpForce: number = 1450; // Aumentado para compensar a gravidade
    private baseScale: number | null = null;

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
    public characterId: string;
    public bufferedSpecialFrames: number = 0;
    public airAttackUsed: boolean = false;
    public specialCooldown: number = 0;

    // KOF 2002 UM — 4 arcos de pulo
    public jumpType: 'none' | 'hop' | 'hyper_hop' | 'normal' | 'super' = 'none';
    public static readonly BASE_GRAVITY: number = 800;

    // Max Mode (BC — 2002 UM / XIII)
    public isMaxMode: boolean = false;
    public maxModeTimer: number = 0;
    public static readonly MAX_MODE_DURATION: number = 1000;   // ~16s a 60fps
    public static readonly MAX_CANCEL_COST: number = 150;      // custo por free cancel
    public static readonly QUICK_MAX_DURATION: number = 500;   // Quick Max dura metade

    // KOF Super Gauge (Poder)
    public superGauge: number = 0;
    public superStocks: number = 0;
    public static readonly MAX_SUPER_GAUGE: number = 1000;
    public static readonly MAX_SUPER_STOCKS: number = 3;

    public addSuperEnergy(amount: number) {
        if (this.superStocks >= Fighter.MAX_SUPER_STOCKS) return;
        this.superGauge += amount;
        if (this.superGauge >= Fighter.MAX_SUPER_GAUGE) {
            this.superGauge -= Fighter.MAX_SUPER_GAUGE;
            this.superStocks = Math.min(Fighter.MAX_SUPER_STOCKS, this.superStocks + 1);
            if ((this.scene as any)?.vfxManager) {
                (this.scene as any).vfxManager.showComboText(0, this.x, this.y - 140, 'MAX POWER ★');
                AudioManager.getInstance().playSFX('electric_cast', 0.4);
            }
        }
    }

    // Combo Tracking
    public comboHits: number = 0;
    public comboDamage: number = 0;
    public comboResetTimer?: Phaser.Time.TimerEvent;
    public attackContact: boolean = false;

    public registerComboHit(damage: number, vfx?: any) {
        this.comboHits++;
        this.comboDamage += damage;
        this.addSuperEnergy(45); // Ganha 45 de energia por cada acerto de combo
        if (this.comboResetTimer) this.comboResetTimer.remove();

        if (this.comboHits >= 2 && vfx) {
            const isKevin = this.characterId.includes('kevin');
            const comboTitle = isKevin
                ? (this.comboHits >= 3 ? 'SELINHO ELÉTRICO!' : 'KEVIN COMBO!')
                : (this.comboHits >= 3 ? 'PITBULL RUSH!' : 'VINI DOG COMBO!');
            vfx.showComboText(this.comboHits, this.x, this.y - 120, comboTitle);
        }

        this.comboResetTimer = this.scene.time.delayedCall(1200, () => {
            this.comboHits = 0;
            this.comboDamage = 0;
        });
    }

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, inputManager?: IInputProvider) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        (this.body as Phaser.Physics.Arcade.Body).setGravityY(800); // KOF Heavy Gravity (Adds to global 1200)

        this.setCollideWorldBounds(true);
        this.setOrigin(0.5, 0.95);
        this.inputManager = inputManager;
        this.characterId = texture.replace(/_(idle|walk|block|punch|kick|special|crouch|jump|hit|ko|win)$/, '');

        // Init Boxes
        this.currentHitbox = new Hitbox(0, 0, 0, 0);
        this.currentHurtbox = new Hurtbox(0, 0, 120, 310);
        this.currentHurtbox.offsetX = -60;
        this.currentHurtbox.offsetY = -310;

        this.pushbox = new Pushbox(0, 0, 100, 240);
        this.pushbox.offsetX = -50;
        this.pushbox.offsetY = -240;

        // Registrando estados usando MoveData base para normais
        this.stateMachine = new StateMachine('idle', {
            // Movimentação
            idle:        new IdleState(),
            walk:        new WalkState(),
            run:         new RunState(),
            backdash:    new BackdashState(),
            roll:        new RollState(),
            prejump:     new PrejumpState(),
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
            blowback:    new BlowbackState(),
            
            // Especial & Super (Desperation Move KOF)
            special:       new SpecialState(),
            super_special: new SuperSpecialState(),
            air_special:   new AirSpecialState(),
        }, [this]);
        this.applyVisualSize();
    }

    update() {
        if (this.specialCooldown > 0) this.specialCooldown--;
        this.updateMaxMode();

        // Um toque durante outro golpe continua válido por uma janela curta.
        if (this.inputManager?.isSpecialJustPressed) this.bufferedSpecialFrames = 18;
        else if (this.bufferedSpecialFrames > 0) this.bufferedSpecialFrames--;
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

    public getDefaultSpecialCommand(): string {
        return this.characterId.includes('vini') ? '214K' : '236P';
    }

    // ── Max Mode (KOF 2002 UM) ──────────────────────────────────
    public canActivateMaxMode(): boolean {
        return !this.isMaxMode && this.superStocks >= 1;
    }

    public activateMaxMode(quick: boolean = false) {
        if (!this.canActivateMaxMode()) return;
        this.superStocks--;
        this.isMaxMode = true;
        this.maxModeTimer = quick ? Fighter.QUICK_MAX_DURATION : Fighter.MAX_MODE_DURATION;
        AudioManager.getInstance().playSFX('electric_cast', 0.7);
        const vfx = (this.scene as any)?.vfxManager;
        vfx?.screenFlash(90);
        vfx?.showComboText(0, this.x, this.y - 150, 'MAX MODE!');
    }

    public deductMaxCancel(): boolean {
        if (!this.isMaxMode || this.maxModeTimer < Fighter.MAX_CANCEL_COST) return false;
        this.maxModeTimer -= Fighter.MAX_CANCEL_COST;
        return true;
    }

    public deactivateMaxMode() {
        this.isMaxMode = false;
        this.maxModeTimer = 0;
    }

    private updateMaxMode() {
        if (!this.isMaxMode) return;
        this.maxModeTimer--;
        if (this.maxModeTimer <= 0) {
            this.deactivateMaxMode();
            return;
        }
        // Aura de Max Mode: afterimage dourado periódico
        if (this.maxModeTimer % 7 === 0) {
            (this.scene as any)?.vfxManager?.spawnAfterImage(this, 0xffd700);
        }
    }

    public isOnGround(): boolean {
        const body = this.body as Phaser.Physics.Arcade.Body;
        const groundY = (this.scene as any)?.floorY ?? 590;
        const distToGround = Math.abs(this.y - groundY);
        const isPhysicsGrounded = Boolean(body?.blocked.down || body?.touching.down);
        const isNearFloor = distToGround <= 10 && (body?.velocity.y ?? 0) >= 0;
        return isPhysicsGrounded || isNearFloor;
    }

    public get isHoldingBack(): boolean {
        if (!this.inputManager) return false;
        const isFacingLeft = this.flipX;
        return isFacingLeft ? this.inputManager.isRightDown : this.inputManager.isLeftDown;
    }

    public get isHoldingLowBack(): boolean {
        if (!this.inputManager) return false;
        return this.isHoldingBack && this.inputManager.isDownDown;
    }

    public setPoseTexture(pose: string) {
        const targetKey = `${this.characterId}_${pose}`;
        const fallbackBaseKey = this.characterId.replace(/_p2$/, '');
        const fallbackKey = `${fallbackBaseKey}_${pose}`;

        if (this.scene.textures.exists(targetKey)) {
            this.setTexture(targetKey);
        } else if (this.scene.textures.exists(fallbackKey)) {
            this.setTexture(fallbackKey);
        } else if (this.scene.textures.exists(`${this.characterId}_idle`)) {
            this.setTexture(`${this.characterId}_idle`);
        } else if (this.scene.textures.exists(this.characterId)) {
            this.setTexture(this.characterId);
        }
        this.setOrigin(0.5, 0.95);
        this.applyVisualSize();
    }

    private applyVisualSize() {
        if (this.baseScale === null) {
            if (this.height > 0) {
                this.baseScale = Fighter.DISPLAY_HEIGHT / this.height;
            } else {
                this.baseScale = 1;
            }
        }

        // Mantém a proporção do personagem sempre idêntica à do frame Idle, 
        // evitando que ele encolha quando frames maiores (com auras gigantes) forem carregados.
        if (this.baseScale !== 1) {
            this.setScale(this.baseScale);
        } else {
            this.setDisplaySize(Fighter.DISPLAY_WIDTH, Fighter.DISPLAY_HEIGHT);
        }
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        // Ajusta a caixa de colisão baseada na nova escala
        const bodyWidth = 88 / this.scaleX;
        const bodyHeight = 306 / this.scaleY;
        body.setSize(bodyWidth, bodyHeight);
        body.setOffset((this.width - bodyWidth) / 2, this.height * 0.04);
    }

    takeDamage(amount: number, pushbackForce: number, fromX: number, type: 'normal' | 'electric' = 'normal') {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        const dir = this.x < fromX ? -1 : 1;
        this.setVelocityX(pushbackForce * dir);
        this.setPoseTexture('hit');
        this.stateMachine.transition('hit', type);
    }
}

// ─────────────────────────────────────────────────────────────────
// IDLE
// ─────────────────────────────────────────────────────────────────
class IdleState extends State {
    private baseScaleY = 0;

    enter(f: Fighter) {
        f.setPoseTexture('idle');
        this.baseScaleY = f.scaleY;
    }
    execute(f: Fighter) {
        // Respiração sutil (pequena oscilação de escala, estilo KOF)
        if (this.baseScaleY > 0) {
            const breathe = 1 + Math.sin(f.scene.time.now * 0.004) * 0.008;
            f.setScale(f.scaleX, this.baseScaleY * breathe);
        }

        // Easing (Friction) to stop smoothly instead of instantly
        const currentVx = (f.body as Phaser.Physics.Arcade.Body).velocity.x;
        f.setVelocityX(Phaser.Math.Linear(currentVx, 0, 0.35));
        
        if (!f.inputManager) return;
        const inp = f.inputManager;

        // Corrida (Double tap para frente) e Backdash (Double tap para trás)
        const isFacingLeft = f.flipX;
        const forwardDouble = isFacingLeft ? inp.isLeftDoubleTapped : inp.isRightDoubleTapped;
        const backDouble = isFacingLeft ? inp.isRightDoubleTapped : inp.isLeftDoubleTapped;

        if (forwardDouble) {
            this.stateMachine.transition('run'); return;
        }
        if (backDouble) {
            this.stateMachine.transition('backdash'); return;
        }

        // AB Roll Esquiva KOF (Soco Leve + Chute Leve juntos)
        if (inp.isLPJustPressed && inp.isLKJustPressed) {
            this.stateMachine.transition('roll'); return;
        }

        // CD Blowback KOF (Soco Forte + Chute Forte juntos)
        if (inp.isHPJustPressed && inp.isHKJustPressed) {
            this.stateMachine.transition('blowback'); return;
        }

        // MAX MODE (KOF 2002 UM): Chute Médio + Soco Forte (B+C) consome 1 stock
        if (inp.isMKJustPressed && inp.isHPJustPressed && f.canActivateMaxMode()) {
            f.activateMaxMode(false); return;
        }

        // Reconhecimento de comandos especiais & Super Especial (Desperation Move KOF)
        const cmd = CommandRecognizer.checkCommands(inp.buffer, inp.currentFrame, f.flipX);
        const isSuperReady = (f.superStocks > 0 || f.superGauge >= 1000);
        // MAX2 (HSDM): vida abaixo de 30% durante o Max Mode — não consome stock
        const isMax2Ready = f.isMaxMode && f.hp <= f.maxHp * 0.3;

        if ((cmd === '236P' || cmd === '623P' || cmd === '214K') && f.specialCooldown <= 0) {
            if (isSuperReady || isMax2Ready) {
                this.stateMachine.transition('super_special', cmd); return;
            } else {
                this.stateMachine.transition('special', cmd); return;
            }
        }
        if (f.bufferedSpecialFrames > 0 && f.specialCooldown <= 0) {
            f.bufferedSpecialFrames = 0;
            if (isSuperReady || isMax2Ready) {
                this.stateMachine.transition('super_special', f.getDefaultSpecialCommand()); return;
            } else {
                this.stateMachine.transition('special', f.getDefaultSpecialCommand()); return;
            }
        }

        if (inp.isUpJustPressed && f.isOnGround()) {
            this.stateMachine.transition('prejump'); return;
        }
        if (inp.isDownDown) {
            if (inp.isLPJustPressed) { this.stateMachine.transition('crouch_LP'); return; }
            if (inp.isMPJustPressed) { this.stateMachine.transition('crouch_MP'); return; }
            if (inp.isHPJustPressed) { this.stateMachine.transition('crouch_HP'); return; }
            if (inp.isLKJustPressed) { this.stateMachine.transition('crouch_LK'); return; }
            if (inp.isMKJustPressed) { this.stateMachine.transition('crouch_MK'); return; }
            if (inp.isHKJustPressed) { this.stateMachine.transition('crouch_HK'); return; }
            this.stateMachine.transition('crouch'); return;
        }

        if (inp.isLeftDown || inp.isRightDown) {
            this.stateMachine.transition('walk'); return;
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

    exit(f: Fighter) {
        // Restaura a escala antes de qualquer outra pose/anim
        if (this.baseScaleY > 0) f.setScale(f.scaleX, this.baseScaleY);
    }
}

// ─────────────────────────────────────────────────────────────────
// WALK
// ─────────────────────────────────────────────────────────────────
class WalkState extends State {
    private walkTimer = 0;
    enter(f: Fighter) {
        this.walkTimer = 0;
        f.setPoseTexture('walk');
    }

    execute(f: Fighter) {
        if (!f.inputManager) return;
        const inp = f.inputManager;

        const isFacingLeft = f.flipX;
        const forwardDouble = isFacingLeft ? inp.isLeftDoubleTapped : inp.isRightDoubleTapped;
        const backDouble = isFacingLeft ? inp.isRightDoubleTapped : inp.isLeftDoubleTapped;

        if (forwardDouble) {
            this.stateMachine.transition('run'); return;
        }
        if (backDouble) {
            this.stateMachine.transition('backdash'); return;
        }

        this.walkTimer++;
        const isMovingForward = (isFacingLeft && inp.isLeftDown) || (!isFacingLeft && inp.isRightDown);

        if (isMovingForward) {
            // Passada para a frente (ciclo suave de 4 fases)
            const cycle = Math.floor((this.walkTimer % 24) / 6);
            if (cycle === 0) f.setPoseTexture('walk');
            else if (cycle === 1) f.setPoseTexture('walk_2');
            else if (cycle === 2) f.setPoseTexture('walk_3');
            else f.setPoseTexture('idle');
        } else {
            // Passada para trás (recuo com guarda atenta)
            const cycle = Math.floor((this.walkTimer % 24) / 6);
            if (cycle === 0) f.setPoseTexture('walk_back');
            else if (cycle === 1) f.setPoseTexture('walk_2');
            else if (cycle === 2) f.setPoseTexture('walk');
            else f.setPoseTexture('idle');
        }

        if (this.walkTimer % 18 === 0) {
            AudioManager.getInstance().playSFX('swing', 0.12);
        }

        const cmd = CommandRecognizer.checkCommands(inp.buffer, inp.currentFrame, f.flipX);
        if ((cmd === '236P' || cmd === '623P' || cmd === '214K') && f.specialCooldown <= 0) {
            this.stateMachine.transition('special', cmd); return;
        }
        if (f.bufferedSpecialFrames > 0 && f.specialCooldown <= 0) {
            f.bufferedSpecialFrames = 0;
            this.stateMachine.transition('special', f.getDefaultSpecialCommand()); return;
        }

        if (inp.isUpJustPressed && f.isOnGround()) {
            this.stateMachine.transition('jump'); return;
        }
        if (inp.isDownDown) {
            if (inp.isLPJustPressed) { this.stateMachine.transition('crouch_LP'); return; }
            if (inp.isMPJustPressed) { this.stateMachine.transition('crouch_MP'); return; }
            if (inp.isHPJustPressed) { this.stateMachine.transition('crouch_HP'); return; }
            if (inp.isLKJustPressed) { this.stateMachine.transition('crouch_LK'); return; }
            if (inp.isMKJustPressed) { this.stateMachine.transition('crouch_MK'); return; }
            if (inp.isHKJustPressed) { this.stateMachine.transition('crouch_HK'); return; }
            this.stateMachine.transition('crouch'); return;
        }

        if (inp.isLeftDown) {
            // Se estiver andando para trás, usa velocidade um pouco mais lenta (0.8x)
            const speedMult = isFacingLeft ? 1 : 0.8;
            const targetVx = -f.speed * speedMult;
            const currentVx = (f.body as Phaser.Physics.Arcade.Body).velocity.x;
            f.setVelocityX(Phaser.Math.Linear(currentVx, targetVx, 0.4));
        } else if (inp.isRightDown) {
            const speedMult = isFacingLeft ? 0.8 : 1;
            const targetVx = f.speed * speedMult;
            const currentVx = (f.body as Phaser.Physics.Arcade.Body).velocity.x;
            f.setVelocityX(Phaser.Math.Linear(currentVx, targetVx, 0.4));
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
// RUN (Corrida) & BACKDASH (Esquiva para trás)
// ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
// RUN (Corrida para Frente) & BACKDASH (Corrida / Recuo para Trás)
// ─────────────────────────────────────────────────────────────────
class RunState extends State {
    private runTimer = 0;
    enter(f: Fighter) {
        this.runTimer = 0;
        f.setPoseTexture('run_1');
        AudioManager.getInstance().playSFX('swing', 0.2);
    }

    execute(f: Fighter) {
        if (!f.inputManager) return;
        const inp = f.inputManager;
        this.runTimer++;

        const isFacingLeft = f.flipX;
        const moveDir = isFacingLeft ? -1 : 1;
        const runSpeed = f.speed * 1.95; // 490px/s velocíssima corrida para frente

        const holdForward = isFacingLeft ? inp.isLeftDown : inp.isRightDown;
        if (!holdForward) {
            this.stateMachine.transition('idle');
            return;
        }

        // Inclinação realista do corpo para frente durante a arrancada
        f.setAngle(isFacingLeft ? -6 : 6);

        // Ciclo rápido de passadas em corrida (run_1 -> run_2 -> run_3)
        const cycle = Math.floor((this.runTimer % 12) / 4);
        if (cycle === 0) f.setPoseTexture('run_1');
        else if (cycle === 1) f.setPoseTexture('run_2');
        else f.setPoseTexture('run_3');

        if (this.runTimer % 10 === 0) {
            AudioManager.getInstance().playSFX('swing', 0.15);
        }

        f.setVelocityX(runSpeed * moveDir);

        // Pular correndo engata Hyper Hop / Super Jump automaticamente
        if (inp.isUpJustPressed && f.isOnGround()) {
            this.stateMachine.transition('prejump', true); return;
        }
        if (inp.isLPJustPressed && !inp.isLKJustPressed) { this.stateMachine.transition('stand_LP'); return; }
        if (inp.isMPJustPressed) { this.stateMachine.transition('stand_MP'); return; }
        if (inp.isHPJustPressed) { this.stateMachine.transition('stand_HP'); return; }
        if (inp.isLKJustPressed && !inp.isLPJustPressed) { this.stateMachine.transition('stand_LK'); return; }
        if (inp.isMKJustPressed) { this.stateMachine.transition('stand_MK'); return; }
        if (inp.isHKJustPressed) { this.stateMachine.transition('stand_HK'); return; }
    }

    exit(f: Fighter) {
        f.setAngle(0);
    }
}

class BackdashState extends State {
    private runTimer = 0;
    enter(f: Fighter) {
        this.runTimer = 0;
        f.setPoseTexture('run_back_1');
        AudioManager.getInstance().playSFX('swing', 0.25);
    }

    execute(f: Fighter) {
        if (!f.inputManager) return;
        const inp = f.inputManager;
        this.runTimer++;

        const isFacingLeft = f.flipX;
        const backDir = isFacingLeft ? 1 : -1;
        const backRunSpeed = f.speed * 1.7; // 425px/s recuo veloz para trás

        // Inclinação realista do corpo para trás durante o recuo
        f.setAngle(isFacingLeft ? 6 : -6);

        // Ciclo rápido de passadas para trás (run_back_1 -> run_back_2 -> run_back_3)
        const cycle = Math.floor((this.runTimer % 12) / 4);
        if (cycle === 0) f.setPoseTexture('run_back_1');
        else if (cycle === 1) f.setPoseTexture('run_back_2');
        else f.setPoseTexture('run_back_3');

        if (this.runTimer % 10 === 0) {
            AudioManager.getInstance().playSFX('swing', 0.15);
        }

        // Rastro fantasma no Backdash
        if (this.runTimer % 3 === 0) {
            (f.scene as any).vfxManager?.spawnAfterImage(f, 0xffaa00);
        }

        // Física: O backdash começa rápido e vai freiando (Ease-out)
        const currentSpeed = backRunSpeed * Math.max(0.1, (1 - (this.runTimer / 22)));
        f.setVelocityX(currentSpeed * backDir);

        const holdBack = isFacingLeft ? inp.isRightDown : inp.isLeftDown;
        if (!holdBack && this.runTimer > 12) {
            this.stateMachine.transition('idle');
            return;
        }

        if (inp.isUpJustPressed && f.isOnGround()) {
            this.stateMachine.transition('prejump'); return;
        }
    }

    exit(f: Fighter) {
        f.setAngle(0);
    }
}

// ─────────────────────────────────────────────────────────────────
// PREJUMP (janela universal de 4 frames — KOF)
// Decide no fim da janela qual dos 4 arcos de pulo será executado
// ─────────────────────────────────────────────────────────────────
class PrejumpState extends State {
    private timer = 0;
    private dir: 'up' | 'fwd' | 'back' = 'up';
    private fromRun = false;
    private hadDownCharge = false;

    enter(f: Fighter, fromRun: boolean = false) {
        this.timer = 4; // janela universal de pré-pulo
        this.fromRun = fromRun;
        f.setPoseTexture('crouch'); // pose curta de agachamento no prejump
        f.setVelocityX(0);

        const inp = f.inputManager;
        const isFacingLeft = f.flipX;
        this.dir = inp?.isUpDown
            ? ((isFacingLeft ? inp.isLeftDown : inp.isRightDown) ? 'fwd'
                : ((isFacingLeft ? inp.isRightDown : inp.isLeftDown) ? 'back' : 'up'))
            : 'up';

        // Charge para baixo nos últimos 8 frames (Super Jump / Hyper Hop — numpad 1/2/3)
        this.hadDownCharge = false;
        if (inp) {
            for (const b of inp.buffer.getWindow(8, inp.currentFrame)) {
                if (b.direction === '1' || b.direction === '2' || b.direction === '3') {
                    this.hadDownCharge = true;
                    break;
                }
            }
        }
    }

    execute(_f: Fighter) {
        this.timer--;
        if (this.timer <= 0) {
            this.stateMachine.transition('jump', {
                fromRun: this.fromRun,
                downCharge: this.hadDownCharge,
                dir: this.dir
            });
        }
    }
}

class JumpState extends State {
    private airFrames = 0;
    private isSuperJump = false;

    enter(f: Fighter, opts?: { resume?: boolean; fromRun?: boolean; downCharge?: boolean; dir?: string } | boolean) {
        // Compat: estados antigos passam `true` como resume
        if (typeof opts === 'boolean') opts = { resume: opts };
        const resume = opts?.resume ?? false;
        if (!resume && !f.isOnGround()) return; // IMPEDE DUPLO PULO ABSOLUTAMENTE!
        this.airFrames = resume ? 9 : 0;
        f.setPoseTexture('jump_1');
        if (resume) return;
        f.airAttackUsed = false;

        // ── Os 4 arcos de pulo do KOF (98 UM / 2002 UM) ──
        const holdingUp = f.inputManager?.isUpDown ?? true;
        const isHyper = (opts?.fromRun ?? false) || (opts?.downCharge ?? false);

        let velY = -f.jumpForce;          // Regular Jump
        let speedX = f.speed * 0.85;
        let gravityMult = 1.0;
        let type: Fighter['jumpType'] = 'normal';

        if (!holdingUp) {
            // Hop: soltou cima durante o prejump — arco baixo e rápido
            velY = -f.jumpForce * 0.55;
            gravityMult = 1.35; // arcos rasantes caem mais rápido
            type = 'hop';
            speedX = f.speed * 0.95;
            if (isHyper) {
                // Hyper Hop: a ferramenta ofensiva do rushdown — rasante e veloz
                type = 'hyper_hop';
                speedX = f.speed * 1.6;
            }
        } else if (isHyper) {
            // Super Jump: longo alcance horizontal para cruzar a tela
            type = 'super';
            speedX = f.speed * 1.6;
        }

        f.jumpType = type;
        f.setGravityY(Fighter.BASE_GRAVITY * gravityMult);
        this.isSuperJump = type === 'super' || type === 'hyper_hop';
        f.setVelocityY(velY);

        if (!f.inputManager) return;
        const isFacingLeft = f.flipX;
        let dirX = 0;
        const dir = opts?.dir ?? 'up';
        if (dir === 'fwd') dirX = isFacingLeft ? -1 : 1;
        else if (dir === 'back') dirX = isFacingLeft ? 1 : -1;
        else if (f.inputManager.isLeftDown) dirX = -1;
        else if (f.inputManager.isRightDown) dirX = 1;
        f.setVelocityX(dirX * speedX);
    }

    execute(f: Fighter) {
        this.airFrames++;
        const body = f.body as Phaser.Physics.Arcade.Body;
        const vy = body?.velocity.y ?? 0;

        // Rastro fantasma em Super Jump / Hyper Hop
        if (this.isSuperJump && this.airFrames % 3 === 0) {
            (f.scene as any).vfxManager?.spawnAfterImage(f, this.isSuperJump && f.jumpType === 'hyper_hop' ? 0xffd700 : 0x00aaff);
        }

        // Alternância de frames de pulo (jump_1 arranque, jump_2 ápice, jump_3 queda)
        if (vy < -200) {
            f.setPoseTexture('jump_1');
        } else if (Math.abs(vy) <= 200) {
            f.setPoseTexture('jump_2');
        } else {
            f.setPoseTexture('jump_3');
        }

        if (this.airFrames > 8 && f.isOnGround()) {
            this.stateMachine.transition('land');
            return;
        }
        if (!f.inputManager || f.airAttackUsed) return;
        const inp = f.inputManager;

        // Especial no ar (Pular + Magia Especial)
        if ((inp.isSpecialJustPressed || f.bufferedSpecialFrames > 0) && f.specialCooldown <= 0) {
            f.bufferedSpecialFrames = 0;
            this.stateMachine.transition('air_special');
            return;
        }

        // Aerial attacks (voadoras)
        if (inp.isLPJustPressed) { this.stateMachine.transition('air_LP'); return; }
        if (inp.isMPJustPressed) { this.stateMachine.transition('air_MP'); return; }
        if (inp.isHPJustPressed) { this.stateMachine.transition('air_HP'); return; }
        if (inp.isLKJustPressed) { this.stateMachine.transition('air_LK'); return; }
        if (inp.isMKJustPressed) { this.stateMachine.transition('air_MK'); return; }
        if (inp.isHKJustPressed) { this.stateMachine.transition('air_HK'); return; }
    }

    exit(f: Fighter) {
        // Restaura a gravidade base ao sair do ar
        f.setGravityY(Fighter.BASE_GRAVITY);
        f.jumpType = 'none';
    }
}

class AirSpecialState extends State {
    private duration = 0;
    private fired = false;

    enter(f: Fighter) {
        f.airAttackUsed = true;
        f.specialCooldown = 45;
        f.setPoseTexture('special');
        this.duration = 35;
        this.fired = false;
        f.currentHitbox.active = false;
        f.setTint(f.characterId.includes('vini') ? 0x66ccff : 0xff77dd);
    }

    execute(f: Fighter) {
        this.duration--;

        if (!this.fired && this.duration <= 33) {
            this.fired = true;
            f.setPoseTexture('special_2');
            f.emit('fire_special', f);
        }

        if (f.isOnGround()) {
            f.clearTint();
            this.stateMachine.transition('land');
            return;
        }

        if (this.duration <= 0) {
            f.clearTint();
            this.stateMachine.transition('jump', true);
        }
    }

    exit(f: Fighter) {
        f.clearTint();
    }
}

// ─────────────────────────────────────────────────────────────────
// LAND
// ─────────────────────────────────────────────────────────────────
class LandState extends State {
    private duration = 0;
    enter(f: Fighter) {
        this.duration = 3; // 3 frames de aterrissagem
        f.setPoseTexture('idle');
        f.setVelocityX(0);
        f.setVelocityY(0);
        AudioManager.getInstance().playSFX('land', 0.45);
    }
    execute(_f: Fighter) {
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
        f.setPoseTexture('crouch');
        f.setVelocityX(0);
        f.currentHurtbox.height = 135;
        f.currentHurtbox.offsetY = 18;
    }

    exit(f: Fighter) {
        f.currentHurtbox.height = 265;
        f.currentHurtbox.offsetY = -112;
    }

    execute(f: Fighter) {
        if (!f.inputManager) return;
        const inp = f.inputManager;

        const cmd = CommandRecognizer.checkCommands(inp.buffer, inp.currentFrame, f.flipX);
        if ((cmd === '236P' || cmd === '623P' || cmd === '214K') && f.specialCooldown <= 0) {
            this.stateMachine.transition('special', cmd); return;
        }
        if (f.bufferedSpecialFrames > 0 && f.specialCooldown <= 0) {
            f.bufferedSpecialFrames = 0;
            this.stateMachine.transition('special', f.getDefaultSpecialCommand()); return;
        }

        if (!inp.isDownDown) {
            this.stateMachine.transition('idle'); return;
        }

        // Super Jump: baixo carregado + cima (2-8) sai direto do agachamento
        if (inp.isUpJustPressed) {
            this.stateMachine.transition('prejump'); return;
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

    private getPoseName(moveData: MoveData, frameIndex: number): string {
        const isAir = moveData.hitLevel === 'AIR';
        const isCrouch = moveData.input.startsWith('c');
        const input = moveData.input;

        let base = 'punch';
        if (isAir) {
            if (input === 'jHP' || input === 'jHK') base = 'air_kick_diag';
            else if (input === 'jLP' || input === 'jLK') base = 'air_kick_up';
            else base = input.includes('K') ? 'air_kick' : 'air_punch';
        } else if (isCrouch) {
            if (input === 'cLP' || input === 'cMP' || input === 'cHP') {
                base = 'crouch_punch';
            } else {
                base = 'sweep'; // Todos os chutes agachados usam a rasteira/sweep
            }
        } else {
            if (input === 'LP') base = 'punch_l';        // Soco Mão Esquerda (Jab)
            else if (input === 'HP') base = 'punch_r';   // Soco Mão Direita (Direto Forte)
            else if (input === 'MP') base = 'punch';     // Soco Médio
            else if (input === 'LK') base = 'kick_l';    // Chute Perna Esquerda (Baixo)
            else if (input === 'HK') base = 'kick_r';    // Chute Perna Direita (Alto Forte)
            else if (input === 'MK') base = 'kick';      // Chute Médio
            else base = input.includes('K') ? 'kick' : 'punch';
        }

        if (frameIndex === 1) return base;
        return `${base}_${frameIndex}`;
    }

    enter(f: Fighter) {
        this.duration = 0;
        f.attackContact = false;
        f.currentHitbox.active = false;
        
        const isAir = this.moveData.hitLevel === 'AIR';
        const isCrouch = this.moveData.input.startsWith('c');

        if (isAir) f.airAttackUsed = true;
        if (isCrouch) {
            f.currentHurtbox.height = 200;
            f.currentHurtbox.offsetY = -200;
        }

        f.setPoseTexture(this.getPoseName(this.moveData, 1));
        AudioManager.getInstance().playSFX('swing', 0.32);
        
        // Copiar dados pro hitbox atual
        f.currentHitbox.damage = this.moveData.damage;
        f.currentHitbox.hitType = this.moveData.type;
        f.currentHitbox.hitLevel = this.moveData.hitLevel;
        f.currentHitbox.knockdown = this.moveData.knockdown;
        f.currentHitbox.knockback = this.moveData.knockback;
        f.currentHitbox.hitstun = this.moveData.hitstun;
        f.currentHitbox.blockstun = this.moveData.blockstun;
        f.currentHitbox.chipDamage = this.moveData.chipDamage;
        f.currentHitbox.soundHit = this.moveData.soundHit;
        
        // Escalar os hitboxes antigos para o tamanho novo (340px)
        const scaleX = 2.0;
        const scaleY = 3.0;

        f.currentHitbox.offsetX = this.moveData.hitboxOffset.x * scaleX;
        f.currentHitbox.offsetY = this.moveData.hitboxOffset.y * scaleY;
        f.currentHitbox.moveId = this.moveData.input;
        f.currentHitbox.setTo(0, 0, this.moveData.hitboxOffset.w * scaleX, this.moveData.hitboxOffset.h * scaleX);
    }

    execute(f: Fighter) {
        this.duration++;

        // Mantém a hurtbox agachada baixa durante ataques agachados
        if (this.moveData.input.startsWith('c')) {
            f.currentHurtbox.height = 200;
            f.currentHurtbox.offsetY = -200;
        }

        // A colisão com o chão encerra o golpe; nunca cria um segundo salto.
        if (this.moveData.hitLevel === 'AIR' && this.duration > 1 && f.isOnGround()) {
            f.currentHitbox.active = false;
            this.stateMachine.transition('land');
            return;
        }

        // Define total duration
        const total = this.moveData.startup + this.moveData.active + this.moveData.recovery;
        
        // Ativa hitbox no primeiro frame active
        if (this.duration === this.moveData.startup + 1) {
            f.currentHitbox.active = true;
        }

        // Desativa hitbox no fim dos frames active
        if (this.duration === this.moveData.startup + this.moveData.active + 1) {
            f.currentHitbox.active = false;
        }
        
        // Fluid Animation logic (4 frames spread over duration)
        const frameLength = Math.max(1, Math.floor(total / 4));
        let frameIndex = 1;
        if (this.duration <= frameLength) frameIndex = 1;
        else if (this.duration <= frameLength * 2) frameIndex = 2;
        else if (this.duration <= frameLength * 3) frameIndex = 3;
        else frameIndex = 4;
        
        // Special case for startup/recovery mapping if frame distribution is weird
        if (this.duration > this.moveData.startup + this.moveData.active) frameIndex = 4;
        else if (this.duration > this.moveData.startup) frameIndex = 3;
        
        const tex = this.getPoseName(this.moveData, frameIndex);
        f.setPoseTexture(tex);

        // Janela de Target Combo Chain & Special Cancel (KOF Style: Only on contact)
        if (this.moveData.hitLevel !== 'AIR' && this.duration > this.moveData.startup + 1) {
            if (f.inputManager && f.attackContact) {
                const inp = f.inputManager;
                const isCrouch = inp.isDownDown;

                // QUICK MAX (KOF 2002 UM): BC no instante do contato cancela o golpe em corrida
                if (inp.isMKJustPressed && inp.isHPJustPressed && f.canActivateMaxMode()) {
                    f.activateMaxMode(true);
                    f.currentHitbox.active = false;
                    f.clearTint();
                    f.setAngle(0);
                    this.stateMachine.transition('run');
                    return;
                }

                // Chain/Target Combos
                const isLight = this.moveData.input.includes('L');
                const isMedium = this.moveData.input.includes('M');
                if (isLight) {
                    if (inp.isMPJustPressed) { f.currentHitbox.active = false; f.stateMachine.transition(isCrouch ? 'crouch_MP' : 'stand_MP'); return; }
                    if (inp.isMKJustPressed) { f.currentHitbox.active = false; f.stateMachine.transition(isCrouch ? 'crouch_MK' : 'stand_MK'); return; }
                } else if (isMedium) {
                    if (inp.isHPJustPressed) { f.currentHitbox.active = false; f.stateMachine.transition(isCrouch ? 'crouch_HP' : 'stand_HP'); return; }
                    if (inp.isHKJustPressed) { f.currentHitbox.active = false; f.stateMachine.transition(isCrouch ? 'crouch_HK' : 'stand_HK'); return; }
                }

                // Special Cancel
                const cmd = CommandRecognizer.checkCommands(inp.buffer, inp.currentFrame, f.flipX);
                if ((cmd === '236P' || cmd === '623P' || cmd === '214K') && f.specialCooldown <= 0) {
                    f.currentHitbox.active = false;
                    f.clearTint();
                    this.stateMachine.transition('special', cmd);
                    return;
                }

                // Buffered Special
                if (f.bufferedSpecialFrames > 0 && f.specialCooldown <= 0) {
                    f.bufferedSpecialFrames = 0;
                    f.currentHitbox.active = false;
                    f.clearTint();
                    this.stateMachine.transition('special', f.getDefaultSpecialCommand());
                    return;
                }
            }
        }

        // Golpes aéreos mantêm a pose até aterrissar; a hitbox já foi desligada.
        if (this.moveData.hitLevel === 'AIR') return;

        // Transition out
        if (this.duration >= this.moveData.startup + this.moveData.active + this.moveData.recovery) {
            f.currentHitbox.active = false;
            f.clearTint();
            
            this.stateMachine.transition(f.inputManager?.isDownDown ? 'crouch' : 'idle');
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
        f.setPoseTexture(this.type === 'LOW' ? 'crouch' : 'block');
        f.setTint(0x888888);
        if (this.type === 'LOW') {
            f.currentHurtbox.height = 135;
            f.currentHurtbox.offsetY = 18;
        }
    }

    exit(f: Fighter) {
        f.isBlocking = false;
        f.clearTint();
        if (this.type === 'LOW') {
            f.currentHurtbox.height = 265;
            f.currentHurtbox.offsetY = -112;
        }
    }

    execute(f: Fighter) {
        if (!f.inputManager) return;
        const inp = f.inputManager;
        const isFacingLeft = f.flipX;
        const holdBack = isFacingLeft ? inp.isRightDown : inp.isLeftDown;
        
        // Guard Cancel KOF (Rolar ou Blowback enquanto defende)
        if (f.hitStunTimer > 0) {
            f.hitStunTimer--;
            
            if (f.superStocks > 0 || f.superGauge >= 1000) {
                const isRoll = inp.isLPJustPressed && inp.isLKJustPressed;
                const isBlowback = inp.isHPJustPressed && inp.isHKJustPressed;
                
                if (isRoll || isBlowback) {
                    if (f.superStocks > 0) f.superStocks--;
                    else f.superGauge -= 1000;
                    
                    if ((f.scene as any)?.vfxManager) {
                        (f.scene as any).vfxManager.showComboText(0, f.x, f.y - 120, 'GUARD CANCEL!');
                    }
                    if (isRoll) {
                        this.stateMachine.transition('roll', true); // true = Guard Cancel
                        return;
                    } else {
                        this.stateMachine.transition('blowback');
                        return;
                    }
                }
            }
        }
        
        // Só sai do block quando terminar o hitStunTimer
        if (f.hitStunTimer <= 0) {
            if (!holdBack) {
                this.stateMachine.transition(this.type === 'LOW' ? 'crouch' : 'idle');
            } else if (this.type === 'HIGH' && inp.isDownDown) {
                this.stateMachine.transition('block_low');
            } else if (this.type === 'LOW' && !inp.isDownDown) {
                this.stateMachine.transition('block_high');
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// SPECIAL
// ─────────────────────────────────────────────────────────────────
class SpecialState extends State {
    private duration = 0;
    private fired = false;
    private isReversal = false;

    enter(f: Fighter, cmd: string = '236P') {
        this.isReversal = cmd === '623P';
        f.bufferedSpecialFrames = 0;
        f.setVelocityX(0);
        f.currentHitbox.active = false;
        this.fired = false;
        this.duration = this.isReversal ? 42 : 45;

        if (this.isReversal) {
            // Reversal KOF (Encontrão do Kevin / Mordida Fatal do Vini):
            // sobe invencível acertando com knockdown — nunca mais um projétil repetido
            f.specialCooldown = 55;
            f.setPoseTexture('punch_r');
            f.setTint(0xffee88);
            f.setVelocityY(-640);
            const dir = f.flipX ? -1 : 1;
            f.setVelocityX(dir * 120);
            f.currentHurtbox.invincible = true;

            f.currentHitbox.damage = 120;
            f.currentHitbox.hitType = 'special';
            f.currentHitbox.hitLevel = 'MID';
            f.currentHitbox.knockdown = true;
            f.currentHitbox.knockback = 420;
            f.currentHitbox.hitstun = 30;
            f.currentHitbox.blockstun = 16;
            f.currentHitbox.chipDamage = 0;
            f.currentHitbox.soundHit = 'hit_heavy';
            f.currentHitbox.moveId = '623P';
            f.currentHitbox.offsetX = 60;
            f.currentHitbox.offsetY = -340;
            f.currentHitbox.setTo(0, 0, 140, 200);

            AudioManager.getInstance().playSFX('swing', 0.5);
            AudioManager.getInstance().playSFX('throw', 0.4);
        } else {
            f.specialCooldown = 75; // Previne envio contínuo/infinito de poderes
            f.setPoseTexture('special');
            f.setTint(f.characterId.includes('vini') ? 0x66ccff : 0xff77dd);
        }
    }

    execute(f: Fighter) {
        this.duration--;

        if (this.isReversal) {
            const active = this.duration <= 38 && this.duration >= 24;
            f.currentHitbox.active = active;
            if (this.duration <= 30) f.currentHurtbox.invincible = false;

            if (this.duration <= 38) f.setPoseTexture('punch_r_2');
            if (this.duration <= 26) f.setPoseTexture('punch_r_3');

            // Recuperação no chão
            if (f.isOnGround() && this.duration < 20) {
                f.setPoseTexture('punch_r_4');
                f.setVelocityX(0);
            }

            if (this.duration <= 0) {
                f.clearTint();
                this.stateMachine.transition('idle');
            }
            return;
        }

        if (!this.fired && this.duration <= 43) {
            this.fired = true;
            f.setPoseTexture('special_2');
            f.emit('fire_special', f);
        }

        // FREE CANCEL (Max Mode — 2002 UM): especial cancela em outro especial
        // consumindo o timer do modo, ignorando o cooldown normal
        if (f.isMaxMode && this.duration <= 38 && this.duration >= 20 && f.inputManager) {
            const cmd = CommandRecognizer.checkCommands(f.inputManager.buffer, f.inputManager.currentFrame, f.flipX);
            if ((cmd === '236P' || cmd === '623P' || cmd === '214K') && f.deductMaxCancel()) {
                f.currentHitbox.active = false;
                this.stateMachine.transition('special', cmd);
                return;
            }
        }

        if (this.duration <= 0) {
            f.clearTint();
            this.stateMachine.transition('idle');
        }
    }

    exit(f: Fighter) {
        f.currentHitbox.active = false;
        f.currentHurtbox.invincible = false;
        f.clearTint();
    }
}

// ─────────────────────────────────────────────────────────────────
// ROLL (AB Esquiva KOF)
// ─────────────────────────────────────────────────────────────────
class RollState extends State {
    private duration = 0;
    private isGuardCancel = false;

    enter(f: Fighter, isGuardCancel: boolean = false) {
        this.duration = 24; // 24 frames de rolamento
        this.isGuardCancel = isGuardCancel;
        f.setPoseTexture('crouch');
        f.currentHurtbox.invincible = true;
        const isFacingLeft = f.flipX;
        const inp = f.inputManager;
        const rollDir = inp?.isLeftDown ? -1 : inp?.isRightDown ? 1 : (isFacingLeft ? -1 : 1);
        
        const speed = isGuardCancel ? 550 : 380;
        f.setVelocityX(speed * rollDir);
        
        if (isGuardCancel) f.setTint(0x00aaff);
        AudioManager.getInstance().playSFX('swing', 0.35);
    }

    execute(f: Fighter) {
        this.duration--;

        if (this.duration % 3 === 0) {
            (f.scene as any).vfxManager?.spawnAfterImage(f, this.isGuardCancel ? 0x00aaff : 0xaaaaaa);
        }

        if (this.duration === 14) {
            f.setPoseTexture('crouch_punch');
        }

        if (this.duration <= 6) {
            f.currentHurtbox.invincible = false;
            f.clearTint();
        }

        if (this.duration <= 10) {
            f.setVelocityX(f.body!.velocity.x * 0.75); // Friction
        }

        if (this.duration <= 0) {
            f.currentHurtbox.invincible = false;
            f.clearTint();
            this.stateMachine.transition(f.inputManager?.isDownDown ? 'crouch' : 'idle');
        }
    }

    exit(f: Fighter) {
        f.currentHurtbox.invincible = false;
    }
}

// ─────────────────────────────────────────────────────────────────
// SUPER SPECIAL (Desperation Move KOF)
// ─────────────────────────────────────────────────────────────────
class SuperSpecialState extends State {
    private duration = 0;
    private fired = false;
    private isMax2 = false;

    enter(f: Fighter) {
        // MAX2 / HSDM: só existe com o Max Mode ativo e vida abaixo de 30% (não consome stock)
        this.isMax2 = f.isMaxMode && f.hp <= f.maxHp * 0.3;
        if (!this.isMax2) {
            if (f.superStocks > 0) {
                f.superStocks--;
            } else if (f.superGauge >= 1000) {
                f.superGauge = 0;
            }
        }
        f.specialCooldown = 95;
        f.bufferedSpecialFrames = 0;
        f.setPoseTexture('special');
        f.setVelocityX(0);
        this.duration = 60;
        this.fired = false;
        f.currentHitbox.active = false;
        f.setTint(this.isMax2 ? 0xff3366 : 0xffd700);

        const isKevin = f.characterId.includes('kevin');
        if ((f.scene as any)?.vfxManager) {
            const vfx = (f.scene as any).vfxManager;
            vfx.darkenScreen(60); // Max Mode KOF style dimming
            vfx.screenFlash(220);
            vfx.cameraShake(0.035);
            // Super Freeze: o mundo congela por 16 frames durante o flash (padrão KOF)
            vfx.hitStop(16);
            vfx.showComboText(0, f.x, f.y - 140,
                this.isMax2 ? (isKevin ? '★ MAX2 — BEIJO LETAL! ★' : '★ MAX2 — ALFA DO CACHORRO! ★')
                            : (isKevin ? 'SELINHO SUPREMO!' : 'PITBULL RUSH EXTREMO!'));
        }
        AudioManager.getInstance().playSFX(isKevin ? 'electric_cast' : 'dog_cast', 0.85);
    }

    execute(f: Fighter) {
        this.duration--;

        if (!this.fired && this.duration <= 56) {
            this.fired = true;
            f.setPoseTexture('special_2');
            f.emit('fire_special', f, true, this.isMax2); // true = super special
        }

        if (this.duration <= 0) {
            f.clearTint();
            this.stateMachine.transition('idle');
        }
    }

    exit(f: Fighter) {
        f.currentHitbox.active = false;
        f.clearTint();
    }
}

// ─────────────────────────────────────────────────────────────────
// THROW & THROWN
// ─────────────────────────────────────────────────────────────────
class ThrowState extends State {
    private duration = 0;
    
    enter(f: Fighter) {
        f.setVelocityX(0);
        this.duration = 24; // 24 frames de animação de throw
        f.setPoseTexture('throw');
        
        f.currentHitbox.active = true;
        f.currentHitbox.damage = 130;
        f.currentHitbox.hitType = 'throw';
        f.currentHitbox.hitLevel = 'UNBLOCKABLE';
        f.currentHitbox.knockback = 520;
        f.currentHitbox.setTo(0, 0, f.throwRange + 20, 70);
        f.currentHitbox.offsetX = 0;
        f.currentHitbox.offsetY = -60;
    }

    execute(f: Fighter) {
        this.duration--;
        if (this.duration === 18) {
            f.setPoseTexture('throw_2');
        }
        if (this.duration < 15) {
            f.currentHitbox.active = false;
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
        f.setPoseTexture('thrown');
        f.setVelocityY(-350); // Jogado para o alto de costas
        f.setVelocityX(f.flipX ? 200 : -200);
    }
    
    execute(f: Fighter) {
        if (f.isOnGround() && (f.body?.velocity.y ?? 0) >= 0) {
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
        f.currentHitbox.active = false;
        f.setPoseTexture('hit');
        this.type = type;

        if (type === 'electric') {
            f.hitStunTimer = 50;
            f.setVelocityX(0);
        } else {
            f.hitStunTimer = Math.max(1, f.hitStunTimer || 22);
            f.setTint(0xffffff);
        }
    }

    execute(f: Fighter) {
        f.hitStunTimer--;

        if (this.type === 'electric') {
            const yellow = f.hitStunTimer % 4 < 2;
            f.setTint(yellow ? 0xffa7ec : 0xffffff);
        } else {
            if (Math.abs(f.body!.velocity.x) > 5) {
                f.setVelocityX(f.body!.velocity.x * 0.75);
            }
        }

        if (f.hitStunTimer <= 0) {
            f.isHit = false;
            f.clearTint();
            if (f.isOnGround()) this.stateMachine.transition('idle');
            else this.stateMachine.transition('jump', true);
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// KNOCKDOWN estilo KOF: arco de queda → quique → ajoelhado → levantar
// ─────────────────────────────────────────────────────────────────
class KnockdownState extends State {
    private phase: 'fall' | 'lying' = 'fall';
    private lyingTimer = 0;
    private bounced = false;
    private tilt = 0;

    enter(f: Fighter) {
        f.isHit = true;
        f.currentHitbox.active = false;
        f.clearTint();
        f.setGravityY(Fighter.BASE_GRAVITY);
        this.phase = 'fall';
        this.bounced = false;
        // Inclinação suave de queda (sem deitar: termina ajoelhado)
        this.tilt = f.flipX ? -28 : 28;
        f.setPoseTexture('hit');
        // Rasteira/CD no chão ganha um pequeno arco pra trás antes de bater
        if (f.isOnGround()) {
            const dir = f.flipX ? 1 : -1;
            f.setVelocityX(dir * 180);
            f.setVelocityY(-380);
        }
        AudioManager.getInstance().playSFX('swing', 0.2);
    }

    execute(f: Fighter) {
        if (this.phase === 'fall') {
            // Corpo inclina caindo de costas
            f.setAngle(Phaser.Math.Linear(f.angle, this.tilt, 0.18));
            if (f.body!.velocity.y > 100) f.setPoseTexture('ko');

            if (f.isOnGround() && f.body!.velocity.y >= 0) {
                if (!this.bounced) {
                    // Primeiro impacto: quique no chão
                    this.bounced = true;
                    f.setPoseTexture('ko');
                    f.setVelocityY(-210);
                    f.setVelocityX(f.body!.velocity.x * 0.5);
                    AudioManager.getInstance().playSFX('land', 0.8);
                    const vfx = (f.scene as any)?.vfxManager;
                    vfx?.spawnDustCloud(f.x, (f.scene as any)?.floorY ?? f.y);
                    vfx?.cameraShake(0.012);
                } else {
                    // Parou: ajoelhado de cabeça baixa (invencível, como no KOF)
                    this.phase = 'lying';
                    this.lyingTimer = 46;
                    f.setPoseTexture('crouch');
                    f.setAngle(this.tilt * 0.45);
                    f.setVelocity(0, 0);
                    f.currentHurtbox.invincible = true;
                }
            }
        } else {
            this.lyingTimer--;
            const inp = f.inputManager;
            // Tech Roll: segurando direção no chão, rola pro lado levantando
            if (inp && (inp.isLeftDown || inp.isRightDown)) {
                this.stateMachine.transition('wakeup', true);
                return;
            }
            if (this.lyingTimer <= 0) {
                this.stateMachine.transition('wakeup');
            }
        }
    }
}

class WakeupState extends State {
    private timer = 0;
    private techRoll = false;

    enter(f: Fighter, techRoll: boolean = false) {
        this.techRoll = techRoll;
        this.timer = techRoll ? 20 : 15;
        f.currentHurtbox.invincible = true;
        f.currentHitbox.active = false;
        f.setAlpha(0.6); // visual feedback of invincibility

        if (techRoll) {
            const inp = f.inputManager;
            const isFacingLeft = f.flipX;
            const dir = inp?.isLeftDown ? -1 : inp?.isRightDown ? 1 : (isFacingLeft ? -1 : 1);
            f.setVelocityX(430 * dir);
            f.setPoseTexture('crouch_punch');
            AudioManager.getInstance().playSFX('swing', 0.3);
        }
    }

    execute(f: Fighter) {
        this.timer--;

        if (this.techRoll) {
            if (this.timer % 4 === 0) {
                (f.scene as any)?.vfxManager?.spawnAfterImage(f, 0x9fe8ff);
            }
            f.setVelocityX(f.body!.velocity.x * 0.92);
        } else {
            // Levanta girando de deitado pra pé
            f.setAngle(Phaser.Math.Linear(f.angle, 0, 0.22));
            if (this.timer <= 8) f.setPoseTexture('crouch');
        }

        if (this.timer <= 0) {
            this.finish(f);
            this.stateMachine.transition('idle');
        }
    }

    exit(f: Fighter) {
        this.finish(f);
    }

    private finish(f: Fighter) {
        f.currentHurtbox.invincible = false;
        f.setAlpha(1);
        f.setAngle(0);
        f.isHit = false;
    }
}

// ─────────────────────────────────────────────────────────────────
// BLOWBACK (C+D) KOF
// ─────────────────────────────────────────────────────────────────
class BlowbackState extends State {
    private duration = 0;

    enter(f: Fighter) {
        f.setVelocityX(0);
        this.duration = 38;
        f.setPoseTexture('kick'); 
        
        f.currentHitbox.active = true;
        f.currentHitbox.damage = 75;
        f.currentHitbox.hitType = 'blowback';
        f.currentHitbox.hitLevel = 'MID';
        f.currentHitbox.knockback = 750; // Joga pra longe!
        f.currentHitbox.knockdown = true;
        f.currentHitbox.blockstun = 24;
        f.currentHitbox.hitstun = 35;
        f.currentHitbox.setTo(0, 0, 100, 60);
        f.currentHitbox.offsetX = 50;
        f.currentHitbox.offsetY = -50;
        
        AudioManager.getInstance().playSFX('swing', 0.5);
    }

    execute(f: Fighter) {
        this.duration--;
        if (this.duration === 28) {
            f.currentHitbox.active = false;
        }
        if (this.duration <= 0) {
            this.stateMachine.transition('idle');
        }
    }

    exit(f: Fighter) {
        f.currentHitbox.active = false;
        f.clearTint();
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
    private landed = false;
    private bounced = false;
    private tilt = 0;

    enter(f: Fighter) {
        f.isHit = true;
        f.currentHitbox.active = false;
        f.clearTint();
        f.setGravityY(Fighter.BASE_GRAVITY);
        this.landed = false;
        this.bounced = false;
        this.tilt = f.flipX ? -34 : 34;
        // Nocaute com queda real: voa de costas, quica e cai ajoelhado
        f.setPoseTexture('hit');
        if (f.isOnGround()) {
            const dir = f.flipX ? 1 : -1;
            f.setVelocityX(dir * 220);
            f.setVelocityY(-420);
        }
        AudioManager.getInstance().playSFX('swing', 0.4);
    }

    execute(f: Fighter) {
        if (!this.landed) {
            f.setAngle(Phaser.Math.Linear(f.angle, this.tilt, 0.15));
            if (f.body!.velocity.y > 120) f.setPoseTexture('ko');

            if (f.isOnGround() && f.body!.velocity.y >= 0) {
                if (!this.bounced) {
                    this.bounced = true;
                    f.setPoseTexture('ko');
                    f.setVelocityY(-240);
                    f.setVelocityX(f.body!.velocity.x * 0.5);
                    AudioManager.getInstance().playSFX('land', 1);
                    const vfx = (f.scene as any)?.vfxManager;
                    vfx?.spawnDustCloud(f.x, (f.scene as any)?.floorY ?? f.y);
                    vfx?.cameraShake(0.02);
                } else {
                    // Derrota: cai de joelhos com a cabeça baixa
                    this.landed = true;
                    f.setPoseTexture('crouch');
                    f.setAngle(this.tilt * 0.5);
                    f.setVelocity(0, 0);
                }
            }
        }
    }
}

class WinState extends State {
    enter(f: Fighter) {
        f.setVelocityX(0);
        f.clearTint();
        f.setPoseTexture('win');
        f.setVelocityY(0);
        f.setDisplaySize(240, 440);
    }

    execute(f: Fighter) {
        if (f.body?.touching.down && f.body.velocity.y >= 0) {
            f.setVelocityY(0);
        }
    }
}

