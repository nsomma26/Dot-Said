import { hashString } from './utils.js';

export class AudioManager {
    constructor(config) {
        this.config = config.audio;
        this.INTRO_VOLUME = this.config.introVolume;
        this.INTRO_AMBIENT_VOLUME = this.config.introAmbientVolume;
        this.TOUCH_VOLUME = this.config.touchVolume;

        this.introSound = document.getElementById('intro-audio');
        this.touchSoundTemplate = document.getElementById('touch-audio');
        this.introSound.volume = this.INTRO_VOLUME;
        this.introSound.load();
        this.touchSoundTemplate.volume = this.TOUCH_VOLUME;

        this.touchSoundPool = [this.touchSoundTemplate, ...Array.from({ length: this.config.touchPoolSize }, () => {
            const audio = new Audio('./star2.mp3');
            audio.preload = 'auto';
            audio.volume = this.TOUCH_VOLUME;
            return audio;
        })];

        this.touchSoundIndex = 0;
        this.touchAudioContext = null;
        this.touchSampleBuffer = null;
        this.touchSampleLoadPromise = null;
        this.audioUnlocked = false;
        this.introFadeActive = false;
        this.introAmbientMode = false;
        this.introShouldPlay = true;
        this.introFadeRaf = null;
    }

    startIntroSound() {
        if (!this.introShouldPlay || this.introFadeActive || !this.audioUnlocked) return;

        this.introSound.volume = this.introAmbientMode ? this.INTRO_AMBIENT_VOLUME : this.INTRO_VOLUME;
        if (!this.introAmbientMode) {
            this.introSound.currentTime = 0;
        }

        const playAttempt = this.introSound.play();
        if (playAttempt) {
            playAttempt.catch(() => {
                this.introSound.load();
                this.introSound.play().catch(() => {});
            });
        }
    }

    primeTouchAudioContext() {
        if (!this.touchAudioContext) {
            this.touchAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.touchAudioContext.state === 'suspended') {
            this.touchAudioContext.resume();
        }
    }

    async fetchTouchSampleArrayBuffer() {
        if (window.location.protocol === 'file:') {
            throw new Error('Su file:// l\'audio usa il fallback HTMLAudioElement.');
        }

        const paths = [...this.config.paths.touch, this.touchSoundTemplate.currentSrc].filter(Boolean);
        for (const path of paths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    return await response.arrayBuffer();
                }
            } catch (_) {}
        }
        throw new Error('Impossibile caricare star2.mp3');
    }

    loadTouchSampleBuffer() {
        if (this.touchSampleBuffer) {
            return Promise.resolve(this.touchSampleBuffer);
        }
        if (this.touchSampleLoadPromise) {
            return this.touchSampleLoadPromise;
        }

        this.touchSampleLoadPromise = (async () => {
            this.primeTouchAudioContext();
            const arrayBuffer = await this.fetchTouchSampleArrayBuffer();
            this.touchSampleBuffer = await this.touchAudioContext.decodeAudioData(arrayBuffer.slice(0));
            return this.touchSampleBuffer;
        })().catch((error) => {
            this.touchSampleLoadPromise = null;
            throw error;
        });

        return this.touchSampleLoadPromise;
    }

    unlockAudio() {
        if (!this.audioUnlocked) {
            this.audioUnlocked = true;
            this.startIntroSound();
            this.primeTouchAudioContext();
            if (this.touchAudioContext) {
                this.touchAudioContext.resume()
                    .then(() => this.loadTouchSampleBuffer())
                    .catch(() => this.loadTouchSampleBuffer().catch(() => {}));
            } else {
                this.loadTouchSampleBuffer().catch(() => {});
            }

            for (const sound of this.touchSoundPool) {
                const attempt = sound.play();
                if (attempt) {
                    attempt.then(() => {
                        sound.pause();
                        sound.currentTime = 0;
                    }).catch(() => {});
                }
            }
            return;
        }

        this.startIntroSound();
    }

    makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }

    getWordSoundProfile(starNode) {
        const word = starNode?.word || '';
        const hash = hashString(word + starNode?.starIndex);
        const order = starNode?.wordOrderIndex ?? 0;
        return {
            playbackRate: 0.86 + (hash % 28) / 100 + order * 0.028,
            filterFreq: 520 + (hash % 1400),
            filterQ: 0.45 + (hash % 12) / 10,
            startOffset: (hash % 45) / 1000,
            duration: 0.16 + (hash % 20) / 100,
            microGlitch: hash % 7 === 0
        };
    }

    playTouchSample({
        playbackRate = 1,
        startOffset = 0,
        duration = 0.22,
        volume = this.TOUCH_VOLUME,
        filterType = 'bandpass',
        filterFreq = 900,
        filterQ = 0.7,
        distortion = 0,
        delay = 0
    }) {
        if (!this.touchAudioContext || !this.touchSampleBuffer) return;

        const ctx = this.touchAudioContext;
        const now = ctx.currentTime + delay;
        const playDuration = Math.min(duration, this.touchSampleBuffer.duration - startOffset);
        if (playDuration <= 0) return;

        const source = ctx.createBufferSource();
        source.buffer = this.touchSampleBuffer;
        source.playbackRate.value = playbackRate;

        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = filterFreq;
        filter.Q.value = filterQ;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, now);
        gain.gain.linearRampToValueAtTime(0, now + playDuration + 0.05);

        let output = source;
        if (distortion > 0) {
            const shaper = ctx.createWaveShaper();
            shaper.curve = this.makeDistortionCurve(distortion);
            source.connect(shaper);
            output = shaper;
        }

        output.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start(now, startOffset, playDuration);
    }

    playErrorTouchSound() {
        if (!this.touchAudioContext || !this.touchSampleBuffer) return;

        const ctx = this.touchAudioContext;
        const now = ctx.currentTime;
        const sliceCount = 3 + Math.floor(Math.random() * 3);

        for (let i = 0; i < sliceCount; i++) {
            this.playTouchSample({
                playbackRate: 0.42 + Math.random() * 0.22,
                startOffset: Math.random() * Math.max(0.01, this.touchSampleBuffer.duration - 0.08),
                duration: 0.05 + Math.random() * 0.07,
                volume: this.TOUCH_VOLUME * (0.75 + Math.random() * 0.35),
                filterType: 'lowpass',
                filterFreq: 420 + Math.random() * 500,
                filterQ: 1.4,
                distortion: 55 + Math.random() * 40,
                delay: i * (0.018 + Math.random() * 0.022)
            });
        }

        const osc = ctx.createOscillator();
        const oscFilter = ctx.createBiquadFilter();
        const oscGain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(210 + Math.random() * 90, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.16);
        oscFilter.type = 'lowpass';
        oscFilter.frequency.value = 680;
        oscGain.gain.setValueAtTime(0.035, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(oscFilter);
        oscFilter.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
    }

    playWordTouchSound(starNode, type) {
        if (!this.touchAudioContext || !this.touchSampleBuffer) return;

        const profile = this.getWordSoundProfile(starNode);

        if (type === 'connect') {
            this.playTouchSample({
                playbackRate: profile.playbackRate * 1.08,
                startOffset: profile.startOffset,
                duration: profile.duration + 0.08,
                volume: this.TOUCH_VOLUME * 1.1,
                filterType: 'lowpass',
                filterFreq: 4800,
                filterQ: 0.45
            });
            this.playTouchSample({
                playbackRate: profile.playbackRate * 1.24,
                startOffset: profile.startOffset * 0.5,
                duration: profile.duration * 0.6,
                volume: this.TOUCH_VOLUME * 0.6,
                filterType: 'lowpass',
                filterFreq: 3600,
                filterQ: 0.5,
                delay: 0.045
            });
            return;
        }

        this.playTouchSample({
            playbackRate: profile.playbackRate,
            startOffset: profile.startOffset,
            duration: profile.duration,
            volume: this.TOUCH_VOLUME,
            filterType: 'lowpass',
            filterFreq: Math.min(profile.filterFreq + 1200, 5200),
            filterQ: 0.55
        });

        if (profile.microGlitch) {
            this.playTouchSample({
                playbackRate: profile.playbackRate * 0.72,
                startOffset: profile.startOffset + 0.03,
                duration: 0.04,
                volume: this.TOUCH_VOLUME * 0.45,
                filterType: 'lowpass',
                filterFreq: 900,
                filterQ: 2,
                distortion: 18,
                delay: 0.03
            });
        }
    }

    getTouchSoundType(starNode, previousSelected) {
        if (!starNode.isWord) return 'error';
        if (previousSelected && previousSelected !== starNode) {
            if (!previousSelected.isWord) return 'error';
            return 'connect';
        }
        return 'word';
    }

    playTouchFallback(type, starNode) {
        const profile = starNode?.isWord ? this.getWordSoundProfile(starNode) : null;

        const playOne = (rate, volume, offset = 0, delay = 0) => {
            const sound = this.touchSoundPool[this.touchSoundIndex];
            this.touchSoundIndex = (this.touchSoundIndex + 1) % this.touchSoundPool.length;
            const start = () => {
                sound.currentTime = offset;
                sound.volume = volume;
                sound.playbackRate = rate;
                sound.play().catch(() => {});
            };
            if (delay > 0) {
                setTimeout(start, delay);
            } else {
                start();
            }
        };

        if (type === 'error') {
            playOne(0.52 + Math.random() * 0.1, this.TOUCH_VOLUME * 0.9, Math.random() * 0.04);
            playOne(0.38 + Math.random() * 0.08, this.TOUCH_VOLUME * 0.7, Math.random() * 0.06, 28);
            playOne(0.62 + Math.random() * 0.1, this.TOUCH_VOLUME * 0.55, Math.random() * 0.05, 58);
            return;
        }

        if (type === 'connect') {
            const rate = (profile?.playbackRate ?? 1) * 1.1;
            playOne(rate, this.TOUCH_VOLUME);
            playOne(rate * 1.18, this.TOUCH_VOLUME * 0.55, profile?.startOffset ?? 0, 42);
            return;
        }

        playOne(profile?.playbackRate ?? 0.95 + Math.random() * 0.15, this.TOUCH_VOLUME, profile?.startOffset ?? 0);
    }

    playProcessedTouchSound(type, starNode) {
        if (!this.touchSampleBuffer || !this.touchAudioContext) return false;
        if (this.touchAudioContext.state !== 'running') return false;

        if (type === 'error') {
            this.playErrorTouchSound();
        } else {
            this.playWordTouchSound(starNode, type);
        }
        return true;
    }

    playStarTouchSound(type, starNode) {
        if (!this.audioUnlocked) return;

        this.primeTouchAudioContext();

        if (!this.playProcessedTouchSound(type, starNode)) {
            this.playTouchFallback(type, starNode);
        }

        if (!this.touchSampleBuffer || this.touchAudioContext?.state !== 'running') {
            this.loadTouchSampleBuffer()
                .then(() => {
                    if (this.touchAudioContext?.state === 'suspended') {
                        return this.touchAudioContext.resume();
                    }
                })
                .catch(() => {});
        }
    }

    fadeIntroToAmbient(durationMs = this.config.introFadeMs) {
        if (this.introAmbientMode || this.introFadeActive) return;
        if (!this.introShouldPlay || this.introSound.paused) return;

        this.introFadeActive = true;

        const startVolume = this.introSound.volume || this.INTRO_VOLUME;
        const startTime = performance.now();

        const fadeStep = (now) => {
            const progress = Math.min((now - startTime) / durationMs, 1);
            this.introSound.volume = startVolume + (this.INTRO_AMBIENT_VOLUME - startVolume) * progress;

            if (progress < 1) {
                this.introFadeRaf = requestAnimationFrame(fadeStep);
                return;
            }

            this.introAmbientMode = true;
            this.introFadeActive = false;
            this.introFadeRaf = null;
        };

        this.introFadeRaf = requestAnimationFrame(fadeStep);
    }

    stopIntroSound(durationMs = this.config.stopIntroMs) {
        if (!this.introShouldPlay && this.introSound.paused) return;

        this.introShouldPlay = false;
        this.introAmbientMode = false;
        this.introFadeActive = false;

        if (this.introFadeRaf !== null) {
            cancelAnimationFrame(this.introFadeRaf);
            this.introFadeRaf = null;
        }

        if (this.introSound.paused) {
            this.introSound.currentTime = 0;
            this.introSound.volume = this.INTRO_VOLUME;
            return;
        }

        const startVolume = this.introSound.volume;
        const startTime = performance.now();

        const fadeStep = (now) => {
            const progress = Math.min((now - startTime) / durationMs, 1);
            this.introSound.volume = startVolume * (1 - progress);

            if (progress < 1) {
                this.introFadeRaf = requestAnimationFrame(fadeStep);
                return;
            }

            this.introSound.pause();
            this.introSound.currentTime = 0;
            this.introSound.volume = this.INTRO_VOLUME;
            this.introFadeRaf = null;
        };

        this.introFadeRaf = requestAnimationFrame(fadeStep);
    }
}
