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
        this.showMessage = false;

        this.sprite = ASSET_MANAGER.getAsset("./assets/beefjerky.png");
        this.width = this.sprite.width * this.scale;
        this.height = this.sprite.height * this.scale;
        
        this.updateBB();
    }

    updateBB() {
        this.BB = new BoundingBox(this.x, this.y, this.width, this.height);
    }

    update() {
        if (this.collected && this.showMessage) {
            if (this.game.keys["Space"]) {
                this.showMessage = false;
                this.game.paused = false;
                this.game.keys["Space"] = false;
                this.removeFromWorld = true;
            }
            return;
        }

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
            this.showMessage = true;
            this.game.camera.hasBeefJerky = true; // Update scene manager state
            this.game.paused = true;
        }
    }

    draw(ctx) {
        if (!this.collected) {
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        }

        if (this.showMessage) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(this.game.ctx.canvas.width / 2 - 200, this.game.ctx.canvas.height / 2 - 50, 400, 100);

            ctx.fillStyle = "white";
            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.fillText("You found the Beef Jerky!", this.game.ctx.canvas.width / 2, this.game.ctx.canvas.height / 2 - 10);
            ctx.font = "16px Arial";
            ctx.fillText("Press SPACE to continue", this.game.ctx.canvas.width / 2, this.game.ctx.canvas.height / 2 + 20);
            ctx.restore();
        }
    }
}