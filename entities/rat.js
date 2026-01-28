// Author: Christina Blackwell

class Rat {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById("gameWorld");
        this.animations = new Map();
        this.animations.set("idle", []);
        this.animations.set("walk", []);
        this.animations.set("run", []);
        // I might try to edit the sprite sheet to create attack animations -Christina
        // this.animations.set("attack", []);
        this.loadAnimations();
        // 0 = left, 1 = right, 2 = down, 3 = up
        this.facing = 0;
        this.scale = 1;
        this.animator = this.animations.get("idle")[this.facing];
        this.x = (this.canvas.width / 2) - ((this.animator.width * this.scale) / 2);
        this.y = (this.canvas.height / 2) - ((this.animator.height * this.scale) / 2);
        this.speed = 0;
    };

    loadAnimations() {
        this.animations.get("idle")[0] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[1]),
            0, 58, 48, 38, 3, 0.7, 0);
        this.animations.get("idle")[1] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[1]),
            0, 106, 48, 38, 3, 0.7, 0);
        this.animations.get("idle")[2] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[1]),
            0, 6, 48, 33, 3, 0.7, 0, -2.4);
        this.animations.get("idle")[3] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[1]),
            0, 148, 48, 44, 3, 0.7, 0, -2.4);

        this.animations.get("walk")[0] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]),
            0, 74, 48, 18, 3, 0.15, 0, 0, 14);
        this.animations.get("walk")[1] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]),
            0, 122, 48, 18, 3, 0.15, 0, 0, 14);
        this.animations.get("walk")[2] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]),
            0, 22, 48, 22, 3, 0.15, 0, 0, 14);
        this.animations.get("walk")[3] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]),
            0, 164, 48, 24, 3, 0.15, 0, 0, 14);

        this.animations.get("run")[0] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]),
            0, 74, 48, 18, 3, 0.1, 0, 0, 14);
        this.animations.get("run")[1] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]),
            0, 122, 48, 18, 3, 0.1, 0, 0, 14);
        this.animations.get("run")[2] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]),
            0, 22, 48, 22, 3, 0.1, 0, 0, 14);
        this.animations.get("run")[3] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]),
            0, 164, 48, 24, 3, 0.1, 0, 0, 14);

        // I might edit the death frames so they actually move -Christina
        this.animations.set("dead", new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[1]),
            0, 312, 48, 18, 3, 0.7, 0, 0, 14, false));
    };

    update() {
        let targetAnim = this.animations.get("idle")[this.facing];
        let targetSpeed = 0;

        // Update for attack eventually
        /*if (this.game.keys["Space"]) {
            targetSpeed = 0;
            targetAnim = this.animations.get("attack");
        }
        else*/

        /* This is just for testing purposes, eventually the death animation will be triggered by
         * the rat's health getting to 0. */
        if (this.game.keys["KeyX"]) {
            targetAnim = this.animations.get("dead");
        }
        else if (this.game.keys["ArrowLeft"] || this.game.keys["KeyA"]) {
            targetSpeed = 100;
            this.facing = 0;
            targetAnim = this.animations.get("walk")[this.facing];
        } else if (this.game.keys["ArrowRight"] || this.game.keys["KeyD"]) {
            targetSpeed = 100;
            this.facing = 1;
            targetAnim = this.animations.get("walk")[this.facing];
        } else if (this.game.keys["ArrowDown"] || this.game.keys["KeyS"]) {
            targetSpeed = 100;
            this.facing = 2;
            targetAnim = this.animations.get("walk")[this.facing];
        } else if (this.game.keys["ArrowUp"] || this.game.keys["KeyW"]) {
            targetSpeed = 100;
            this.facing = 3;
            targetAnim = this.animations.get("walk")[this.facing];
        }

        if (this.game.keys["ShiftLeft"]) {
            targetSpeed = 200;
            targetAnim = this.animations.get("run")[this.facing];
        }

        const currentAnim = this.animator;
        const isPriority = (/*currentAnim === this.animations.get("attack") ||*/ currentAnim === this.animations.get("dead"));

        // This just makes it so you don't have to hold down on the key for the whole animation to loop
        if (isPriority && !currentAnim.isDone()) {
            targetAnim = currentAnim;
            targetSpeed = 0;
        }

        if (this.animator !== targetAnim) {
            this.animator = targetAnim;
            this.animator.elapsedTime = 0;
        }
        else {
            if (isPriority && currentAnim.isDone() && targetAnim === this.animator) {
                this.animator.elapsedTime = 0;
            }
        }

        this.speed = targetSpeed;
        // stored your this.x and this.y into variable references
        let newX = this.x;
        let newY = this.y;
        if (this.facing === 0) newX -= this.speed * this.game.clockTick;
        if (this.facing === 1) newX += this.speed * this.game.clockTick;
        if (this.facing === 2) newY += this.speed * this.game.clockTick;
        if (this.facing === 3) newY -= this.speed * this.game.clockTick;

        // check collision before applying movement
        const width = this.animator.width * this.scale;
        const height = this.animator.height * this.scale;

        if (!this.game.collisionManager.checkCollision(newX, newY, width, height)) {
            this.x = newX;
            this.y = newY;
        }

        // canvas boundary checks
        if (this.x + (this.animator.width * this.scale) > this.canvas.width && this.facing === 1) {
            this.x = this.canvas.width - (this.animator.width * this.scale);
        }
        if (this.x < 0 && this.facing === 0) this.x = 0;
        if (this.y < 0 && this.facing === 3) this.y = 0;

        let padding = this.animator.yOffset * this.scale;
        //   @@ -127,7 +140,9 @@ class Rat
        if (this.y + (this.animator.height * this.scale) + padding > this.canvas.height && this.facing === 2) {
            this.y = this.canvas.height - (this.animator.height * this.scale) - padding;
        }
    }



    draw(ctx) {
        ctx.imageSmoothingEnabled = false;
        this.animator.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.scale);
    };

}