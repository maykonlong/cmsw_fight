import Phaser from 'phaser';

export class AudioManager {
    private static instance: AudioManager;
    private scene!: Phaser.Scene;

    private currentMusic?: Phaser.Sound.BaseSound;
    private synthContext?: AudioContext;
    private synthMusicKey?: string;
    private synthMusicTimer?: number;
    private synthMusicStep = 0;
    private resumeListenersAttached = false;

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
        if (!this.resumeListenersAttached) {
            const resume = () => { void this.synthContext?.resume(); };
            window.addEventListener('pointerdown', resume);
            window.addEventListener('keydown', resume);
            this.resumeListenersAttached = true;
        }
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
        if (this.synthMusicKey === key) return;

        this.stopMusic();

        if (this.scene.cache.audio.exists(key)) {
            this.currentMusic = this.scene.sound.add(key, { volume: this.musicVolume, loop });
            this.currentMusic.play();
        } else {
            this.playSynthMusic(key, loop);
        }
    }

    public stopMusic() {
        if (this.synthMusicTimer !== undefined) window.clearInterval(this.synthMusicTimer);
        this.synthMusicTimer = undefined;
        this.synthMusicKey = undefined;
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
            const electric = key === 'electric_hit' || key === 'electric_cast';
            const frequency = electric ? 720 : key === 'dog_cast' ? 260 : key === 'block' ? 420 : key === 'ui_cursor' ? 620 : 180;
            this.playTone(frequency, electric ? 0.22 : 0.13,
                this.sfxVolume * volumeScale * 0.12, electric ? 'sawtooth' : 'square');
        }
    }

    public playVoice(key: string) {
        if (!this.scene) return;

        if (this.scene.cache.audio.exists(key)) {
            this.scene.sound.play(key, { volume: this.voiceVolume });
        } else {
            const root = key === 'ko' ? 196 : key === 'fight' ? 440 : 330;
            this.playTone(root, 0.17, this.voiceVolume * 0.12, 'sawtooth');
            window.setTimeout(() => this.playTone(key === 'ko' ? root * 0.6 : root * 1.5,
                0.26, this.voiceVolume * 0.12, 'sawtooth'), 130);
        }
    }

    public playUI(key: string) {
        this.playSFX(key, 0.8);
    }

    private getSynthContext(): AudioContext | undefined {
        if (!this.synthContext && typeof window.AudioContext !== 'undefined') {
            this.synthContext = new window.AudioContext();
        }
        return this.synthContext;
    }

    private playTone(frequency: number, duration: number, volume: number, type: OscillatorType = 'triangle') {
        if (volume <= 0) return;
        const context = this.getSynthContext();
        if (!context) return;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(50, frequency * 0.75), context.currentTime + duration);
        gain.gain.setValueAtTime(Math.max(0.0001, volume), context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + duration);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }

    private playSynthMusic(key: string, loop: boolean) {
        this.synthMusicKey = key;
        this.synthMusicStep = 0;
        const melodies: Record<string, number[]> = {
            menu_bgm: [220, 0, 330, 392, 330, 0, 262, 196],
            char_select: [330, 392, 440, 392, 330, 262, 294, 0],
            stage_cmsw: [165, 220, 262, 220, 196, 247, 294, 247],
            victory: [392, 523, 659, 784, 659, 523, 784, 0],
            game_over: [220, 196, 165, 147, 131, 0, 131, 0],
        };
        const melody = melodies[key] ?? melodies.menu_bgm;
        this.synthMusicTimer = window.setInterval(() => {
            if (this.synthMusicKey !== key) return;
            const note = melody[this.synthMusicStep % melody.length];
            if (note) this.playTone(note, 0.15, this.musicVolume * 0.055, 'triangle');
            if (this.synthMusicStep % 4 === 0) this.playTone(82, 0.09, this.musicVolume * 0.03, 'square');
            this.synthMusicStep++;
            if (!loop && this.synthMusicStep >= melody.length) this.stopMusic();
        }, 220);
    }
}
