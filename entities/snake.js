//@author: Connor Willis
//@date: 2/7/26
//Snake enemy: patrols a path or remains idle, then chases and attacks player when visible
/*
includes debugging still
example usage:
// Example 1: Stationary snake that idles in place
const stationarySnake = new Snake(game, 100, 100, null);
game.addEntity(stationarySnake);

// Example 2: Snake with simple back-and-forth patrol
const patrolSnake = new Snake(game, 200, 200, [
    { x: 200, y: 200 },
    { x: 400, y: 200 },
    { x: 400, y: 400 },
    { x: 200, y: 400 }
]);
game.addEntity(patrolSnake);

// Example 3: Snake with complex patrol path (guard route)
const guardSnake = new Snake(game, 500, 100, [
    { x: 500, y: 100 },
    { x: 600, y: 100 },
    { x: 600, y: 200 },
    { x: 500, y: 200 },
    { x: 500, y: 300 },
    { x: 600, y: 300 }
]);
game.addEntity(guardSnake);

// Example 4: Single point patrol (essentially stationary but using patrol system)
const sentrySnake = new Snake(game, 300, 300, [
    { x: 300, y: 300 }
]);
game.addEntity(sentrySnake);
 */

class Snake extends Enemy{
    constructor(game, x, y, width, height, patrolPath = null){
        super(
            game,
            x,y,
            3,
            0.1,
            200,
            50,
            1.0
        );
        this.scale = 4;
        this.facing = 0; // 0=down, 1=up, 2=right, 3=left

        // Patrol system
        this.patrolPath = patrolPath; // Array of {x, y} points, or null for stationary idle
        this.patrolIndex = 0;
        this.patrolDirection = 1; // 1 for forward, -1 for backward
        this.patrolWaitTimer = 0;
        this.patrolWaitDuration = 1; // Wait 1 second at each patrol point

        // State management
        this.state = "IDLE"; // IDLE, PATROL, CHASE, ATTACK, HURT, DEAD

        // Attack timing
        this.attackAnimationTimer = 0;
        this.attackAnimationDuration = 0.5;

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

    loadAnimations() {
        //need to look at spritesheet

        this.animations = new Map();
        this.animations.set("idle", []);
        this.animations.set("walk", []);
        this.animations.set("attack", []);
        this.animations.set("death", []);
        //sample:
        //this.animations.get("idle")[0] = new Animator(this.sprite, 0, 0, 16, 16, 1, 1, 0);

    }

    /**
     * Determines facing direction based on movement
     */
    updateFacing() {
        if (Math.abs(this.velocity.x) > Math.abs(this.velocity.y)) {
            // Moving more horizontally
            this.facing = this.velocity.x > 0 ? 2 : 3; // Right : Left
        } else if (Math.abs(this.velocity.y) > 0.1) {
            // Moving more vertically
            this.facing = this.velocity.y > 0 ? 0 : 1; // Down : Up
        }
        // If no significant movement, keep current facing
    }

    /**
     * Patrol behavior - move along predetermined path
     */
    updatePatrol() {
        if (!this.patrolPath || this.patrolPath.length === 0) {
            // No patrol path, just idle
            this.state = "IDLE";
            return;
        }

        // Check if we're waiting at a patrol point
        if (this.patrolWaitTimer > 0) {
            this.patrolWaitTimer -= this.game.clockTick;
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.currentAnimation = this.animations.get("idle")[this.facing];
            return;
        }

        // Get current target patrol point
        const target = this.patrolPath[this.patrolIndex];
        const distance = getDistance({ x: this.x, y: this.y }, target);

        // If close enough to patrol point, move to next one
        if (distance < 5) {
            // Reached patrol point
            this.patrolWaitTimer = this.patrolWaitDuration;

            // Move to next patrol point
            if (this.patrolPath.length === 1) {
                // Only one point, just idle here
                this.patrolIndex = 0;
            } else {
                // Multiple points - move back and forth
                this.patrolIndex += this.patrolDirection;

                // Reverse direction at endpoints
                if (this.patrolIndex >= this.patrolPath.length) {
                    this.patrolIndex = this.patrolPath.length - 2;
                    this.patrolDirection = -1;
                } else if (this.patrolIndex < 0) {
                    this.patrolIndex = 1;
                    this.patrolDirection = 1;
                }
            }
        } else {
            // Move toward patrol point
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

        // Reset animation to start from beginning
        this.currentAnimation.elapsedTime = 0;
    }

    /**
     * Override hurt to show feedback
     */
    onHurt() {
        this.state = "HURT";
        // Brief pause when hurt
        this.velocity.x = 0;
        this.velocity.y = 0;
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
        if (this.dead) {
            // Update death animation
            if (this.currentAnimation && this.currentAnimation.isDone()) {
                this.removeFromWorld = true;
            }
            this.updateBoundingBox();
            return;
        }

        // Update attack cooldown (from parent)
        if (this.attackCooldown > 0) {
            this.attackCooldown -= this.game.clockTick;
        }

        // Update attack animation timer
        if (this.attackAnimationTimer > 0) {
            this.attackAnimationTimer -= this.game.clockTick;
            this.velocity.x = 0;
            this.velocity.y = 0;

            if (this.attackAnimationTimer <= 0) {
                this.state = "CHASE"; // Return to chase after attack
            }
            this.updateBoundingBox();
            return;
        }

        // Check for player
        const player = this.detectPlayer();

        if (player && this.state !== "HURT") {
            // Player detected
            if (this.canAttackPlayer()) {
                this.attack();
            } else {
                this.state = "CHASE";
                this.updateChase(player);
            }
        } else {
            // No player detected - patrol or idle
            if (this.state === "HURT") {
                // Brief pause after being hurt, then return to patrol
                this.velocity.x = 0;
                this.velocity.y = 0;
                // Short timer before resuming
                if (!this.hurtRecoveryTimer) {
                    this.hurtRecoveryTimer = 0.3;
                } else {
                    this.hurtRecoveryTimer -= this.game.clockTick;
                    if (this.hurtRecoveryTimer <= 0) {
                        this.hurtRecoveryTimer = 0;
                        this.state = this.patrolPath ? "PATROL" : "IDLE";
                    }
                }
            } else {
                // Resume patrol or idle
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

        // Apply velocity
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Update bounding box
        this.updateBoundingBox();
    }

    draw(ctx, game) {
        // Draw current animation
        if (this.currentAnimation) {
            this.currentAnimation.drawFrame(
                game.clockTick,
                ctx,
                this.x - game.camera.x,
                this.y - game.camera.y,
                this.scale
            );
        }

        // Debug visualization
        if (game.options.debugging) {
            ctx.save();

            // Detection range
            ctx.strokeStyle = "yellow";
            ctx.beginPath();
            ctx.arc(
                this.x - game.camera.x + this.width / 2,
                this.y - game.camera.y + this.height / 2,
                this.detectionRange,
                0,
                Math.PI * 2
            );
            ctx.stroke();

            // Attack range
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.arc(
                this.x - game.camera.x + this.width / 2,
                this.y - game.camera.y + this.height / 2,
                this.attackRange,
                0,
                Math.PI * 2
            );
            ctx.stroke();

            // Health bar
            const barWidth = 50;
            const barHeight = 5;
            const healthPercent = this.health / this.maxHealth;

            ctx.fillStyle = "red";
            ctx.fillRect(
                this.x - game.camera.x,
                this.y - game.camera.y - 20,
                barWidth,
                barHeight
            );

            ctx.fillStyle = "green";
            ctx.fillRect(
                this.x - game.camera.x,
                this.y - game.camera.y - 20,
                barWidth * healthPercent,
                barHeight
            );

            // Bounding box
            if (this.boundingBox) {
                ctx.strokeStyle = "cyan";
                ctx.strokeRect(
                    this.boundingBox.x - game.camera.x,
                    this.boundingBox.y - game.camera.y,
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
                    this.patrolPath[0].x - game.camera.x,
                    this.patrolPath[0].y - game.camera.y
                );
                for (let i = 1; i < this.patrolPath.length; i++) {
                    ctx.lineTo(
                        this.patrolPath[i].x - game.camera.x,
                        this.patrolPath[i].y - game.camera.y
                    );
                }
                ctx.stroke();
                ctx.lineWidth = 1;

                // Mark patrol points
                ctx.fillStyle = "orange";
                for (const point of this.patrolPath) {
                    ctx.fillRect(
                        point.x - game.camera.x - 3,
                        point.y - game.camera.y - 3,
                        6,
                        6
                    );
                }

                // Mark current target
                ctx.fillStyle = "lime";
                const currentTarget = this.patrolPath[this.patrolIndex];
                if (currentTarget) {
                    ctx.fillRect(
                        currentTarget.x - game.camera.x - 5,
                        currentTarget.y - game.camera.y - 5,
                        10,
                        10
                    );
                }
            }

            // State indicator
            ctx.fillStyle = "white";
            ctx.font = "12px Arial";
            ctx.fillText(
                this.state,
                this.x - game.camera.x,
                this.y - game.camera.y - 30
            );

            ctx.restore();
        }
    }

}