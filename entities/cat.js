//@author: Connor Willis
//@date: 2/26/26
//Cat enemy: patrols a path or remains idle, then chases and attacks player when visible

class Cat extends Enemy {
    constructor(game, x, y, patrolPath = null) {
        super(
            game,
            x, y,
            5,
            5,
            100,
            30,
            0.75,
            0.2
        );
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
        this.ratWasInRange = false;
        this.catInsults = [
            "Do I look like a petting zoo? Piss off, squeaker.",
            "I'd eat you, but I'm watching my cholesterol. Scram.",
            "Nine lives and I waste one looking at your ugly mug.",
            "Touch me again and I'll turn you into a fuzzy slipper.",
            "I'm on my union-mandated break. Go bother the dog.",
            "You smell like garbage and disappointment. Walk away.",
            "Didn't I already kill you in another life? Beat it.",
            "Look, the claws are resting. Don't tempt me."
        ];
        this.stateBeforeHurt = null;

        // Single spritesheet — 896x4608, cells are 64x64 (14 cols x 72 rows) <- this is not true its 66 rows not 72
        this.sprite = ASSET_MANAGER.getAsset("./assets/OrangeCat.png");

        this.scale = 1.75; // scaled down

        // increase detection range for better intelligence
        this.detectionRange = 300;
        this.attackRange = 40;

        // Dimensions for bounding box
        this.width = 64 * this.scale;
        this.height = 64 * this.scale;

        // Load animations
        this.loadAnimations();
        this.currentAnimation = this.animations.get("idle")[this.facing];

        // center bounding box around torso, not the tail
        let bbWidth = 35 * this.scale;
        let bbHeight = 35 * this.scale;
        let offsetX = (this.width - bbWidth) / 3;
        let offsetY = (this.height - bbHeight) / 3;
        this.boundingBox = new BoundingBox(this.x + offsetX, this.y + offsetY, bbWidth, bbHeight);
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
        this.animations.set("idle", []);
        this.animations.set("walk", []);
        this.animations.set("run", []);
        this.animations.set("attack", []);
        this.animations.set("death", []);
        this.animations.set("hiss", []);

        this.horizontalFacing = 1; // default right

        // --- IDLE: tail wag ---
        this.animations.get("idle")[0] = this.makeAnim(25, 5); // Left
        this.animations.get("idle")[1] = this.makeAnim(22, 5); // Right
        this.animations.get("idle")[2] = this.makeAnim(23, 5); // Down
        this.animations.get("idle")[3] = this.makeAnim(24, 5); // Up

        // --- WALK ---
        this.animations.get("walk")[0] = this.makeAnim(4, 6); // Left
        this.animations.get("walk")[1] = this.makeAnim(5, 6); // Right
        this.animations.get("walk")[2] = this.makeAnim(2, 6); // Down
        this.animations.get("walk")[3] = this.makeAnim(3, 6); // Up

        // --- RUN ---
        this.animations.get("run")[0] = this.makeAnim(11, 5, 0.1); // Left
        this.animations.get("run")[1] = this.makeAnim(10, 5, 0.1); // Right
        this.animations.get("run")[2] = this.makeAnim(8, 4, 0.1);  // Down
        this.animations.get("run")[3] = this.makeAnim(9, 4, 0.1);  // Up

        // --- ATTACK ---
        this.animations.get("attack")[0] = this.makeAnim(33, 11, 0.05, false); // Left
        this.animations.get("attack")[1] = this.makeAnim(35, 11, 0.05, false); // Right
        this.animations.get("attack")[2] = this.makeAnim(29, 11, 0.05, false); // Down
        this.animations.get("attack")[3] = this.makeAnim(31, 5, 0.05, false);  // Up

        // --- HISS ---
        const hissLeftDown = this.makeAnim(60, 2, 0.2, true);
        const hissRightUp = this.makeAnim(61, 2, 0.2, true);

        this.animations.get("hiss")[0] = hissLeftDown; // Left
        this.animations.get("hiss")[1] = hissRightUp;  // Right
        this.animations.get("hiss")[2] = hissLeftDown; // Down
        this.animations.get("hiss")[3] = hissRightUp;  // Up

        // --- DEATH: sleep ---
        const sleepAnim = this.makeAnim(44, 2, 0.2, true);

        // Assigning sleep animation to all 4 facing directions
        for (let i = 0; i < 4; i++) {
            this.animations.get("death")[i] = sleepAnim;
        }
    }

    updateBoundingBox() {
        // size of the torso box
        let bbWidth = 35 * this.scale;
        let bbHeight = 35 * this.scale;

        // make BB much wider and taller when sleeping to block the rat from sliding under
        if (this.state === "SLEEPING") {
            bbWidth = 55 * this.scale;
            bbHeight = 45 * this.scale;
        }

        // base centered offsets
        let offsetX = (this.width - bbWidth) / 2;
        let offsetY = (this.height - bbHeight) / 2;

        // dynamically shift box based on where the cat is looking
        if (this.state === "SLEEPING") {
            offsetY += 8 * this.scale; // Push bounding box down slightly to cover the bed
        } else if (this.facing === 0) {
            offsetX -= 0;
        } else if (this.facing === 1) {
            offsetX += 0;
        } else if (this.facing === 2) {
            offsetY += 5 * this.scale;
        } else if (this.facing === 3) {
            offsetY += 5 * this.scale;
        }

        // apply newly calculated box
        this.boundingBox = new BoundingBox(this.x + offsetX, this.y + offsetY, bbWidth, bbHeight);
    }

    moveWithSlidingCat(clockTick, collisionManager, target, spriteWidth, spriteHeight, colliderRadius) {
        const colliderWidth = colliderRadius * 2;
        const colliderHeight = colliderRadius;
        const slideAmount = (150 * this.speed) * clockTick;

        // base intended movement (from moveToward)
        let moveX = this.velocity.x * clockTick;
        let moveY = this.velocity.y * clockTick;

        if (target) {
            let targetDirX = target.x > this.x ? 1 : -1;
            let targetDirY = target.y > this.y ? 1 : -1;
            // if currently hugging a wall IGNORE standard movement & force slide
            if (this.isExtricatingX) {
                // test if original X direction to target is finally free
                let testFreeX = this.x + (targetDirX * slideAmount);
                let testColliderX = testFreeX + (spriteWidth / 2) - colliderRadius;
                let currentColliderY = this.y + spriteHeight - colliderHeight;

                if (!collisionManager.checkCollision(testColliderX, currentColliderY, colliderWidth, colliderHeight)) {
                    //  X-axis is finally free; break out of wall hugging
                    this.isExtricatingX = false;
                } else {
                    // blocked, ignore moveToward & FORCE slide along Y
                    moveX = 0;
                    moveY = this.extricateDirY * slideAmount;
                }
            } else if (this.isExtricatingY) {
                // test if Y direction is finally free
                let testFreeY = this.y + (targetDirY * slideAmount);
                let currentColliderX = this.x + (spriteWidth / 2) - colliderRadius;
                let testColliderY = testFreeY + spriteHeight - colliderHeight;

                if (!collisionManager.checkCollision(currentColliderX, testColliderY, colliderWidth, colliderHeight)) {
                    this.isExtricatingY = false;
                } else {
                    moveY = 0;
                    moveX = this.extricateDirX * slideAmount;
                }
            }
        }

        let xBlocked = false;
        let yBlocked = false;

        // apply x movement
        if (Math.abs(moveX) > 0.001) {
            const testX = this.x + moveX;
            const testColliderX = testX + (spriteWidth / 2) - colliderRadius;
            const currentColliderY = this.y + spriteHeight - colliderHeight;

            if (!collisionManager.checkCollision(testColliderX, currentColliderY, colliderWidth, colliderHeight)) {
                this.x = testX;
            } else {
                xBlocked = true;
                this.velocity.x = 0;
            }
        }

        // apply y movement
        if (Math.abs(moveY) > 0.001) {
            const testY = this.y + moveY;
            const currentColliderX = this.x + (spriteWidth / 2) - colliderRadius;
            const testColliderY = testY + spriteHeight - colliderHeight;

            if (!collisionManager.checkCollision(currentColliderX, testColliderY, colliderWidth, colliderHeight)) {
                this.y = testY;
            } else {
                yBlocked = true;
                this.velocity.y = 0;
            }
        }

        // initiate wall hugging
        if (target && !this.isExtricatingX && !this.isExtricatingY) {
            if (xBlocked) {
                this.isExtricatingX = true;
                this.extricateDirY = target.y >= this.y ? 1 : -1;

                // test first slide step
                let testY = this.y + (this.extricateDirY * slideAmount);
                let testColliderY = testY + spriteHeight - colliderHeight;
                let currentColliderX = this.x + (spriteWidth / 2) - colliderRadius;

                if (!collisionManager.checkCollision(currentColliderX, testColliderY, colliderWidth, colliderHeight)) {
                    this.y = testY;
                } else {
                    // corner trap on frame 1: Reverse slide direction forever for wall.
                    this.extricateDirY *= -1;
                }
            } else if (yBlocked) {
                this.isExtricatingY = true;
                this.extricateDirX = target.x >= this.x ? 1 : -1;

                let testX = this.x + (this.extricateDirX * slideAmount);
                let testColliderX = testX + (spriteWidth / 2) - colliderRadius;
                let currentColliderY = this.y + spriteHeight - colliderHeight;

                if (!collisionManager.checkCollision(testColliderX, currentColliderY, colliderWidth, colliderHeight)) {
                    this.x = testX;
                } else {
                    this.extricateDirX *= -1;
                }
            }
        }
        // handle inner corners
        else if (target) {
            // if cat is sliding along a wall but suddenly hits another wall, inner corner, turn around
            if (this.isExtricatingX && yBlocked) {
                this.extricateDirY *= -1;
            }
            if (this.isExtricatingY && xBlocked) {
                this.extricateDirX *= -1;
            }
        }
    }

    moveToward(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const pixelsPerSecond = 150 * this.speed;
        const stickiness = 40;

        let weightX = Math.abs(dx);
        let weightY = Math.abs(dy);

        // track stickiness using memory instead of velocity, so wall bumps don't break it
        if (this.lastAxis === 'X') weightX += stickiness;
        if (this.lastAxis === 'Y') weightY += stickiness;

        if (Math.abs(dx) < 5) weightX = 0;
        if (Math.abs(dy) < 5) weightY = 0;

        if (weightX > weightY) {
            this.velocity.x = dx > 0 ? pixelsPerSecond : -pixelsPerSecond;
            this.velocity.y = 0;
            this.lastAxis = 'X'; // Remember we chose X
        } else {
            this.velocity.x = 0;
            this.velocity.y = dy > 0 ? pixelsPerSecond : -pixelsPerSecond;
            this.lastAxis = 'Y'; // Remember we chose Y
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
        const distance = getDistance({x: this.x, y: this.y}, target);

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
        if (this.state !== "HURT") {
            this.stateBeforeHurt = this.state;
        }
        this.state = "HURT";
        // don't change animation to sleep pause movement to allow red flash in draw()
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.hurtAnimationTimer = 0.3;
    }

    onDeath() {
        if (this.state === "DEFEATED_WALK" || this.state === "SLEEPING") return;

        this.state = "DEFEATED_WALK";
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.detectionRange = Math.round(this.detectionRange / 3);
        // generate waypoint path to avoid complex obstacles!
        this.retreatPath = this.getRetreatPath();
        this.retreatIndex = 0;

        // PAUSE game engine so text box doesn't vanish
        this.game.paused = true;
        this.game.keys["Space"] = false;

        if (this.game.camera) {
            this.game.camera.itemPopupText = [
                "Tough luck, furball! Go pop that.",
                "safe open, and claim your cheese, king."
            ];
            this.game.camera.itemPopupActive = true;
        }
    }

    update() {
        // Poison tick
        this.updatePoison(this.game.clockTick);
        // Cat intro dialogue, first time rat enters detection range
        if (!this.dead && !this.game.camera.catIntroPlayed && this.state !== "INTRO_DIALOGUE") {
            const ratEnt = this.game.entities.find(e => e.constructor.name === "Rat");
            if (ratEnt) {
                const d = getDistance({x: this.x, y: this.y}, {x: ratEnt.x, y: ratEnt.y});
                if (d < this.detectionRange) {
                    if (this.game.camera.debugNoDialogue) {
                        this.game.camera.catIntroPlayed = true;
                    } else {
                        this.state = "INTRO_DIALOGUE";
                        this.startIntroDialogue();
                    }
                }
            }
        }
        if (this.state === "INTRO_DIALOGUE") {
            if (!this.game.camera.dialogueActive) {
                this.state = "IDLE";
                this.game.camera.catIntroPlayed = true;
            }
            this.updateBoundingBox();
            return;
        }
        // defeated cat logic
        if (this.state === "DEFEATED_WALK" || this.state === "SLEEPING" || this.state === "HISSING") {
            if (this.state === "DEFEATED_WALK") {
                // get current waypoint we are walking to
                let target = this.retreatPath[this.retreatIndex];

                this.moveToward(target.x, target.y);
                const distance = getDistance({x: this.x, y: this.y}, target);

                if (distance < 20) {
                    // reached waypoint
                    // hard reset wall hugging memory, doesn't carry over
                    this.isExtricatingX = false;
                    this.isExtricatingY = false;

                    if (this.retreatIndex < this.retreatPath.length - 1) {
                        // move to next waypoint
                        this.retreatIndex++;
                    } else {
                        // reached the final waypoint; catbed
                        this.state = "SLEEPING";
                        this.velocity.x = 0;
                        this.velocity.y = 0;
                        this.x = target.x;
                        this.y = target.y;
                        this.facing = 2; // face forward/down

                        this.currentAnimation = this.animations.get("death")[this.facing];
                        if (this.currentAnimation) this.currentAnimation.elapsedTime = 0;
                    }
                } else {
                    // b/c waypoints route AROUND the complex furniture,
                    // can use standard sliding to handle minor corner bumps smoothly!
                    const spriteWidth = 64 * this.scale;
                    const spriteHeight = 64 * this.scale;
                    const colliderRadius = 10 * this.scale;

                    this.moveWithSlidingCat(this.game.clockTick, this.game.collisionManager, target, spriteWidth, spriteHeight, colliderRadius);
                    this.updateFacing();

                    const correctAnim = this.animations.get("walk")[this.facing];
                    if (this.currentAnimation !== correctAnim) {
                        let oldTime = this.currentAnimation ? this.currentAnimation.elapsedTime : 0;
                        this.currentAnimation = correctAnim;
                        this.currentAnimation.elapsedTime = oldTime;
                    }
                }

            } else if (this.state === "HISSING") {
                this.currentAnimation = this.animations.get("hiss")[this.facing];
                if (!this.game.camera.dialogueActive) {
                    this.state = "SLEEPING";
                    this.currentAnimation = this.animations.get("death")[this.facing];
                    this.ratWasInRange = true; // prevent instant re-trigger while rat still in range
                }
            } else if (this.state === "SLEEPING") {
                this.velocity.x = 0;
                this.velocity.y = 0;
                this.currentAnimation = this.animations.get("death")[this.facing];

                // hiss trigger when rat re-enters detection range
                const sleepingRat = this.game.entities.find(e => e.constructor.name === "Rat");
                if (sleepingRat) {
                    const dist = getDistance({x: this.x, y: this.y}, {x: sleepingRat.x, y: sleepingRat.y});
                    const inRange = dist < this.detectionRange;
                    if (inRange && !this.ratWasInRange) this.triggerHiss();
                    this.ratWasInRange = inRange;
                }
            }
            // Push rat away if bounding boxes overlap — prevents trapping
            const ratEnt = this.game.entities.find(e => e.constructor.name === "Rat");
            if (ratEnt && ratEnt.boundingBox && this.boundingBox && this.boundingBox.collide(ratEnt.boundingBox)) {
                const dx = (ratEnt.x + ratEnt.width / 2) - (this.x + this.width / 2);
                const dy = (ratEnt.y + ratEnt.height / 2) - (this.y + this.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                ratEnt.x += (dx / dist) * 6;
                ratEnt.y += (dy / dist) * 6;
            }
            this.updateBoundingBox();
            return;
        }
        // ensure standard death triggers our override
        if (this.health <= 0 && this.state !== "DEFEATED_WALK" && this.state !== "SLEEPING" && this.state !== "HISSING" && this.state !== "INTRO_DIALOGUE") {            this.onDeath();
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

    getRetreatPath() {
        const bedTarget = {x: 1170, y: 490};

        // defining some "Safe Nodes" in level where there are no obstacles
        const safeNodes = [
            {x: 419, y: 160}, // top left
            {x: 1284, y: 227}, // top right
            {x: 1088, y: 515}, // bottom right
            {x: 104, y: 515}, // bottom hallway
        ];

        // find the closest safe node to where cat currently 'died'
        let closestNode = safeNodes[0];
        let shortestDist = Infinity;

        for (const node of safeNodes) {
            const dist = getDistance({x: this.x, y: this.y}, node);
            if (dist < shortestDist) {
                shortestDist = dist;
                closestNode = node;
            }
        }

        // return a path -> 1st step: go to closest safe space, 2nd step: go to bed
        return [closestNode, bedTarget];
    }
    startIntroDialogue() {
        const sm = this.game.camera;
        // face the rat when conversation starts
        const ratEnt = this.game.entities.find(e => e.constructor.name === "Rat");
        if (ratEnt) {
            const dx = ratEnt.x - this.x;
            const dy = ratEnt.y - this.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                this.facing = dx > 0 ? 1 : 0; // right or left
            } else {
                this.facing = dy > 0 ? 2 : 3; // down or up
            }
            this.currentAnimation = this.animations.get("idle")[this.facing];
        }
        sm.dialogue.dialogues = [
            { speaker: "Carrot the Cat", text: "Well, well... another squeaky little casualty in my territory.", type: "dialogue" },
            { speaker: "Carrot the Cat", text: "I am Carrot. I guard this kitchen with extreme prejudice.", type: "dialogue" },
            { speaker: "Carrot the Cat", text: "Come on then, little rat. Let's see if you fight as desperately as you smell.", type: "dialogue" },
            { speaker: "Carrot the Cat", text: "", type: "choice", choices: [
                    { text: "Carrot? Were the Humans out of intimidating names?", response: "Laugh while you can, furball. I'm about to improve your eyesight by scratching your eyes out." },
                    { text: "I don't have time for this. Step aside, Garfield.", response: "Oh, I love fast food. It makes the chase so much more satisfying." },
                    { text: "The dog taught me everything. You're just a fluffy downgrade.", response: "Edgar is a neurotic mop. I am a finely tuned killing machine." },                    { text: "You realize if I die, the colony starves, right?", response: "Oh, I know. It's a two-for-one special." },
                    { text: "I can throw poison and I'm not afraid to use it!", response: "Spicy food. My absolute favorite." }
                ], nextIndex: 5 }
        ];
        sm.dialogue.speaker = "Carrot the Cat";
        sm.dialogue.portrait = ASSET_MANAGER.getAsset("./assets/cat.png");
        sm.dialogue.phase = "INTRO";
        sm.dialogue.currentIndex = 0;
        sm.dialogue.displayText = "";
        sm.dialogue.charIndex = 0;
        sm.dialogue.typeTimer = 0;
        sm.dialogue.selectedChoiceIndex = null;
        sm.dialogue.displayingChoiceResponse = false;
        sm.dialogue.lines = [];
        sm.dialogueActive = true;
        this.game.paused = true;
    }

    triggerHiss() {
        if (this.game.camera.debugNoDialogue) return;
        this.state = "HISSING";
        this.currentAnimation = this.animations.get("hiss")[this.facing];

        const hissSound = ASSET_MANAGER.getAsset("./assets/cat-hiss.wav");
        if (hissSound) {
            const s = hissSound.cloneNode();
            s.volume = 0.2;
            s.play().catch(e => console.error(e));
        }

        const insult = this.catInsults[Math.floor(Math.random() * this.catInsults.length)];
        const sm = this.game.camera;
        sm.dialogue.lines = [insult];
        sm.dialogue.speaker = "Carrot the Cat";
        sm.dialogue.portrait = ASSET_MANAGER.getAsset("./assets/cat.png");
        sm.dialogue.currentLine = 0;
        sm.dialogue.displayText = "";
        sm.dialogue.charIndex = 0;
        sm.dialogue.typeTimer = 0;
        sm.dialogueActive = true;
    }
    draw(ctx, game) {
        if (this.currentAnimation) {
            ctx.save();

            // Poison tint & red flash for damage
            if (this.state === "HURT") {
                ctx.filter = "brightness(50%) sepia(1) hue-rotate(-50deg) saturate(5)"; // flash red
            } else if (this.isPoisoned) {
                ctx.filter = "sepia(1) hue-rotate(70deg) saturate(5)"; //green for poison
            } else {
                ctx.filter = "none";
            }

            let tick = game.clockTick;

            // No flipping needed — cat sheet has explicit directional rows
            this.currentAnimation.drawFrame(tick, ctx, this.x, this.y, this.scale);

            ctx.restore();
        }

        // Inherited from Enemy — hides automatically when dead
        if (this.state !== "SLEEPING" && this.state !== "DEFEATED_WALK") {
            this.drawHealthBar(ctx);
        }

        if (game.options.debugging) {
            ctx.save();
            ctx.strokeStyle = "yellow";
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.detectionRange, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.attackRange, 0, Math.PI * 2);
            ctx.stroke();

            if (this.boundingBox) {
                ctx.strokeStyle = "cyan";
                ctx.strokeRect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.width, this.boundingBox.height);
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
            ctx.fillText(`${this.state} F:${this.facing} HF:${this.horizontalFacing}`, this.x, this.y - 30);
            ctx.restore();
            // draw defeated retreat path for debugging purposes
            if (this.state === "DEFEATED_WALK" && this.retreatPath) {
                ctx.strokeStyle = "magenta";
                ctx.fillStyle = "magenta";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2); // start at cat

                for (let i = this.retreatIndex; i < this.retreatPath.length; i++) {
                    let pt = this.retreatPath[i];
                    ctx.lineTo(pt.x, pt.y);
                    ctx.fillRect(pt.x - 5, pt.y - 5, 10, 10);
                }
                ctx.stroke();
                ctx.lineWidth = 1;
            }
        }
    }
}