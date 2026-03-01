//@author: Connor Willis
//@date: 2/26/26
//Cat enemy: patrols a path or remains idle, then chases and attacks player when visible

class Cat extends Enemy{
    constructor(game, x, y, patrolPath = null){
        super(
            game,
            x, y,
            5,
            5,
            100,
            30,
            0.5
        );
        this.scale = 2.5;
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

        // Single spritesheet — 896x4608, cells are 64x64 (14 cols x 72 rows)
        this.sprite = ASSET_MANAGER.getAsset("./assets/OrangeCat.png");

        // Dimensions for bounding box
        this.width = 64 * this.scale;
        this.height = 64 * this.scale;

        // Load animations
        this.loadAnimations();
        this.currentAnimation = this.animations.get("idle")[this.facing];

        // Initialize bounding box
        this.boundingBox = new BoundingBox(this.x, this.y, this.width, this.height);
    }

    /**
     * Helper: create an Animator from a row on OrangeCat.png
     * Sheet is 896x4608 with 64x64 cells (14 cols, 72 rows)
     * @param {number} row        - Row index (0-based)
     * @param {number} frameCount - Number of frames in the row
     * @param {number} frameTime  - Seconds per frame
     * @param {boolean} loop      - Whether the animation loops
     */
    makeAnim(row, frameCount, frameTime = 0.12, loop = true) {
        return new Animator(
            this.sprite,
            0,          // startX
            row * 64,   // startY — each cell is 64px tall
            64, 64,     // frameWidth, frameHeight
            frameCount,
            frameTime,
            0,          // padding
            0, 0,
            loop
        );
    }

    // facing: 0=left, 1=right, 2=down, 3=up
    loadAnimations() {
        this.animations = new Map();
        this.animations.set("idle",   []);
        this.animations.set("walk",   []);
        this.animations.set("run",    []);
        this.animations.set("attack", []);
        this.animations.set("hurt",   []);
        this.animations.set("death",  []);

        this.horizontalFacing = 1; // default right

        // --- IDLE: tail wag (rows 23-26: front, back, left, right) ---
        const idleDown  = this.makeAnim(23, 5);
        const idleUp    = this.makeAnim(24, 5);
        const idleLeft  = this.makeAnim(25, 5);
        const idleRight = this.makeAnim(26, 5);
        this.animations.get("idle")[0] = idleLeft;
        this.animations.get("idle")[1] = idleRight;
        this.animations.get("idle")[2] = idleDown;
        this.animations.get("idle")[3] = idleUp;

        // --- WALK (rows 2-5: down, up, right, left) ---
        const walkDown  = this.makeAnim(2, 6);
        const walkUp    = this.makeAnim(3, 6);
        const walkRight = this.makeAnim(4, 6);
        const walkLeft  = this.makeAnim(5, 6);
        this.animations.get("walk")[0] = walkLeft;
        this.animations.get("walk")[1] = walkRight;
        this.animations.get("walk")[2] = walkDown;
        this.animations.get("walk")[3] = walkUp;

        // --- RUN (rows 8-11: down, up, right, left) ---
        // rows 8/9 have 4 frames, rows 10/11 have 5 frames
        const runDown  = this.makeAnim(8,  4, 0.1);
        const runUp    = this.makeAnim(9,  4, 0.1);
        const runRight = this.makeAnim(10, 5, 0.1);
        const runLeft  = this.makeAnim(11, 5, 0.1);
        this.animations.get("run")[0] = runLeft;
        this.animations.get("run")[1] = runRight;
        this.animations.get("run")[2] = runDown;
        this.animations.get("run")[3] = runUp;

        // --- ATTACK ---
        // down (front): row 29, right paw, 11 frames
        // up   (back):  row 31, paw swipe back, 5 frames
        // left:         row 32, left paw swipe standing left, 11 frames
        // right:        row 35, right paw swipe standing right, 11 frames
        const attackDown  = this.makeAnim(29, 11, 0.05, false);
        const attackUp    = this.makeAnim(31, 5,  0.05, false);
        const attackLeft  = this.makeAnim(32, 11, 0.05, false);
        const attackRight = this.makeAnim(35, 11, 0.05, false);
        this.animations.get("attack")[0] = attackLeft;
        this.animations.get("attack")[1] = attackRight;
        this.animations.get("attack")[2] = attackDown;
        this.animations.get("attack")[3] = attackUp;

        // --- HURT & DEATH: sleep (row 44, front-facing, 2 frames, non-looping) ---
        const sleepAnim = this.makeAnim(44, 2, 0.2, false);
        for (let i = 0; i < 4; i++) {
            this.animations.get("hurt")[i]  = sleepAnim;
            this.animations.get("death")[i] = sleepAnim;
        }
    }

    moveToward(targetX, targetY){
        const dx = targetX - this.x;
        const dy = targetY - this.y;

        // 150 * this.speed so poison slowdown (0.4x modifier) works correctly
        const pixelsPerSecond = 150 * this.speed;

        if (Math.abs(dx) > Math.abs(dy)) {
            this.velocity.x = dx > 0 ? pixelsPerSecond : -pixelsPerSecond;
            this.velocity.y = 0;
        } else {
            this.velocity.x = 0;
            this.velocity.y = dy > 0 ? pixelsPerSecond : -pixelsPerSecond;
        }
    }

    updateFacing() {
        const rat = this.game.entities.find(e => e instanceof Rat);
        if (rat) {
            // Dead zone prevents rapid flickering when vertically aligned
            const dx = rat.x - this.x;
            if (dx > 2) {
                this.horizontalFacing = 1;
            } else if (dx < -2) {
                this.horizontalFacing = 0;
            }
        }

        if (Math.abs(this.velocity.x) > 0.1) {
            this.facing = this.velocity.x > 0 ? 1 : 0;
            this.horizontalFacing = this.facing;
        } else if (Math.abs(this.velocity.y) > 0.1) {
            this.facing = this.velocity.y > 0 ? 2 : 3;
            // No vertical animation remapping needed — cat has dedicated directional rows
        }
    }

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

    updateChase(player) {
        this.moveToward(player.x, player.y);
        this.updateFacing();
        // Use run animation when chasing
        this.currentAnimation = this.animations.get("run")[this.facing];
    }

    onAttack() {
        this.state = "ATTACK";
        this.attackAnimationTimer = this.attackAnimationDuration;
        this.currentAnimation = this.animations.get("attack")[this.facing];
        this.currentAnimation.elapsedTime = 0;

        const player = this.findPlayer();
        if (player && player.takeDamage) {
            player.takeDamage(this.attackDamage);
            console.log(`Cat hit rat for ${this.attackDamage} damage!`);
        }
    }

    onHurt() {
        this.stateBeforeHurt = this.state;
        this.state = "HURT";
        this.currentAnimation = this.animations.get("hurt")[this.facing];
        this.currentAnimation.elapsedTime = 0;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.hurtAnimationTimer = 0.3;
    }

    onDeath() {
        this.state = "DEAD";
        let anim = this.animations.get("death")[this.facing];
        if (anim) {
            anim.elapsedTime = 0;
        }
        this.currentAnimation = anim;
        this.velocity.x = 0;
        this.velocity.y = 0;
    }

    update() {
        // Poison tick
        this.updatePoison(this.game.clockTick);

        // 1. Death logic — force death animation every frame
        if (this.dead) {
            this.currentAnimation = this.animations.get("death")[this.facing];

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

        // Use parent class moveWithSliding
        const spriteWidth = 64 * this.scale;
        const spriteHeight = 64 * this.scale;
        const colliderRadius = 10 * this.scale;
        const ratTarget = this.state === "CHASE" ? this.game.entities.find(e => e.constructor.name === "Rat") : null;

        this.moveWithSliding(this.game.clockTick, this.game.collisionManager, ratTarget, spriteWidth, spriteHeight, colliderRadius);

        this.updateBoundingBox();
    }

    draw(ctx, game) {
        // Early exit if dead and animation is done
        if (this.dead && this.currentAnimation && this.currentAnimation.isDone()) {
            return;
        }

        if (this.currentAnimation) {
            ctx.save();

            // Poison tint
            if (this.isPoisoned) {
                ctx.filter = "sepia(1) hue-rotate(70deg) saturate(5)";
            }

            let tick = game.clockTick;

            // Clamp tick on death to prevent animator overflow
            if (this.dead && this.currentAnimation.elapsedTime + tick >= this.currentAnimation.totalTime) {
                this.removeFromWorld = true;
                tick = this.currentAnimation.totalTime - this.currentAnimation.elapsedTime - 0.001;
                if (tick < 0) tick = 0;
            }

            // No flipping needed — cat sheet has explicit directional rows
            this.currentAnimation.drawFrame(tick, ctx, this.x, this.y, this.scale);

            ctx.restore();
        }

        // Inherited from Enemy — hides automatically when dead
        this.drawHealthBar(ctx);

        if (game.options.debugging) {
            ctx.save();

            ctx.strokeStyle = "yellow";
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.detectionRange,
                0, Math.PI * 2
            );
            ctx.stroke();

            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.attackRange,
                0, Math.PI * 2
            );
            ctx.stroke();

            if (this.boundingBox) {
                ctx.strokeStyle = "cyan";
                ctx.strokeRect(
                    this.boundingBox.x,
                    this.boundingBox.y,
                    this.boundingBox.width,
                    this.boundingBox.height
                );
            }

            if (this.patrolPath && this.patrolPath.length > 0) {
                ctx.strokeStyle = "orange";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.patrolPath[0].x, this.patrolPath[0].y);
                for (let i = 1; i < this.patrolPath.length; i++) {
                    ctx.lineTo(this.patrolPath[i].x, this.patrolPath[i].y);
                }
                ctx.stroke();
                ctx.lineWidth = 1;

                ctx.fillStyle = "orange";
                for (const point of this.patrolPath) {
                    ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
                }

                ctx.fillStyle = "lime";
                const currentTarget = this.patrolPath[this.patrolIndex];
                if (currentTarget) {
                    ctx.fillRect(currentTarget.x - 5, currentTarget.y - 5, 10, 10);
                }
            }

            ctx.fillStyle = "white";
            ctx.font = "12px Arial";
            ctx.fillText(
                `${this.state} F:${this.facing} HF:${this.horizontalFacing}`,
                this.x,
                this.y - 30
            );

            ctx.restore();
        }
    }
}