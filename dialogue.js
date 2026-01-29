class Dialogue {
    constructor(game, sceneManager) {
        this.game = game;
        this.sceneManager = sceneManager;
        this.playerName = "";
        this.state = "TALKING"; // TALKING, INPUT, FINISHED
        
        this.currentLine = 0;
        this.displayText = "";
        this.charIndex = 0;
        this.typeTimer = 0;

        this.lines = [
            "Squeak! A new set of whiskers in the walls? I haven't seen a living soul since... well, since I lost mine.",
            "Tell me, young scout... what do they call you in the Great Below?",
            "INPUT_NAME", // Special tag to trigger the name box
            "Ah, {NAME}... a fine name for a scout. I am Stuart Big, once the Chosen, now your spirit guide.",
            "I sought the Golden Wheel once, but my paws slipped at the Great Gate. My poor tail still aches from the fall.",
            "Listen well: To reach the Forbidden Hearth, you must find the Golden Key to unlock the Baby Gate.",
            "But first, find Edgar Barkley the Yorkie in the living room. He's a loud beast, but he'll teach you the tooth and claw tactics you'll need.",
            "Good luck, {NAME}. Don't let your tail drag!"
        ];
    }

    update() {
        let line = this.lines[this.currentLine];

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

        // Process line with name replacement
        let processedLine = line.replace("{NAME}", this.playerName);

        if (this.charIndex < processedLine.length) {
            this.typeTimer += this.game.clockTick;
            if (this.typeTimer > 0.03) {
                this.displayText += processedLine[this.charIndex];
                this.charIndex++;
                this.typeTimer = 0;
            }
        }

        if (this.game.click || this.game.keys["Space"]) {
            if (this.charIndex < processedLine.length) {
                this.displayText = processedLine;
                this.charIndex = processedLine.length;
            } else {
                this.currentLine++;
                if (this.currentLine >= this.lines.length) {
                    this.sceneManager.dialogueActive = false;
                } else {
                    this.displayText = "";
                    this.charIndex = 0;
                }
            }
            this.game.click = null;
            this.game.keys["Space"] = false;
        }
    }

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Dialogue Box UI
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.fillRect(w / 2 - 400, h - 200, 800, 150);
        ctx.strokeRect(w / 2 - 400, h - 200, 800, 150);

        // Speaker Name
        ctx.fillStyle = "#aaaaff"; // Ghostly Blue
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Stuart Big (Spirit Guide)", w / 2 - 380, h - 170);

        ctx.fillStyle = "white";
        ctx.font = "20px 'Courier New'";
        
        if (this.lines[this.currentLine] === "INPUT_NAME") {
            ctx.fillText("Type your name and press Enter:", w / 2 - 380, h - 120);
            ctx.fillStyle = "#ffcc00";
            ctx.fillText("> " + this.playerName + "_", w / 2 - 380, h - 90);
        } else {
            this.wrapText(ctx, this.displayText, w / 2 - 380, h - 130, 760, 25);
            ctx.font = "14px Arial";
            ctx.fillStyle = "#888";
            ctx.fillText("Click or Space to continue...", w / 2 + 200, h - 65);
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