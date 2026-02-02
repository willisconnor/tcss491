// Author: Christina Blackwell

class StuartBig {
    constructor(game, x, y, facing) {
        this.game = game;
        this.canvas = document.getElementById("gameWorld");
        this.animations = new Map();
        this.animations.set("idle", []);
        this.loadAnimations();
        // 0 = left, 1 = right, 2 = down, 3 = up
        this.facing = facing;
        this.scale = 1.5;
        this.animator = this.animations.get("idle")[this.facing];
        this.x = x;
        this.y = y;
    };

    // Stuart Big doesn't move, so he just has the idle animation
    loadAnimations() {
        this.animations.get("idle")[0] = new Animator(ASSET_MANAGER.getAsset("./assets/stuart_big.png"),
            0, 58, 48, 38, 3, 1.5, 0);
        this.animations.get("idle")[1] = new Animator(ASSET_MANAGER.getAsset("./assets/stuart_big.png"),
            0, 106, 48, 38, 3, 1.5, 0);
        this.animations.get("idle")[2] = new Animator(ASSET_MANAGER.getAsset("./assets/stuart_big.png"),
            0, 6, 48, 33, 3, 1.5, 0);
        this.animations.get("idle")[3] = new Animator(ASSET_MANAGER.getAsset("./assets/stuart_big.png"),
            0, 148, 48, 44, 3, 1.5, 0);
    };

    // Nothing to update
    update() {
    };

    draw(ctx) {
        ctx.imageSmoothingEnabled = true;

        // drawing glow outline; pass 0 for tick to avoid advancing animation
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.filter = "brightness(1.5) drop-shadow(0 0 4px white)";
        const offsets = [[-2, 0], [2, 0], [0, -2], [0, 2]];
        offsets.forEach(([ox, oy]) => {
            this.animator.drawFrame(0, ctx, this.x + ox, this.y + oy, this.scale); // Pass 0 here
        });
        ctx.restore();

        // drawing actual sprite on top, only THIS one advances the animation
        ctx.save();
        this.animator.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.scale);
        ctx.restore();
    }


}