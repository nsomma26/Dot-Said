export class UIManager {
    constructor(app) {
        this.app = app;
        this.experienceStarted = false;

        this.introText = document.getElementById('intro-text');
        this.promptScreen = document.getElementById('prompt-screen');
        this.promptInput = document.getElementById('prompt-input');
        this.audioGate = document.getElementById('audio-gate');
        this.downloadButton = document.getElementById('download-constellation');
    }

    bind() {
        const copy = this.app.copy;
        const uiCfg = this.app.config.ui;

        this.introText.textContent = copy.introText;
        document.getElementById('prompt-question').textContent = copy.promptQuestion;
        this.promptInput.placeholder = copy.promptPlaceholder;
        document.getElementById('prompt-hint').textContent = copy.promptHint;
        this.audioGate.querySelector('p').textContent = copy.audioGate;
        this.downloadButton.setAttribute('aria-label', copy.downloadAriaLabel);
        this.downloadButton.setAttribute('title', copy.downloadTitle);
        document.getElementById('constellation-hint').textContent = copy.constellationHintDefault;

        this.promptInput.addEventListener('input', (event) => {
            const limited = this.limitWords(event.target.value);
            if (limited !== event.target.value) {
                event.target.value = limited;
            }
        });

        this.promptInput.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;

            const words = this.promptInput.value.trim().split(/\s+/).filter(Boolean);
            if (words.length === 0) return;

            event.preventDefault();
            this.app.constellation.disperseWords(words);
        });

        this.audioGate.addEventListener('click', () => this.startExperience());
        this.audioGate.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.startExperience();
            }
        });
        this.audioGate.setAttribute('tabindex', '0');
    }

    limitWords(value) {
        const maxWords = this.app.config.ui.maxWords;
        const words = value.trim().split(/\s+/).filter(Boolean);
        if (words.length <= maxWords) {
            return value;
        }
        return words.slice(0, maxWords).join(' ');
    }

    showPrompt() {
        this.app.audio.unlockAudio();
        this.app.starfield.clearIntroCameraZoom();
        this.app.starfield.controls.enabled = true;
        this.app.starfield.starsRotating = false;
        this.app.starfield.controls.autoRotate = false;
        this.promptScreen.classList.add('visible');
        this.promptInput.focus();
    }

    startExperience() {
        if (this.experienceStarted) return;
        this.experienceStarted = true;

        const uiCfg = this.app.config.ui;
        const audioCfg = this.app.config.audio;

        this.app.audio.unlockAudio();
        this.app.starfield.startIntroCameraZoom();

        this.audioGate.classList.add('hidden');
        setTimeout(() => this.audioGate.remove(), uiCfg.audioGateRemoveMs);

        setTimeout(() => this.introText.classList.add('visible'), uiCfg.introTextDelayMs);

        setTimeout(() => {
            this.introText.classList.remove('visible');
            this.introText.classList.add('fade-out');
            this.app.audio.fadeIntroToAmbient(audioCfg.introFadeMs);
        }, uiCfg.introTextVisibleUntilMs);

        setTimeout(() => {
            this.introText.remove();
            this.showPrompt();
        }, uiCfg.introTextVisibleUntilMs + uiCfg.fadeMs);
    }
}
