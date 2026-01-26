class SceneManager {
    constructor(game) {
        this.game = game;
        this.game.camera = this;

        // Load spritesheet
        this.spritesheet = ASSET_MANAGER.getAsset("./assets/global.png");
    };

    update() {
        // No logic needed; yet
    };

    draw(ctx) {
        const tileSize = 64; // Scaled size (16 * 4)
        const sourceTileSize = 16; // Size on spritesheet
        const sourceX = 128;
        const sourceY = 1120; // my tile

        // Calculate # of tiles needed
        const tilesWide = Math.ceil(this.game.ctx.canvas.width / tileSize);
        const tilesHigh = Math.ceil(this.game.ctx.canvas.height / tileSize);

        // Draw tiles in grid
        for (let row = 0; row < tilesHigh; row++) {
            for (let col = 0; col < tilesWide; col++) {
                ctx.drawImage(
                    this.spritesheet,
                    sourceX, sourceY, sourceTileSize, sourceTileSize,
                    col * tileSize, row * tileSize, tileSize, tileSize
                );
            }
        }
    }
}