// Jayda level 1 snake behavior 32x32
class Snake {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        
        // Stats (Level 1 Boss)
        this.hp = 100;
        this.maxHp = 100;
        this.isTurn = false;
        this.timer = 0;
        this.attackDelay = 3; // Snake bites every 3 seconds if player is idle(?)
        
        // Animation States
        this.state = "idle"; // idle, biting, damaged, death
        this.facingRight = false; // Usually faces the player (Assuming the player is on the left)

    
        const sheet = ASSET_MANAGER.getAsset("./snake.png");
        
        // Define animations (Adjust coordinates/frames)
        this.animations = {
            idle: new Animator(sheet, 0, 0, 64, 64, 4, 0.2, true),
            bite: new Animator(sheet, 0, 64, 64, 64, 5, 0.1, false),
            damaged: new Animator(sheet, 0, 128, 64, 64, 2, 0.15, false),
            death: new Animator(sheet, 0, 192, 64, 64, 6, 0.2, false)
        };
        
        this.currentAnimator = this.animations.idle;
    };

    update() {
        // Battle Timer Logic
        // If it's the snake's turn or the battle is active, increase timer
        this.timer += this.game.clockTick;

        if (this.timer >= this.attackDelay && this.state === "idle") {
            this.attack();
        }

        // Handle animation transitions
        if (this.currentAnimator.isDone()) {
            if (this.state === "death") {
                this.removeFromWorld = true;
                // Transition logic for SceneManager could go here
            } else {
                this.setState("idle");
            }
        }
    };

    attack() {
        this.setState("bite");
        this.timer = 0;
        // Logic to damage the Rat protagonist would go here
        console.log("Snake strikes!");
    };

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.setState("death");
        } else {
            this.setState("damaged");
        }
    };

    setState(newState) {
        this.state = newState;
        this.currentAnimator = this.animations[newState];
        this.currentAnimator.elapsedTime = 0;
    };

    draw(ctx) {
        // Simple rectangular health bar above the snake
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y - 20, (this.hp / this.maxHp) * 100, 10);
        
        // Flip or draw the current frame
        if (this.facingRight) {
            ctx.save();
            ctx.translate(this.x + 64, this.y);
            ctx.scale(-1, 1);
            this.currentAnimator.drawFrame(this.game.clockTick, ctx, 0, 0);
            ctx.restore();
        } else {
            this.currentAnimator.drawFrame(this.game.clockTick, ctx, this.x, this.y);
        }
    };
};