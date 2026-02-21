// Author: Christina Blackwell

class Rat {

    constructor(game, x, y) {
        this.game = game;
        this.canvas = document.getElementById("gameWorld");
        this.animations = new Map();
        this.animations.set("idle", []);
        this.animations.set("walk", []);
        this.animations.set("run", []);
        this.animations.set("attack", []);
        this.animations.set("dead", null);
        this.loadAnimations();

        this.attackCooldownMax = .5
        // 0 = left, 1 = right, 2 = down, 3 = up
        this.facing = 2;
        this.scale = 1.25;
        this.animator = this.animations.get("idle")[this.facing];

        this.x = x;
        this.y = y;
        this.speed = 0;

        this.attackCooldown = 0;
        // initialize Bounding Box
        //health system
        this.health = 10;
        this.maxHealth = 10;
        this.invulnerabilityTimer = 0; //prevent spam damage
        this.invulnerabilityDuration = 0.5; //0.5 seconds of invuln after damaged


        this.hasHit = false;

        this.updateBB();
    };

    loadAnimations() {
        this.animations.get("idle")[0] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[1]), 0, 58, 48, 38, 3, 0.7, 0);
        this.animations.get("idle")[1] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[1]), 0, 106, 48, 38, 3, 0.7, 0);
        this.animations.get("idle")[2] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[1]), 0, 6, 48, 33, 3, 0.7, 0, -2.4);
        this.animations.get("idle")[3] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[1]), 0, 148, 48, 44, 3, 0.7, 0, -2.4);

        this.animations.get("walk")[0] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]), 0, 74, 48, 18, 3, 0.15, 0, 0, 14);
        this.animations.get("walk")[1] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]), 0, 122, 48, 18, 3, 0.15, 0, 0, 14);
        this.animations.get("walk")[2] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]), 0, 22, 48, 22, 3, 0.15, 0, 0, 14);
        this.animations.get("walk")[3] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]), 0, 164, 48, 24, 3, 0.15, 0, 0, 14);

        this.animations.get("run")[0] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]), 0, 74, 48, 18, 3, 0.1, 0, 0, 14);
        this.animations.get("run")[1] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]), 0, 122, 48, 18, 3, 0.1, 0, 0, 14);
        this.animations.get("run")[2] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]), 0, 22, 48, 22, 3, 0.1, 0, 0, 14);
        this.animations.get("run")[3] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[0]), 0, 164, 48, 24, 3, 0.1, 0, 0, 14);

        this.animations.get("attack")[0] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[2]), 183, 12, 62, 44, 3, 0.2, 0, 20, 0, false);
        this.animations.get("attack")[1] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[2]), 371, 12, 62, 44, 3, 0.2, 0, 0, 0, false);
        this.animations.get("attack")[2] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[2]), 0, 10, 62, 44, 3, 0.2, 0, 0, 0, false);
        this.animations.get("attack")[3] = new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[2]), 558, 7, 62, 48, 3, 0.2, 0, 0, 0, false);

        this.animations.set("dead", new Animator(ASSET_MANAGER.getAsset(RAT_SPRITES[1]), 0, 312, 48, 18, 3, 0.7, 0, 0, 14, false));
    }

    updateBB() {
        const spriteWidth = 48 * this.scale;
        const fixedHeight = 38 * this.scale;
        const colliderRadius = 12 * this.scale;
        const colliderWidth = colliderRadius * 2;
        const colliderHeight = colliderRadius;

        const colliderX = this.x + (spriteWidth / 2) - colliderRadius;
        const colliderY = this.y + fixedHeight - colliderHeight;

        this.BB = new BoundingBox(colliderX, colliderY, colliderWidth, colliderHeight);
    }

    takeDamage(damage) {
        if (this.invulnerabilityTimer > 0) return; // Can't take damage while invulnerable

        this.health -= damage;
        this.invulnerabilityTimer = this.invulnerabilityDuration;

        console.log(`Rat took ${damage} damage! Health: ${this.health}/${this.maxHealth}`);

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    die() {
        console.log("Rat died!");
        // For now, just set the death animation
        // You can add game over logic later
        this.animator = this.animations.get("dead");
    }

    update() {
        if (this.attackCooldown > 0) this.attackCooldown -= this.game.clockTick;
        if (this.invulnerabilityTimer > 0) this.invulnerabilityTimer -= this.game.clockTick;

        if ((this.game.camera && this.game.camera.preDialogueActive) || this.frozenForDialogue) {
            if (this.game.camera && this.game.camera.preDialogueActive) this.facing = 1;
            this.animator = this.animations.get("idle")[this.facing];
            this.updateBB();
            return;
        }

        let targetAnim = this.animations.get("idle")[this.facing];
        let targetSpeed = 0;

        let yorkie = this.game.entities.find(e => e.constructor.name === "Yorkie");

        if (yorkie && yorkie.actionState === "WAIT_FOR_RAT") {
            let safeX = yorkie.targetX + 80;
            if (this.x < safeX) {
                this.x += 100 * this.game.clockTick;
                this.facing = 1;
                this.animator = this.animations.get("walk")[1];
                this.updateBB();
                return;
            } else {
                yorkie.actionState = "LEAVING";
                yorkie.leavingPhase = 1;
                return;
            }
        }

        if (this.game.keys["Space"] && this.attackCooldown <= 0) {
            targetSpeed = 0;
            targetAnim = this.animations.get("attack")[this.facing];
            this.performAttack();
        } else {
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

            if (this.game.keys["ShiftLeft"] && targetSpeed > 0) {
                targetSpeed = 200;
                targetAnim = this.animations.get("run")[this.facing];
            }
        }

        const currentAnim = this.animator;
        const isPriority = (currentAnim === this.animations.get("dead")) || (currentAnim === this.animations.get("attack")[this.facing]);

        if (isPriority && !currentAnim.isDone()) {
            targetAnim = currentAnim;
            targetSpeed = 0;
        }

        if (this.animator !== targetAnim) {
            this.animator = targetAnim;
            this.animator.elapsedTime = 0;
            this.hasHit = false;
        } else if (isPriority && currentAnim.isDone()) {
            this.animator.elapsedTime = 0;
            this.hasHit = false;
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

        // X-Axis
        let testColliderX = newX + (spriteWidth / 2) - colliderRadius;
        let currentColliderY = this.y + fixedHeight - colliderHeight;

        if (!this.game.collisionManager.checkCollision(testColliderX, currentColliderY, colliderWidth, colliderHeight) &&
            !this.checkYorkieCollision(testColliderX, currentColliderY, colliderWidth, colliderHeight)) {
            this.x = newX;
        }
        // checking Y-axis movement only, using potentially UPDATED X we re-calculate X because if we moved left/right
        // above we need the new position for this check
        let currentColliderX = this.x + (spriteWidth / 2) - colliderRadius;
        let testColliderY = newY + fixedHeight - colliderHeight;

        if (!this.game.collisionManager.checkCollision(currentColliderX, testColliderY, colliderWidth, colliderHeight) &&
            !this.checkYorkieCollision(currentColliderX, testColliderY, colliderWidth, colliderHeight)) {
            this.y = newY; // safe to move Y
        }

        this.updateBB();

        if (this.animator === this.animations.get("attack")[this.facing]) {
            this.performAttack();
        }
    }

    performAttack() {
        if (this.hasHit) return;
        let range = 60;
        let hitX = this.x;
        let hitY = this.y;
        if (this.facing === 0) hitX -= range;
        else if (this.facing === 1) hitX += range;
        else if (this.facing === 2) hitY += range;
        else if (this.facing === 3) hitY -= range;
        if (this.attackCooldown > 0 || this.hasHit) return;

        let attackBox = new BoundingBox(hitX, hitY, 50, 50);

        // find Yorkie and check collision
        //let yorkie = this.game.entities.find(e => e.constructor.name === "Yorkie");
        //check all entities for hits
        for (let entity of this.game.entities) {
            //check yorkie
            if (entity.constructor.name === "Yorkie" && entity.actionState === "TRAINING" && entity.BB) {
                if (attackBox.collide(entity.BB)) {
                    entity.health -= 1;
                    this.hasHit = true;
                    this.attackCooldown = this.attackCooldownMax;
                    break;
                }
            }
            //check enemies
            if (entity.constructor.name === "Snake" && !entity.dead && entity.boundingBox){
                if (attackBox.collide(entity.boundingBox)) {
                    entity.takeDamage(1);
                    this.hasHit = true;
                    this.attackCooldown = this.attackCooldownMax; // ✓ Start cooldown!
                    console.log(`Hit ${entity.constructor.name}! Health: ${entity.health}`);
                    break; // ✓ Only hit one entity
                }
            }
        }

        /**
        // validate Yorkie exists, is in training state,  initialized its own BoundingBox
        let yorkie = this.game.entities.find(e => e.constructor.name === "Yorkie");

        if (yorkie && yorkie.actionState === "TRAINING" && yorkie.BB) {
            if (attackBox.collide(yorkie.BB)) {
                yorkie.health -= 0.5;
                this.hasHit = true;
            }
        }
        */
    }

    checkYorkieCollision(newX, newY, colliderW, colliderH) {
        let yorkie = this.game.entities.find(e => e.constructor.name === "Yorkie");
        if (yorkie && yorkie.BB) {
            let potentialRatBox = new BoundingBox(newX, newY, colliderW, colliderH);
            return potentialRatBox.collide(yorkie.BB);
        }
        return false;
    }

    draw(ctx) {
        ctx.imageSmoothingEnabled = false;
        let drawX = this.x;
        let drawY = this.y;
        let width = (this.animator === this.animations.get("attack")[this.facing])
            ? this.animations.get("idle")[this.facing].width * this.scale
            : this.animator.width * this.scale;

        const centerX = drawX + width / 2;
        const fixedHeight = 38 * this.scale;
        const feetY = drawY + fixedHeight;

        // Shadow
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(centerX, feetY - 5, width * 0.6, 8, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 215, 0, 0.5)";
        ctx.fill();
        ctx.restore();

        // Glow Outline
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.filter = "brightness(1) drop-shadow(0 0 4px gold)";
        [[-2, 0], [2, 0], [0, -2], [0, 2]].forEach(([ox, oy]) => {
            this.animator.drawFrame(0, ctx, drawX + ox, drawY + oy, this.scale);
        });
        ctx.restore();

        // Main Sprite
        ctx.save();
        ctx.filter = "drop-shadow(0 0 4px rgba(255, 215, 0, 0.6))";
        this.animator.drawFrame(this.game.clockTick, ctx, drawX, drawY, this.scale);
        ctx.restore();

        // Debug Hitboxes
        if (this.game.options.debugging) {
            const isAttacking = (this.animator === this.animations.get("attack")[this.facing]);
            if (isAttacking) {
                ctx.strokeStyle = "red";
                let range = 60;
                let hitX = this.x;
                let hitY = this.y;
                if (this.facing === 0) hitX -= range;
                else if (this.facing === 1) hitX += range;
                else if (this.facing === 2) hitY += range;
                else if (this.facing === 3) hitY -= range;
                ctx.strokeRect(hitX, hitY, 50, 50);
            }
            if (this.BB) {
                ctx.strokeStyle = "blue"; // Blue for movement BB
                ctx.strokeRect(this.BB.x, this.BB.y, this.BB.width, this.BB.height);
            }
        }
    }
}