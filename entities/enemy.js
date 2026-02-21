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
    /**
     * Updates bounding box position
     * Uses a smaller circular collider at the center/base like the Rat
     */
    updateBoundingBox() {
        if (!this.boundingBox) {
            // Initialize bounding box if it doesn't exist
            const colliderRadius = 10 * this.scale; // Adjust size as needed
            const colliderWidth = colliderRadius * 2;

            this.boundingBox = new BoundingBox(
                this.x,
                this.y,
                colliderWidth,
                colliderRadius
            );
        }

        // Position the collider at the snake's base/center
        const spriteWidth = 32 * this.scale; // Snake sprite is 32px wide
        const spriteHeight = 32 * this.scale;
        const colliderRadius = 10 * this.scale;
        const colliderWidth = colliderRadius * 2;

        // Center horizontally, place at bottom vertically (like rat's feet)
        this.boundingBox.x = this.x + (spriteWidth / 2) - colliderRadius;
        this.boundingBox.y = this.y + spriteHeight - colliderRadius;
        this.boundingBox.width = colliderWidth;
        this.boundingBox.height = colliderRadius;

        // Update AABB properties
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
            if (this.canAttackPlayer()) {
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

    drawHealthBar(ctx) {
        if (this.dead) return; // do not draw if dead
        const barWidth = 50;
        const barHeight = 5;
        const healthPercent = Math.max(0, this.health/this.maxHealth);

        ctx.save();

        // attempt to center health bar over the enemy
        let barX = this.x;
        if (this.width) {
            barX = this.x + (this.width/2) - (barWidth/2);
        }

        ctx.filleStyle = "red";
        ctx.fillRect(barX, this.y-20, barWidth, barHeight);
        ctx.fillStyle = "#39FF14"; // from html color picker, neon green
        ctx.fillRect(barX, this.y-20, barWidth * healthPercent, barHeight);
        ctx.restore();
    }

    draw(ctx, game){
        //draw current animation if available
        if (this.currentAnimation) {
            this.currentAnimation.drawFrame(
                game.clockTick,
                ctx,
                this.x,
                this.y,
                game.camera.scale || 1
            );
        }
        // call new standardized health bar drawing method
        this.drawHealthBar(ctx);

        //debug: draw detection and attack ranges
        if (game.options.debugging) {
            ctx.save();

            //detection range
            ctx.strokeStyle = "yellow";
            ctx.beginPath();
            ctx.arc(
                this.x,
                this.y,
                this.attackRange,
                0,
                Math.PI * 2
            );
            ctx.stroke();
            ctx.restore();
        }
    }
}