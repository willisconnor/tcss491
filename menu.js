class Menu {
    constructor(game) {
        this.game = game;
        this.state = "STORY"; // Initial state

        // Updated Lore: The Legend of the Golden Wheel
        this.storyLines = [
            "For generations, our colony has thrived in the shadows of the Great Below.",
            "But the winters grow long, and our food stores are empty.",
            "Ancient tales speak of the 'Golden Wheel'—a cheese of infinite bounty.",
            "It lies hidden deep within 'The Forbidden Hearth,' the domain of the Giants.",
            "You are the Chosen One, tasked to ascend from the basement into the light.",
            "But beware... the Great Feline and the Silent Slitherer lurk in the halls above.",
            "Go now. Our survival rests in your paws."
        ];
        
        this.currentLine = 0;
        this.displayText = "";
        this.charIndex = 0;
        this.typeSpeed = 0.06; 
        this.typeTimer = 0;

        // Button dimensions (we will calculate X/Y in draw to keep them centered)
        this.btnW = 240;
        this.btnH = 60;
    }

    update() {
        // Check for ESC in ANY menu state to go back to START
        if (this.game.keys["Escape"]) {
            this.game.keys["Escape"] = false; // Reset the key so it doesn't double-trigger
            
            if (this.state === "STORY" || this.state === "TUTORIAL") {
                this.state = "START";
                return; 
            }
        }

        if (this.state === "STORY") {
            this.updateStory();
        } else if (this.game.click) {
            this.handleClicks(this.game.click.x, this.game.click.y);
            this.game.click = null;
        }
    }

    updateStory() {
        let line = this.storyLines[this.currentLine];
        
        // Typewriter logic
        if (this.charIndex < line.length) {
            this.typeTimer += this.game.clockTick;
            if (this.typeTimer >= this.typeSpeed) {
                this.displayText += line[this.charIndex];
                this.charIndex++;
                this.typeTimer = 0;
            }
        }

        // "Press any key" logic
        let anyKeyPressed = Object.values(this.game.keys).some(key => key === true);
        if (this.game.click || anyKeyPressed) {
            if (this.charIndex < line.length) {
                this.displayText = line; // Finish line instantly
                this.charIndex = line.length;
            } else {
                this.currentLine++;
                if (this.currentLine >= this.storyLines.length) {
                    this.state = "START";
                } else {
                    this.displayText = "";
                    this.charIndex = 0;
                }
            }
            this.game.click = null;
            // Clear keys to prevent rapid-firing through lines
            Object.keys(this.game.keys).forEach(k => this.game.keys[k] = false);
        }
    }

   handleClicks(x, y) {
        const w = this.game.ctx.canvas.width;
        const h = this.game.ctx.canvas.height;
        const centerX = w / 2 - this.btnW / 2;
        const centerY = h / 2;

        if (this.state === "START") {
            // --- START GAME BUTTON ---
            if (this.checkBounds(x, y, centerX, centerY - 40, this.btnW, this.btnH)) {

                // 1. START THE MUSIC
                // Use the music path stored in SceneManager so it matches the current level
                if (this.game.camera && this.game.camera.currentMusicPath) {
                    this.game.audio.playMusic(this.game.camera.currentMusicPath);
                } else {
                    // Fallback just in case
                    this.game.audio.playMusic("./assets/background_music.wav");
                }

                // 2. Transition to Game
                this.game.camera.menuActive = false;     // Turn off menu
                this.game.camera.storyState = "STUART_TALK";
                
                // Check if Stuart's intro has already been played
                if (!this.game.camera.stuartIntroPlayed) {
                    // First time: play the intro dialogue
                    this.game.camera.dialogueActive = true;  // Trigger Stuart Big intro
                    this.game.camera.dialogue.currentIndex = 0;
                    this.game.camera.dialogue.charIndex = 0;
                    this.game.camera.dialogue.displayText = "";
                    this.game.camera.dialogue.playerName = "";
                    this.game.camera.dialogue.phase = "INTRO";
                    this.game.camera.dialogue.selectedChoiceIndex = null;
                    this.game.camera.dialogue.selectedQuestions = new Set();
                    this.game.camera.dialogue.displayingChoiceResponse = false;
                    this.game.camera.dialogue.currentQuestionIndex = null;
                    this.game.camera.dialogue.askingFollowUp = false;
                    this.game.camera.dialogue.typeTimer = 0;
                } else {
                    // Already played intro: skip straight to game without dialogue
                    this.game.camera.dialogueActive = false;
                }
            } 
            // --- TUTORIAL BUTTON ---
            else if (this.checkBounds(x, y, centerX, centerY + 40, this.btnW, this.btnH)) {
                this.state = "TUTORIAL";
            }
        } else if (this.state === "TUTORIAL") {
            // <-- fixed Y to match drawTutorial (centerY + 180)
            if (this.checkBounds(x, y, centerX, centerY + 180, this.btnW, this.btnH)) {
                this.state = "START";
            }
        }
    }

    checkBounds(x, y, bx, by, bw, bh) {
        return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
    }

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Background always fills the screen
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, w, h);

        if (this.state === "STORY") {
            this.drawStory(ctx, w, h);
        } else if (this.state === "START") {
            this.drawStartMenu(ctx, w, h);
        } else if (this.state === "TUTORIAL") {
            this.drawTutorial(ctx, w, h);
        }
    }

    drawStory(ctx, w, h) {
        ctx.fillStyle = "#888888";
        ctx.font = "16px 'Courier New'";
        ctx.textAlign = "right";
        ctx.fillText("Hit ESC to skip introduction", w - 30, 40);

        ctx.fillStyle = "white";
        ctx.font = "28px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText(this.displayText, w / 2, h / 2);

        if (this.charIndex >= this.storyLines[this.currentLine].length) {
            ctx.fillStyle = "#ffcc00";
            ctx.font = "20px 'Courier New'";
            ctx.fillText("Press any key to continue", w / 2, h - 60);
        }
    }

    drawStartMenu(ctx, w, h) {
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 70px Arial";
        ctx.textAlign = "center";
        ctx.fillText("RAT PLAYING GAME", w / 2, h / 2 - 180);

        const centerX = w / 2 - this.btnW / 2;
        const centerY = h / 2;

        this.drawBtn(ctx, centerX, centerY - 40, "START GAME");
        this.drawBtn(ctx, centerX, centerY + 40, "TUTORIAL");
    }

    drawTutorial(ctx, w, h) {
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GUIDE FOR THE CHOSEN ONE", w / 2, h / 2 - 200);

        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        
        // Movement controls
        ctx.fillText("Movement: WASD or Arrow Keys", w / 2, h / 2 - 100);
        
        // Sprint controls
        ctx.fillText("Sprint: Hold SHIFT + WASD or Arrow Keys", w / 2, h / 2 - 50);
        
        // Attack controls
        ctx.fillText("Attack: Press SPACE", w / 2, h / 2);
        
        // Objective
        ctx.fillText("Find the Golden Wheel in the Forbidden Hearth", w / 2, h / 2 + 50);
        
        // Warning
        ctx.fillStyle = "#ff6b6b";
        ctx.fillText("Face the beasts that guard the upper world", w / 2, h / 2 + 100);

        this.drawBtn(ctx, w / 2 - this.btnW / 2, h / 2 + 180, "BACK");
    }

    drawBtn(ctx, x, y, text) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, this.btnW, this.btnH);
        
        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(text, x + this.btnW / 2, y + 40);
    }
}