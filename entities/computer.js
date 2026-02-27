class Computer {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        
        // States: STARTUP, LOGIN, DESKTOP, VERIFY_INTRO, VERIFY_QUESTIONS, VERIFY_PROGRESS, UNLOCKED, SHUTDOWN
        this.active = false;
        this.state = "LOGIN"; 
        this.transitionTimer = 0;
        this.uiScale = 0; 
        this.progress = 0; 
        
        this.startMenuOpen = false;
        this.passwordInput = "";
        this.targetPassword = "LoveEdgar123";
        this.errorMessage = "";

        // The specific files and folders you liked
        this.desktopItems = [
            { x: 50, y: 50, w: 60, h: 45, type: "folder", name: "Cheese Safe", msg: "" },
            { x: 50, y: 150, w: 60, h: 45, type: "folder", name: "Recipes", msg: "Error: You cannot use a whisk. You are a rodent." },
            { x: 50, y: 250, w: 60, h: 45, type: "file", name: "Cheddar.xlsx", msg: "A spreadsheet of cheese prices. Boring." },
            { x: 180, y: 50, w: 45, h: 60, type: "file", name: "Memes", msg: "A picture of a human slipping on a banana peel. Classic." },
            { x: 180, y: 150, w: 45, h: 60, type: "file", name: "Not_A_Trap.jpg", msg: "It's a high-res photo of a peanut. Suspiciously high-res." },
            { x: 180, y: 250, w: 45, h: 60, type: "file", name: "Human.exe", msg: "Fatal Error: Requires opposable thumbs." }
        ];

        this.verifyStep = 0;
        this.questions = [
            { 
                q: "SECURITY: Which is a human hobby?", 
                options: ["Watching TV", "Gnawing on floorboards", "Running in a plastic ball"], 
                answer: 0 
            },
            { 
                q: "SECURITY: Where do humans put 'Garbage'?", 
                options: ["In a bin", "In the corner for later", "Under the fridge"], 
                answer: 0 
            },
            { 
                q: "SECURITY: A 'Trap' contains cheese. Do you touch it?", 
                options: ["Yes, immediately", "No, it is a trick", "Only if I have a stick"], 
                answer: 1 
            }
        ];

        this.updateBB();
    }

    updateBB() {
        this.BB = new BoundingBox(this.x, this.y, this.width, this.height);
        this.interactBox = new BoundingBox(this.x - 60, this.y - 60, this.width + 120, this.height + 120);
    }

    exit() {
        this.state = "SHUTDOWN";
        this.transitionTimer = 0;
        this.game.keys["Escape"] = false;
    }

    update() {
        let rat = this.game.entities.find(e => e.constructor.name === "Rat");
        if (!rat) return;

        if (!this.active) {
            if (this.interactBox.collide(rat.BB) && this.game.keys["KeyE"]) {
                this.active = true;
                this.state = "STARTUP";
                this.transitionTimer = 0;
                this.uiScale = 0;
                this.game.keys["KeyE"] = false;
                this.game.typing = true;
                rat.frozenForDialogue = true; 
            }
            return;
        }

        // --- TRANSITIONS ---
        if (this.state === "STARTUP") {
            this.transitionTimer += this.game.clockTick;
            this.uiScale = Math.min(1, this.transitionTimer / 0.4);
            if (this.uiScale >= 1) this.state = "LOGIN";
            return;
        }

        if (this.state === "SHUTDOWN") {
            this.transitionTimer += this.game.clockTick;
            this.uiScale = Math.max(0, 1 - (this.transitionTimer / 0.4));
            if (this.uiScale <= 0) {
                this.active = false;
                this.game.typing = false;
                rat.frozenForDialogue = false;
                this.state = "LOGIN";
            }
            return;
        }

        if (this.game.keys["Escape"]) { this.exit(); return; }

        // --- INTERACTION ---
        if (this.game.click) {
            let mx = this.game.click.x;
            let my = this.game.click.y;
            let w = this.game.ctx.canvas.width;
            let h = this.game.ctx.canvas.height;

            if (mx > w - 60 && mx < w && my < 60) this.exit();

            if (this.state === "DESKTOP") {
                this.errorMessage = "";
                for (let item of this.desktopItems) {
                    if (mx > item.x && mx < item.x + item.w && my > item.y && my < item.y + item.h + 20) {
                        if (item.name === "Cheese Safe") this.state = "VERIFY_INTRO";
                        else this.errorMessage = item.msg;
                    }
                }
            } else if (this.state === "VERIFY_INTRO") {
                if (mx > w/2 - 100 && mx < w/2 + 100 && my > h/2 + 50 && my < h/2 + 100) {
                    this.state = "VERIFY_QUESTIONS";
                    this.verifyStep = 0;
                }
            } else if (this.state === "VERIFY_QUESTIONS") {
                let q = this.questions[this.verifyStep];
                for (let i = 0; i < q.options.length; i++) {
                    let ox = w / 2 - 200;
                    let oy = 250 + i * 70;
                    if (mx > ox && mx < ox + 400 && my > oy && my < oy + 50) {
                        if (i === q.answer) {
                            this.verifyStep++;
                            if (this.verifyStep >= this.questions.length) {
                                this.state = "VERIFY_PROGRESS";
                                this.progress = 0;
                            }
                        } else {
                            this.state = "DESKTOP";
                            this.errorMessage = "BOT DETECTED! Denied.";
                        }
                    }
                }
            }
            this.game.click = null;
        }

        if (this.state === "VERIFY_PROGRESS") {
            this.progress += this.game.clockTick * 0.5;
            if (this.progress >= 1) this.state = "UNLOCKED";
        }

        if (this.state === "LOGIN") {
            if (this.game.lastInput === "Enter") {
                if (this.passwordInput === this.targetPassword) this.state = "DESKTOP";
                else { this.passwordInput = ""; this.errorMessage = "Invalid Credentials."; }
                this.game.lastInput = null;
            } else if (this.game.lastInput === "Backspace") {
                this.passwordInput = this.passwordInput.slice(0, -1);
                this.game.lastInput = null;
            } else if (this.game.lastInput && this.game.lastInput.length === 1) {
                this.passwordInput += this.game.lastInput;
                this.game.lastInput = null;
            }
        }
    }

    draw(ctx) {
        let drawX = this.x - this.game.camera.x;
        let drawY = this.y - this.game.camera.y;

        // Draw physical monitor in world
        ctx.fillStyle = "#333";
        ctx.fillRect(drawX, drawY, this.width, this.height);
        ctx.fillStyle = "black";
        ctx.fillRect(drawX + 8, drawY + 8, this.width - 16, this.height - 25);
        
        if (!this.active && this.interactBox.collide(this.game.entities.find(e => e.constructor.name === "Rat").BB)) {
            ctx.fillStyle = "yellow";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.fillText("[E] Hack Computer", drawX + this.width / 2, drawY - 15);
        }

        if (this.active) {
            ctx.save();
            let w = ctx.canvas.width;
            let h = ctx.canvas.height;

            // HANDLE ZOOM
            if (this.state === "STARTUP" || this.state === "SHUTDOWN") {
                let targetX = drawX + this.width / 2;
                let targetY = drawY + this.height / 2;
                ctx.translate(targetX, targetY);
                ctx.scale(this.uiScale, this.uiScale);
                ctx.translate(-w / 2, -h / 2);
            } else {
                ctx.setTransform(1, 0, 0, 1, 0, 0); 
            }

            // UI Background
            ctx.fillStyle = (this.state === "LOGIN" || this.state === "STARTUP" || this.state === "SHUTDOWN") ? "black" : "#008080";
            ctx.fillRect(0, 0, w, h);

            // Red X Close Button
            ctx.fillStyle = "red";
            ctx.fillRect(w - 60, 0, 60, 60);
            ctx.fillStyle = "white";
            ctx.font = "bold 30px Arial";
            ctx.textAlign = "center";
            ctx.fillText("X", w - 30, 42);

            if (this.state === "LOGIN") {
                ctx.fillStyle = "#0F0";
                ctx.font = "24px 'Courier New'";
                ctx.fillText("ENTER SYSTEM PASSWORD: " + this.passwordInput + "_", w / 2, h / 2);
            } 
            
            else if (this.state === "VERIFY_INTRO") {
                ctx.fillStyle = "white";
                ctx.fillRect(w/2 - 250, h/2 - 150, 500, 300);
                ctx.fillStyle = "black";
                ctx.font = "bold 24px Arial";
                ctx.fillText("SECURITY GATEWAY", w/2, h/2 - 100);
                ctx.font = "18px Arial";
                ctx.fillText("Confirm you are a human resident", w/2, h/2 - 40);
                ctx.fillText("and not a household pest.", w/2, h/2 - 10);
                ctx.fillStyle = "#444";
                ctx.fillRect(w/2 - 100, h/2 + 50, 200, 50);
                ctx.fillStyle = "white";
                ctx.fillText("BEGIN TEST", w/2, h/2 + 82);
            }

            else if (this.state === "VERIFY_QUESTIONS") {
                let q = this.questions[this.verifyStep];
                ctx.fillStyle = "white";
                ctx.font = "bold 22px Arial";
                ctx.fillText(q.q, w/2, 150);
                q.options.forEach((opt, i) => {
                    ctx.fillStyle = "#333";
                    ctx.fillRect(w/2 - 200, 250 + i * 70, 400, 50);
                    ctx.fillStyle = "white";
                    ctx.fillText(opt, w/2, 282 + i * 70);
                });
            }

            else if (this.state === "VERIFY_PROGRESS") {
                ctx.fillStyle = "white";
                ctx.font = "bold 28px Arial";
                ctx.fillText("VERIFYING BIOMETRICS...", w/2, h/2 - 50);
                ctx.strokeStyle = "white";
                ctx.strokeRect(w/2 - 200, h/2, 400, 40);
                ctx.fillStyle = "#00FF00";
                ctx.fillRect(w/2 - 200, h/2, 400 * this.progress, 40);
            }

            else if (this.state === "UNLOCKED") {
                ctx.fillStyle = "#0F0";
                ctx.font = "bold 24px Arial";
                ctx.fillText("SUCCESS!", w/2, h/2 - 80);
                ctx.fillStyle = "white";
                ctx.font = "18px Arial";
                ctx.fillText("Successfully proved we are not a pest", w/2, h/2 - 40);
                ctx.fillText("trying to get access to food.", w/2, h/2 - 15);
                ctx.fillStyle = "yellow";
                ctx.font = "bold 40px Arial";
                ctx.fillText("SAFE CODE: 7 - 3 - 1 - 9", w/2, h/2 + 60);
            }

            else if (this.state === "DESKTOP") {
                for (let item of this.desktopItems) {
                    ctx.fillStyle = item.type === "folder" ? "#FFD700" : "#FFF";
                    ctx.fillRect(item.x, item.y, item.w, item.h);
                    ctx.fillStyle = "white";
                    ctx.font = "12px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText(item.name, item.x + item.w/2, item.y + item.h + 15);
                }
                if (this.errorMessage) {
                    ctx.fillStyle = "yellow";
                    ctx.fillText(this.errorMessage, w/2, h - 80);
                }
                // Start Bar
                ctx.fillStyle = "#C0C0C0";
                ctx.fillRect(0, h - 40, w, 40);
                ctx.fillStyle = "black";
                ctx.font = "bold 14px Arial";
                ctx.textAlign = "left";
                ctx.fillText("START", 20, h - 15);
            }

            ctx.restore();
        }
    }
}