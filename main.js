const ASSET_MANAGER = new AssetManager();
const gameEngine = new GameEngine();
const RAT_SPRITES = ["./assets/rats.png", "./assets/rats_extras.png", "./assets/rat_lunge.png"];

ASSET_MANAGER.queueDownload(RAT_SPRITES[0])
ASSET_MANAGER.queueDownload(RAT_SPRITES[1])
ASSET_MANAGER.queueDownload(RAT_SPRITES[2])

ASSET_MANAGER.queueDownload("./assets/Level1LivingRoom.json");
ASSET_MANAGER.queueDownload("./assets/global.png");
ASSET_MANAGER.queueDownload("./assets/goldenkey.png");
ASSET_MANAGER.queueDownload("./assets/StuartBigDialogue.png");
ASSET_MANAGER.queueDownload("./assets/EdgarDialogue.png");
ASSET_MANAGER.queueDownload("./assets/yorkie animation.png");
ASSET_MANAGER.queueDownload("./assets/stuart_big.png");
ASSET_MANAGER.queueDownload("./assets/background_music.wav");
ASSET_MANAGER.queueDownload("./assets/Level2DiningRoom.json");
ASSET_MANAGER.queueDownload("./assets/Desert.mp3");

ASSET_MANAGER.downloadAll(() => {
    const canvas = document.getElementById("gameWorld");
    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = false;
    gameEngine.init(ctx);

    const levelData = ASSET_MANAGER.getAsset("./assets/Level1LivingRoom.json");

    const sceneManager = new SceneManager(gameEngine);
    gameEngine.collisionManager = new CollisionManager(sceneManager.scale);
    gameEngine.collisionManager.loadFromTiledJSON(levelData);

    // The game was originally scaled at 4x. Diving the current scale by 4 is the factor by which everything else needs
    // to be scaled by to look proportional to the new scale.
    const scaleFactor = sceneManager.scale / 4;
    // add yorkie first so the white lines of the rat's attack animation aren't covered by him
    gameEngine.addEntity(new Yorkie(gameEngine, 320 * scaleFactor, 150 * scaleFactor, scaleFactor, scaleFactor));
    gameEngine.addEntity(new Rat(gameEngine, 97 * scaleFactor, 220 * scaleFactor, scaleFactor, scaleFactor));
    gameEngine.addEntity(new GoldenKey(gameEngine, 65 * scaleFactor, 120 * scaleFactor));
    gameEngine.addEntity(new Door(gameEngine, 448 * scaleFactor, 128 * scaleFactor, "Level2", true));
    gameEngine.addEntity(new StuartBig(gameEngine, 200 * scaleFactor, 215 * scaleFactor, 2, scaleFactor));
    gameEngine.addEntity(sceneManager);

    gameEngine.start();
});