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
    public static readonly CENTER_ABOVE_FLOOR = 150;
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
    public characterId: string;
    public bufferedSpecialFrames: number = 0;
    public airAttackUsed: boolean = false;

    // Combo Tracking
    public comboHits: number = 0;
    public comboDamage: number = 0;
    public comboResetTimer?: Phaser.Time.TimerEvent;

    public registerComboHit(damage: number, vfx?: any) {
        this.comboHits++;
        this.comboDamage += damage;
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

        this.setCollideWorldBounds(true);
        this.inputManager = inputManager;
        this.characterId = texture.replace(/_(idle|walk|block|punch|kick|special|crouch|jump|hit|ko|win)$/, '');

        // Init Boxes
        this.currentHitbox = new Hitbox(0, 0, 0, 0);
        this.currentHurtbox = new Hurtbox(0, 0, 100, 265);
        this.currentHurtbox.offsetX = -50;
        this.currentHurtbox.offsetY = -112;

        this.pushbox = new Pushbox(0, 0, 75, 180);
        this.pushbox.offsetX = -37.5;
        this.pushbox.offsetY = -30;

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
        this.applyVisualSize();
    }

    update() {
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

    public isOnGround(): boolean {
        const body = this.body as Phaser.Physics.Arcade.Body;
        const groundY = (this.scene.cache.json.get('cmsw_hq')?.groundY ?? 590) - Fighter.CENTER_ABOVE_FLOOR;
        const distToGround = Math.abs(this.y - groundY);
        const isPhysicsGrounded = Boolean(body?.blocked.down || body?.touching.down);
        const isNearFloor = distToGround <= 4 && (body?.velocity.y ?? 0) >= 0;
        return isPhysicsGrounded || isNearFloor;
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
        this.applyVisualSize();
    }

    private applyVisualSize() {
        // Poses largas precisam de canvas mais largo, não de um corpo menor.
        // A altura e a escala dos pixels permanecem constantes entre quadros.
        const displayWidth = this.width >= 400
            ? this.width * (Fighter.DISPLAY_HEIGHT / this.height)
            : Fighter.DISPLAY_WIDTH;
        this.setDisplaySize(displayWidth, Fighter.DISPLAY_HEIGHT);
        const body = this.body as Phaser.Physics.Arcade.Body;
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
    enter(f: Fighter) {
        f.setPoseTexture('idle');
    }
    execute(f: Fighter) {
        f.setVelocityX(0);
        if (!f.inputManager) return;
        const inp = f.inputManager;

        // Reconhecimento de comandos especiais
        const cmd = CommandRecognizer.checkCommands(inp.buffer, inp.currentFrame, f.flipX);
        if (cmd === '236P' || cmd === '623P' || cmd === '214K') {
            this.stateMachine.transition('special', cmd); return;
        }
        if (f.bufferedSpecialFrames > 0) { f.bufferedSpecialFrames = 0; this.stateMachine.transition('special', f.getDefaultSpecialCommand()); return; }

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
        const isFacingLeft = f.flipX;
        const holdBack = isFacingLeft ? inp.isRightDown : inp.isLeftDown;
        if (holdBack) {
            this.stateMachine.transition('block_high'); return;
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

        this.walkTimer++;
        if (this.walkTimer % 16 < 8) {
            f.setPoseTexture('walk_2');
        } else {
            f.setPoseTexture('walk');
        }

        const cmd = CommandRecognizer.checkCommands(inp.buffer, inp.currentFrame, f.flipX);
        if (cmd === '236P' || cmd === '623P' || cmd === '214K') {
            this.stateMachine.transition('special', cmd); return;
        }
        if (f.bufferedSpecialFrames > 0) { f.bufferedSpecialFrames = 0; this.stateMachine.transition('special', f.getDefaultSpecialCommand()); return; }

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
        const isFacingLeft = f.flipX;
        const holdBack = isFacingLeft ? inp.isRightDown : inp.isLeftDown;
        if (holdBack) {
            this.stateMachine.transition('block_high'); return;
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
    enter(f: Fighter, resume: boolean = false) {
        if (!resume && !f.isOnGround()) return; // IMPEDE DUPLO PULO ABSOLUTAMENTE!
        this.airFrames = resume ? 9 : 0;
        f.setPoseTexture('jump_1');
        if (resume) return;
        f.airAttackUsed = false;
        f.setVelocityY(-f.jumpForce);
        if (!f.inputManager) return;
        if (f.inputManager.isLeftDown)  f.setVelocityX(-f.speed * 0.85);
        else if (f.inputManager.isRightDown) f.setVelocityX(f.speed * 0.85);
    }

    execute(f: Fighter) {
        this.airFrames++;
        const body = f.body as Phaser.Physics.Arcade.Body;
        const vy = body?.velocity.y ?? 0;

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

        // Aerial attacks
        if (inp.isLPJustPressed) { this.stateMachine.transition('air_LP'); return; }
        if (inp.isMPJustPressed) { this.stateMachine.transition('air_MP'); return; }
        if (inp.isHPJustPressed) { this.stateMachine.transition('air_HP'); return; }
        if (inp.isLKJustPressed) { this.stateMachine.transition('air_LK'); return; }
        if (inp.isMKJustPressed) { this.stateMachine.transition('air_MK'); return; }
        if (inp.isHKJustPressed) { this.stateMachine.transition('air_HK'); return; }
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
        if (cmd === '236P' || cmd === '623P' || cmd === '214K') {
            this.stateMachine.transition('special', cmd); return;
        }
        if (f.bufferedSpecialFrames > 0) { f.bufferedSpecialFrames = 0; this.stateMachine.transition('special', f.getDefaultSpecialCommand()); return; }

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
        
        const isAir = this.moveData.hitLevel === 'AIR';
        if (isAir) f.airAttackUsed = true;
        const isCrouch = this.moveData.input.startsWith('c');
        const poseName = isAir
            ? `air_${this.moveData.input.includes('K') ? 'kick' : 'punch'}`
            : isCrouch
                ? (this.moveData.input.includes('K') ? 'sweep' : 'crouch_punch')
                : (this.moveData.input.includes('K') ? 'kick' : 'punch');
        f.setPoseTexture(poseName);
        AudioManager.getInstance().playSFX('swing', 0.32);
        
        // Copiar dados pro hitbox atual
        f.currentHitbox.damage = this.moveData.damage;
        f.currentHitbox.hitType = this.moveData.type;
        f.currentHitbox.hitLevel = this.moveData.hitLevel;
        f.currentHitbox.knockdown = this.moveData.knockdown;
        f.currentHitbox.knockback = this.moveData.knockback;
        f.currentHitbox.hitstun = this.moveData.hitstun;
        f.currentHitbox.blockstun = this.moveData.blockstun;
        f.currentHitbox.soundHit = this.moveData.soundHit;
        
        f.currentHitbox.offsetX = this.moveData.hitboxOffset.x;
        f.currentHitbox.offsetY = this.moveData.hitboxOffset.y;
        f.currentHitbox.setTo(0, 0, this.moveData.hitboxOffset.w, this.moveData.hitboxOffset.h);

    }

    execute(f: Fighter) {
        this.duration++;

        // A colisão com o chão encerra o golpe; nunca cria um segundo salto.
        if (this.moveData.hitLevel === 'AIR' && this.duration > 1 && f.isOnGround()) {
            f.currentHitbox.active = false;
            this.stateMachine.transition('land');
            return;
        }

        // Ativa hitbox durante os frames active
        if (this.duration === this.moveData.startup + 1) {
            const isAir = this.moveData.hitLevel === 'AIR';
            const isCrouch = this.moveData.input.startsWith('c');
            const poseName = isAir
                ? `air_${this.moveData.input.includes('K') ? 'kick' : 'punch'}`
                : isCrouch
                    ? (this.moveData.input.includes('K') ? 'sweep' : 'crouch_punch')
                    : (this.moveData.input.includes('K') ? 'kick' : 'punch');
            f.setPoseTexture(`${poseName}_2`);
            f.currentHitbox.active = true;
        }

        // Desativa hitbox
        if (this.duration === this.moveData.startup + this.moveData.active + 1) {
            const isAir = this.moveData.hitLevel === 'AIR';
            const isCrouch = this.moveData.input.startsWith('c');
            const poseName = isAir
                ? `air_${this.moveData.input.includes('K') ? 'kick' : 'punch'}`
                : isCrouch
                    ? (this.moveData.input.includes('K') ? 'sweep' : 'crouch_punch')
                    : (this.moveData.input.includes('K') ? 'kick' : 'punch');
            f.setPoseTexture(poseName);
            f.currentHitbox.active = false;
        }

        // Janela de Target Combo Chain & Special Cancel
        if (this.moveData.hitLevel !== 'AIR' && this.duration > this.moveData.startup + 1) {
            if (f.inputManager) {
                const inp = f.inputManager;
                const isCrouch = inp.isDownDown;

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
                if (cmd === '236P' || cmd === '623P' || cmd === '214K') {
                    f.currentHitbox.active = false;
                    f.clearTint();
                    this.stateMachine.transition('special', cmd);
                    return;
                }
            }
        }

        if (this.moveData.hitLevel !== 'AIR' && f.bufferedSpecialFrames > 0 && this.duration > this.moveData.startup + this.moveData.active) {
            f.bufferedSpecialFrames = 0;
            f.currentHitbox.active = false;
            this.stateMachine.transition('special', f.getDefaultSpecialCommand());
            return;
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
// SPECIAL
// ─────────────────────────────────────────────────────────────────
class SpecialState extends State {
    private duration = 0;
    private fired = false;
    private cmd: string = '';

    enter(f: Fighter, cmd: string = '236P') {
        f.setPoseTexture('special');
        f.setVelocityX(0);
        this.duration = 45;
        this.fired = false;
        this.cmd = cmd;
        f.currentHitbox.active = false;
        f.setTint(f.characterId.includes('vini') ? 0x66ccff : 0xff77dd);
    }

    execute(f: Fighter) {
        this.duration--;

        if (!this.fired && this.duration === 32) {
            this.fired = true;
            f.setPoseTexture('special_2');
            if (this.cmd === '623P') {
                f.setVelocityY(-600);
                f.currentHitbox.setTo(0, 0, 110, 145);
                f.currentHitbox.offsetX = 15;
                f.currentHitbox.offsetY = -110;
                f.currentHitbox.damage = 110;
                f.currentHitbox.knockback = 280;
                f.currentHitbox.hitstun = 28;
                f.currentHitbox.blockstun = 18;
                f.currentHitbox.hitLevel = 'HIGH';
                f.currentHitbox.hitType = 'special';
                f.currentHitbox.active = true;
            } else {
                f.emit('fire_special', f);
            }
        }

        if (this.cmd === '623P' && this.duration === 18) f.currentHitbox.active = false;

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
        this.duration = 20; // 20 frames de animação de throw
        f.setTint(0x00ff00);
        
        // A lógica de aplicar o throw no oponente será processada pelo CombatSystem
        // Apenas criamos uma hitbox "UNBLOCKABLE" que se conecta imediatamente
        f.currentHitbox.active = true;
        f.currentHitbox.damage = 120;
        f.currentHitbox.hitType = 'throw';
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

class KnockdownState extends State {
    private timer = 0;
    enter(f: Fighter) {
        f.isHit = true;
        this.timer = 50; // hard knockdown 50 frames
        f.setVelocityX(0);
        f.currentHitbox.active = false;
        f.setPoseTexture('ko');
    }
    execute(_f: Fighter) {
        this.timer--;
        if (this.timer <= 0) {
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
        f.setPoseTexture('ko');
        f.setVelocityX(0);
        f.setVelocityY(0);
        f.isHit = true;
        f.currentHitbox.active = false;
        f.clearTint();
        f.setAngle(0);
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
