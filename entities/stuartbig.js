// Author: Christina Blackwell

class StuartBig {
    constructor(game, x, y, facing) {
        this.game = game;
        this.canvas = document.getElementById("gameWorld");
        this.animations = new Map();
        this.animations.set("idle", []);
        this.loadAnimations();
        // 0 = left, 1 = right, 2 = down, 3 = up
        this.facing = facing;
        this.scale = 1.5;
        this.animator = this.animations.get("idle")[this.facing];
        this.x = x * scaleFactor;
        this.y = y * scaleFactor;
        
        // Interaction system
        this.width = 48 * this.scale;
        this.height = 38 * this.scale;
        this.actionState = "IDLE"; // IDLE, TALKING
        this.BB = null;
        this.updateBB();
    };

    // Stuart Big doesn't move, so he just has the idle animation
    loadAnimations() {
        this.animations.get("idle")[0] = new Animator(ASSET_MANAGER.getAsset("./assets/stuart_big.png"),
            0, 58, 48, 38, 3, 1.5, 0);
        this.animations.get("idle")[1] = new Animator(ASSET_MANAGER.getAsset("./assets/stuart_big.png"),
            0, 106, 48, 38, 3, 1.5, 0);
        this.animations.get("idle")[2] = new Animator(ASSET_MANAGER.getAsset("./assets/stuart_big.png"),
            0, 6, 48, 33, 3, 1.5, 0);
        this.animations.get("idle")[3] = new Animator(ASSET_MANAGER.getAsset("./assets/stuart_big.png"),
            0, 148, 48, 44, 3, 1.5, 0);
    };

    // Nothing to update
    update() {
        this.updateBB();
        
        let rat = this.game.entities.find(e => e.constructor.name === "Rat");
        let playerInRange = false;
        
        if (rat) {
            const interactBox = new BoundingBox(this.x - 20, this.y - 20, this.width + 40, this.height + 40);
            if (rat.BB && interactBox.collide(rat.BB)) {
                playerInRange = true;
            }
            
            switch (this.actionState) {
                case "IDLE":
                    // Check if player pressed E and intro dialogue has played
                    if (playerInRange && this.game.keys["KeyE"] && this.game.camera.stuartIntroPlayed) {
                        this.startFurtherQuestionsDialogue();
                        this.actionState = "TALKING";
                        this.game.keys["KeyE"] = false;
                    }
                    break;
                    
                case "TALKING":
                    if (!this.game.camera.dialogueActive) {
                        this.actionState = "IDLE";
                    }
                    break;
            }
        }
    };
    
    updateBB() {
        this.BB = new BoundingBox(this.x, this.y, this.width, this.height);
    };
    
    startFurtherQuestionsDialogue() {
        const dialogue = this.game.camera.dialogue;
        dialogue.portrait = ASSET_MANAGER.getAsset("./assets/StuartBigDialogue.png");
        dialogue.speaker = "Stuart Big";
        dialogue.phase = "INQUIRY";
        dialogue.currentQuestionIndex = null;
        dialogue.displayText = "";
        dialogue.charIndex = 0;
        dialogue.selectedQuestions.clear();
        dialogue.askingFollowUp = false;
        dialogue.exitingAfterResponse = false;
        this.game.camera.dialogueActive = true;
    };

    draw(ctx) {
        ctx.imageSmoothingEnabled = true;

        // ensure animator matches current facing (so cutscene-facing changes immediately apply)
        this.animator = this.animations.get("idle")[this.facing];

        // drawing glow outline; pass 0 for tick to avoid advancing animation
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.filter = "brightness(1.5) drop-shadow(0 0 4px white)";
        const offsets = [[-2, 0], [2, 0], [0, -2], [0, 2]];
        offsets.forEach(([ox, oy]) => {
            this.animator.drawFrame(0, ctx, this.x + ox, this.y + oy, this.scale); // Pass 0 here
        });
        ctx.restore();

        // drawing actual sprite on top, only THIS one advances the animation
        ctx.save();
        this.animator.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.scale);
        ctx.restore();
        
        // Draw interaction prompt if Stuart intro has been played and player is in range
        let rat = this.game.entities.find(e => e.constructor.name === "Rat");
        if (rat && this.game.camera.stuartIntroPlayed && !this.game.camera.dialogueActive) {
            let interactBox = new BoundingBox(this.x - 20, this.y - 20, this.width + 40, this.height + 40);
            if (rat.BB && interactBox.collide(rat.BB)) {
                ctx.font = "14px Arial";
                ctx.fillStyle = "yellow";
                ctx.fillText("[E] Stuart Big", this.x, this.y - 10);
            }
        }
    }
}