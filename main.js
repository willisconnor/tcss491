const gameEngine = new GameEngine();
const ASSET_MANAGER = new AssetManager();
const RAT_SPRITES = ["./assets/rats.png", "./assets/rats_extras.png"];

ASSET_MANAGER.queueDownload(RAT_SPRITES[0])
ASSET_MANAGER.queueDownload(RAT_SPRITES[1])
ASSET_MANAGER.queueDownload("./assets/global.png");

ASSET_MANAGER.queueDownload("./assets/Level1LivingRoom.json");

ASSET_MANAGER.downloadAll(() => {
    const canvas = document.getElementById("gameWorld");
    const ctx = canvas.getContext("2d");
    // Add Rat FIRST (Index 0)
    gameEngine.addEntity(new Rat(gameEngine));

    // Add the SceneManager SECOND (Index 1)
    gameEngine.addEntity(new SceneManager(gameEngine));
    gameEngine.init(ctx);
    gameEngine.start();
});