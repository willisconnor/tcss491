class SceneManager {
    constructor(game) {
        this.game = game;
        this.game.camera = this;
        this.menuActive = true; // Jayda - added this line. Start the game with the menu/story active
        this.menu = new Menu(this.game); // Jayda - added this line. Initializes the menu system

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
        if (this.menuActive) {  //Jayda added
            this.menu.update(); //Jayda added
        } else {
            // Normal game update logic (camera follow, etc.)
        }
    }

    draw(ctx) {
        // Jayda added
        if (this.menuActive) {
            this.menu.draw(ctx); // Draw Story, Start Menu, or Tutorial
            return; // Exit draw early so the game world doesn't show behind the menu
        }
        // End of new code

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

        // Debug draw collision boxes
        if (this.game.options && this.game.options.debugging) {
            ctx.strokeStyle = 'Red';
            this.collisionBoxes.forEach(box => {
                ctx.strokeRect(box.x, box.y, box.width, box.height);
            });
        }
    }
}
