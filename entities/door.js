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

        // verify rat isn't dead before allowing room transitions
        if (rat && rat.health > 0) {
            // simple distance check
            const dist = Math.sqrt(Math.pow((rat.x - this.x), 2) + Math.pow((rat.y - this.y), 2));

            if (dist < 150) { // detection range
                this.showPrompt = true;

                // check for 'E' key press
                if (this.game.keys["KeyE"]) {
                    this.game.keys["KeyE"] = false; // prevent double triggering

                    // check if Snake alive before entering level 3
                    if (this.destination === "Level3") {
                        let snake = this.game.entities.find(e => e.constructor.name === "Snake" && !e.dead);
                        if (snake) {
                            // split into arrays so text box stacks on two lines
                            const snakeQuotes = [
                                ["Are you blind? There's a giant danger", "noodle right there!"],
                                ["The snake is literally staring at you.", "Deal with it first."],
                                ["You want to get swallowed whole? Kill", "the oversized worm first."],
                                ["Door's locked. Password is", "'Dead Snake'. Get to work."],
                                ["Momma didn't raise no coward.", "Go bite that snake's tail off!"],
                                ["Trying to run away so soon?", "You're a disappointment to the colony."]
                            ];
                            this.game.camera.itemPopupText = snakeQuotes[Math.floor(Math.random() * snakeQuotes.length)];
                            this.game.camera.itemPopupActive = true;
                            this.game.paused = true;
                            return; // stop transition!
                        }
                    }

                    // shockwave centered on polygon shape (or fallback to entity center)
                    const shapeName = "door" + this.destination;
                    const shapes = this.game.camera.interactableShapes[shapeName];
                    let burstX = this.x + this.width / 2;
                    let burstY = this.y + this.height / 2;
                    if (shapes && shapes.length > 0) {
                        // Merge all polygon points to find true center
                        const allPts = shapes.flat();
                        const c = InteractionFX.polygonCenter(allPts);
                        burstX = c.x;
                        burstY = c.y;
                    }
                    InteractionFX.triggerShockwave(burstX, burstY, "#ffffff");

                    // Iris transition instead of abrupt level load
                    this.game.camera.startIrisTransition(this.destination);
                }
            } else {
                this.showPrompt = false;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.showPrompt) {
            // draw polygon glow from Tiled JSON interactable layer
            const shapeName = "door" + this.destination;
            const shapes = this.game.camera.interactableShapes[shapeName];
            if (shapes) {
                for (const pts of shapes) {
                    InteractionFX.drawPolygonGlow(ctx, pts, "#ffffff");
                }
            } else {
                // fallback if no polygon data
                InteractionFX.drawRectGlow(ctx, this.x, this.y, this.width, this.height, "#ffffff");
            }
        }
        ctx.restore();

        // removed this.game.camera.x for red debug box too
        if (this.game.options && this.game.options.debugging) {
            ctx.save();
            ctx.strokeStyle = "red";
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
    }
}