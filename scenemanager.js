class SceneManager {
    constructor(game) {
        this.game = game;
        this.game.camera = this;
        this.menuActive = true; // Jayda - added this line. Start the game with the menu/story active
        this.menu = new Menu(this.game); // Jayda - added this line. Initializes the menu system
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
        if (this.menuActive) {
            this.menu.update();
        } else if (this.dialogueActive) {
            this.dialogue.update();
        }
    }

    draw(ctx) {
    // 1. If we are in the main menu/intro story, ONLY draw the menu
    if (this.menuActive) {
        this.menu.draw(ctx);
        return; // Stop here so we don't draw the rat/tiles behind the intro
    }

    // 2. DRAW THE GAME WORLD (Tiles)
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

    // 3. DRAW DIALOGUE ON TOP
    // This allows the Rat and the Room to be visible while Stuart Big speaks
    if (this.dialogueActive) {
        this.dialogue.draw(ctx);
    }

    // 4. Debugging boxes (only if enabled)
    if (this.game.options && this.game.options.debugging) {
        ctx.strokeStyle = 'Red';
        this.collisionBoxes.forEach(box => {
            ctx.strokeRect(box.x, box.y, box.width, box.height);
        });
    }
}
}
