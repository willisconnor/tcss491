class SceneAudio {
    constructor() {
        this.currentMusic = null;
        this.volume = 0.5;
    }

    playMusic(path, loop = true) {
        // Don't restart if the same song is already playing
        if (this.currentMusic && this.currentMusic.src.includes(path.replace("./", ""))) {
            return;
        }

        this.stopMusic();

        this.currentMusic = new Audio(path);
        this.currentMusic.loop = loop;
        this.currentMusic.volume = this.volume;
        
        // Play returns a promise; we catch errors (like browser auto-play blocks)
        this.currentMusic.play().catch(error => {
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
}