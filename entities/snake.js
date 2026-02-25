//@author: Connor Willis
//@date: 2/7/26
//Snake enemy: patrols a path or remains idle, then chases and attacks player when visible

class Snake extends Enemy{
    constructor(game, x, y, patrolPath = null){
        super(
            game,
            x, y,
            3,
            10,
            200,
            50,
            0.5  // Slowed down from 1.0
        );
        this.scale = 2.5;  // Scaled down from 4
        this.facing = 1; // 0=left, 1=right, 2=down, 3=up

        this.attackCooldownMax = 1.5;

        // Patrol system
        this.patrolPath = patrolPath;
        this.patrolIndex = 0;
        this.patrolDirection = 1;
        this.patrolWaitTimer = 0;
        this.patrolWaitDuration = 1;

        // State management
        this.state = "IDLE";

        // Attack timing
        this.attackAnimationTimer = 0;
        this.attackAnimationDuration = 0.5;
        this.hurtAnimationTimer = 0;
        this.stateBeforeHurt = null;

        // Load sprite
        this.sprite = ASSET_MANAGER.getAsset("./assets/Snake.png");

        // Dimensions for bounding box
        this.width = 16 * this.scale;
        this.height = 16 * this.scale;

        // Load animations
        this.loadAnimations();
        this.currentAnimation = this.animations.get("idle")[this.facing];

        // Initialize bounding box
        this.boundingBox = new BoundingBox(this.x, this.y, this.width, this.height);
    }

    // 0 = left, 1 = right, 2 = down, 3 = up
    loadAnimations() {
        this.animations = new Map();
        this.animations.set("idle", []);
        this.animations.set("walk", []);
        this.animations.set("attack", []);
        this.animations.set("hurt", []);
        this.animations.set("death", []);

        // Store which horizontal direction we're facing (0=left, 1=right)
        this.horizontalFacing = 1; // default to right

        // SNAKE_SPRITES order: [attack, death, hurt, idle, walk]
        // We only load right-facing sprites, flipping is handled in draw()

        //idle - just use one animator for all directions
        const idleAnim = new Animator(
            ASSET_MANAGER.getAsset(SNAKE_SPRITES[3]),
            0, 0, 32, 32, 10, 0.1, 0
        );
        this.animations.get("idle")[0] = idleAnim;
        this.animations.get("idle")[1] = idleAnim;
        this.animations.get("idle")[2] = idleAnim;
        this.animations.get("idle")[3] = idleAnim;

        //walk
        const walkAnim = new Animator(
            ASSET_MANAGER.getAsset(SNAKE_SPRITES[4]),
            0, 0, 32, 32, 7, 0.1, 0
        );
        this.animations.get("walk")[0] = walkAnim;
        this.animations.get("walk")[1] = walkAnim;
        this.animations.get("walk")[2] = walkAnim;
        this.animations.get("walk")[3] = walkAnim;

        //attack
        const attackAnim = new Animator(
            ASSET_MANAGER.getAsset(SNAKE_SPRITES[0]),
            0, 0, 32, 32, 7, 0.05, 0, 0, 0, false
        );
        this.animations.get("attack")[0] = attackAnim;
        this.animations.get("attack")[1] = attackAnim;
        this.animations.get("attack")[2] = attackAnim;
        this.animations.get("attack")[3] = attackAnim;

        //hurt
        const hurtAnim = new Animator(
            ASSET_MANAGER.getAsset(SNAKE_SPRITES[2]),
            0, 0, 32, 32, 2, 0.1, 0, 0, 0, false
        );
        this.animations.get("hurt")[0] = hurtAnim;
        this.animations.get("hurt")[1] = hurtAnim;
        this.animations.get("hurt")[2] = hurtAnim;
        this.animations.get("hurt")[3] = hurtAnim;

        //death
        const deathAnim = new Animator(
            ASSET_MANAGER.getAsset(SNAKE_SPRITES[1]),
            0, 0, 32, 32, 10, 0.1, 0, 0, 0, false
        );
        this.animations.get("death")[0] = deathAnim;
        this.animations.get("death")[1] = deathAnim;
        this.animations.get("death")[2] = deathAnim;
        this.animations.get("death")[3] = deathAnim;
    }

    moveToward(targetX, targetY){
        const dx = targetX - this.x;
        const dy = targetY - this.y;

        const pixelsPerSecond = 75;

        if (Math.abs(dx) > Math.abs(dy)) {
            this.velocity.x = dx > 0 ? pixelsPerSecond : -pixelsPerSecond;
            this.velocity.y = 0;
        } else {
            this.velocity.x = 0;
            this.velocity.y = dy > 0 ? pixelsPerSecond : -pixelsPerSecond;
        }
    }

    /**
     * Determines facing direction based on movement
     * Snake sprite faces the direction it's moving toward the rat
     */
    updateFacing() {
        // Determine which horizontal direction to face based on rat position
        const rat = this.game.entities.find(e => e instanceof Rat);
        if (rat) {
            if (rat.x > this.x) {
                this.horizontalFacing = 1; // Rat is to the right
            } else {
                this.horizontalFacing = 0; // Rat is to the left
            }
        }

        // Set facing based on actual movement direction
        if (Math.abs(this.velocity.x) > 0.1) {
            // Moving horizontally
            this.facing = this.velocity.x > 0 ? 1 : 0;
            this.horizontalFacing = this.facing;
        } else if (Math.abs(this.velocity.y) > 0.1) {
            // Moving vertically - use horizontalFacing to determine sprite
            this.facing = this.velocity.y > 0 ? 2 : 3;

            // Update vertical animations to use the correct horizontal sprite
            for (let animName of ["idle", "walk", "attack", "hurt"]) {
                this.animations.get(animName)[2] = this.animations.get(animName)[this.horizontalFacing];
                this.animations.get(animName)[3] = this.animations.get(animName)[this.horizontalFacing];
            }
        }
    }

    /**
     * Patrol behavior - move along predetermined path
     */
    updatePatrol() {
        if (!this.patrolPath || this.patrolPath.length === 0) {
            this.state = "IDLE";
            return;
        }

        if (this.patrolWaitTimer > 0) {
            this.patrolWaitTimer -= this.game.clockTick;
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.currentAnimation = this.animations.get("idle")[this.facing];
            return;
        }

        const target = this.patrolPath[this.patrolIndex];
        const distance = getDistance({ x: this.x, y: this.y }, target);

        if (distance < 5) {
            this.patrolWaitTimer = this.patrolWaitDuration;

            if (this.patrolPath.length === 1) {
                this.patrolIndex = 0;
            } else {
                this.patrolIndex += this.patrolDirection;

                if (this.patrolIndex >= this.patrolPath.length) {
                    this.patrolIndex = this.patrolPath.length - 2;
                    this.patrolDirection = -1;
                } else if (this.patrolIndex < 0) {
                    this.patrolIndex = 1;
                    this.patrolDirection = 1;
                }
            }
        } else {
            this.moveToward(target.x, target.y);
            this.updateFacing();
            this.currentAnimation = this.animations.get("walk")[this.facing];
        }
    }

    /**
     * Chase behavior - move toward player
     */
    updateChase(player) {
        this.moveToward(player.x, player.y);
        this.updateFacing();
        this.currentAnimation = this.animations.get("walk")[this.facing];
    }

    /**
     * Override attack to include animation
     */
    onAttack() {
        this.state = "ATTACK";
        this.attackAnimationTimer = this.attackAnimationDuration;
        this.currentAnimation = this.animations.get("attack")[this.facing];
        this.currentAnimation.elapsedTime = 0;

        // FIXED: Actually damage the rat!
        const player = this.findPlayer();
        if (player && player.takeDamage) {
            player.takeDamage(this.attackDamage); // 0.1 damage per attack
            console.log(`Snake hit rat for ${this.attackDamage} damage!`);
        }
    }

    /**
     * Override hurt to show feedback
     */
    onHurt() {
        // Store the previous state so we can return to it
        this.stateBeforeHurt = this.state;
        this.state = "HURT";

        // Set hurt animation
        this.currentAnimation = this.animations.get("hurt")[this.facing];
        this.currentAnimation.elapsedTime = 0; // Reset animation to start

        // Brief pause when hurt
        this.velocity.x = 0;
        this.velocity.y = 0;

        // Set a timer for how long the hurt animation plays
        this.hurtAnimationTimer = 0.3; // 0.3 seconds
    }

    /**
     * Override death to play animation
     */
    onDeath() {
        this.state = "DEAD";
        this.currentAnimation = this.animations.get("death")[this.facing];
        this.currentAnimation.elapsedTime = 0;
        this.velocity.x = 0;
        this.velocity.y = 0;
    }

    update() {
        this.updatePoison(this.game.clockTick);
        if (this.dead) {
            if (this.currentAnimation && this.currentAnimation.isDone()) {
                this.removeFromWorld = true;
            }
            this.updateBoundingBox();
            return;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= this.game.clockTick;
        }

        if (this.attackAnimationTimer > 0) {
            this.attackAnimationTimer -= this.game.clockTick;
            this.velocity.x = 0;
            this.velocity.y = 0;

            if (this.attackAnimationTimer <= 0) {
                this.state = "CHASE";
            }
            this.updateBoundingBox();
            return;
        }

        // Handle hurt animation timer
        if (this.hurtAnimationTimer > 0) {
            this.hurtAnimationTimer -= this.game.clockTick;
            this.velocity.x = 0;
            this.velocity.y = 0;

            if (this.hurtAnimationTimer <= 0) {
                this.state = this.stateBeforeHurt || "IDLE";
                this.hurtAnimationTimer = 0;
            }
            this.updateBoundingBox();
            return;
        }

        const player = this.detectPlayer();

        if (player && this.state !== "HURT") {
            if (this.canAttackPlayer()) {
                this.attack();
            } else {
                this.state = "CHASE";
                this.updateChase(player);
            }
        } else {
            if (this.state === "HURT") {
                this.updateBoundingBox();
                return;
            } else {
                if (this.patrolPath && this.patrolPath.length > 0) {
                    this.state = "PATROL";
                    this.updatePatrol();
                } else {
                    this.state = "IDLE";
                    this.velocity.x = 0;
                    this.velocity.y = 0;
                    this.currentAnimation = this.animations.get("idle")[this.facing];
                }
            }
        }

        // Apply velocity WITH COLLISION DETECTION (like Rat)
        const spriteWidth = 32 * this.scale;
        const spriteHeight = 32 * this.scale;
        const colliderRadius = 10 * this.scale;
        const colliderWidth = colliderRadius * 2;
        const colliderHeight = colliderRadius;

        // Calculate potential new positions
        const moveX = this.velocity.x * this.game.clockTick;
        const moveY = this.velocity.y * this.game.clockTick;

        // Test X movement independently - ONLY if actually moving
        if (Math.abs(moveX) > 0.01) {
            const testX = this.x + moveX;
            const testColliderX = testX + (spriteWidth / 2) - colliderRadius;
            const currentColliderY = this.y + spriteHeight - colliderHeight;

            if (!this.game.collisionManager.checkCollision(testColliderX, currentColliderY, colliderWidth, colliderHeight)) {
                this.x = testX; // Safe to move
            } else {
                this.velocity.x = 0; // ✓ STOP sliding - zero velocity!
            }
        }

        // Test Y movement independently - ONLY if actually moving
        if (Math.abs(moveY) > 0.01) {
            const testY = this.y + moveY;
            const currentColliderX = this.x + (spriteWidth / 2) - colliderRadius;
            const testColliderY = testY + spriteHeight - colliderHeight;

            if (!this.game.collisionManager.checkCollision(currentColliderX, testColliderY, colliderWidth, colliderHeight)) {
                this.y = testY; // Safe to move
            } else {
                this.velocity.y = 0; // ✓ STOP sliding - zero velocity!
            }
        }

        this.updateBoundingBox();
    }

    draw(ctx, game) {
        if (this.currentAnimation) {
            // fixed connors minor snake sliding issue; SceneManager already handles camera translation. Subtracting
            // camera values here caused the snake to slide!
            const drawX = this.x;
            const drawY = this.y;

            // Check if we need to flip
            const shouldFlip = (this.facing === 0) ||
                ((this.facing === 2 || this.facing === 3) && this.horizontalFacing === 0);

            ctx.save();

            if (shouldFlip) {
                // Translate to the sprite position, flip, then draw at origin
                const spriteWidth = 32 * this.scale;
                ctx.translate(drawX + spriteWidth, drawY);
                ctx.scale(-1, 1);

                this.currentAnimation.drawFrame(game.clockTick, ctx, 0, 0, this.scale);
                this.drawPoisonTint(ctx, 0, 0, 32 * this.scale, 32 * this.scale);
            } else {
                this.currentAnimation.drawFrame(game.clockTick, ctx, drawX, drawY, this.scale);
                this.drawPoisonTint(ctx, drawX, drawY, 32 * this.scale, 32 * this.scale);
            }

            ctx.restore();
        }
        // inherited from enemy class, will hide automatically when dead!
        this.drawHealthBar(ctx);
        if (game.options.debugging) {
            ctx.save();

            // Detection range
            ctx.strokeStyle = "yellow";
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.detectionRange,
                0,
                Math.PI * 2
            );
            ctx.stroke();

            // Attack range
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.attackRange,
                0,
                Math.PI * 2
            );
            ctx.stroke();

            // Bounding box
            if (this.boundingBox) {
                ctx.strokeStyle = "cyan";
                ctx.strokeRect(
                    this.boundingBox.x,
                    this.boundingBox.y,
                    this.boundingBox.width,
                    this.boundingBox.height
                );
            }

            // Patrol path
            if (this.patrolPath && this.patrolPath.length > 0) {
                ctx.strokeStyle = "orange";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(
                    this.patrolPath[0].x,
                    this.patrolPath[0].y
                );
                for (let i = 1; i < this.patrolPath.length; i++) {
                    ctx.lineTo(
                        this.patrolPath[i].x,
                        this.patrolPath[i].y
                    );
                }
                ctx.stroke();
                ctx.lineWidth = 1;

                // Mark patrol points
                ctx.fillStyle = "orange";
                for (const point of this.patrolPath) {
                    ctx.fillRect(
                        point.x - 3,
                        point.y - 3,
                        6,
                        6
                    );
                }

                // Mark current target
                ctx.fillStyle = "lime";
                const currentTarget = this.patrolPath[this.patrolIndex];
                if (currentTarget) {
                    ctx.fillRect(
                        currentTarget.x - 5,
                        currentTarget.y - 5,
                        10,
                        10
                    );
                }
            }

            // State indicator
            ctx.fillStyle = "white";
            ctx.font = "12px Arial";
            ctx.fillText(
                `${this.state} F:${this.facing} HF:${this.horizontalFacing}`,
                this.x,
                this.y- 30
            );

            ctx.restore();
        }
    }
}