const ASSET_MANAGER = new AssetManager();
const gameEngine = new GameEngine();
const RAT_SPRITES = ["./assets/rats.png", "./assets/rats_extras.png"];

ASSET_MANAGER.queueDownload(RAT_SPRITES[0])
ASSET_MANAGER.queueDownload(RAT_SPRITES[1])
gameEngine.collisionManager = new CollisionManager();

ASSET_MANAGER.queueDownload("./assets/Level1LivingRoom.json");
ASSET_MANAGER.queueDownload("./assets/global.png");
ASSET_MANAGER.queueDownload("./assets/goldenkey.png");
ASSET_MANAGER.queueDownload("./assets/StuartBigDialogue.png");

ASSET_MANAGER.downloadAll(() => {
    const canvas = document.getElementById("gameWorld");
    const ctx = canvas.getContext("2d");

    // disable image smoothing
    ctx.imageSmoothingEnabled = false;

    gameEngine.init(ctx);

    // load collision data from cached JSON
    const levelData = ASSET_MANAGER.getAsset("./assets/Level1LivingRoom.json");
    gameEngine.collisionManager.loadFromTiledJSON(levelData);
    gameEngine.addEntity(new Rat(gameEngine));
    gameEngine.addEntity(new GoldenKey(gameEngine, 65, 120));

    // add entities
    const sceneManager = new SceneManager(gameEngine);
    gameEngine.addEntity(sceneManager);


    gameEngine.start();
});