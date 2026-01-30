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
        this.scale = 1.25;
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
        } else if (this.game.keys["ArrowLeft"] || this.game.keys["KeyA"]) {
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
        const isPriority = currentAnim === this.animations.get("dead");

        // This just makes it so you don't have to hold down on the key for the whole animation to loop
        if (isPriority && !currentAnim.isDone()) {
            targetAnim = currentAnim;
            targetSpeed = 0;
        }

        if (this.animator !== targetAnim) {
            this.animator = targetAnim;
            this.animator.elapsedTime = 0;
        } else {
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

        // using small circle collider at feet instead of full sprite box
        const spriteWidth = this.animator.width * this.scale;
        const fixedHeight = 38 * this.scale; // same as what is used in draw()

        // small collision box placed at rat's feet (bottom center)
        const colliderRadius = 12 * this.scale;
        const colliderWidth = colliderRadius * 2;
        const colliderHeight = colliderRadius;
        const colliderX = newX + (spriteWidth / 2) - colliderRadius;
        const colliderY = newY + fixedHeight - colliderHeight;

        if (!this.game.collisionManager.checkCollision(colliderX, colliderY, colliderWidth, colliderHeight)) {
            this.x = newX;
            this.y = newY;
        }

        // canvas boundary checks using the same feet-based collider
        const currentColliderX = this.x + (spriteWidth / 2) - colliderRadius;
        const currentColliderY = this.y + fixedHeight - colliderHeight;

        if (currentColliderX + colliderWidth > this.canvas.width && this.facing === 1) {
            this.x = this.canvas.width - colliderWidth - (spriteWidth / 2) + colliderRadius;
        }
        if (currentColliderX < 0 && this.facing === 0) {
            this.x = -(spriteWidth / 2) + colliderRadius;
        }
        if (currentColliderY < 0 && this.facing === 3) {
            this.y = -(fixedHeight - colliderHeight);
        }
        if (currentColliderY + colliderHeight > this.canvas.height && this.facing === 2) {
            this.y = this.canvas.height - fixedHeight;
        }
    }



    draw(ctx) {
        ctx.imageSmoothingEnabled = false;

        const width = this.animator.width * this.scale;
        const centerX = this.x + width / 2;

        // using fixed height for the circle position (idle animation height)
        const fixedHeight = 38 * this.scale; // idle animation height is 38
        const feetY = this.y + fixedHeight;

        // drawing circle @ feet
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(centerX, feetY - 5, width * 0.6, 8, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 215, 0, 0.4)"; // changed from 0.8 to 0.4 as per Christina's request
        ctx.lineWidth = 3; // changed from 3 to 2 as per Christina's request
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 215, 0, 0.1)"; // changed from 0.2 to 0.1 as per Christina's request
        ctx.fill();
        ctx.restore();

        // drawing glow outline; pass 0 for tick to avoid advancing animation
        ctx.save();
        ctx.globalAlpha = 0.25; // Changed from 0.5 to 0.25 as per Christina's request
        ctx.filter = "brightness(1) drop-shadow(0 0 4px gold)";
        const offsets = [[-2, 0], [2, 0], [0, -2], [0, 2]];
        offsets.forEach(([ox, oy]) => {
            this.animator.drawFrame(0, ctx, this.x + ox, this.y + oy, this.scale); // Pass 0 here
        });
        ctx.restore();

        // drawing actual sprite on top, only THIS one advances the animation
        ctx.save();
        ctx.filter = "drop-shadow(0 0 2px rgba(255, 215, 0, 0.3))"; // was 4px/0.6 now 2px/0.3 as per Christina's request
        this.animator.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.scale);
        ctx.restore();
    }


}