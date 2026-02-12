//Author: Connor Willis
//@date: 2/5/26

class Enemy{
    scale;
    constructor(game, x, y, maxHealth, attackDamage, detectionRange, attackRange, speed){
        Object.assign(this, {game, x, y, maxHealth, attackDamage, detectionRange, attackRange, speed});

        //health section
        this.health = maxHealth;
        this.dead = false;

        //attacking
        this.attackCooldown = 1; //so not constantly attacking, will tweak
        this.attackCooldownMax;

        //base movement
        this.velocity = {x: 0, y: 0};

        //animation, overwritten by children but i want it to exist
        this.animations = {}
        this.currentAnimation = null;

        //bounding box (again set by children)
        this.boundingBox = null;

        //to remove the sprite from world when dead
        this.removeFromWorld = false;

    }

    /**
     * Detects if player is within detection range
     * @returns object|null, player entity if detected, null othjerwise
     */
    detectPlayer() {
        const player = this.findPlayer();
        if (!player) return null;

        const distance = getDistance(
            {x: this.x, y: this.y },
            {x: player.x, y: player.y}
        );

        return distance <= this.detectionRange ? player : null;
    }

    canAttackPlayer() {
        const player = this.findPlayer();
        if (!player || this.attackCooldown >0) return false;

        const distance = getDistance(
            {x: this.x, y: this.y },
            {x: player.x, y: player.y}
        );

        return distance <= this.attackRange;
    }

    /**
     * performs attack on player
     * override for custom in children
     */
    attack() {
        if (this.canAttackPlayer()) {
            const player = this.findPlayer();
            if (player && player.takeDamage) {
                player.takeDamage(this.attackDamage);
                this.attackCooldown = this.attackCooldownMax;
                this.onAttack(); //hook method
            }
        }
    }

    /**
     * hook method called when attack is performed
     * eg what do we do when we attack
     * overwritten by all children
     */
    onAttack(){
        //to be overwritten
    }

    /**
     * moves enemy towards a target rposition
     * params: target x and target y
     */
    moveToward(targetX, targetY){
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.velocity.x = (dx / distance) * this.speed;
            this.velocity.y = (dy / distance) * this.speed;
        }
    }

    /**
     * take damage and handles death
     * @param {Number} damage Amount of damage to take
     */
    takeDamage(damage){
        if (this.dead) return;

        this.health -= damage;

        if (this.health <= 0){
            this.health = 0;
            this.die();
        } else {
            this.onHurt(); //hook for children classes
        }
    }

    /**
     * hook method once more
     */
    onHurt(){
        //override
    }

    /**
     * hyandles enemy death
     * override in child classes for custom death behavior
     */
    die() {
        this.dead = true;
        this.onDeath(); //hook for children
        //could optionally remove from world after death animation
        //talk to group
        // this.removeFromWorld = true;
    }

    /**
     * hook method to call when enemie dies
     */
    onDeath(){
        //opverride
    }

    /**
     * finds the palyer entity in the game
     * might have to tweak this based on Mariott videos
     * @returns {Object|null} player entity or nulkl
     */
    findPlayer(){
        return this.game.entities.find(entity => entity.constructor.name === 'Rat');
    }

    /**
     * updates bounding box position
     * call this after moving the enemy
     */
    updateBoundingBox() {
        if (!this.boundingBox) {
            // Initialize bounding box if it doesn't exist
            const colliderRadius = 8 * this.scale; // Smaller than full sprite
            const colliderWidth = colliderRadius * 2;
            const colliderHeight = colliderRadius * 2;

            this.boundingBox = new BoundingBox(
                this.x,
                this.y,
                colliderWidth,
                colliderHeight
            );
        }

        // Center the collider on the snake's sprite
        const spriteWidth = 16 * this.scale; // 32px / 2 for center
        const spriteHeight = 16 * this.scale;
        const colliderRadius = 8 * this.scale;

        this.boundingBox.x = this.x + spriteWidth - colliderRadius;
        this.boundingBox.y = this.y + spriteHeight - colliderRadius;
        this.boundingBox.left = this.boundingBox.x;
        this.boundingBox.top = this.boundingBox.y;
        this.boundingBox.right = this.boundingBox.left + this.boundingBox.width;
        this.boundingBox.bottom = this.boundingBox.top + this.boundingBox.height;
    }

    update(){
        if (this.dead) {
            //update death animation and post death logic
            return;
        }

        //update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= this.game.clockTick;
        }

        //basic AI behavior (prob override)
        const player = this.detectPlayer();
        if (player) {
            if (this.canAttackPLayer()) {
                this.attack();
            } else {
                this.moveToward(player.x, player.y);
            }
        }
        //apply velocity
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        //update bounding box
        this.updateBoundingBox();
    }

    draw(ctx, game){
        //draw current animation if available
        if (this.currentAnimation) {
            this.currentAnimation.drawFrame(
                game.clockTick,
                ctx,
                this.x -game.camera.x,
                this.y - game.camera.y,
                game.camera.scale || 1
            );
        }

        //debug: draw detection and attack ranges
        if (game.options.debugging) {
            ctx.save();

            //detection range
            ctx.strokeStyle = "yellow";
            ctx.beginPath();
            ctx.arc(
                this.x - game.camera.x,
                this.y - game.camera.y,
                this.attackRange,
                0,
                Math.PI * 2
            );
            ctx.stroke();

            //health bar
            const barWidth = 50;
            const barHeight = 5;
            const healthPercent = this.health / this.maxHealth;

            ctx.fillStyle = "red";
            ctx.fillRect (
                this.x - game.camera.x - barWidth/ 2,
                this.y - game.camera.y - 20,
                barWidth,
                barHeight
            );

            ctx.fillStyle = "green";
            ctx.fillRect(
                this.x - game.camera.x - barWidth/2,
                this.y - game.camera.y - 20,
                barWidth * healthPercent,
                barHeight
            );

            ctx.restore();
        }
    }
}