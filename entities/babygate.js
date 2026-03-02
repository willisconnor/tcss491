class BabyGate {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;

        this.spritesheet = ASSET_MANAGER.getAsset("./assets/BabyGate.png");

        this.isOpen = false;

        // original sprite dimensions per frame
        this.frameWidth = 338;
        this.frameHeight = 369;

        // rotating 90 degrees, original width (338) becomes height on the canvas
        this.scale = 180 / this.frameWidth;

        // After rotation drawn dimensions:
        this.drawHeight = this.frameWidth * this.scale;
        this.drawWidth = this.frameHeight * this.scale;

        this.updateBB();
    }

    updateBB() {
        if (!this.isOpen) {
            // adjust BoundingBox dimensions to match rotated sprite
            this.BB = new BoundingBox(this.x, this.y, this.drawWidth, this.drawHeight);
        } else {
            this.BB = null; // remove collision when open
        }
    }

    update() {
        // if gate is closed and camera has golden key
        if (!this.isOpen && this.game.camera.hasGoldenKey) {
            const rat = this.game.entities.find(e => e.constructor.name === "Rat");
            if (rat) {
                // check distance to see if rat is close enough to unlock it
                const dist = Math.sqrt(Math.pow((rat.x - this.x), 2) + Math.pow((rat.y - this.y), 2));
                if (dist < 100) {
                    this.isOpen = true; // unlock gate
                    this.updateBB();
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();

        // move canvas origin to target X, Y
        ctx.translate(this.x, this.y);

        // rotate canvas 90 degrees clockwise (in radians)
        ctx.rotate(Math.PI / 2);

        // if open use the second frame (start at x=338), otherwise use the first frame (start at x=0)
        let sourceX = this.isOpen ? this.frameWidth : 0;

        // B/c rotated 90 degrees, drawing at (0,0) would draw it "down and left".
        // offset Y axis by drawn width to place it perfectly at (301, 496) mark
        ctx.drawImage(
            this.spritesheet,
            sourceX, 0, this.frameWidth, this.frameHeight,
            0, -this.drawWidth, this.drawHeight, this.drawWidth
        );

        ctx.restore();

        // debug drawing for bounding box
        if (this.game.options && this.game.options.debugging && this.BB) {
            ctx.save();
            ctx.strokeStyle = "Magenta";
            ctx.strokeRect(this.BB.x, this.BB.y, this.BB.width, this.BB.height);
            ctx.restore();
        }
    }
}