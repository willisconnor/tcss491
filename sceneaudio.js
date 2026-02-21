class SceneAudio {
    constructor() {
        this.currentMusic = null;
        this.volume = 0.15;
        this.muted = false; // track mute state
    }

    playMusic(path, loop = true) {
        // don't restart if the same song is already playing
        if (this.currentMusic && this.currentMusic.src.includes(path.replace("./", ""))) {
            return;
        }
        this.stopMusic();
        this.currentMusic = new Audio(path);
        this.currentMusic.loop = loop;
        this.currentMusic.volume = this.volume;
        this.currentMusic.muted = this.muted; // 2. Apply mute setting to new music

        this.currentMusic.play().catch(() => {
            console.warn("Audio waiting for user interaction to start.");
        });
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
    }

    setVolume(v) {
        this.volume = v;
        if (this.currentMusic) this.currentMusic.volume = v;
    }

    // new toggle method
    toggleMute() {
        this.muted = !this.muted;
        if (this.currentMusic) {
            this.currentMusic.muted = this.muted;
        }
    }
}