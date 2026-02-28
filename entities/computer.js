class Computer {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        
        this.active = false;
        this.state = "LOGIN"; 
        this.transitionTimer = 0;
        this.uiScale = 0; 
        this.progress = 0; 
        
        this.startMenuOpen = false;
        this.passwordInput = "";
        this.targetPassword = "LoveEdgar123";
        this.errorMessage = "";

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
            { q: "SECURITY: Which is a human hobby?", options: ["Watching TV", "Gnawing on floorboards", "Running in a plastic ball"], answer: 0 },
            { q: "SECURITY: Where do humans put 'Garbage'?", options: ["In a bin", "In the corner for later", "Under the fridge"], answer: 0 },
            { q: "SECURITY: A 'Trap' contains cheese. Do you touch it?", options: ["Yes, immediately", "No, it is a trick", "Only if I have a stick"], answer: 1 },
            { q: "SECURITY: You see a 'Cat'. What is your reaction?", options: ["Squeak and hide", "Pet it and say 'pspsps'", "Challenge it to a duel"], answer: 1 },
            { q: "SECURITY: How do humans typically travel?", options: ["Through the air vents", "Walking on two legs like a weirdo", "By scuttling along the baseboards"], answer: 1 },
            { q: "SECURITY: What is the purpose of a 'Shower'?", options: ["To clean oneself with water", "A terrifying rain room to be avoided", "A place to find damp spiders"], answer: 0 },
            { q: "SECURITY: Which is a delicious human delicacy?", options: ["Electricity cables", "A 'Pizza' inside a box", "The glue behind the wallpaper"], answer: 1 },
            { q: "SECURITY: Why do humans use 'Money'?", options: ["To build a soft nest", "To trade for goods and services", "To shred for bedding"], answer: 1 }
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
        this.startMenuOpen = false;
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

        if (this.game.click) {
            let mx = this.game.click.x;
            let my = this.game.click.y;
            let w = this.game.ctx.canvas.width;
            let h = this.game.ctx.canvas.height;

            if (mx > w - 60 && mx < w && my < 60) this.exit();

            if (this.state === "DESKTOP") {
                // Taskbar / Start Menu Logic
                if (mx < 100 && my > h - 40) {
                    this.startMenuOpen = !this.startMenuOpen;
                } else if (this.startMenuOpen && mx < 200 && my > h - 140 && my < h - 40) {
                    this.exit(); // Clicking Shutdown in menu
                } else {
                    this.startMenuOpen = false;
                    this.errorMessage = "";
                    for (let item of this.desktopItems) {
                        if (mx > item.x && mx < item.x + item.w && my > item.y && my < item.y + item.h + 20) {
                            if (item.name === "Cheese Safe") this.state = "VERIFY_INTRO";
                            else this.errorMessage = item.msg;
                        }
                    }
                }
            } else if (this.state === "VERIFY_INTRO") {
                if (mx > w/2 - 120 && mx < w/2 + 120 && my > h/2 + 60 && my < h/2 + 120) {
                    this.state = "VERIFY_QUESTIONS";
                    this.verifyStep = 0;
                }
            } else if (this.state === "VERIFY_QUESTIONS") {
                let q = this.questions[this.verifyStep];
                for (let i = 0; i < q.options.length; i++) {
                    let ox = w / 2 - 250;
                    let oy = 250 + i * 80;
                    if (mx > ox && mx < ox + 500 && my > oy && my < oy + 60) {
                        if (i === q.answer) {
                            this.verifyStep++;
                            if (this.verifyStep >= this.questions.length) {
                                this.state = "VERIFY_PROGRESS";
                                this.progress = 0;
                            }
                        } else {
                            this.state = "DESKTOP";
                            this.errorMessage = "PEST DETECTED! Denied.";
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
                else { this.passwordInput = ""; this.errorMessage = "Access Denied."; }
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
        const rat = this.game.entities.find(e => e.constructor.name === "Rat");
        if (!this.active && rat && this.interactBox.collide(rat.BB)) {
            ctx.fillStyle = "white";
            ctx.font = "bold 12px 'Press Start 2P'";
            ctx.textAlign = "center";
            ctx.fillText("[E] Hack Computer", this.x + this.width / 2, this.y - 15);
        }
    }

    drawUI(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.resetTransform(); 
        let w = ctx.canvas.width;
        let h = ctx.canvas.height;

        if (this.state === "STARTUP" || this.state === "SHUTDOWN") {
            ctx.translate(w/2, h/2);
            ctx.scale(this.uiScale, this.uiScale);
            ctx.translate(-w/2, -h/2);
        }

        ctx.fillStyle = (this.state === "LOGIN" || this.state === "STARTUP") ? "#000080" : "#008080";
        ctx.fillRect(0, 0, w, h);

        // --- LOGIN SCREEN ---
        if (this.state === "LOGIN") {
            ctx.fillStyle = "white";
            ctx.font = "bold 40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Mindows OS", w/2, h/2 - 120);
            ctx.font = "20px Courier New";
            ctx.fillText("User: Administrator", w/2, h/2 - 70);
            ctx.fillStyle = "rgba(255,255,255,0.1)";
            ctx.fillRect(w/2 - 200, h/2 - 30, 400, 60);
            ctx.fillStyle = "#0F0";
            ctx.font = "28px 'Courier New'";
            ctx.fillText("PASS: " + "*".repeat(this.passwordInput.length) + "_", w / 2, h / 2 + 10);
            if (this.errorMessage) {
                ctx.fillStyle = "red";
                ctx.font = "bold 18px Arial";
                ctx.fillText(this.errorMessage, w/2, h/2 + 80);
            }
        } 
        
        // --- DESKTOP ---
        else if (this.state === "DESKTOP") {
            for (let item of this.desktopItems) {
                // Icon Shadow/Selection effect
                ctx.fillStyle = "rgba(0,0,0,0.3)";
                ctx.fillRect(item.x + 4, item.y + 4, item.w, item.h);
                
                ctx.fillStyle = item.type === "folder" ? "#FFE066" : "#E0E0E0";
                ctx.fillRect(item.x, item.y, item.w, item.h);
                ctx.strokeStyle = "white";
                ctx.strokeRect(item.x, item.y, item.w, item.h);
                
                ctx.fillStyle = "white";
                ctx.font = "bold 14px Arial";
                ctx.textAlign = "center";
                ctx.fillText(item.name, item.x + item.w/2, item.y + item.h + 18);
            }

            // Error Pop-up logic (visual only)
            if (this.errorMessage) {
                ctx.fillStyle = "#C0C0C0";
                ctx.fillRect(w/2 - 200, h/2 - 50, 400, 100);
                ctx.strokeStyle = "black";
                ctx.strokeRect(w/2 - 200, h/2 - 50, 400, 100);
                ctx.fillStyle = "navy";
                ctx.fillRect(w/2 - 198, h/2 - 48, 396, 20);
                ctx.fillStyle = "white";
                ctx.font = "12px Arial";
                ctx.textAlign = "left";
                ctx.fillText("Alert", w/2 - 190, h/2 - 34);
                ctx.fillStyle = "black";
                ctx.textAlign = "center";
                ctx.font = "14px Arial";
                ctx.fillText(this.errorMessage, w/2, h/2 + 20);
            }

            // Retro Taskbar
            ctx.fillStyle = "#C0C0C0";
            ctx.fillRect(0, h - 40, w, 40);
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.strokeRect(2, h - 38, 80, 36); // Start Button box
            ctx.fillStyle = "black";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Start", 42, h - 14);

            // Clock
            let now = new Date();
            ctx.textAlign = "right";
            ctx.fillText(now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0'), w - 20, h - 14);

            if (this.startMenuOpen) {
                ctx.fillStyle = "#C0C0C0";
                ctx.fillRect(0, h - 140, 180, 100);
                ctx.strokeStyle = "black";
                ctx.strokeRect(0, h - 140, 180, 100);
                ctx.fillStyle = "black";
                ctx.textAlign = "left";
                ctx.fillText("📁 My Cheese", 10, h - 110);
                ctx.fillText("⚙️ Settings", 10, h - 80);
                ctx.fillStyle = "red";
                ctx.fillText("🔴 Log Off", 10, h - 50);
            }
        }

        // --- SECURITY INTERFACE ---
        else if (this.state === "VERIFY_INTRO" || this.state === "VERIFY_QUESTIONS") {
            ctx.fillStyle = "rgba(0,0,0,0.8)";
            ctx.fillRect(0,0,w,h);
            
            // Window Frame
            ctx.fillStyle = "#C0C0C0";
            ctx.fillRect(w/2 - 300, 50, 600, 500);
            ctx.strokeStyle = "white";
            ctx.strokeRect(w/2 - 300, 50, 600, 500);
            ctx.fillStyle = "navy";
            ctx.fillRect(w/2 - 298, 52, 596, 30);
            ctx.fillStyle = "white";
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Human Identity Verification v2.1", w/2, 73);

            if (this.state === "VERIFY_INTRO") {
                ctx.fillStyle = "black";
                ctx.font = "22px Arial";
                ctx.fillText("Are you a rodent?", w/2, 200);
                ctx.font = "16px Arial";
                ctx.fillText("Please complete the behavioral analysis to proceed.", w/2, 240);
                
                ctx.fillStyle = "#008000";
                ctx.fillRect(w/2 - 120, h/2 + 60, 240, 60);
                ctx.fillStyle = "white";
                ctx.font = "bold 20px Arial";
                ctx.fillText("START TEST", w/2, h/2 + 98);
            } else {
                let q = this.questions[this.verifyStep];
                ctx.fillStyle = "black";
                ctx.font = "bold 24px Arial";
                ctx.fillText(q.q, w/2, 160);
                q.options.forEach((opt, i) => {
                    ctx.fillStyle = "#888";
                    ctx.fillRect(w/2 - 250, 250 + i * 80, 500, 60);
                    ctx.strokeStyle = "black";
                    ctx.strokeRect(w/2 - 250, 250 + i * 80, 500, 60);
                    ctx.fillStyle = "white";
                    ctx.font = "18px Arial";
                    ctx.fillText(opt, w/2, 288 + i * 80);
                });
            }
        }

        // --- PROGRESS & UNLOCKED ---
        else if (this.state === "VERIFY_PROGRESS") {
            ctx.fillStyle = "white";
            ctx.font = "bold 35px Arial";
            ctx.textAlign = "center";
            ctx.fillText("VERIFYING BIOMETRICS ...", w/2, h/2 - 50);
            ctx.strokeRect(w/2 - 200, h/2, 400, 50);
            ctx.fillStyle = "#0F0";
            ctx.fillRect(w/2 - 200, h/2, 400 * this.progress, 50);
        }

        else if (this.state === "UNLOCKED") {
            ctx.fillStyle = "#0F0";
            ctx.font = "bold 30px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Successfully confirmed you are not a pest trying to obtain food. Access Code Granted.", w/2, h/2 - 100);
            ctx.fillStyle = "yellow";
            ctx.font = "bold 40px Arial";
            ctx.fillText("7 - 3 - 1 - 9", w/2, h/2 + 50);
        }

        // Global Close Button
        ctx.fillStyle = "#800000";
        ctx.fillRect(w - 60, 0, 60, 40);
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.fillText("EXIT", w - 30, 28);

        ctx.restore();
    }
}