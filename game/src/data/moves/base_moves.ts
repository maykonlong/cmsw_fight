export interface MoveData {
    id: string;
    name: string;
    input: string;        // 'LP' | 'MP' | 'HP' | 'LK' | 'MK' | 'HK'
    type: 'normal' | 'special' | 'super' | 'throw';
    hitLevel: 'HIGH' | 'MID' | 'LOW' | 'AIR' | 'UNBLOCKABLE';
    startup: number;      // frames antes de ser ativo
    active: number;       // frames ativos (causa dano)
    recovery: number;     // frames de recuperação
    damage: number;       // dano em HP
    chipDamage: number;   // dano ao bloquear (geralmente 0 para normais)
    hitstun: number;      // frames que o inimigo fica em hit stun
    blockstun: number;    // frames que o inimigo fica em block stun
    knockback: number;    // força de empurrão
    cancelable: boolean;  // pode cancelar em especial
    knockdown: boolean;   // derruba o oponente
    hitboxOffset: { x: number; y: number; w: number; h: number };
    animation: string;    // nome da animação
    soundHit: string;     // SFX ao acertar
    soundBlock: string;   // SFX ao bloquear
    effect: string;       // VFX ao acertar
}

// Frame data da Fase 3
export const BASE_MOVES: Record<string, MoveData> = {
    // ── ATAQUES DE PÉ ───────────────────────────────────────────
    'LP': {
        id: 'LP', name: 'Light Punch', input: 'LP', type: 'normal', hitLevel: 'HIGH',
        startup: 4, active: 4, recovery: 8, damage: 30, chipDamage: 0,
        hitstun: 14, blockstun: 10, knockback: 100, cancelable: true, knockdown: false,
        hitboxOffset: { x: 40, y: -80, w: 60, h: 40 }, animation: 'punch', soundHit: 'hit_light', soundBlock: 'block', effect: 'hit_spark_light'
    },
    'MP': {
        id: 'MP', name: 'Medium Punch', input: 'MP', type: 'normal', hitLevel: 'HIGH',
        startup: 6, active: 5, recovery: 12, damage: 60, chipDamage: 0,
        hitstun: 18, blockstun: 14, knockback: 150, cancelable: true, knockdown: false,
        hitboxOffset: { x: 50, y: -80, w: 70, h: 40 }, animation: 'punch', soundHit: 'hit_medium', soundBlock: 'block', effect: 'hit_spark_medium'
    },
    'HP': {
        id: 'HP', name: 'Heavy Punch', input: 'HP', type: 'normal', hitLevel: 'HIGH',
        startup: 8, active: 6, recovery: 18, damage: 100, chipDamage: 0,
        hitstun: 22, blockstun: 16, knockback: 200, cancelable: false, knockdown: false,
        hitboxOffset: { x: 60, y: -80, w: 80, h: 50 }, animation: 'punch', soundHit: 'hit_heavy', soundBlock: 'block', effect: 'hit_spark_heavy'
    },
    'LK': {
        id: 'LK', name: 'Light Kick', input: 'LK', type: 'normal', hitLevel: 'HIGH',
        startup: 5, active: 4, recovery: 9, damage: 35, chipDamage: 0,
        hitstun: 14, blockstun: 10, knockback: 120, cancelable: true, knockdown: false,
        hitboxOffset: { x: 50, y: -40, w: 80, h: 40 }, animation: 'kick', soundHit: 'hit_light', soundBlock: 'block', effect: 'hit_spark_light'
    },
    'MK': {
        id: 'MK', name: 'Medium Kick', input: 'MK', type: 'normal', hitLevel: 'HIGH',
        startup: 7, active: 5, recovery: 14, damage: 70, chipDamage: 0,
        hitstun: 18, blockstun: 14, knockback: 160, cancelable: true, knockdown: false,
        hitboxOffset: { x: 60, y: -40, w: 90, h: 40 }, animation: 'kick', soundHit: 'hit_medium', soundBlock: 'block', effect: 'hit_spark_medium'
    },
    'HK': {
        id: 'HK', name: 'Heavy Kick', input: 'HK', type: 'normal', hitLevel: 'HIGH',
        startup: 10, active: 7, recovery: 20, damage: 110, chipDamage: 0,
        hitstun: 24, blockstun: 18, knockback: 220, cancelable: false, knockdown: false,
        hitboxOffset: { x: 70, y: -50, w: 100, h: 50 }, animation: 'kick', soundHit: 'hit_heavy', soundBlock: 'block', effect: 'hit_spark_heavy'
    },

    // ── ATAQUES AGACHADOS ───────────────────────────────────────
    'cLP': {
        id: 'cLP', name: 'Crouch Light Punch', input: 'cLP', type: 'normal', hitLevel: 'MID', // Algumas cLP são MID
        startup: 4, active: 4, recovery: 8, damage: 30, chipDamage: 0,
        hitstun: 14, blockstun: 10, knockback: 100, cancelable: true, knockdown: false,
        hitboxOffset: { x: 40, y: -40, w: 60, h: 40 }, animation: 'crouch_attack', soundHit: 'hit_light', soundBlock: 'block', effect: 'hit_spark_light'
    },
    'cMP': {
        id: 'cMP', name: 'Crouch Medium Punch', input: 'cMP', type: 'normal', hitLevel: 'MID',
        startup: 6, active: 5, recovery: 12, damage: 60, chipDamage: 0,
        hitstun: 18, blockstun: 14, knockback: 150, cancelable: true, knockdown: false,
        hitboxOffset: { x: 50, y: -40, w: 70, h: 40 }, animation: 'crouch_attack', soundHit: 'hit_medium', soundBlock: 'block', effect: 'hit_spark_medium'
    },
    'cHP': {
        id: 'cHP', name: 'Crouch Heavy Punch', input: 'cHP', type: 'normal', hitLevel: 'HIGH', // Usado de anti-air
        startup: 8, active: 6, recovery: 20, damage: 90, chipDamage: 0,
        hitstun: 20, blockstun: 14, knockback: 200, cancelable: false, knockdown: false,
        hitboxOffset: { x: 40, y: -90, w: 60, h: 80 }, animation: 'crouch_attack', soundHit: 'hit_heavy', soundBlock: 'block', effect: 'hit_spark_heavy'
    },
    'cLK': {
        id: 'cLK', name: 'Crouch Light Kick', input: 'cLK', type: 'normal', hitLevel: 'LOW',
        startup: 5, active: 4, recovery: 9, damage: 35, chipDamage: 0,
        hitstun: 14, blockstun: 10, knockback: 120, cancelable: true, knockdown: false,
        hitboxOffset: { x: 50, y: -20, w: 80, h: 30 }, animation: 'crouch_attack', soundHit: 'hit_light', soundBlock: 'block', effect: 'hit_spark_light'
    },
    'cMK': {
        id: 'cMK', name: 'Crouch Medium Kick', input: 'cMK', type: 'normal', hitLevel: 'LOW',
        startup: 7, active: 5, recovery: 14, damage: 70, chipDamage: 0,
        hitstun: 18, blockstun: 14, knockback: 160, cancelable: true, knockdown: false,
        hitboxOffset: { x: 60, y: -20, w: 90, h: 30 }, animation: 'crouch_attack', soundHit: 'hit_medium', soundBlock: 'block', effect: 'hit_spark_medium'
    },
    'cHK': { // Sweep (Rasteira)
        id: 'cHK', name: 'Sweep', input: 'cHK', type: 'normal', hitLevel: 'LOW',
        startup: 12, active: 5, recovery: 22, damage: 80, chipDamage: 0,
        hitstun: 0, blockstun: 0, knockback: 250, cancelable: false, knockdown: true,
        hitboxOffset: { x: 70, y: -20, w: 100, h: 30 }, animation: 'crouch_attack', soundHit: 'hit_heavy', soundBlock: 'block', effect: 'hit_spark_heavy'
    },

    // ── ATAQUES AÉREOS ──────────────────────────────────────────
    'jLP': {
        id: 'jLP', name: 'Jump Light Punch', input: 'jLP', type: 'normal', hitLevel: 'AIR',
        startup: 4, active: 10, recovery: 0, damage: 40, chipDamage: 0,
        hitstun: 15, blockstun: 11, knockback: 100, cancelable: false, knockdown: false,
        hitboxOffset: { x: 40, y: -20, w: 60, h: 40 }, animation: 'air_attack', soundHit: 'hit_light', soundBlock: 'block', effect: 'hit_spark_light'
    },
    'jMP': {
        id: 'jMP', name: 'Jump Medium Punch', input: 'jMP', type: 'normal', hitLevel: 'AIR',
        startup: 6, active: 8, recovery: 0, damage: 70, chipDamage: 0,
        hitstun: 19, blockstun: 15, knockback: 150, cancelable: false, knockdown: false,
        hitboxOffset: { x: 50, y: -20, w: 70, h: 40 }, animation: 'air_attack', soundHit: 'hit_medium', soundBlock: 'block', effect: 'hit_spark_medium'
    },
    'jHP': {
        id: 'jHP', name: 'Jump Heavy Punch', input: 'jHP', type: 'normal', hitLevel: 'AIR',
        startup: 8, active: 6, recovery: 0, damage: 110, chipDamage: 0,
        hitstun: 23, blockstun: 17, knockback: 200, cancelable: false, knockdown: false,
        hitboxOffset: { x: 60, y: -20, w: 80, h: 50 }, animation: 'air_attack', soundHit: 'hit_heavy', soundBlock: 'block', effect: 'hit_spark_heavy'
    },
    'jLK': {
        id: 'jLK', name: 'Jump Light Kick', input: 'jLK', type: 'normal', hitLevel: 'AIR',
        startup: 5, active: 10, recovery: 0, damage: 45, chipDamage: 0,
        hitstun: 15, blockstun: 11, knockback: 120, cancelable: false, knockdown: false,
        hitboxOffset: { x: 50, y: 0, w: 80, h: 40 }, animation: 'air_attack', soundHit: 'hit_light', soundBlock: 'block', effect: 'hit_spark_light'
    },
    'jMK': {
        id: 'jMK', name: 'Jump Medium Kick', input: 'jMK', type: 'normal', hitLevel: 'AIR',
        startup: 7, active: 8, recovery: 0, damage: 80, chipDamage: 0,
        hitstun: 19, blockstun: 15, knockback: 160, cancelable: false, knockdown: false,
        hitboxOffset: { x: 60, y: 10, w: 90, h: 40 }, animation: 'air_attack', soundHit: 'hit_medium', soundBlock: 'block', effect: 'hit_spark_medium'
    },
    'jHK': {
        id: 'jHK', name: 'Jump Heavy Kick', input: 'jHK', type: 'normal', hitLevel: 'AIR',
        startup: 10, active: 6, recovery: 0, damage: 120, chipDamage: 0,
        hitstun: 24, blockstun: 19, knockback: 220, cancelable: false, knockdown: false,
        hitboxOffset: { x: 70, y: 20, w: 100, h: 50 }, animation: 'air_attack', soundHit: 'hit_heavy', soundBlock: 'block', effect: 'hit_spark_heavy'
    }
};

