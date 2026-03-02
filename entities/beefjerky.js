class BeefJerky {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.scale = 0.015;
        this.baseScale = 0.1;
        this.pulseSpeed = 2;
        this.pulseTime = 0;
        this.collected = false;

        this.sprite = ASSET_MANAGER.getAsset("./assets/beefjerky.png");
        this.width = this.sprite.width * this.scale;
        this.height = this.sprite.height * this.scale;

        this.updateBB();
    }

    updateBB() {
        this.BB = new BoundingBox(this.x, this.y, this.width, this.height);
    }

    update() {
        if (this.collected) return;

        // Pulse animation
        this.pulseTime += this.game.clockTick * this.pulseSpeed;
        this.scale = this.baseScale + Math.sin(this.pulseTime) * 0.01;
        this.width = this.sprite.width * this.scale;
        this.height = this.sprite.height * this.scale;
        this.updateBB();

        // Check collision with Rat
        let rat = this.game.entities.find(e => e.constructor.name === "Rat");
        if (rat && rat.BB && this.BB.collide(rat.BB)) {
            this.collected = true;
            this.removeFromWorld = true;
            this.game.camera.hasBeefJerky = true;

            let dingSound = ASSET_MANAGER.getAsset("./assets/ding.mp3");
            if (dingSound) {
                let soundClone = dingSound.cloneNode(); // Create clone first!
                soundClone.volume = 0.15;
                soundClone.playbackRate = 1.5;
                soundClone.currentTime = 0.50;
                soundClone.play().catch(e => console.error(e));
            }

            let sm = this.game.camera;
            sm.itemPopupText = [
                "Secured the meaty goods! Let's drag this back to",
                " that yappy Yorkie before he pees on the rug."
            ];
            sm.itemPopupActive = true;
            this.game.click = null;
            this.game.keys["Space"] = false;
            this.game.paused = true; // pauses game while reading

            rat.speed = 0;
            rat.animator = rat.animations.get("idle")[rat.facing];
        }
    }

    draw(ctx) {
        if (!this.collected) {
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        }
    }
}