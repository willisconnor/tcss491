class PoisonProjectile {
    constructor(game, x, y, facing, scale) {
        Object.assign(this, { game, x, y, facing, scale });

        // Sprite Sheets (64x64)
        this.sprites = {
            fadein: ASSET_MANAGER.getAsset("./assets/poison_fadein.png"),
            idle: ASSET_MANAGER.getAsset("./assets/poison_idle.png"),
            fadeout: ASSET_MANAGER.getAsset("./assets/poison_fadeout.png")
        };

        // Animations: frameCount, frameDuration, loop
        this.animations = {
            "fadein": new Animator(this.sprites.fadein, 0, 0, 64, 64, 4, 0.08, 0, 0, 0, false),
            "idle": new Animator(this.sprites.idle, 0, 0, 64, 64, 4, 0.1, 0, 0, 0, true),
            "fadeout": new Animator(this.sprites.fadeout, 0, 0, 64, 64, 4, 0.08, 0, 0, 0, false)
        };

        this.state = "fadein"; 
        this.speed = 400;
        this.velocity = { x: 0, y: 0 };
        this.removeFromWorld = false;

        // Map facing to velocity (0:L, 1:R, 2:D, 3:U)
        if (this.facing === 0) this.velocity.x = -this.speed;
        else if (this.facing === 1) this.velocity.x = this.speed;
        else if (this.facing === 2) this.velocity.y = this.speed;
        else if (this.facing === 3) this.velocity.y = -this.speed;

        this.updateBB();
    }

    updateBB() {
        // Projectile BB (slightly smaller than 64x64)
        const size = 32 * this.scale;
        const offset = (64 * this.scale - size) / 2;
        this.BB = new BoundingBox(this.x + offset, this.y + offset, size, size);
    }

    update() {
        const tick = this.game.clockTick;

        if (this.state === "fadein") {
            if (this.animations["fadein"].isDone()) this.state = "idle";
        }

        if (this.state !== "fadeout") {
            this.x += this.velocity.x * tick;
            this.y += this.velocity.y * tick;
            this.updateBB();

            // Check collisions with Enemies (Snakes, Yorkies, etc)
            this.game.entities.forEach(entity => {
                const isEnemy = ["Yorkie", "Enemy", "Snake"].includes(entity.constructor.name);
                if (isEnemy && entity.BB && this.BB.collide(entity.BB)) {
                    this.applyPoison(entity);
                    this.state = "fadeout";
                }
                // Handle Snake specifically if it uses boundingBox instead of BB
                else if (isEnemy && entity.boundingBox && this.BB.collide(entity.boundingBox)) {
                    this.applyPoison(entity);
                    this.state = "fadeout";
                }
            });
        }

        if (this.state === "fadeout" && this.animations["fadeout"].isDone()) {
            this.removeFromWorld = true;
        }
    }

    applyPoison(target) {
        target.health -= 0.2; // Small impact damage
        target.isPoisoned = true;
        target.poisonTimer = 2; // Duration in seconds (requested 2)
        
        // Save original speed if not already poisoned
        if (!target.originalSpeed) target.originalSpeed = target.speed;
        target.speed = target.originalSpeed * 0.4; // 60% slow
    }

    draw(ctx) {
        const tick = this.game.clockTick;
        const size = 64 * this.scale;
        const centerX = this.x + size / 2;
        const centerY = this.y + size / 2;

        ctx.save();
        // Translate to the center of the projectile for rotation
        ctx.translate(centerX, centerY);
        
        // Rotate context (Sprite naturally faces right / facing 1)
        if (this.facing === 0) ctx.rotate(Math.PI);          // Left
        else if (this.facing === 2) ctx.rotate(Math.PI / 2);  // Down
        else if (this.facing === 3) ctx.rotate(-Math.PI / 2); // Up
        // Facing 1 (Right) is 0 rotation
        
        // Draw frame at negative half-size so it's centered
        this.animations[this.state].drawFrame(tick, ctx, -size / 2, -size / 2, this.scale);
        ctx.restore();
        
        // Debug BB
        if (this.game.options.debugging) {
            ctx.strokeStyle = "red";
            ctx.strokeRect(this.BB.x, this.BB.y, this.BB.width, this.BB.height);
        }
    }
}