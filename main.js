const gameEngine = new GameEngine();
const ASSET_MANAGER = new AssetManager();
const RAT_SPRITES = ["./assets/rats.png", "./assets/rats_extras.png"];

ASSET_MANAGER.queueDownload(RAT_SPRITES[0])
ASSET_MANAGER.queueDownload(RAT_SPRITES[1])

ASSET_MANAGER.downloadAll(() => {
    const canvas = document.getElementById("gameWorld");
    const ctx = canvas.getContext("2d");

    gameEngine.addEntity(new Rat(gameEngine));
    gameEngine.init(ctx);
    gameEngine.start();
});