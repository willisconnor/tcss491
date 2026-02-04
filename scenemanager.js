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
        return; // Freeze the world while talking
    }

    // 5. Normal Gameplay Logic (Add movement/collisions here)
}

draw(ctx) {
    // 1. Main Menu
    if (this.menuActive) {
        this.menu.draw(ctx);
        return; 
    }

    // 2. Game World Tiles
    this.drawWorld(ctx);

    // 3. Dialogue (Drawn over the world)
    if (this.dialogueActive) {
        this.dialogue.draw(ctx);
    }

    // 4. Pause Menu (Drawn on top of everything)
    if (this.paused) {
        this.pauseMenu.draw(ctx);
    }

    // Only ONE instance of the fade logic should be here
    if (this.isFading) {
        ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
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
