class Safe {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 100;
        this.height = 100;
        this.isOpen = this.game.camera.safeUnlocked;

        this.updateBB();
    }

    updateBB() {
        this.BB = new BoundingBox(this.x, this.y, this.width, this.height);
        this.interactBox = new BoundingBox(this.x - 20, this.y - 20, this.width + 40, this.height + 40);
    }

    // Called externally by the Keypad when the correct code is entered
    openSafe() {
        if (!this.isOpen) {
            this.isOpen = true;
            this.game.camera.safeUnlocked = true;
            // Optional: Play a victory sound! 
            // this.game.audio.playMusic("./assets/victory_fanfare.mp3"); 
        }
    }

    update() {
        // The safe itself is static and waits for the keypad to act upon it.
        if (this.isOpen) {
            let rat = this.game.entities.find(e => e.constructor.name === "Rat");
            if (rat && this.interactBox && this.interactBox.collide(rat.BB) && this.game.keys["KeyE"]) {
                this.game.keys["KeyE"] = false;
                InteractionFX.triggerShockwave(this.x + this.width / 2, this.y + this.height / 2, "gold");
                let dingSound = ASSET_MANAGER.getAsset("./assets/ding.wav");
                if (dingSound) { let s = dingSound.cloneNode(); s.volume = 0.2; s.play().catch(e => console.error(e)); }
                let sm = this.game.camera;
                sm.winState = true;
                sm.winTimer = 0;
                this.game.click = null;
                Object.keys(this.game.keys).forEach(k => this.game.keys[k] = false);
                this.game.audio.playMusic("./assets/win-game.mp3", false);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Draw the main safe box
        ctx.fillStyle = "#555555";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = "#222222";
        ctx.lineWidth = 4;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        if (this.isOpen) {
            // Dark interior
            ctx.fillStyle = "#111111";
            ctx.fillRect(this.x + 10, this.y + 10, this.width - 20, this.height - 20);
            
            // The Golden Wheel
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // Add a glowing effect to the cheese
            ctx.shadowColor = "gold";
            ctx.shadowBlur = 15;
            ctx.shadowBlur = 0; // reset

            const rat = this.game.entities.find(e => e.constructor.name === "Rat");
            if (rat && this.interactBox && this.interactBox.collide(rat.BB)) {
                InteractionFX.drawRectGlow(ctx, this.x, this.y, this.width, this.height, "gold");
            }
        } else {
            // Draw a closed vault door and handle
            ctx.fillStyle = "#777777";
            ctx.fillRect(this.x + 10, this.y + 10, this.width - 20, this.height - 20);
            
            ctx.fillStyle = "#333333";
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}