import Phaser from 'phaser';
import { ArcadeTheme } from '../ui/ArcadeTheme';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        const poses = [
            'idle', 'walk', 'walk_2', 'walk_3', 'walk_back', 'run_1', 'run_2', 'run_3', 'run_back_1', 'run_back_2', 'run_back_3',
            'jump', 'jump_1', 'jump_2', 'jump_3',
            'air_punch', 'air_punch_2', 'air_punch_3', 'air_punch_4',
            'air_kick', 'air_kick_2', 'air_kick_3', 'air_kick_4',
            'air_kick_up', 'air_kick_up_2', 'air_kick_up_3', 'air_kick_up_4', 
            'air_kick_diag', 'air_kick_diag_2', 'air_kick_diag_3', 'air_kick_diag_4',
            'crouch', 'crouch_punch', 'crouch_punch_2', 'crouch_punch_3', 'crouch_punch_4',
            'sweep', 'sweep_2', 'sweep_3', 'sweep_4',
            'block', 
            'punch', 'punch_2', 'punch_3', 'punch_4', 
            'punch_l', 'punch_l_2', 'punch_l_3', 'punch_l_4', 
            'punch_r', 'punch_r_2', 'punch_r_3', 'punch_r_4',
            'kick', 'kick_2', 'kick_3', 'kick_4', 
            'kick_l', 'kick_l_2', 'kick_l_3', 'kick_l_4', 
            'kick_r', 'kick_r_2', 'kick_r_3', 'kick_r_4',
            'special', 'special_2', 'special_3', 'special_4',
            'throw', 'throw_2', 'thrown',
            'hit', 'ko', 'win'
        ];

        // Carrega todas as imagens de poses individuais do Kevin (P1 e P2)
        this.load.image('kevin', 'assets/sprites/kevin.png');
        poses.forEach(p => {
            const k1 = `kevin_${p}`;
            const k2 = `kevin_p2_${p}`;
            if (!this.textures.exists(k1)) this.load.image(k1, `assets/sprites/${k1}.png`);
            if (!this.textures.exists(k2)) this.load.image(k2, `assets/sprites/${k2}.png`);
        });

        // Carrega todas as imagens de poses individuais do Vini Dog (P1 e P2)
        this.load.image('vini_dog', 'assets/sprites/vini_dog.png');
        poses.forEach(p => {
            const v1 = `vini_dog_${p}`;
            const v2 = `vini_dog_p2_${p}`;
            if (!this.textures.exists(v1)) this.load.image(v1, `assets/sprites/${v1}.png`);
            if (!this.textures.exists(v2)) this.load.image(v2, `assets/sprites/${v2}.png`);
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

        // Carregamento universal de Audio (SFX, Vozes e Músicas com reservas)
        const sfxKeys = [
            'hit_light', 'hit_medium', 'hit_heavy', 'block', 'electric_hit', 'throw', 'land',
            'swing', 'ui_cursor', 'ui_select', 'ui_cancel', 'electric_cast', 'dog_cast',
            'vape_smoke', 'shower_water', 'dog_bark'
        ];
        sfxKeys.forEach(key => {
            this.load.audio(key, [
                `assets/audio/sfx/${key}.ogg`,
                `assets/audio/sfx/${key}.mp3`,
                `assets/audio/sfx/${key}.wav`
            ]);
        });

        const voiceKeys = ['round_1', 'round_2', 'round_3', 'fight', 'ko', 'time_over', 'perfect', 'you_win', 'you_lose'];
        voiceKeys.forEach(key => {
            this.load.audio(key, [
                `assets/audio/voice/${key}.ogg`,
                `assets/audio/voice/${key}.mp3`,
                `assets/audio/voice/${key}.wav`
            ]);
        });

        const musicKeys = ['menu_bgm', 'char_select', 'stage_combat_masters', 'stage_street', 'victory', 'game_over'];
        musicKeys.forEach(key => {
            this.load.audio(key, [
                `assets/audio/music/${key}.ogg`,
                `assets/audio/music/${key}.mp3`,
                `assets/audio/music/${key}.wav`
            ]);
        });
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
                        onComplete: () => this.scene.start('MainMenuScene')
                    });
                });
            }
        });
    }
}

