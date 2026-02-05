class Dialogue {
    constructor(game, sceneManager) {
        this.game = game;
        this.sceneManager = sceneManager;
        this.portrait = ASSET_MANAGER.getAsset("./assets/StuartBigDialogue.png");
        this.speaker = "Stuart Big";
        this.playerName = "";
        this.state = "TALKING"; 
        
        this.currentLine = 0;
        this.displayText = "";
        this.charIndex = 0;
        this.typeTimer = 0;

        this.lines = [
            "Squeak! A new set of whiskers in the walls? I haven't seen a living soul since... well, since I lost mine.",
            "Tell me, young scout... what do they call you in the Great Below?",
            "INPUT_NAME", 
            "Ah, {NAME}... a fine name for a scout. I am Stuart Big, once the Chosen, now your spirit guide.",
            "I sought the Golden Wheel once, but my paws slipped at the Great Gate. My poor tail still aches from the fall.",
            "Listen well: To reach the Forbidden Hearth, you must find the Golden Key to unlock the Baby Gate.",
            "The key is guarded by Edgar Barkley, a Yorkie in the living room. He is technically an ally, but he is a creature of hollow loyalty and bottomless greed.",
            "He has not let a single soul pass without one of his 'little tricks'—a show of skill to prove you aren't just another house mouse.",
            "He hoards that key like a dragon guards gold, and he won't lift a paw unless there is a tribute for his stomach. Treat him like a mercenary, {NAME}.",
            "Good luck. Show him the 'tooth and claw' tactics of the Great Below, and don't let your tail drag!"
        ];
    }

update() {
    let line = this.lines[this.currentLine];

    // Handle name input state
    if (line === "INPUT_NAME") {
        this.game.typing = true;
        if (this.game.lastInput === "Enter" && this.playerName.length > 0) {
            this.game.typing = false;
            this.currentLine++;
            this.game.lastInput = null;
        } else if (this.game.lastInput === "Backspace") {
            this.playerName = this.playerName.slice(0, -1);
            this.game.lastInput = null;
        } else if (this.game.lastInput && this.game.lastInput.length === 1) {
            if (this.playerName.length < 12) this.playerName += this.game.lastInput;
            this.game.lastInput = null;
        }
        return;
    }

    // Process typing effect
    let processedLine = line.replace("{NAME}", this.playerName);
    if (this.charIndex < processedLine.length) {
        this.typeTimer += this.game.clockTick;
        if (this.typeTimer > 0.03) {
            this.displayText += processedLine[this.charIndex];
            this.charIndex++;
            this.typeTimer = 0;
        }
    }

    // Advance Dialogue with Click or Space
    if (this.game.click || this.game.keys["Space"]) {
        // Reset the keys immediately to prevent freezing/skipping
        this.game.click = null;
        this.game.keys["Space"] = false;

        if (this.charIndex < processedLine.length) {
            // Instant skip to end of line
            this.displayText = processedLine;
            this.charIndex = processedLine.length;
        } else {
            // Move to next line
            this.currentLine++;
            
            if (this.currentLine >= this.lines.length) {
                this.sceneManager.dialogueActive = false;

                this.game.paused = false;
                if (this.speaker === "Stuart Big" && this.sceneManager.storyState === "STUART_TALK") {
                    this.sceneManager.storyState = "YORKIE_CHALLENGE";
                } 
            } else {
                this.displayText = "";
                this.charIndex = 0;
            }
        }
    }
}

    draw(ctx) {
        const w = ctx.canvas.width; 
        const h = ctx.canvas.height; 

        // 1. Dialogue Box Dimensions
        const boxW = 1200; 
        const boxH = 200;
        const boxX = (w - boxW) / 2;
        const boxY = h - boxH - 40; 

        // 2. Draw Main Dialogue Box
        ctx.fillStyle = "rgba(20, 20, 20, 0.9)";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // 3. Draw Portrait Frame
        const framePadding = 15;
        const frameSize = boxH - (framePadding * 2);
        const frameX = boxX + framePadding;
        const frameY = boxY + framePadding;

        ctx.fillStyle = "#3a3a3a";
        ctx.fillRect(frameX, frameY, frameSize, frameSize);
        
        if (this.portrait) {
            ctx.drawImage(
                this.portrait, 
                Math.floor(frameX + 5), 
                Math.floor(frameY + 5), 
                Math.floor(frameSize - 10), 
                Math.floor(frameSize - 10)
            );
        }

        ctx.strokeStyle = "#ffcc00"; // Gold frame
        ctx.lineWidth = 3;
        ctx.strokeRect(frameX, frameY, frameSize, frameSize);

        // 4. Text Content Offset
        const textX = frameX + frameSize + 30;
        const textY = boxY + 50;
        const maxTextWidth = boxW - frameSize - 80;

        ctx.fillStyle = "#aaaaff"; // Ghostly Blue
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "left";
        ctx.fillText(this.speaker, textX, textY - 10);

        ctx.fillStyle = "white";
        ctx.font = "22px 'Courier New'";
        
        if (this.lines[this.currentLine] === "INPUT_NAME") {
            ctx.fillText("Type your name and press Enter:", textX, textY + 40);
            ctx.fillStyle = "#ffcc00";
            ctx.fillText("> " + this.playerName + "_", textX, textY + 80);
        } else {
            const processedLine = this.lines[this.currentLine].replace("{NAME}", this.playerName);
            this.wrapText(ctx, this.displayText, textX, textY + 30, maxTextWidth, 32);
            
            if (this.charIndex >= processedLine.length) {
                ctx.font = "16px Arial";
                ctx.fillStyle = "#888";
                ctx.textAlign = "right";
                // FIXED THE SEMICOLON BELOW
                ctx.fillText("Press SPACE to continue...", boxX + boxW - 20, boxY + boxH - 20);
            }
        }
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        let words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }
}