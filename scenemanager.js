class SceneManager {
    constructor(game) {
        this.game = game;
        this.game.camera = this;

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

    update() {}

    draw(ctx) {
        const scale = 4; // Scaled size (16 * 4)
        const sourceSize = 16; // Size on spritesheet
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

        // Debug,r draw collision boxes
        if (this.game.options && this.game.options.debugging) {
            ctx.strokeStyle = 'Red';
            this.collisionBoxes.forEach(box => {
                ctx.strokeRect(box.x, box.y, box.width, box.height);
            });
        }
    }
}
