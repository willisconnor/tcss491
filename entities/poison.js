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

            // check collisions with environment/walls
            if (this.game.collisionManager && this.game.collisionManager.checkCollision(this.BB.x, this.BB.y, this.BB.width, this.BB.height)) {
                this.state = "fadeout";
            }
            // Check collisions with Enemies (Snakes, Yorkies, etc)
            this.game.entities.forEach(entity => {
                const isEnemy = ["Yorkie", "Enemy", "Snake"].includes(entity.constructor.name);
                if (isEnemy && entity.BB && this.BB.collide(entity.BB)) {
                    this.applyPoison(entity);
                    this.state = "fadeout";
                    // Remove poison immediately if Yorkie is defeated to prevent lingering poison after death
                    if (entity.constructor.name === "Yorkie" && entity.health <= 0) {
                        this.removeFromWorld = true;
                    }
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
        // Check if the target is Yorkie and if he is currently "peaceful"
        if (target.constructor.name === "Yorkie") {
            const combatStates = ["TRAINING", "PRE_FIGHT"];
            if (!combatStates.includes(target.actionState)) {
                return; // Do nothing if we aren't in combat!
            }
        }
        // properly trigger enemy/snake death logic
        if (typeof target.takeDamage === "function") {
            target.takeDamage(0.2);
        } else {
            target.health -= 0.2;
        }

        target.isPoisoned = true;
        target.poisonTimer = 2; 
        
        if (!target.originalSpeed) target.originalSpeed = target.speed;
        target.speed = target.originalSpeed * 0.4; 
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

class PoisonParticle {
    constructor(game, x, y) {
        Object.assign(this, { game, x, y });
        
        // Randomize movement slightly
        this.velocity = { 
            x: (Math.random() - 0.5) * 50, 
            y: -Math.random() * 80 - 20 
        };
        
        this.lifetime = 0.6; // Seconds
        this.elapsed = 0;
        this.removeFromWorld = false;
        this.size = Math.random() * 3 + 2;
    }

    update() {
        this.elapsed += this.game.clockTick;
        if (this.elapsed > this.lifetime) {
            this.removeFromWorld = true;
        }

        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    draw(ctx) {
        ctx.save();
        // Fade out based on lifetime
        ctx.globalAlpha = 1 - (this.elapsed / this.lifetime);
        ctx.fillStyle = "#39FF14"; // Neon Green
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}