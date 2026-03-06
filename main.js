const ASSET_MANAGER = new AssetManager();
const gameEngine = new GameEngine();
const RAT_SPRITES = [
    "./assets/rats.png",
    "./assets/rats_extras.png",
    "./assets/rat_lunge.png",
    "./assets/rat_whip.png",
    "./assets/rat_slide.png",];
const SNAKE_SPRITES = [
    "./assets/snakes/Green/SnakeGreen-Attack.png",
    "./assets/snakes/Green/SnakeGreen-Death.png",
    "./assets/snakes/Green/SnakeGreen-Hurt.png",
    "./assets/snakes/Green/SnakeGreen-Idle.png",
    "./assets/snakes/Green/SnakeGreen-Walk.png"
];

for(let i = 0; i < SNAKE_SPRITES.length; i++){
    ASSET_MANAGER.queueDownload(SNAKE_SPRITES[i]);
}



ASSET_MANAGER.queueDownload(RAT_SPRITES[0])
ASSET_MANAGER.queueDownload(RAT_SPRITES[1])
ASSET_MANAGER.queueDownload(RAT_SPRITES[2])
ASSET_MANAGER.queueDownload(RAT_SPRITES[3])
ASSET_MANAGER.queueDownload(RAT_SPRITES[4])
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
ASSET_MANAGER.queueDownload("./assets/poison_fadein.png");
ASSET_MANAGER.queueDownload("./assets/poison_idle.png");
ASSET_MANAGER.queueDownload("./assets/poison_fadeout.png");
ASSET_MANAGER.queueDownload("./assets/ding.wav");
ASSET_MANAGER.queueDownload("./assets/hearts.png");
ASSET_MANAGER.queueDownload("./assets/beefjerky.png");
ASSET_MANAGER.queueDownload("./assets/OrangeCat.png")
ASSET_MANAGER.queueDownload("./assets/cat-defeat-rat.png");
ASSET_MANAGER.queueDownload("./assets/sad-meow-song.mp3");
ASSET_MANAGER.queueDownload("./assets/punch.mp3");
ASSET_MANAGER.queueDownload("./assets/snake-portrait.png");
ASSET_MANAGER.queueDownload("./assets/text-box.png");
ASSET_MANAGER.queueDownload("./assets/BabyGate.png");
ASSET_MANAGER.queueDownload("./assets/mouse-click.wav");
ASSET_MANAGER.queueDownload("./assets/loseHumanVerification.mp3");
ASSET_MANAGER.queueDownload("./assets/win-game.mp3");
ASSET_MANAGER.queueDownload("./assets/button-click.wav");
ASSET_MANAGER.queueDownload("./assets/heaven-sound-effect.wav");
ASSET_MANAGER.queueDownload("./assets/cat.png");
ASSET_MANAGER.queueDownload("./assets/cat-hiss.wav");
ASSET_MANAGER.queueDownload("./assets/HPBar.png");
ASSET_MANAGER.queueDownload("./assets/poisonmeter.png");
ASSET_MANAGER.queueDownload("./assets/Rat1.png");
ASSET_MANAGER.queueDownload("./assets/Rat2.png");
ASSET_MANAGER.queueDownload("./assets/Rat3.png");
ASSET_MANAGER.queueDownload("./assets/Rat4.png");

// LOADING SCREEN
let _loadCanvas = null;
let _loadCtx = null;
function _drawPixelCloud(ctx, x, y, size) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    const s = size / 5;
    ctx.fillRect(x - s * 2, y, s * 4, s * 2);
    ctx.fillRect(x - s * 3, y + s, s * 6, s);
    ctx.fillRect(x - s, y - s, s * 2, s);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(x - s * 4, y + s * 0.5, s, s);
    ctx.fillRect(x + s * 3, y + s * 0.5, s, s);
}

function _drawPixelStar(ctx, x, y, size) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const s = size / 4;
    ctx.fillRect(x - s / 2, y - s * 2, s, s * 4);
    ctx.fillRect(x - s * 2, y - s / 2, s * 4, s);
}

const _loadInterval = setInterval(() => {
    if (!_loadCanvas) {
        _loadCanvas = document.getElementById("gameWorld");
        if (!_loadCanvas) return; // DOM not ready yet, skip this tick
        _loadCtx = _loadCanvas.getContext("2d");
    }
    const total = ASSET_MANAGER.downloadQueue.length;
    const done = ASSET_MANAGER.successCount + ASSET_MANAGER.errorCount;
    const progress = total > 0 ? done / total : 0;
    const w = _loadCanvas.width;
    const h = _loadCanvas.height;

    // Gradient background (lavender → sky blue → soft pink)
    const grad = _loadCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#d4a0e8');
    grad.addColorStop(0.4, '#9bc4f0');
    grad.addColorStop(1, '#e8a8d0');
    _loadCtx.fillStyle = grad;
    _loadCtx.fillRect(0, 0, w, h);

    // Clouds
    _drawPixelCloud(_loadCtx, w * 0.12, h * 0.22, 90);
    _drawPixelCloud(_loadCtx, w * 0.45, h * 0.12, 70);
    _drawPixelCloud(_loadCtx, w * 0.82, h * 0.28, 80);
    _drawPixelCloud(_loadCtx, w * 0.6, h * 0.55, 55);
    _drawPixelCloud(_loadCtx, w * 0.22, h * 0.6, 65);

    // Stars
    _drawPixelStar(_loadCtx, w * 0.3, h * 0.08, 10);
    _drawPixelStar(_loadCtx, w * 0.72, h * 0.06, 8);
    _drawPixelStar(_loadCtx, w * 0.88, h * 0.18, 12);
    _drawPixelStar(_loadCtx, w * 0.08, h * 0.42, 9);
    _drawPixelStar(_loadCtx, w * 0.55, h * 0.35, 7);

    // "Loading Game..." text
    const dots = '.'.repeat(Math.floor(Date.now() / 400) % 4);
    _loadCtx.fillStyle = 'white';
    _loadCtx.font = "28px 'Press Start 2P', monospace";
    _loadCtx.textAlign = 'center';
    _loadCtx.textBaseline = 'middle';
    _loadCtx.fillText('Loading Game' + dots, w / 2, h / 2 - 40);

    // Plus sign decorations
    _loadCtx.font = "18px 'Press Start 2P', monospace";
    _loadCtx.fillText('+', w / 2 + 180, h / 2 - 42);
    _loadCtx.fillText('+', w / 2 - 190, h / 2 - 38);

    // Loading bar
    const barW = 320;
    const barH = 32;
    const barX = (w - barW) / 2;
    const barY = h / 2;

    // White pixel border
    _loadCtx.fillStyle = 'white';
    _loadCtx.fillRect(barX - 4, barY - 4, barW + 8, barH + 8);

    // Dark interior
    _loadCtx.fillStyle = '#1a0a2e';
    _loadCtx.fillRect(barX, barY, barW, barH);

    // Chunky progress blocks
    const blockCount = 10;
    const gap = 4;
    const innerW = barW - gap * 2;
    const blockW = (innerW / blockCount) - gap;
    const filledBlocks = Math.floor(progress * blockCount);
    for (let i = 0; i < filledBlocks; i++) {
        _loadCtx.fillStyle = 'white';
        _loadCtx.fillRect(
            barX + gap + i * (blockW + gap),
            barY + gap,
            blockW,
            barH - gap * 2
        );
    }

    // Small butterfly/cursor near the bar
    const cursorX = barX + gap + filledBlocks * (blockW + gap) + 5;
    _loadCtx.fillStyle = '#ffd700';
    _loadCtx.fillRect(cursorX, barY + barH / 2 - 3, 6, 6);
    _loadCtx.fillRect(cursorX - 3, barY + barH / 2 - 6, 4, 4);
    _loadCtx.fillRect(cursorX + 5, barY + barH / 2 - 6, 4, 4);

    _loadCtx.textBaseline = 'alphabetic';
}, 50);
ASSET_MANAGER.downloadAll(() => {
    clearInterval(_loadInterval);
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
    gameEngine.addEntity(new HeartContainer(gameEngine, 1375, 540));
    gameEngine.start();

});