import Phaser from 'phaser';
import { ArcadeTheme } from '../ui/ArcadeTheme';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        const poses = ['idle', 'walk', 'jump', 'air_punch', 'air_kick', 'crouch', 'crouch_punch', 'sweep', 'block', 'punch', 'kick', 'special', 'hit', 'ko', 'win'];

        // Carrega todas as imagens de poses individuais do Kevin (P1 e P2, incluindo frames _2 e _3 de pulo)
        this.load.image('kevin', 'assets/sprites/kevin.png');
        poses.forEach(p => {
            this.load.image(`kevin_${p}`, `assets/sprites/kevin_${p}.png`);
            this.load.image(`kevin_p2_${p}`, `assets/sprites/kevin_p2_${p}.png`);
            this.load.image(`kevin_${p}_2`, `assets/sprites/kevin_${p}_2.png`);
            this.load.image(`kevin_p2_${p}_2`, `assets/sprites/kevin_p2_${p}_2.png`);
        });
        [1, 2, 3].forEach(n => {
            this.load.image(`kevin_jump_${n}`, `assets/sprites/kevin_jump_${n}.png`);
            this.load.image(`kevin_p2_jump_${n}`, `assets/sprites/kevin_p2_jump_${n}.png`);
        });

        // Carrega todas as imagens de poses individuais do Vini Dog (P1 e P2, incluindo frames _2 e _3 de pulo)
        this.load.image('vini_dog', 'assets/sprites/vini_dog.png');
        poses.forEach(p => {
            this.load.image(`vini_dog_${p}`, `assets/sprites/vini_dog_${p}.png`);
            this.load.image(`vini_dog_p2_${p}`, `assets/sprites/vini_dog_p2_${p}.png`);
            this.load.image(`vini_dog_${p}_2`, `assets/sprites/vini_dog_${p}_2.png`);
            this.load.image(`vini_dog_p2_${p}_2`, `assets/sprites/vini_dog_p2_${p}_2.png`);
        });
        [1, 2, 3].forEach(n => {
            this.load.image(`vini_dog_jump_${n}`, `assets/sprites/vini_dog_jump_${n}.png`);
            this.load.image(`vini_dog_p2_jump_${n}`, `assets/sprites/vini_dog_p2_jump_${n}.png`);
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
        this.load.json('kevin', 'data/characters/kevin.json');
        this.load.json('vini_dog', 'data/characters/vini_dog.json');
        this.load.json('cmsw_hq', 'data/stages/cmsw_hq.json');
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

        const musicKeys = ['menu_bgm', 'char_select', 'stage_cmsw', 'stage_street', 'victory', 'game_over'];
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

        const studioText = this.add.text(width / 2, height / 2 - 60, 'CMSW', {
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
