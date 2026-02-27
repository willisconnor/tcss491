const ASSET_MANAGER = new AssetManager();
const gameEngine = new GameEngine();
const RAT_SPRITES = ["./assets/rats.png", "./assets/rats_extras.png", "./assets/rat_lunge.png"];
const SNAKE_SPRITES = [
    "./assets/snakes/Green/SnakeGreen-Attack.png",
    "./assets/snakes/Green/SnakeGreen-Death.png",
    "./assets/snakes/Green/SnakeGreen-Hurt.png",
    "./assets/snakes/Green/SnakeGreen-Idle.png",
    "./assets/snakes/Green/SnakeGreen-Walk.png"
];

ASSET_MANAGER.queueDownload(RAT_SPRITES[0])
ASSET_MANAGER.queueDownload(RAT_SPRITES[1])

for(let i = 0; i < SNAKE_SPRITES.length; i++){
    ASSET_MANAGER.queueDownload(SNAKE_SPRITES[i]);
}



ASSET_MANAGER.queueDownload(RAT_SPRITES[0])
ASSET_MANAGER.queueDownload(RAT_SPRITES[1])
ASSET_MANAGER.queueDownload(RAT_SPRITES[2])
gameEngine.collisionManager = new CollisionManager();

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
ASSET_MANAGER.queueDownload("./assets/Level3Kitchen.json");
ASSET_MANAGER.queueDownload("./assets/MiiParade.mp3");
ASSET_MANAGER.queueDownload("./assets/snake-eat-rat.png");
ASSET_MANAGER.queueDownload("./assets/in-the-arms-of-an-angel.mp3");
ASSET_MANAGER.queueDownload("./assets/crunchy-bite.mp3");
ASSET_MANAGER.queueDownload("./assets/keyboard-click.mp3");
ASSET_MANAGER.queueDownload("./assets/OrangeCat.png");

ASSET_MANAGER.downloadAll(() => {
    const canvas = document.getElementById("gameWorld");
    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = false;
    gameEngine.init(ctx);

    const levelData = ASSET_MANAGER.getAsset("./assets/Level1LivingRoom.json");
    gameEngine.collisionManager.loadFromTiledJSON(levelData);

    // add yorkie first so the white lines of the rat's attack animation aren't covered by him
    gameEngine.addEntity(new Yorkie(gameEngine, 320, 150));
    gameEngine.addEntity(new Rat(gameEngine, 97, 220));
    gameEngine.addEntity(new GoldenKey(gameEngine, 65, 120));
    gameEngine.addEntity(new Door(gameEngine, 420, 90, "Level2", true));
    gameEngine.addEntity(new StuartBig(gameEngine, 200, 215, 2));
    const sceneManager = new SceneManager(gameEngine);
    gameEngine.addEntity(sceneManager);

    gameEngine.start();

});