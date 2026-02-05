class GoldenKey {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.scale = 0.1; // scale down from 500x500 golden key png :0
        this.baseScale = 0.1;
        this.pulseSpeed = 2;
        this.pulseAmount = 0.02;
        this.pulseTime = 0;
        this.collected = false;
        this.showMessage = false;

        this.sprite = ASSET_MANAGER.getAsset("./assets/goldenkey.png");
        this.width = this.sprite.width * this.scale;
        this.height = this.sprite.height * this.scale;
    }

    update() {
        // 1. If we already have it, wait for Space to unpause
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

        // 2. Animation logic
        this.pulseTime += this.game.clockTick * this.pulseSpeed;
        this.scale = this.baseScale + Math.sin(this.pulseTime) * this.pulseAmount;
        this.width = this.sprite.width * this.scale;
        this.height = this.sprite.height * this.scale;

        // 3. Collision Logic
        for (let i = 0; i < this.game.entities.length; i++) {
            let ent = this.game.entities[i];

            // Find the player (Rat)
            if (ent.constructor.name === "Rat") {
                // Check collision using the Rat's width/height or its BoundingBox if it has one
                let ratW = ent.width || 50;
                let ratH = ent.height || 50;

                if (this.x < ent.x + ratW &&
                    this.x + this.width > ent.x &&
                    this.y < ent.y + ratH &&
                    this.y + this.height > ent.y) {

                    this.collected = true;
                    this.showMessage = true;
                    this.game.paused = true; // This pauses the REST of the world
                }
            }
        }
    }

    rectCollide(boxA, boxB) {
        return boxA.x < boxB.x + boxB.width &&
            boxA.x + boxA.width > boxB.x &&
            boxA.y < boxB.y + boxB.height &&
            boxA.y + boxA.height > boxB.y;
    }

    draw(ctx) {
        if (!this.collected) {
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        }

        if (this.showMessage) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(this.game.ctx.canvas.width / 2 - 200, this.game.ctx.canvas.height / 2 - 50, 400, 100);

            ctx.fillStyle = "gold";
            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.fillText("You've retrieved the key!!", this.game.ctx.canvas.width / 2, this.game.ctx.canvas.height / 2 - 10);

            ctx.fillStyle = "white";
            ctx.font = "16px Arial";
            ctx.fillText("Press the spacebar to continue...", ctx.canvas.width / 2, ctx.canvas.height / 2 + 25);
        }
    }
}