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

        this.facing = 2; // 0 = left, 1 = right, 2 = down, 3 = up
        this.scale = 4;
        this.showMessage = false;

        this.sprite = ASSET_MANAGER.getAsset("./assets/yorkie animation.png");

        // DEBUG: Check if sprite loaded
        console.log("Yorkie sprite loaded:", this.sprite);
        console.log("Sprite width:", this.sprite.width, "height:", this.sprite.height);

        this.animations = new Map();
        this.animations.set("sleep", []);
        this.animations.set("walk", []);

        this.loadAnimations();

        this.animator = this.animations.get("sleep")[this.facing];
        this.width = this.animator.width * this.scale;
        this.height = this.animator.height * this.scale;
        this.canvas = document.getElementById("gameWorld");

        this.inRange = false;
        this.interactionPressed = false;

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

    }

    loadAnimations() {
        this.animations.set("sleep", []);
        this.animations.set("walk", []);
        
        // SLEEP ANIMATIONS - using row 6 (y = 18 * 6 = 108)
        // Note: your original had y=109, which would be slightly off. Let's use 108
        this.animations.get("sleep")[0] = new Animator(this.sprite, 0, 108, 18, 18, 4, 0.7, 0); 
        this.animations.get("sleep")[1] = new Animator(this.sprite, 0, 108, 18, 18, 4, 0.7, 0); 
        this.animations.get("sleep")[2] = new Animator(this.sprite, 0, 108, 18, 18, 4, 0.7, 0); 
        this.animations.get("sleep")[3] = new Animator(this.sprite, 0, 108, 18, 18, 4, 0.7, 0); 

        // WALK ANIMATIONS - let's try the first few rows
        this.animations.get("walk")[0] = new Animator(this.sprite, 0, 0, 18, 18, 4, 0.15, 0);   // row 0
        this.animations.get("walk")[1] = new Animator(this.sprite, 0, 18, 18, 18, 4, 0.15, 0);  // row 1
        this.animations.get("walk")[2] = new Animator(this.sprite, 0, 36, 18, 18, 4, 0.15, 0);  // row 2
        this.animations.get("walk")[3] = new Animator(this.sprite, 0, 54, 18, 18, 4, 0.15, 0);  // row 3
    }

    update() {
        // 1. Check for state change (Defeat)
        if (this.health <= 0 && this.game.camera.storyState !== "YORKIE_DEFEATED") {
            this.game.camera.storyState = "YORKIE_DEFEATED";
        }

        // 2. Interaction Logic
        this.inRange = false;
        for (let i = 0; i < this.game.entities.length; i++) {
            let ent = this.game.entities[i];
            
            // Find the Rat
            if (ent.constructor.name === "Rat") {
                const ratBox = {
                    x: ent.x,
                    y: ent.y,
                    width: 50, // Standard rat width fallback
                    height: 50
                };
                const yorkieBox = {
                    x: this.x,
                    y: this.y,
                    width: this.animator.width * this.scale,
                    height: this.animator.height * this.scale
                };

                // Check if rat is in interaction range
                this.inRange = this.rectCollide(ratBox, yorkieBox);

                // Handle E key interaction
                if (this.inRange && this.game.keys["KeyE"]) {
                    if (!this.interactionPressed) {
                        this.startDialogue();
                        this.interactionPressed = true;
                        this.game.keys["KeyE"] = false; // Consume the press
                    }
                } else if (!this.game.keys["KeyE"]) {
                    this.interactionPressed = false;
                }
            }
        }
    }

    startDialogue() {
        const sceneManager = this.game.camera;
        
        // DECIDE WHICH DIALOGUE TO USE:
        if (sceneManager.storyState === "YORKIE_DEFEATED") {
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

    rectCollide(boxA, boxB) {
        return boxA.x < boxB.x + boxB.width && boxA.x + boxA.width > boxB.x &&
                boxA.y < boxB.y + boxB.height && boxA.y + boxA.height > boxB.y;
    }

    draw(ctx) {
      
    ctx.imageSmoothingEnabled = false;
    this.animator.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.scale);

    // Draw interaction hint when in range
    if (this.inRange) {
        ctx.fillStyle = "yellow";
        ctx.font = "14px Arial";
        ctx.fillText("[E] Interact", this.x + (this.animator.width * this.scale) / 2 - 30, this.y - 20);
    }
    };

}