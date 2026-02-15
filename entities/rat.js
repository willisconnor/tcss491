// Author: Christina Blackwell
// I modified it to include attack logic w/ lunge animation and Yorkie interaction

class Rat {
    constructor(game, x, y) {
        this.game = game;
        this.canvas = document.getElementById("gameWorld");
        this.animations = new Map();
        this.animations.set("idle", []);
        this.animations.set("walk", []);
        this.animations.set("run", []);
        // I might try to edit the sprite sheet to create attack animations -Christina
        // this.animations.set("attack", []);
        this.animations.set("dead", null);
        this.loadAnimations();
        // 0 = left, 1 = right, 2 = down, 3 = up
        this.facing = 2;
        this.scale = 1.25;
        this.animator = this.animations.get("idle")[this.facing];
        // Controls where player spawns
        this.x = x;
        this.y = y;
        //this.x = (this.canvas.width / 2) - ((this.animator.width * this.scale) / 2);
        //this.y = (this.canvas.height / 2) - ((this.animator.height * this.scale) / 2);
        this.speed = 0;

        // attack stats
        this.attackTimer = 0;
        this.attackDuration = 0.10; // 0.1 seconds for the lunge (decrease # for faster lunge, increase # for slower lunge)
        this.attackCooldown = 0;
        // initialize Bounding Box
        //health system
        this.health = 10;
        this.maxHealth = 10;
        this.invulnerabilityTimer = 0; //prevent spam damage
        this.invulnerabilityDuration = 0.5; //0.5 seconds of invuln after damaged



        this.updateBB();
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
        // timer management
        if (this.attackTimer > 0) this.attackTimer -= this.game.clockTick;
        if (this.attackCooldown > 0) this.attackCooldown -= this.game.clockTick;
        if (this.invulnerabilityTimer > 0) this.invulnerabilityTimer -= this.game.clockTick;

        // Freeze movement and force facing during pre-dialogue or when explicitly frozen
        if ((this.game.camera && this.game.camera.preDialogueActive) || this.frozenForDialogue) {
            // if frozenForDialogue may have a preset facing, otherwise look right for the intro
            if (this.game.camera && this.game.camera.preDialogueActive) this.facing = 1;
            this.animator = this.animations.get("idle")[this.facing];
            this.updateBB();
            return;
        }

        // attack input ---SPACEBAR!!--
        // can only attack if not already attacking and cooldown is up
        if (this.game.keys["Space"] && this.attackTimer <= 0 && this.attackCooldown <= 0) {
            this.attackTimer = this.attackDuration;
            this.attackCooldown = 0.5; // add slight delay before next attack
            this.performAttack();      // execute hit check immediately
        }

        let targetAnim = this.animations.get("idle")[this.facing];
        let targetSpeed = 0;
        // I made my own attack logic but left Christina's commented out in case she wants to incorporate/change something
        // Update for attack eventually
        /*if (this.game.keys["Space"]) {
            targetSpeed = 0;
            targetAnim = this.animations.get("attack");
        }
        else*/
        // cutscene logic (automatic movement)
        let yorkie = this.game.entities.find(e => e.constructor.name === "Yorkie");

        // check if Yorkie is waiting for us to move
        if (yorkie && yorkie.actionState === "WAIT_FOR_RAT") {
            // move RAT far enough so Yorkie doesn't walk over him
            // yorkie goes to targetX=420. Rat needs to be PAST that
            let safeX = yorkie.targetX + 50;

            if (this.x < safeX) {
                this.x += 100 * this.game.clockTick; // auto-walk right
                this.facing = 1;
                this.animator = this.animations.get("walk")[1];
                this.updateBB();
                return; // STOP here; ignore inputs
            } else {
                // we are safe; trigger Yorkie to leave!
                yorkie.actionState = "LEAVING";
                yorkie.leavingPhase = 1;
                return;
            }
        }

        if (this.attackTimer > 0) {
            targetAnim = this.animations.get("walk")[this.facing];
            targetSpeed = 0; // lock movement so you dont glide
        }
        // normal movement
        else {
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
    }

    performAttack() {
        // define hitbox range and size
        let range = 60;
        let hitX = this.x;
        let hitY = this.y;

        // offset hitbox based on facing direction
        if (this.facing === 0) hitX -= range; // left
        else if (this.facing === 1) hitX += range; // right
        else if (this.facing === 2) hitY += range; // down
        else if (this.facing === 3) hitY -= range; // up

        // create hitbox
        let attackBox = new BoundingBox(hitX, hitY, 50, 50);

        // find Yorkie and check collision
        //let yorkie = this.game.entities.find(e => e.constructor.name === "Yorkie");
        //check all entities for hits
        for (let entity of this.game.entities) {
            //check yorkie
            if (entity.constructor.name === "Yorkie" && entity.actionState === "TRAINING" && entity.BB) {
                if (attackBox.collide(entity.BB)) {
                    entity.health -= 1;
                }
            }
            //check enemies
            if (entity.constructor.name === "Snake" && !entity.dead && entity.boundingBox){
                if (attackBox.collide(entity.boundingBox)) {
                    entity.takeDamage(1); //deal 1 damage to enemy
                    console.log(`Hit ${entity.constructor.name}! Health: ${entity.health}`);
                }
            }
        }

        /**
        // validate Yorkie exists, is in training state,  initialized its own BoundingBox
        if (yorkie && yorkie.actionState === "TRAINING" && yorkie.BB) {
            if (attackBox.collide(yorkie.BB)) {
                yorkie.health -= 1;
            }
        }
        */
    }

    checkYorkieCollision(newX, newY, colliderW, colliderH) {
        let yorkie = this.game.entities.find(e => e.constructor.name === "Yorkie");
        // removed state checks
        // if Yorkie exists, collide with him; NO WALKING OVER YORKIE1
        if (yorkie && yorkie.BB) {
            let potentialRatBox = new BoundingBox(newX, newY, colliderW, colliderH);
            if (potentialRatBox.collide(yorkie.BB)) {
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        ctx.imageSmoothingEnabled = false;

        // lunge animation calculation
        let drawX = this.x;
        let drawY = this.y;

        if (this.attackTimer > 0) {
            // calculate a ratio from 0 to 1 and back to 0
            // Math.sin(0) = 0, Math.sin(PI/2) = 1, Math.sin(PI) = 0
            let ratio = this.attackTimer / this.attackDuration;
            let sineWave = Math.sin(ratio * Math.PI);

            let lungeDistance = 20; // # of pixels to lunge
            let offset = sineWave * lungeDistance;

            if (this.facing === 0) drawX -= offset;
            if (this.facing === 1) drawX += offset;
            if (this.facing === 2) drawY += offset;
            if (this.facing === 3) drawY -= offset;
        }

        const width = this.animator.width * this.scale;
        const centerX = drawX + width / 2; // use drawX
        const fixedHeight = 38 * this.scale;
        const feetY = drawY + fixedHeight; // use drawY

        // shadow
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(centerX, feetY - 5, width * 0.6, 8, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 215, 0, 0.5)";
        ctx.fill();
        ctx.restore();

        // drawing glow outline; pass 0 for tick to avoid advancing animation
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.filter = "brightness(1) drop-shadow(0 0 4px gold)";
        const offsets = [[-2, 0], [2, 0], [0, -2], [0, 2]];
        offsets.forEach(([ox, oy]) => {
            this.animator.drawFrame(0, ctx, drawX + ox, drawY + oy, this.scale);
        });
        ctx.restore();

        // drawing actual sprite on top, only THIS one advances the animation
        ctx.save();
        ctx.filter = "drop-shadow(0 0 4px rgba(255, 215, 0, 0.6))";
        this.animator.drawFrame(this.game.clockTick, ctx, drawX, drawY, this.scale);
        ctx.restore();

        // debug: draw Hitbox if attacking
        if (this.game.options.debugging && this.attackTimer > 0) {
            ctx.strokeStyle = "red";
            let range = 60;
            let hitX = this.x; let hitY = this.y;
            if (this.facing === 0) hitX -= range;
            else if (this.facing === 1) hitX += range;
            else if (this.facing === 2) hitY += range;
            else if (this.facing === 3) hitY -= range;
            ctx.strokeRect(hitX, hitY, 50, 50);
        }

        if (this.game.options.debugging && this.BB) {
            ctx.strokeStyle = "red";
            ctx.strokeRect(this.BB.x, this.BB.y, this.BB.width, this.BB.height);
        }
    }
}