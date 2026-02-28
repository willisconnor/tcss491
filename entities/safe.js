class SafeComputer {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;

        // --- STATES ---
        this.isZoomed = false; 
        this.screenState = "LOGIN"; // "LOGIN", "DESKTOP", "SAFE_APP"
        this.isUnlocked = false;

        // --- PUZZLE LOGIC ---
        this.targetCode = "4219";
        this.inputCode = "";
        
        // --- VISUALS ---
        this.width = 64; 
        this.height = 64;
        this.desktopBG = "#008080"; // Classic Windows Teal
    }

    update() {
        let rat = this.game.entities.find(e => e instanceof Rat);
        if (!rat) return;

        // 1. WORLD INTERACTION (Distance Check)
        let dist = Math.sqrt(Math.pow((this.x + 32) - (rat.x + 24), 2) + Math.pow((this.y + 32) - (rat.y + 30), 2));

        if (dist < 80 && this.game.keys["KeyE"] && !this.isZoomed) {
            this.isZoomed = true;
            this.game.paused = true; // Freezes rat movement
            this.game.keys["KeyE"] = false;
        }

        // 2. ZOOMED INTERFACE LOGIC
        if (this.isZoomed) {
            if (this.game.keys["Escape"]) {
                this.isZoomed = false;
                this.game.paused = false;
                this.screenState = "LOGIN";
                return;
            }

            if (this.game.click) {
                const mx = this.game.click.x;
                const my = this.game.click.y;

                if (this.screenState === "LOGIN") {
                    // Click "User" button in middle of screen
                    if (mx > 400 && mx < 624 && my > 300 && my < 400) {
                        this.screenState = "DESKTOP";
                    }
                } else if (this.screenState === "DESKTOP") {
                    // Click Safe Icon
                    if (mx > 100 && mx < 164 && my > 100 && my < 164) {
                        this.screenState = "SAFE_APP";
                    }
                } else if (this.screenState === "SAFE_APP") {
                    this.checkKeypad(mx, my);
                }
                this.game.click = null;
            }
        }
    }

    checkKeypad(mx, my) {
        const startX = 400, startY = 250, size = 60, gap = 10;
        for (let i = 0; i < 10; i++) {
            let row = Math.floor(i / 3);
            let col = i % 3;
            if (i === 9) { col = 1; row = 3; }
            let bx = startX + col * (size + gap);
            let by = startY + row * (size + gap);
            if (mx > bx && mx < bx + size && my > by && my < by + size) {
                this.inputCode += (i + 1) % 10;
                if (this.inputCode.length === 4) {
                    if (this.inputCode === this.targetCode) this.isUnlocked = true;
                    else this.inputCode = ""; 
                }
            }
        }
    }

    draw(ctx) {
        if (!this.isZoomed) {
            this.drawComputerSprite(ctx);
        } else {
            this.drawFullScreenInterface(ctx);
        }
    }

    // DRAW THE 64x64 PIXEL ART COMPUTER
    drawComputerSprite(ctx) {
        ctx.save();
        // Monitor Shell (Beige)
        ctx.fillStyle = "#D2B48C"; 
        ctx.fillRect(this.x, this.y, 64, 50);
        // Screen (Black)
        ctx.fillStyle = "#000";
        ctx.fillRect(this.x + 6, this.y + 6, 52, 38);
        // Base/Stand
        ctx.fillStyle = "#8B7355";
        ctx.fillRect(this.x + 20, this.y + 50, 24, 14);
        // Glowing LED
        ctx.fillStyle = this.isUnlocked ? "#0F0" : "#F00";
        ctx.fillRect(this.x + 54, this.y + 45, 4, 4);
        
        ctx.fillStyle = "white";
        ctx.font = "10px Arial";
        ctx.fillText("Press E", this.x + 12, this.y - 5);
        ctx.restore();
    }

    drawFullScreenInterface(ctx) {
        const cw = ctx.canvas.width;
        const ch = ctx.canvas.height;

        // 1. DESKTOP BACKGROUND
        ctx.fillStyle = this.desktopBG;
        ctx.fillRect(0, 0, cw, ch);

        if (this.screenState === "LOGIN") {
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(0,0,cw,ch);
            ctx.fillStyle = "#C0C0C0";
            ctx.fillRect(400, 300, 224, 100);
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.fillText("CLICK TO LOGIN", 512, 355);
        } 
        
        else if (this.screenState === "DESKTOP") {
            // Safe Icon
            ctx.fillStyle = "#FFD700";
            ctx.fillRect(100, 100, 64, 64);
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Safe.exe", 132, 185);
            
            // Taskbar
            ctx.fillStyle = "#C0C0C0";
            ctx.fillRect(0, ch - 40, cw, 40);
        }

        else if (this.screenState === "SAFE_APP") {
            this.drawSafeApp(ctx);
        }
    }

    drawSafeApp(ctx) {
        // Window
        ctx.fillStyle = "#C0C0C0";
        ctx.fillRect(300, 100, 424, 500);
        ctx.fillStyle = "#000080";
        ctx.fillRect(300, 100, 424, 30);
        
        // Display
        ctx.fillStyle = "#222";
        ctx.fillRect(350, 150, 324, 70);
        ctx.fillStyle = this.isUnlocked ? "#0F0" : "#F00";
        ctx.font = "30px Courier";
        ctx.textAlign = "center";
        let txt = this.isUnlocked ? "OPENED" : "* ".repeat(this.inputCode.length) || "LOCKED";
        ctx.fillText(txt, 512, 195);

        // Keypad buttons
        const startX = 400, startY = 250, size = 60, gap = 10;
        for (let i = 0; i < 10; i++) {
            let row = Math.floor(i / 3);
            let col = i % 3;
            if (i === 9) { col = 1; row = 3; }
            let bx = startX + col * (size + gap);
            let by = startY + row * (size + gap);
            
            ctx.fillStyle = "#888";
            ctx.fillRect(bx, by, size, size);
            
            // Smudge Hint for 4, 2, 1, 9
            if ([4,2,1,9].includes((i+1)%10)) {
                ctx.fillStyle = "rgba(0,0,0,0.1)";
                ctx.beginPath(); ctx.arc(bx+30, by+30, 20, 0, Math.PI*2); ctx.fill();
            }

            ctx.fillStyle = "black";
            ctx.font = "20px Arial";
            ctx.fillText((i + 1) % 10, bx + 30, by + 40);
        }
    }
}