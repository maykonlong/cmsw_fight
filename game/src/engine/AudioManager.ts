import Phaser from 'phaser';

export class AudioManager {
    private static instance: AudioManager;
    private scene!: Phaser.Scene;

    private currentMusic?: Phaser.Sound.BaseSound;

    // Volumes
    public musicVolume: number = 0.5;
    public sfxVolume: number = 0.8;
    public voiceVolume: number = 1.0;

    private constructor() {
        this.loadSettings();
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    public setScene(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public loadSettings() {
        const mv = localStorage.getItem('cmsw_music_vol');
        const sv = localStorage.getItem('cmsw_sfx_vol');
        const vv = localStorage.getItem('cmsw_voice_vol');

        if (mv !== null) this.musicVolume = parseFloat(mv);
        if (sv !== null) this.sfxVolume = parseFloat(sv);
        if (vv !== null) this.voiceVolume = parseFloat(vv);
    }

    public saveSettings() {
        localStorage.setItem('cmsw_music_vol', this.musicVolume.toString());
        localStorage.setItem('cmsw_sfx_vol', this.sfxVolume.toString());
        localStorage.setItem('cmsw_voice_vol', this.voiceVolume.toString());

        // Update current music volume
        if (this.currentMusic) {
            // @ts-ignore
            if (this.currentMusic.setVolume) this.currentMusic.setVolume(this.musicVolume);
        }
    }

    public playMusic(key: string, loop: boolean = true) {
        if (!this.scene) return;

        // Don't restart if already playing
        if (this.currentMusic && this.currentMusic.key === key && this.currentMusic.isPlaying) {
            return;
        }

        this.stopMusic();

        if (this.scene.cache.audio.exists(key)) {
            this.currentMusic = this.scene.sound.add(key, { volume: this.musicVolume, loop });
            this.currentMusic.play();
        } else {
            console.warn(`AudioManager: Music '${key}' not found in cache.`);
        }
    }

    public stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic.destroy();
            this.currentMusic = undefined;
        }
    }

    public playSFX(key: string, volumeScale: number = 1.0) {
        if (!this.scene) return;

        if (this.scene.cache.audio.exists(key)) {
            this.scene.sound.play(key, { volume: this.sfxVolume * volumeScale });
        } else {
            // console.warn(`AudioManager: SFX '${key}' not found.`);
        }
    }

    public playVoice(key: string) {
        if (!this.scene) return;

        if (this.scene.cache.audio.exists(key)) {
            this.scene.sound.play(key, { volume: this.voiceVolume });
        } else {
            // console.warn(`AudioManager: Voice '${key}' not found.`);
        }
    }

    public playUI(key: string) {
        this.playSFX(key, 0.8);
    }
}
