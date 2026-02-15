class Door {
    constructor(game, x, y, destination, requiresKey) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.destination = destination; // Level1 or Level2
        this.requiresKey = requiresKey; // need golden key to enter other door
        this.width = 100;
        this.height = 100;
        this.showPrompt = false;
    }

    update() {
        // this door requires a key in our inventory and we don't have it so we do nothing
        if (this.requiresKey && !this.game.camera.hasGoldenKey) return;

        // find Rat
        const rat = this.game.entities.find(e => e.constructor.name === "Rat");
        if (rat) {
            // simple distance check
            const dist = Math.sqrt(Math.pow((rat.x - this.x), 2) + Math.pow((rat.y - this.y), 2));

            if (dist < 150) { // detection range
                this.showPrompt = true;

                // check for 'E' key press
                if (this.game.keys["KeyE"]) {
                    this.game.keys["KeyE"] = false; // prevent double triggering
                    if (this.destination === "Level2") {
                        this.game.camera.loadLevelTwo();
                    } else if (this.destination === "Level1") {
                        this.game.camera.loadLevelOne();
                    }
                }
            } else {
                this.showPrompt = false;
            }
        }
    }

    draw(ctx) {
        if (this.showPrompt) {
            ctx.font = "20px Arial";
            ctx.fillStyle = "yellow";
            ctx.textAlign = "center";
            // removed this.game.camera.x so door don't float around (fixed in debug mode)
            ctx.fillText("Press 'E' to Enter", this.x + 50, this.y - 20);
        }

        // removed this.game.camera.x for red debug box too
        if (this.game.options && this.game.options.debugging) {
            ctx.strokeStyle = "red";
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}