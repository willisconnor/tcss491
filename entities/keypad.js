class Keypad {
    constructor(game, x, y, linkedSafe) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        
        this.linkedSafe = linkedSafe; 
        this.active = false;
        
        this.inputCode = "";
        this.targetCode = "7319"; 
        
        this.statusMessage = "ENTER CODE";
        this.statusColor = "#00FF00"; // Neon Green
        
        this.updateBB();
    }

    updateBB() {
        this.BB = new BoundingBox(this.x, this.y, this.width, this.height);
        this.interactBox = new BoundingBox(this.x - 40, this.y - 40, this.width + 80, this.height + 80);
    }

    exit() {
        this.active = false;
        this.game.keys["Escape"] = false;
        
        let rat = this.game.entities.find(e => e.constructor.name === "Rat");
        if (rat) rat.frozenForDialogue = false;
        
        this.inputCode = "";
        this.statusMessage = "ENTER CODE";
        this.statusColor = "#00FF00";
    }

    update() {
        if (this.linkedSafe.isOpen) return; // Disable keypad if safe is already open

        let rat = this.game.entities.find(e => e.constructor.name === "Rat");
        if (!rat) return;

        // Check for physical interaction
        if (!this.active) {
            if (this.interactBox.collide(rat.BB) && this.game.keys["KeyE"]) {
                this.active = true;
                this.game.keys["KeyE"] = false;
                rat.frozenForDialogue = true; 
            }
            return;
        }

        // --- UI Interaction Logic ---
        if (this.game.keys["Escape"]) { this.exit(); return; }

        if (this.game.click) {
            let mx = this.game.click.x;
            let my = this.game.click.y;
            let w = this.game.ctx.canvas.width;
            let h = this.game.ctx.canvas.height;

            // Global Exit Button click
            if (mx > w - 60 && mx < w && my < 60) {
                this.exit();
                this.game.click = null;
                return;
            }

            // Number pad click bounds
            let startX = w / 2 - 100;
            let startY = h / 2 - 50;
            let btnSize = 60;
            let padding = 10;
            
            const buttons = [
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['C', '0', 'E']
            ];

            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 3; col++) {
                    let bx = startX + col * (btnSize + padding);
                    let by = startY + row * (btnSize + padding);

                    if (mx >= bx && mx <= bx + btnSize && my >= by && my <= by + btnSize) {
                        this.handleButtonPress(buttons[row][col]);
                    }
                }
            }
            this.game.click = null;
        }
    }

    handleButtonPress(val) {
        if (this.statusMessage === "LOCKED" || this.statusMessage === "UNLOCKED") return;

        if (val === 'C') {
            this.inputCode = "";
        } else if (val === 'E') {
            if (this.inputCode === this.targetCode) {
                this.statusMessage = "UNLOCKED";
                this.statusColor = "yellow";
                this.linkedSafe.openSafe();
                
                // Automatically close the UI shortly after solving
                setTimeout(() => this.exit(), 1500); 
            } else {
                this.statusMessage = "LOCKED";
                this.statusColor = "red";
                // Reset after 1 second
                setTimeout(() => {
                    this.inputCode = "";
                    this.statusMessage = "ENTER CODE";
                    this.statusColor = "#00FF00";
                }, 1000);
            }
        } else {
            if (this.inputCode.length < 4) {
                this.inputCode += val;
            }
        }
    }

    draw(ctx) {
        if (this.linkedSafe.isOpen) return; // Hide or disable visually when done

        // Draw a small physical keypad mounted on the wall
        ctx.fillStyle = "#222";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Small glowing screen light
        ctx.fillStyle = this.active ? "#0F0" : "red";
        ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, 8);

        // Interaction prompt
        const rat = this.game.entities.find(e => e.constructor.name === "Rat");
        if (!this.active && rat && this.interactBox.collide(rat.BB)) {
            ctx.fillStyle = "white";
            ctx.font = "bold 12px 'Press Start 2P', Courier";
            ctx.textAlign = "center";
            ctx.fillText("[E] Enter Code", this.x + this.width / 2, this.y - 15);
        }
    }

    drawUI(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.resetTransform(); 
        
        let w = ctx.canvas.width;
        let h = ctx.canvas.height;

        // Dark background fade
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, w, h);

        // Main Keypad Panel
        let panelW = 300;
        let panelH = 450;
        let panelX = w / 2 - panelW / 2;
        let panelY = h / 2 - panelH / 2;

        ctx.fillStyle = "#808080";
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 6;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        // LCD Display Screen
        ctx.fillStyle = "#111111";
        ctx.fillRect(panelX + 20, panelY + 20, panelW - 40, 70);
        
        ctx.fillStyle = this.statusColor;
        ctx.font = "bold 26px 'Courier New', Courier, monospace";
        ctx.textAlign = "center";
        
        if (this.statusMessage === "ENTER CODE" && this.inputCode.length > 0) {
            ctx.fillText("* ".repeat(this.inputCode.length), w / 2, panelY + 65);
        } else {
            ctx.fillText(this.statusMessage, w / 2, panelY + 65);
        }

        // Draw Numpad Buttons
        let startX = w / 2 - 100;
        let startY = h / 2 - 50;
        let btnSize = 60;
        let padding = 10;
        
        const buttons = [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['C', '0', 'E']
        ];

        ctx.font = "bold 28px Arial";
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                let bx = startX + col * (btnSize + padding);
                let by = startY + row * (btnSize + padding);

                // Button shadow/depth
                ctx.fillStyle = "#555";
                ctx.fillRect(bx, by, btnSize, btnSize);
                
                ctx.fillStyle = "#C0C0C0";
                ctx.fillRect(bx + 2, by + 2, btnSize - 4, btnSize - 4);

                // Button Text
                ctx.fillStyle = "black";
                ctx.fillText(buttons[row][col], bx + btnSize / 2, by + btnSize / 2 + 10);
            }
        }

        // Global Close Button (Matches Computer)
        ctx.fillStyle = "#800000";
        ctx.fillRect(w - 60, 0, 60, 40);
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.fillText("EXIT", w - 30, 28);

        ctx.restore();
    }
}