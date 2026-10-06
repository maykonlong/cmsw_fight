import Phaser from 'phaser';
import { Hitbox } from './Hitbox';
import { Hurtbox } from './Hurtbox';
import { Pushbox } from './Pushbox';

export class CombatSystem {
    // Verifica interseção entre hitbox e hurtbox (Hit detection)
    public static checkHitboxCollision(hitbox: Hitbox, hurtbox: Hurtbox): boolean {
        if (!hitbox.active || hurtbox.invincible) return false;
        return Phaser.Geom.Intersects.RectangleToRectangle(hitbox, hurtbox);
    }

    // Verifica interseção entre pushboxes e retorna o quanto eles se sobrepõem no eixo X
    // Se não sobrepõem, retorna 0.
    public static checkPushboxCollision(pb1: Pushbox, pb2: Pushbox): number {
        if (Phaser.Geom.Intersects.RectangleToRectangle(pb1, pb2)) {
            const overlapX = Math.min(pb1.right - pb2.left, pb2.right - pb1.left);
            return overlapX;
        }
        return 0;
    }

    // Separa os personagens baseados no overlapX
    // Em jogos de luta, geralmente quem está atacando empurra o outro, 
    // ou se ambos andam, dividem o pushback.
    public static resolvePushbox(pb1: Pushbox, pb2: Pushbox, char1: any, char2: any) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(pb1, pb2)) {
            const center1 = pb1.x + pb1.width / 2;
            const center2 = pb2.x + pb2.width / 2;
            
            // pushback is divided equally for now
            // find penetration depth
            let overlap = 0;
            if (center1 < center2) {
                overlap = pb1.right - pb2.left;
                char1.x -= overlap / 2;
                char2.x += overlap / 2;
            } else {
                overlap = pb2.right - pb1.left;
                char1.x += overlap / 2;
                char2.x -= overlap / 2;
            }
        }
    }

    public static calculateDamage(move: Hitbox, isCounter: boolean): number {
        let damage = move.damage;
        if (isCounter) damage = Math.floor(damage * 1.25);
        return damage;
    }

    public static checkThrowRange(thrower: any, target: any): boolean {
        const distance = Phaser.Math.Distance.Between(thrower.x, thrower.y, target.x, target.y);
        return distance < thrower.throwRange;
    }

    // attackerState pode ser passado para checar se está em startup para dar counter
    public static applyHit(attacker: any, defender: any, hitbox: Hitbox, isCounterHit: boolean = false): 'hit' | 'blocked' | 'none' {
        if (defender.isHit) return 'none';

        // Auto-Guard: Defender bloqueia se estiver no estado de bloqueio OU segurando/andando para trás
        const isHoldingBack = Boolean(defender.isHoldingBack);
        const isHoldingLowBack = Boolean(defender.isHoldingLowBack);
        const isCurrentlyBlocking = Boolean(defender.isBlocking);
        const canAutoBlock = (isHoldingBack || isHoldingLowBack || isCurrentlyBlocking) && hitbox.hitLevel !== 'UNBLOCKABLE';

        if (canAutoBlock) {
            const currentState = defender.stateMachine.state;
            const isDefendingLow = currentState === 'block_low' || isHoldingLowBack;
            const isDefendingHigh = currentState === 'block_high' || (isHoldingBack && !isHoldingLowBack);

            let blocked = false;
            if (hitbox.hitLevel === 'HIGH' && isDefendingHigh) blocked = true;
            else if (hitbox.hitLevel === 'LOW' && isDefendingLow) blocked = true;
            else if (hitbox.hitLevel === 'MID' && (isDefendingHigh || isDefendingLow)) blocked = true;
            else if (hitbox.hitLevel === 'AIR' && isDefendingHigh) blocked = true;

            if (blocked) {
                defender.hitStunTimer = hitbox.blockstun;
                const dir = attacker.x < defender.x ? 1 : -1;
                defender.setVelocityX(hitbox.knockback * 0.5 * dir);
                if (typeof defender.addSuperEnergy === 'function') defender.addSuperEnergy(25);
                if (typeof attacker.addSuperEnergy === 'function') attacker.addSuperEnergy(15);
                defender.stateMachine.transition(isDefendingLow ? 'block_low' : 'block_high');
                return 'blocked';
            }
        }
        
        // Se chegou aqui, hit limpo
        const finalDamage = this.calculateDamage(hitbox, isCounterHit);
        const dir = attacker.x < defender.x ? 1 : -1;
        
        defender.hp -= finalDamage;
        if (defender.hp < 0) defender.hp = 0;

        if (typeof defender.addSuperEnergy === 'function') defender.addSuperEnergy(60);
        if (typeof attacker.addSuperEnergy === 'function') attacker.addSuperEnergy(40);

        // Rastrear repetição do mesmo golpe para prevenir armadilhas "infinitas" sem saída
        if (attacker) {
            const moveKey = hitbox.moveId || hitbox.hitType;
            if (attacker.lastMoveId === moveKey && moveKey !== '') {
                attacker.sameMoveHits = (attacker.sameMoveHits || 1) + 1;
            } else {
                attacker.lastMoveId = moveKey;
                attacker.sameMoveHits = 1;
            }

            // Se o oponente tentar travar o jogador repetindo EXATAMENTE o mesmo golpe 10 vezes (Prevenção de infinito):
            if (attacker.sameMoveHits >= 10) {
                attacker.sameMoveHits = 0;
                defender.setVelocityX(hitbox.knockback * 4.2 * dir);
                defender.hitStunTimer = 2;
                defender.isHit = false;
                if (attacker.scene?.vfxManager) {
                    attacker.scene.vfxManager.showComboText(0, defender.x, defender.y - 120, 'BURST ESCAPE!');
                }
                defender.stateMachine.transition('knockdown');
                return 'hit';
            }
        }

        defender.setVelocityX(hitbox.knockback * dir);
        
        // Registrar hit no sistema de combos do atacante
        if (attacker && typeof attacker.registerComboHit === 'function') {
            attacker.registerComboHit(finalDamage, attacker.scene?.vfxManager);
        }

        defender.hitStunTimer = hitbox.hitstun;
        defender.stateMachine.transition(hitbox.knockdown ? 'knockdown' : 'hit', hitbox.hitType);
        return 'hit';
    }
}
