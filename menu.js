class Menu {
    constructor(game) {
        this.game = game;
        this.state = "START";

        // intro animation; phases flow in sequence
        this.introTimer = 0;
        this.introPhase = "FADE_LOADING"; // FADE_LOADING → SLIDE_TITLE → SPARKLE_CREDITS → POP_BUTTONS → SLIDE_RATS → DONE
        this.introDone = false;

        // Sparkle particles for credit reveal
        this.sparkles = [];
        this.sparklesSpawned = false;

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

        // Button dimensions
        this.btnW = 300;
        this.btnH = 70;

        // Hover/press tracking
        this.hoveredBtn = null;   // "start", "tutorial", "back"
        this.pressedBtn = null;

        // Track audio
        this.activeSounds = []; // stores all active 'click' sounds to stop them
    }

    // helper to play and track sound
    playTypingSound() {
        // play sound using AssetManager
        let snd = ASSET_MANAGER.playAsset("./assets/keyboard-click.mp3");
        snd.currentTime = 0.60; // skips the first 60 milliseconds to bypass the delay
        if (snd) {
            this.activeSounds.push(snd);
            // auto remove from list when done to save memory
            snd.onended = () => {
                this.activeSounds = this.activeSounds.filter(s => s !== snd);
            };
        }
    }

    // helper to INSTANTLY stop all typing sounds
    stopTypingSounds() {
        this.activeSounds.forEach(snd => {
            snd.pause();
            snd.currentTime = 0;
        });
        this.activeSounds = [];
    }

    update() {
        // Advance intro animation
        if (!this.introDone && this.state === "START") {
            this.introTimer += this.game.clockTick || 0.016;
            if (this.introPhase === "FADE_LOADING" && this.introTimer >= 1.0) {
                this.introPhase = "SLIDE_TITLE";
                this.introTimer = 0;
            } else if (this.introPhase === "SLIDE_TITLE" && this.introTimer >= 1.0) {
                this.introPhase = "SPARKLE_CREDITS";
                this.introTimer = 0;
                this.sparklesSpawned = false;
            } else if (this.introPhase === "SPARKLE_CREDITS" && this.introTimer >= 1.5) {
                this.introPhase = "POP_BUTTONS";
                this.introTimer = 0;
            } else if (this.introPhase === "POP_BUTTONS" && this.introTimer >= 1.5) {
                this.introPhase = "SLIDE_RATS";
                this.introTimer = 0;
            } else if (this.introPhase === "SLIDE_RATS" && this.introTimer >= 4.5) {
                this.introPhase = "DONE";
                this.introDone = true;
            }

            // Update sparkle particles
            for (let i = this.sparkles.length - 1; i >= 0; i--) {
                const sp = this.sparkles[i];
                sp.life -= this.game.clockTick || 0.016;
                sp.x += sp.vx * (this.game.clockTick || 0.016);
                sp.y += sp.vy * (this.game.clockTick || 0.016);
                sp.vy += 30 * (this.game.clockTick || 0.016); // gentle gravity
                if (sp.life <= 0) this.sparkles.splice(i, 1);
            }
        }
        // Track hover state for button highlighting
        if (this.game.mouse) {
            const mx = this.game.mouse.x;
            const my = this.game.mouse.y;
            const w = this.game.ctx.canvas.width;
            const h = this.game.ctx.canvas.height;
            const cx = w / 2 - this.btnW / 2;
            const cy = h / 2 + 20;
            this.hoveredBtn = null;

            if (this.state === "START" && this.introDone) {
                if (this.checkBounds(mx, my, cx, cy - 40, this.btnW, this.btnH)) {
                    this.hoveredBtn = "start";
                } else if (this.checkBounds(mx, my, cx, cy + 40 + this.btnH - 60, this.btnW, this.btnH)) {
                    this.hoveredBtn = "tutorial";
                }
            } else if (this.state === "TUTORIAL") {
                if (this.checkBounds(mx, my, w / 2 - this.btnW / 2, h / 2 + 200, this.btnW, this.btnH)) {
                    this.hoveredBtn = "back";
                }
            }
        }

        // Track press state
        this.pressedBtn = (this.game.click && this.hoveredBtn) ? this.hoveredBtn : null;
        // Check for ESC in ANY menu state to go back to START
        if (this.game.keys["Escape"]) {
            this.game.keys["Escape"] = false; // Reset the key so it doesn't double-trigger

            this.stopTypingSounds(); // KILL SWITCH

            if (this.state === "STORY") {
                this.startGame();
                return;
            } else if (this.state === "TUTORIAL") {
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
        let userSkipped = false;

        // "Press any key" logic
        let anyKeyPressed = Object.values(this.game.keys).some(key => key === true);

        // user skip, fast-forward
        if (this.game.click || anyKeyPressed) {
            userSkipped = true;

            this.stopTypingSounds(); // kill switch

            if (this.charIndex < line.length) {
                this.displayText = line; // Finish line instantly
                this.charIndex = line.length;
            } else {
                this.currentLine++;
                if (this.currentLine >= this.storyLines.length) {
                    this.startGame();
                } else {
                    this.displayText = "";
                    this.charIndex = 0;
                }
            }
            this.game.click = null;
            // Clear keys to prevent rapid-firing through lines
            Object.keys(this.game.keys).forEach(k => this.game.keys[k] = false);
        }

        // typewriter logic
        if (!userSkipped && this.charIndex < line.length) {
            this.typeTimer += this.game.clockTick;
            if (this.typeTimer >= this.typeSpeed) {
                this.displayText += line[this.charIndex];
                this.charIndex++;
                this.typeTimer = 0;

                // play sound
                // every 4th character
                if (this.charIndex % 4 === 0) {
                    this.playTypingSound();
                }
            }
        }

        // ensure silence if line finishes naturally
        if (this.charIndex >= line.length) {
            this.stopTypingSounds();
        }
    }

    startGame() {
        this.stopTypingSounds(); // cleanup
        if (this.game.camera) {
            this.game.camera.loreCompleted = true;
            this.game.camera.isFading = true;
            this.game.camera.fadeAlpha = 1;
        }
        // resume or start the music
        // if music was just paused (returning from menu), resume it
        if (this.game.audio.currentMusic && this.game.audio.currentMusic.paused && this.game.audio.currentMusic.currentTime > 0) {
            this.game.audio.currentMusic.play().catch(() => {});
        } else if (this.game.camera && this.game.camera.currentMusicPath) {
            this.game.audio.playMusic(this.game.camera.currentMusicPath);
        } else {
            this.game.audio.playMusic("./assets/background_music.wav");
        }

        // 2. Transition to Game
        this.game.camera.menuActive = false;
        this.game.camera.storyState = "STUART_TALK";

        // Check if Stuart's intro has already been played
        if (!this.game.camera.stuartIntroPlayed) {
            if (this.game.camera.debugNoDialogue) {
                this.game.camera.dialogueActive = false;
                this.game.camera.stuartIntroPlayed = true;
            } else {
                // First time: play the intro dialogue
                this.game.camera.dialogueActive = true;
                this.game.camera.dialogue.currentIndex = 0;
                this.game.camera.dialogue.charIndex = 0;
                this.game.camera.dialogue.displayText = "";
                this.game.camera.dialogue.phase = "INTRO";
                this.game.camera.dialogue.selectedChoiceIndex = null;
                this.game.camera.dialogue.selectedQuestions = new Set();
                this.game.camera.dialogue.displayingChoiceResponse = false;
                this.game.camera.dialogue.currentQuestionIndex = null;
                this.game.camera.dialogue.askingFollowUp = false;
                this.game.camera.dialogue.typeTimer = 0;
            }
        } else {
            // already played intro -> skip straight to game without dialogue
            this.game.camera.dialogueActive = false;
        }
    }

    handleClicks(x, y) {
        const w = this.game.ctx.canvas.width;
        const h = this.game.ctx.canvas.height;
        const centerX = w / 2 - this.btnW / 2;
        const centerY = h / 2;

        if (this.state === "START") {
            // block clicks until intro animation finishes
            if (!this.introDone) return;

            const cy = centerY + 20;
            if (this.checkBounds(x, y, centerX, cy - 40, this.btnW, this.btnH)) { // modification: check if we are resuming
                // if intro has been played skip story text -> go straight to game
                const cam = this.game.camera;
                if (cam && (cam.stuartIntroPlayed || cam.loreCompleted)) {
                    this.startGame();
                } else {
                    // otherwise play story lines
                    this.state = "STORY";
                    this.currentLine = 0;
                    this.displayText = "";
                    this.charIndex = 0;
                }
            }
            // --- TUTORIAL BUTTON ---
            else if (this.checkBounds(x, y, centerX, cy - 40 + this.btnH + 10, this.btnW, this.btnH)) {
                this.state = "TUTORIAL";
            }
        } else if (this.state === "TUTORIAL") {
            if (this.checkBounds(x, y, w / 2 - this.btnW / 2, h / 2 + 200, this.btnW, this.btnH)) {
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

        // gradient background matching loading screen->used for all menu states
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#d4a0e8');
        grad.addColorStop(0.4, '#9bc4f0');
        grad.addColorStop(1, '#e8a8d0');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Draw pixel clouds for atmosphere
        this._drawMenuCloud(ctx, w * 0.12, h * 0.22, 90);
        this._drawMenuCloud(ctx, w * 0.45, h * 0.12, 70);
        this._drawMenuCloud(ctx, w * 0.82, h * 0.28, 80);
        this._drawMenuCloud(ctx, w * 0.6, h * 0.55, 55);
        this._drawMenuCloud(ctx, w * 0.22, h * 0.6, 65);

        // Draw pixel stars
        this._drawMenuStar(ctx, w * 0.3, h * 0.08, 10);
        this._drawMenuStar(ctx, w * 0.72, h * 0.06, 8);
        this._drawMenuStar(ctx, w * 0.88, h * 0.18, 12);
        this._drawMenuStar(ctx, w * 0.08, h * 0.42, 9);
        this._drawMenuStar(ctx, w * 0.55, h * 0.35, 7);

        if (this.state === "STORY") {
            this.drawStory(ctx, w, h);
        } else if (this.state === "START") {
            this.drawStartMenu(ctx, w, h);
        } else if (this.state === "TUTORIAL") {
            this.drawTutorial(ctx, w, h);
        }
    }

    drawStory(ctx, w, h) {
        // Darken the gradient slightly for text readability
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 6;

        ctx.fillStyle = "rgba(255,255,255,0.6)";
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
        ctx.restore();
    }

    drawStartMenu(ctx, w, h) {
        const phase = this.introPhase;
        const t = this.introTimer;

        // Easing helpers
        const easeOut = (v) => 1 - (1 - v) * (1 - v);
        const easeOutBack = (v) => { const c = 1.7; return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2); };
        const easeOutCubic = (v) => 1 - Math.pow(1 - v, 3);

        const isResume = this.game.camera && (this.game.camera.stuartIntroPlayed || this.game.camera.loreCompleted || this.game.camera.gameplayStarted);
        const startLabel = isResume ? "RESUME GAME" : "START GAME";

        const pastFade = (phase !== "FADE_LOADING");
        const pastSparkle = (phase === "POP_BUTTONS" || phase === "SLIDE_RATS" || phase === "DONE");
        const pastBtns = (phase === "SLIDE_RATS" || phase === "DONE");

        // ── Phase 1: Fade out loading screen text ──
        if (phase === "FADE_LOADING") {
            const fadeOut = 1 - easeOut(Math.min(1, t / 0.8));
            ctx.save();
            ctx.globalAlpha = fadeOut;
            ctx.fillStyle = 'white';
            ctx.font = "28px 'Press Start 2P', monospace";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Loading Game...', w / 2, h / 2 - 40);
            ctx.font = "18px 'Press Start 2P', monospace";
            ctx.fillText('+', w / 2 + 180, h / 2 - 42);
            ctx.fillText('+', w / 2 - 190, h / 2 - 38);

            const barW = 320, barH = 32;
            const barX = (w - barW) / 2, barY = h / 2;
            ctx.fillStyle = 'white';
            ctx.fillRect(barX - 4, barY - 4, barW + 8, barH + 8);
            ctx.fillStyle = '#1a0a2e';
            ctx.fillRect(barX, barY, barW, barH);
            const blockCount = 10, gap = 4;
            const innerW = barW - gap * 2;
            const blockW = (innerW / blockCount) - gap;
            for (let i = 0; i < blockCount; i++) {
                ctx.fillStyle = 'white';
                ctx.fillRect(barX + gap + i * (blockW + gap), barY + gap, blockW, barH - gap * 2);
            }
            ctx.textBaseline = 'alphabetic';
            ctx.restore();
        }

        // ── Phase 2: Slide title down ──
        let titleAlpha = 0;
        let titleOffsetY = -120;
        if (pastFade) {
            let titleT = phase === "SLIDE_TITLE" ? Math.min(1, t / 0.85) : 1;
            titleAlpha = easeOut(titleT);
            titleOffsetY = -120 * (1 - easeOutCubic(titleT));
        }

        if (titleAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = titleAlpha;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 4;
            ctx.fillStyle = "white";
            ctx.font = "72px 'Press Start 2P', Arial";
            ctx.textAlign = "center";
            ctx.fillText("RPG", w / 2, 140 + titleOffsetY);
            ctx.font = "36px 'Press Start 2P', Arial";
            ctx.fillText("RAT PLAYING GAME", w / 2, 200 + titleOffsetY);
            ctx.restore();
        }

        // ── Phase 3: Sparkle credit reveal ──
        if (phase === "SPARKLE_CREDITS" || pastSparkle) {
            // Spawn sparkles once at the start of this phase
            if (phase === "SPARKLE_CREDITS" && !this.sparklesSpawned) {
                this.sparklesSpawned = true;
                for (let i = 0; i < 40; i++) {
                    this.sparkles.push({
                        x: w / 2 + (Math.random() - 0.5) * 600,
                        y: 220 + (Math.random() - 0.5) * 40,
                        vx: (Math.random() - 0.5) * 120,
                        vy: -Math.random() * 80 - 20,
                        size: 2 + Math.random() * 4,
                        life: 0.8 + Math.random() * 0.7,
                        maxLife: 0.8 + Math.random() * 0.7,
                        color: ['#FFD700', '#FFF8DC', '#FFFACD', '#FFB6C1', '#E0BBE4'][Math.floor(Math.random() * 5)]
                    });
                }
            }

            // Draw sparkle particles
            for (const sp of this.sparkles) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, sp.life / sp.maxLife) * 0.9;
                ctx.fillStyle = sp.color;
                // Four-pointed star shape
                const s = sp.size;
                ctx.fillRect(sp.x - s / 2, sp.y - s * 1.5, s, s * 3);
                ctx.fillRect(sp.x - s * 1.5, sp.y - s / 2, s * 3, s);
                ctx.restore();
            }

            // Fade in credit text
            let creditT = phase === "SPARKLE_CREDITS" ? Math.min(1, t) : 1;
            let creditAlpha = easeOut(creditT);

            ctx.save();
            ctx.globalAlpha = creditAlpha;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 6;
            ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
            ctx.font = "14px 'Press Start 2P', Arial";
            ctx.textAlign = "center";
            ctx.fillText("by  Salima  ·  Jayda  ·  Christina  ·  Connor", w / 2, 240);
            ctx.restore();
        }

        // ── Phase 4: Pop buttons ──
        const centerX = w / 2 - this.btnW / 2;
        const centerY = h / 2 + 20;

        if (pastSparkle) {
            let btn1T = phase === "POP_BUTTONS" ? Math.min(1, t / 0.4) : 1;
            let btn1Alpha = easeOut(btn1T);
            let btn1Scale = easeOutBack(btn1T);

            ctx.save();
            ctx.globalAlpha = btn1Alpha;
            ctx.translate(w / 2, centerY - 40 + this.btnH / 2);
            ctx.scale(btn1Scale, btn1Scale);
            ctx.translate(-w / 2, -(centerY - 40 + this.btnH / 2));
            this.drawBtn(ctx, centerX, centerY - 40, startLabel, "start");
            ctx.restore();

            let btn2T = phase === "POP_BUTTONS" ? Math.min(1, Math.max(0, (t - 0.5) / 0.4)) : 1;
            let btn2Alpha = easeOut(btn2T);
            let btn2Scale = easeOutBack(btn2T);
            const btn2Y = centerY - 40 + this.btnH + 10;

            ctx.save();
            ctx.globalAlpha = btn2Alpha;
            ctx.translate(w / 2, btn2Y + this.btnH / 2);
            ctx.scale(btn2Scale, btn2Scale);
            ctx.translate(-w / 2, -(btn2Y + this.btnH / 2));
            this.drawBtn(ctx, centerX, btn2Y, "TUTORIAL", "tutorial");
            ctx.restore();
        }

        // ── Phase 5: Rat portraits slide in — 1 second each, staggered ──
        if (pastBtns || phase === "SLIDE_RATS") {
            const ratData = [
                { asset: "./assets/Rat1.png", ow: 500, oh: 500, displayH: 340, anchorX: 20,  anchorY: h - 340, fromDir: "bottom", name: "Salima", stagger: 0 },
                { asset: "./assets/Rat2.png", ow: 375, oh: 666, displayH: 380, anchorX: w - 250, anchorY: h - 380, fromDir: "bottom", name: "Christina", stagger: 1.0 },
                { asset: "./assets/Rat3.png", ow: 500, oh: 500, displayH: 320, anchorX: w - 340, anchorY: 30, fromDir: "top", name: "Jayda", stagger: 2.0 },
                { asset: "./assets/Rat4.png", ow: 500, oh: 500, displayH: 320, anchorX: 20, anchorY: 60, fromDir: "top", name: "Connor", stagger: 3.0 }
            ];

            for (let i = 0; i < ratData.length; i++) {
                const rd = ratData[i];
                let ratT;
                if (phase === "SLIDE_RATS") {
                    ratT = Math.min(1, Math.max(0, (t - rd.stagger)));
                } else {
                    ratT = 1;
                }
                let ratAlpha = easeOut(ratT);

                const img = ASSET_MANAGER.getAsset(rd.asset);
                if (!img) continue;

                const aspect = rd.ow / rd.oh;
                const displayW = rd.displayH * aspect;
                let drawX = rd.anchorX;
                let drawY = rd.anchorY;

                if (rd.fromDir === "bottom") {
                    drawY = rd.anchorY + 350 * (1 - easeOutCubic(ratT));
                } else if (rd.fromDir === "top") {
                    drawY = rd.anchorY - 350 * (1 - easeOutCubic(ratT));
                }

                ctx.save();
                ctx.globalAlpha = ratAlpha;
                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                ctx.shadowBlur = 14;
                ctx.shadowOffsetY = 5;
                ctx.drawImage(img, drawX, drawY, displayW, rd.displayH);

                // Name label underneath (or above for top-corner rats)
                if (ratAlpha > 0.1) {
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                    ctx.shadowBlur = 5;
                    ctx.fillStyle = "white";
                    ctx.font = "16px 'Press Start 2P', Arial";
                    ctx.textAlign = "center";

                    if (rd.name === "Christina") {
                        ctx.fillText(rd.name, drawX + displayW / 2, drawY +50); // adjust -20 as needed
                    } else if (rd.fromDir === "bottom") {
                        ctx.fillText(rd.name, drawX + displayW / 2, drawY - 10);
                    } else {
                        ctx.fillText(rd.name, drawX + displayW / 2, drawY + rd.displayH + 22);
                    }

                }

                ctx.restore();
            }
        }
    }

    drawTutorial(ctx, w, h) {
        // Darken background for readability
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;

        ctx.fillStyle = "white";
        ctx.font = "30px 'Press Start 2P', Arial";
        ctx.textAlign = "center";
        ctx.fillText("GUIDE for the Chosen One", w / 2, h / 2 - 210);

        ctx.font = "20px Arial";
        ctx.fillText("Interact: Press E", w / 2, h / 2 - 150);
        ctx.fillText("Movement: WASD or Arrow Keys", w / 2, h / 2 - 100);
        ctx.fillText("Sprint: Press SHIFT to toggle", w / 2, h / 2 - 50);
        ctx.fillText("Bite: Press SPACE ", w / 2, h / 2);
        ctx.fillText("Poison: Press 1", w / 2, h / 2 + 50);
        ctx.fillText("Tail Whip: Press 2", w / 2, h / 2 + 100);
        ctx.fillText("When the dashed circle appears around an enemy,", w / 2, h / 2 + 135);
        ctx.fillText("Tail Whip is in the appropriate distance to be used.", w / 2, h / 2 + 160);

        ctx.restore();

        this.drawBtn(ctx, w / 2 - this.btnW / 2, h / 2 + 200, "BACK", "back");
    }

    _drawMenuCloud(ctx, x, y, size) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        const s = size / 5;
        ctx.fillRect(x - s * 2, y, s * 4, s * 2);
        ctx.fillRect(x - s * 3, y + s, s * 6, s);
        ctx.fillRect(x - s, y - s, s * 2, s);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(x - s * 4, y + s * 0.5, s, s);
        ctx.fillRect(x + s * 3, y + s * 0.5, s, s);
    }

    _drawMenuStar(ctx, x, y, size) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const s = size / 4;
        ctx.fillRect(x - s / 2, y - s * 2, s, s * 4);
        ctx.fillRect(x - s * 2, y - s / 2, s * 4, s);
    }

    drawBtn(ctx, x, y, text, btnId) {
        const isHovered = this.hoveredBtn === btnId;
        const isPressed = this.pressedBtn === btnId;

        // Background: darker on press, baby pink on hover, default dark
        if (isPressed) {
            ctx.fillStyle = "rgba(180, 60, 100, 0.7)";
        } else if (isHovered) {
            ctx.fillStyle = "rgba(255, 182, 210, 0.55)";
        } else {
            ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        }
        ctx.fillRect(x, y, this.btnW, this.btnH);

        // Border: brighter on hover
        if (isPressed) {
            ctx.strokeStyle = "rgba(255, 130, 180, 1)";
            ctx.lineWidth = 4;
        } else if (isHovered) {
            ctx.strokeStyle = "rgba(255, 200, 220, 0.95)";
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 3;
        }
        ctx.strokeRect(x, y, this.btnW, this.btnH);

        ctx.fillStyle = "white";
        ctx.font = "20px 'Press Start 2P', Arial";
        ctx.textAlign = "center";

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(text, x + this.btnW / 2, y + this.btnH / 2 + 8);
        ctx.restore();
    }
}