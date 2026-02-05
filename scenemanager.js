class SceneManager {
    constructor(game) {
        this.game = game;
        this.game.camera = this;
        this.fadeAlpha = 1; // Start fully black
        this.isFading = true;

        this.paused = false;
        this.pauseMenu = new PauseMenu(this.game);
        // Track story progress
        // States: "STUART_TALK", "YORKIE_CHALLENGE", "YORKIE_DEFEATED"
        this.storyState = "STUART_TALK";

        this.menuActive = true; 
        this.menu = new Menu(this.game); 
        this.dialogueActive = false;
        this.dialogue = new Dialogue(this.game, this);
        
        this.level = ASSET_MANAGER.getAsset("./assets/Level1LivingRoom.json");
        // Load spritesheet
        this.spritesheet = ASSET_MANAGER.getAsset("./assets/global.png");

        // Store collision boxes in an array
        this.collisionBoxes = [];

        if (this.level && this.level.layers) {
            let collisionLayer = this.level.layers.find(l => l.name === "collision");
            if (collisionLayer && collisionLayer.objects) {
                collisionLayer.objects.forEach(obj => {
                    this.collisionBoxes.push(new BoundingBox(obj.x * 4, obj.y * 4, obj.width * 4, obj.height * 4));
                });
            }
        }
    }

    update() {
        // check for mute button click; Top Right Corner
        // Coordinates: X=1380, Y=20, Width=60, Height=30 (Fits inside 1472 width)
        if (this.game.click) {
            const mouseX = this.game.click.x;
            const mouseY = this.game.click.y;

            // check collision with the button area
            if (mouseX >= 1380 && mouseX <= 1440 && mouseY >= 20 && mouseY <= 50) {
                this.game.audio.toggleMute();
                this.game.click = null; // prevent click from triggering other things
                return;
            }
        }
        // 1. Toggle pause or skip menu with Escape
        if (this.game.keys["Escape"]) {
            this.game.keys["Escape"] = false; // Reset key to prevent double-triggering

            if (this.menuActive) {
                // If in intro/tutorial, ESC returns to Start Menu
                if (this.menu.state === "STORY" || this.menu.state === "TUTORIAL") {
                    this.menu.state = "START";
                }
            } else {
                // Toggle pause during gameplay
                this.paused = !this.paused;
            }
        }

        // 2. Main Menu Logic
        if (this.menuActive) {
            this.menu.update();
            return; // Stop here so game doesn't run behind menu
        }

        // 3. Pause Menu Logic
        if (this.paused) {
            this.pauseMenu.update();
            return; // Stop here to freeze the game world
        }

        // 4. Dialogue Logic (Stuart Big or Key Picked Up)
        if (this.dialogueActive) {
            this.dialogue.update(); // This allows Space bar to advance text
            // world is frozen b/c we exit update early by not running the rest of the function;
            // no explicit 'return' needed if this is already the last statement
        }

        // 5. Normal Gameplay Logic (Add movement/collisions here)
    }

    draw(ctx) {
        // 1. Main Menu (Handled separately)
        if (this.menuActive) {
            this.menu.draw(ctx);
            return;
        }

        // 2. Game World Tiles (Bottom Layer)
        this.drawWorld(ctx);

        // draw overlays (top layer)
        // we move the overlay logic here so GameEngine can call it separately if needed
        this.drawOverlays(ctx);
    }

// I added a new method to handles everything that should go ON TOP of entities
    drawOverlays(ctx) {
        // dialogue
        if (this.dialogueActive) {
            this.dialogue.draw(ctx);
        }

        // pause Menu
        if (this.paused) {
            this.pauseMenu.draw(ctx);
        }
// draw mute toggle switch
        const isMuted = this.game.audio.muted;
        const x = 1380;
        const y = 20;
        const w = 60;
        const h = 30;
        const radius = h / 2;
        ctx.save();
        // draw pill shape (background)
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.fillStyle = isMuted ? "#ccc" : "#4CD964"; // gray if muted, green if ON
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        // draw the knob; circle
        ctx.beginPath();
        // if muted (OFF), knob is on left. If ON, knob is on right.
        const knobX = isMuted ? x + radius : x + w - radius;
        ctx.arc(knobX, y + radius, radius - 4, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();

        // draw text label "MUSIC" below
        ctx.font = "bold 12px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("MUSIC", x + w / 2, y + h + 15);

        ctx.restore();
        // fade effect (must be last to cover everything)
        if (this.isFading) {
            ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            // update fade alpha
            this.fadeAlpha -= 0.01;
            if (this.fadeAlpha <= 0) {
                this.fadeAlpha = 0;
                this.isFading = false;
            }
        }
    }

// Move the tile logic here to keep the draw method clean
    drawWorld(ctx) {
        const scale = 4;
        const sourceSize = 16;
        const destSize = sourceSize * scale;
        const columns = 270;

        if (this.level && this.level.layers) {
            this.level.layers.forEach(layer => {
                if (layer.type === "tilelayer") {
                    layer.data.forEach((gid, i) => {
                        if (gid > 0) {
                            const mapX = (i % layer.width) * destSize;
                            const mapY = Math.floor(i / layer.width) * destSize;
                            const spriteId = gid - 1;
                            const sourceX = (spriteId % columns) * sourceSize;
                            const sourceY = Math.floor(spriteId / columns) * sourceSize;

                            ctx.drawImage(this.spritesheet,
                                sourceX, sourceY, sourceSize, sourceSize,
                                mapX, mapY, destSize, destSize);
                        }
                    });
                }
            });
        }
    }
}
