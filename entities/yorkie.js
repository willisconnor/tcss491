// Author: Connor Willis

//Notes:
//yorkie is an entity that is going to stand in front of the door
//when the rat player interacts with said yorkie, it will give dialogue
//the yorkie will then intiaite a psuedo fight, in which the yorkie simply stands up and does not move
//after the rat attacks the yorkie 5 times, the yorkie will then move out of the way, allowing the rat to pass
//however, it will request dog treats from the new room the rat is going to enter
//then, in the new spot, it will fall back to sleep until the rat interacts with it
//while it has the dog treats.

class Yorkie {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;

        this.facing = 0; // start facing Down row 0
        this.scale = 4;

        // stats
        this.health = 5;
        this.maxHealth = 5;
        this.lastHealth = 5;
        this.hurtTimer = 0;
        this.isPoisoned = false;
        this.poisonTimer = 0;
        this.speed = 0; // Yorkie doesn't usually move but we need the prop for poison

        // state management
        this.actionState = "IDLE";
        this.leavingPhase = 0;
        this.startX = 0;

        // target Coordinates for leaving
        this.targetX = 420;
        this.targetY = 420;

        this.sprite = ASSET_MANAGER.getAsset("./assets/yorkie animation.png");

        // animations
        this.animations = new Map();
        this.loadAnimations();
        this.animator = this.animations.get("sleep")[this.facing];

        // bounding box
        this.width = 18 * this.scale;
        this.height = 18 * this.scale;
        this.updateBB();

        // Dialogue lines for the Yorkie NPC
        this.dialogueChallenge = [
            "Woof! Another rat? How did you get in here?",
            "I'm Edgar Barkley, guardian of this room. I'm guarding the path to the kitchen snacks.",
            "The giants hide the premium beef jerky in there, but beasts have taken over the floorboards.",
            "You want the key to the Baby Gate? You'll have to earn my respect and help clear a path for my snacks!",
            "But look at you... you're soft! A house pet's snack waiting to happen.",
            "Prove you've got some fight in you, pipsqueak! If you can't even rattle my collar, you won't last a second in the kitchen. Do your worst!"
        ];

        this.dialoguePostFight = [
            "Woah! Ease up there, whisker-face! You've got more bite than a flea on a summer day.",
            "I'll admit... I didn't think a basement-dweller had it in 'em. You passed my little test. Here, take the Baby Gate key.",
            "But listen close, {NAME}. Stuart thinks that gate is the end of the journey. He’s a fool.",
            "The real prize, the Golden Wheel, is locked in the Giants' Safe. I'm the only one who knows the code to crack it, but I'm not talking on an empty stomach.",
            "The path to the kitchen is crawling with fiends, and they’re standing between me and my premium beef jerky. Clear 'em out.",
            "Prove you're not just a lucky amateur, and I’ll give you the numbers to the hoard.",
            "Now, beat it. I’m hitting the hay. Don't wake me up unless you're carrying the scent of dried beef!"
        ];

        if (this.game.camera && this.game.camera.yorkieDefeated) {
            this.health = 0;
            this.lastHealth = 0;
            this.dead = true;
            
            // Check if he already received the beef jerky from a previous visit
            if (this.game.camera.yorkieGivenJerky) {
                this.actionState = "JERKY_IDLE";
            } else {
                this.actionState = "SLEEPING";
            }

            // needs to be equal to x and y bc the coordinates are passed to loadLevelTwo in SceneManager
            this.x = x;
            this.y = y;
            this.facing = 0;
        }
    }

    loadAnimations() {
        this.animations.set("sleep", []);
        this.animations.set("walk", []);
        this.animations.set("idle", []);
        this.animations.set("lick", []); // New Lick Animation

        // SLEEP (Row 6, y=108)
        for (let i = 0; i < 4; i++) {
            this.animations.get("sleep")[i] = new Animator(this.sprite, 0, 108, 18, 18, 4, 0.7, 0);
        }

        // WALK & IDLE
        // create an "Idle" frame by taking the first frame of walk and setting duration to 1 (infinite loop effectively)

        // Down (Row 0)
        this.animations.get("walk")[0] = new Animator(this.sprite, 0, 0, 18, 18, 4, 0.15, 0);
        this.animations.get("idle")[0] = new Animator(this.sprite, 0, 0, 18, 18, 1, 1, 0);

        // Up (Row 1)
        this.animations.get("walk")[1] = new Animator(this.sprite, 0, 18, 18, 18, 4, 0.15, 0);
        this.animations.get("idle")[1] = new Animator(this.sprite, 0, 18, 18, 18, 1, 1, 0);

        // Right (Row 2)
        this.animations.get("walk")[2] = new Animator(this.sprite, 0, 36, 18, 18, 4, 0.15, 0);
        this.animations.get("idle")[2] = new Animator(this.sprite, 0, 36, 18, 18, 1, 1, 0);

        // Left (Row 3)
        this.animations.get("walk")[3] = new Animator(this.sprite, 0, 54, 18, 18, 4, 0.15, 0);
        this.animations.get("idle")[3] = new Animator(this.sprite, 0, 54, 18, 18, 1, 1, 0);

        // fight/lick animation I thought it was cute
        // Row 4 [y=72], 2 frames, looks like dog is teasing rat w/ tongue out
        this.animations.get("lick")[0] = new Animator(this.sprite, 0, 72, 18, 18, 2, 0.15, 0);
    }

    updateBB() {
        // adjusting numbers so rat can't fit under yorkie
        let xOffset = 0; // if you want to offset box by L or R
        let yOffset = 20; // Pushes top of the box down
        let boxWidth = this.width -5; // Makes the box skinnier
        let boxHeight = this.height + 15; // Makes the box taller

        this.BB = new BoundingBox(this.x + xOffset, this.y + yOffset, boxWidth, boxHeight);
    }

    update() {
        const tick = this.game.clockTick;

        //  Poison Logic & Particles
        if (this.isPoisoned) {
            this.poisonTimer -= tick;
            if (Math.random() < 0.2) {
                const px = this.x + Math.random() * this.width;
                const py = this.y + Math.random() * this.height;
                this.game.addEntity(new PoisonParticle(this.game, px, py));
            }

            if (this.poisonTimer <= 0) {
                this.isPoisoned = false;
                // Reset to normal speed or 0 depending on state
                this.speed = (this.actionState === "LEAVING") ? 2 : 0;
            }
        }

        //  Hurt Animation Timer Logic
        if (this.hurtTimer > 0) {
            this.hurtTimer -= tick;
        }

        // Check for health changes to trigger the Red Flash/Shake
        if (this.health < this.lastHealth) {
            this.hurtTimer = 0.2; // Show red for 0.2s
            this.lastHealth = this.health;
        }

        let rat = this.game.entities.find(e => e.constructor.name === "Rat");
        let playerInRange = false;

        if (rat) {
            const interactBox = new BoundingBox(this.x - 20, this.y - 20, this.width + 40, this.height + 40);
            if (rat.BB && interactBox.collide(rat.BB)) {
                playerInRange = true;
            }

            switch (this.actionState) {
                case "IDLE":
                    this.animator = this.animations.get("sleep")[this.facing];
                    if (playerInRange && this.game.keys["KeyE"]) {
                        this.startDialogue();
                        this.actionState = "TALKING";
                        this.game.keys["KeyE"] = false;
                    }
                    break;

                case "TALKING":
                    if (!this.game.camera.dialogueActive) {
                        if (this.game.camera.storyState === "YORKIE_DEFEATED") {
                            this.actionState = "WAIT_FOR_RAT";
                        } else {
                            this.actionState = "PRE_FIGHT";
                        }
                    }
                    break;

                case "PRE_FIGHT":
                    this.animator = this.animations.get("sleep")[this.facing];
                    if (playerInRange && this.game.keys["KeyE"]) {
                        this.actionState = "TRAINING";
                        this.game.keys["KeyE"] = false;
                    }
                    break;

                case "TRAINING":
                    this.animator = this.animations.get("lick")[0];
                    if (this.health <= 0) {
                        this.game.camera.yorkieDefeated = true;
                        this.actionState = "POST_FIGHT";
                        this.game.camera.storyState = "YORKIE_DEFEATED";
                        this.startDialogue();
                    }
                    break;

                case "POST_FIGHT":
                    if (!this.game.camera.dialogueActive) {
                        this.actionState = "WAIT_FOR_RAT";
                    }
                    break;

                case "WAIT_FOR_RAT":
                    this.animator = this.animations.get("idle")[this.facing];
                    break;

                case "LEAVING":
                    // Set base speed if we just started leaving
                    if (this.speed === 0) {
                        this.speed = 2; 
                        this.originalSpeed = 2;
                    }

                    // Move X -> right
                    if (this.leavingPhase === 1) {
                        if (this.x < this.targetX) {
                            this.x += this.speed;
                            this.facing = 2; // Right
                            this.animator = this.animations.get("walk")[2];
                        } else {
                            this.x = this.targetX;
                            this.leavingPhase = 2;
                        }
                    }
                    // Move Y down
                    else if (this.leavingPhase === 2) {
                        if (this.y < this.targetY) {
                            this.y += this.speed;
                            this.facing = 0; // Down
                            this.animator = this.animations.get("walk")[0];
                        } else {
                            this.y = this.targetY;
                            this.actionState = "SLEEPING";
                            this.speed = 0;
                        }
                    }
                    break;

                case "SLEEPING":
                    this.animator = this.animations.get("sleep")[this.facing];
                    
                    // Interaction for when he's asleep (waiting for jerky)
                    if (playerInRange && this.game.keys["KeyE"]) {
                        if (!this.game.camera.hasBeefJerky && !this.game.camera.yorkieGivenJerky) {
                            // Still sleeping/waiting for jerky
                            const sceneManager = this.game.camera;
                            sceneManager.dialogue.lines = ["Zzz... smell no treats... Zzz..."];
                            sceneManager.dialogue.speaker = "Edgar Barkley (Yorkie)";
                            sceneManager.dialogue.portrait = ASSET_MANAGER.getAsset("./assets/EdgarDialogue.png"); // Make sure this matches your portrait
                            sceneManager.dialogue.currentLine = 0;
                            sceneManager.dialogue.displayText = "";
                            sceneManager.dialogue.charIndex = 0;
                            sceneManager.dialogue.typeTimer = 0;
                            sceneManager.dialogueActive = true;
                            
                        } else if (this.game.camera.hasBeefJerky && !this.game.camera.yorkieGivenJerky) {
                            // Rat has jerky, giving it to Yorkie
                            this.actionState = "JERKY_IDLE"; // Wake him up into new awake state
                            this.game.camera.yorkieGivenJerky = true; 
                            
                            // Start the password dialogue
                            if (this.game.camera.dialogue.startJerkyRewardDialogue) {
                                this.game.camera.dialogue.startJerkyRewardDialogue();
                            }
                            
                        }
                        
                        this.game.keys["KeyE"] = false; // consume the key press
                    }
                    break;

                  
                case "JERKY_IDLE":
                    // Remains in the awake idle animation forever after getting the jerky
                    this.animator = this.animations.get("lick")[this.facing];
                    
                    if (playerInRange && this.game.keys["KeyE"]) {
                        // Talk to him again for branching choices
                        if (this.game.camera.dialogue.startYorkieOptionsDialogue) {
                            this.game.camera.dialogue.startYorkieOptionsDialogue();
                        }
                        this.game.keys["KeyE"] = false;
                    }
                    break;
            }
        }

        //  Update the Bounding Box every frame so it follows the movement
        this.updateBB();
    }

    startDialogue() {
        const sceneManager = this.game.camera;
        if (this.game.camera.storyState === "YORKIE_DEFEATED") {
            sceneManager.dialogue.lines = this.dialoguePostFight;
        } else {
            sceneManager.dialogue.lines = this.dialogueChallenge;
        }
        sceneManager.dialogue.speaker = "Edgar Barkley (Yorkie)";
        sceneManager.dialogue.portrait = ASSET_MANAGER.getAsset("./assets/EdgarDialogue.png");
        sceneManager.dialogue.currentLine = 0;
        sceneManager.dialogue.displayText = "";
        sceneManager.dialogue.charIndex = 0;
        sceneManager.dialogue.typeTimer = 0;
        sceneManager.dialogueActive = true;
    }

    draw(ctx) {
        ctx.imageSmoothingEnabled = false;

        let drawX = this.x;
        let drawY = this.y;

        ctx.save(); // Save before applying any filters

        // shake effect when hurt
        if (this.hurtTimer > 0) {
            ctx.filter = "sepia(1) saturate(5) hue-rotate(-50deg)";
            let shakeX = Math.random() * 4 - 2;
            let shakeY = Math.random() * 4 - 2;
            drawX += shakeX;
            drawY += shakeY;
        } else if (this.isPoisoned) {
            // Apply poison filter if poisoned
            ctx.filter = "sepia(1) hue-rotate(70deg) saturate(5)";
        }

        // drawn sprite
        this.animator.drawFrame(this.game.clockTick, ctx, Math.floor(drawX), Math.floor(drawY), this.scale);
        
        ctx.restore(); // Restore to clear the filters

        // ui
        let rat = this.game.entities.find(e => e.constructor.name === "Rat");
        if (rat) {
            let interactBox = new BoundingBox(this.x - 20, this.y - 20, this.width + 40, this.height + 40);
            if (rat.BB && interactBox.collide(rat.BB) && !this.game.camera.dialogueActive) {
                ctx.font = "14px Arial";
                
                // Show the [E] Yorkie prompt on these states
                if (this.actionState === "IDLE" || this.actionState === "SLEEPING" || this.actionState === "JERKY_IDLE") {
                    ctx.fillStyle = "yellow";
                    ctx.fillText("[E] Yorkie", this.x, this.y - 10);
                }
                else if (this.actionState === "PRE_FIGHT") {
                    ctx.fillStyle = "red";
                    ctx.fillText("[E] FIGHT!", this.x, this.y - 10);
                }
            }
        }

        // health bar during fight
        if (this.actionState === "TRAINING") {
            ctx.fillStyle = "red";
            ctx.fillRect(this.x, this.y - 20, 50, 5);
            ctx.fillStyle = "#39FF14";
            ctx.fillRect(this.x, this.y - 20, (this.health / this.maxHealth) * 50, 5);
        }

        // debugging bounding box
        if (this.game.options.debugging && this.BB) {
            ctx.strokeStyle = "red";
            ctx.strokeRect(this.BB.x, this.BB.y, this.BB.width, this.BB.height);
        }
    }
}