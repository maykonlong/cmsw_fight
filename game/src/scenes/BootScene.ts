import Phaser from 'phaser';
import { ArcadeTheme } from '../ui/ArcadeTheme';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Boot rápido: apenas bases e as poses usadas fora do combate
        // (menu, seleção, VS e vitória). As 75 poses de luta de cada
        // lutador são carregadas sob demanda pelo CombatScene (lazy loading),
        // cortando ~50% da banda da primeira visita em qualquer dispositivo.
        const charKeys = ['kevin', 'kevin_p2', 'vini_dog', 'vini_dog_p2'];
        const commonPoses = ['idle', 'win', 'win_alt'];
        charKeys.forEach(ck => {
            if (!this.textures.exists(ck)) this.load.image(ck, `assets/sprites/${ck}.png`);
            commonPoses.forEach(p => {
                const key = `${ck}_${p}`;
                if (!this.textures.exists(key)) this.load.image(key, `assets/sprites/${key}.png`);
            });
        });

        // Efeitos especiais e itens
        this.load.image('aura_beijo', 'assets/sprites/aura_beijo.png');
        this.load.image('aura_cachorro', 'assets/sprites/aura_cachorro.png');
        this.load.image('hit_spark', 'assets/sprites/hit_spark.png');
        this.load.image('banheiro_portatil', 'assets/sprites/banheiro_portatil.png');

        // Cenários
        this.load.image('stage_bg', 'assets/sprites/stage_bg.png');
        this.load.image('stage_mg', 'assets/sprites/stage_mg.png');
        this.load.image('stage_fg', 'assets/sprites/stage_fg.png');
        this.load.image('stage_kevin_bathroom', 'assets/sprites/stage_kevin_bathroom.png');
        this.load.image('stage_vini_tabacaria', 'assets/sprites/stage_vini_tabacaria.png');

        // Carrega JSONs de dados (chaves idênticas aos IDs dos personagens)
        this.load.json('character_roster', 'data/character_roster.json');
        this.load.json('kevin', 'data/characters/kevin.json');
        this.load.json('vini_dog', 'data/characters/vini_dog.json');
        this.load.json('combat_masters_hq', 'data/stages/combat_masters_hq.json');
        this.load.json('kevin_bathroom', 'data/stages/kevin_bathroom.json');
        this.load.json('vini_tabacaria', 'data/stages/vini_tabacaria.json');

        // Pacote VFX/cenário/cinemática (gerado por scripts/generate_vfx_pack.cjs)
        const vfxAssets = [
            'spark_1', 'spark_2', 'spark_3', 'spark_4',
            'clash_1', 'clash_2', 'clash_3',
            'guard_shield', 'star', 'dust_puff',
            'aura_ring_1', 'aura_ring_2', 'aura_ring_3',
            'electric_bolt_1', 'electric_bolt_2', 'electric_bolt_3',
            'beijo_1', 'beijo_2', 'beijo_3',
            'dog_run_1', 'dog_run_2', 'dog_run_3',
            'vape_puff', 'crowd_1', 'crowd_2', 'neon_open_1', 'neon_open_2'
        ];
        vfxAssets.forEach(k => {
            if (!this.textures.exists(k)) this.load.image(k, `assets/sprites/${k}.png`);
        });

        // Carregamento universal de Audio (SFX, Vozes e Músicas com reservas)
        // Apenas os SFX com arquivos reais no repo são carregados aqui.
        // Vozes (voice/) e Músicas (music/) ainda não possuem assets;
        // o AudioManager cai no synth fallback quando a chave não está no cache.
        const sfxKeys = [
            'hit_light', 'hit_medium', 'hit_heavy', 'block', 'electric_hit', 'throw', 'land'
        ];
        sfxKeys.forEach(key => {
            this.load.audio(key, [
                `assets/audio/sfx/${key}.ogg`,
                `assets/audio/sfx/${key}.mp3`,
                `assets/audio/sfx/${key}.wav`
            ]);
        });

        // Voice lines & music tracks: aguardar assets .ogg/.mp3/.wav no
        // assets/audio/voice e assets/audio/music. Fallback de synth já ativo.
    }

    create() {
        const { width, height } = this.scale;

        ArcadeTheme.background(this, 'red');

        const studioText = this.add.text(width / 2, height / 2 - 60, 'COMBAT MASTERS', {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '84px',
            color: '#ffffff',
            stroke: '#d52821',
            strokeThickness: 10,
        }).setOrigin(0.5).setAlpha(0);

        const titleSubText = this.add.text(width / 2, height / 2 + 10, 'COMBAT MARTIAL SOUL WARRIORS', {
            fontFamily: 'Impact, "Arial Black", sans-serif',
            fontSize: '26px',
            color: '#ffd429',
            stroke: '#101331',
            strokeThickness: 5,
            letterSpacing: 4,
        }).setOrigin(0.5).setAlpha(0);

        const subText = this.add.text(width / 2, height / 2 + 65, 'RESOLVA SUA TRETA AQUI', {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: '22px',
            color: '#8ea6d9',
            stroke: '#000000',
            strokeThickness: 4,
            letterSpacing: 6,
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [studioText, titleSubText, subText],
            alpha: 1,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                this.time.delayedCall(1000, () => {
                    this.tweens.add({
                        targets: [studioText, titleSubText, subText],
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            // Atalho de dev: ?scene=NomeDaCena&p1=kevin&p2=vini_dog&mode=1p
                            const params = new URLSearchParams(window.location.search);
                            const target = params.get('scene');
                            if (target && this.scene.manager.keys[target]) {
                                this.scene.start(target, {
                                    winner: params.get('winner') || 'kevin',
                                    loser: params.get('loser') || 'vini_dog',
                                    p1Wins: Number(params.get('p1Wins')) || 2,
                                    p2Wins: Number(params.get('p2Wins')) || 0,
                                    mode: params.get('mode') || '2p',
                                    p1: params.get('p1') || 'kevin',
                                    p2: params.get('p2') || 'vini_dog',
                                    stage: params.get('stage') || undefined
                                });
                            } else {
                                this.scene.start('MainMenuScene');
                            }
                        }
                    });
                });
            }
        });
    }
}

