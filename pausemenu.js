class PauseMenu {
    constructor(game) {
        this.game = game;
        this.btnW = 240;
        this.btnH = 60;

        // Volume slider properties
        this.sliderX = 0; 
        this.sliderY = 0; 
        this.sliderWidth = 180; 
        this.sliderHeight = 20;
        this.isDragging = false;

        // Menu states
        this.soundSettingsOpen = false;
        this.tutorialOpen = false; // New state for the tutorial
    }

    update() {
        if (this.game.click) {
            const mouseX = this.game.click.x;
            const mouseY = this.game.click.y;
            const w = this.game.ctx.canvas.width;
            const h = this.game.ctx.canvas.height;
            const centerX = w / 2 - this.btnW / 2;
            const centerY = h / 2;

            if (this.soundSettingsOpen) {
                this.sliderX = centerX + 20;
                this.sliderY = centerY;

                // Check slider drag area
                if (mouseX >= this.sliderX && mouseX <= this.sliderX + this.sliderWidth &&
                    mouseY >= this.sliderY - 15 && mouseY <= this.sliderY + this.sliderHeight + 15) {
                    this.isDragging = true;
                    this.updateVolume(mouseX);
                    this.game.click = null;
                    return;
                }

                // Checkbox area
                const cbX = this.sliderX;
                const cbY = this.sliderY + 40;
                const cbSize = 24;
                const cbLabelW = 200;
                if (mouseX >= cbX && mouseX <= cbX + cbSize + cbLabelW &&
                    mouseY >= cbY && mouseY <= cbY + cbSize) {
                    this.game.audio.toggleMute();
                    this.game.click = null;
                    return;
                }

                // BACK button
                if (mouseX >= centerX && mouseX <= centerX + this.btnW &&
                    mouseY >= centerY + 120 && mouseY <= centerY + 120 + this.btnH) {
                    this.soundSettingsOpen = false;
                    this.game.click = null;
                    return;
                }
            } else if (this.tutorialOpen) {
                // BACK button for Tutorial Menu
                if (mouseX >= centerX && mouseX <= centerX + this.btnW &&
                    mouseY >= centerY + 160 && mouseY <= centerY + 160 + this.btnH) {
                    this.tutorialOpen = false;
                    this.game.click = null;
                    return;
                }
            } else {
                // Normal pause menu interactions with updated Y coordinates for 4 buttons
                
                // RESUME Button
                if (mouseX >= centerX && mouseX <= centerX + this.btnW &&
                    mouseY >= centerY - 100 && mouseY <= centerY - 100 + this.btnH) {
                    this.game.camera.paused = false;
                    this.isDragging = false;
                    this.soundSettingsOpen = false;
                    this.tutorialOpen = false;
                }

                // TUTORIAL Button
                else if (mouseX >= centerX && mouseX <= centerX + this.btnW &&
                    mouseY >= centerY - 20 && mouseY <= centerY - 20 + this.btnH) {
                    this.tutorialOpen = true;
                }

                // SOUND SETTINGS Button
                else if (mouseX >= centerX && mouseX <= centerX + this.btnW &&
                    mouseY >= centerY + 60 && mouseY <= centerY + 60 + this.btnH) {
                    this.soundSettingsOpen = true;
                }

                // MAIN MENU Button
                else if (mouseX >= centerX && mouseX <= centerX + this.btnW &&
                    mouseY >= centerY + 140 && mouseY <= centerY + 140 + this.btnH) {
                    
                    this.game.camera.paused = false;
                    this.game.paused = false;
                    this.game.camera.dialogueActive = false;
                    this.game.typing = false;
                    
                    if (this.game.camera.dialogue) {
                        this.game.camera.dialogue.displayText = "";
                        this.game.camera.dialogue.charIndex = 0;
                        this.game.camera.dialogue.typeTimer = 0;
                        this.game.camera.dialogue.currentQuestionIndex = null;
                        this.game.camera.dialogue.displayingChoiceResponse = false;
                    }
                    this.game.camera.preDialogueActive = false;
                    this.game.camera._dialogueWasActive = false;

                    // Pause music (don't destroy it) so we can resume later
                    if (this.game.audio.currentMusic) {
                        this.game.audio.currentMusic.pause();
                    }

                    this.game.camera.menuActive = true;
                    this.game.camera.menu.state = "START";
                    // Reset menu intro so it doesn't replay the full animation on return
                    this.game.camera.menu.introDone = true;
                    this.game.camera.menu.introPhase = "DONE";
                    this.isDragging = false;
                    this.soundSettingsOpen = false;
                    this.tutorialOpen = false;
                }
            }
            this.game.click = null;
        }

        if (!this.game.keys["MouseDown"]) {
            this.isDragging = false;
        }
    }

    updateVolume(mouseX) {
        let volume = (mouseX - this.sliderX) / this.sliderWidth;
        volume = Math.max(0, Math.min(1, volume)); 
        this.game.audio.setVolume(volume);
    }

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, w, h);

        const centerX = w / 2 - this.btnW / 2;
        const centerY = h / 2;

        if (this.soundSettingsOpen) {
            this.drawSoundSettingsMenu(ctx, centerX, centerY);
        } else if (this.tutorialOpen) {
            this.drawTutorialMenu(ctx, centerX, centerY);
        } else {
            ctx.fillStyle = "#ffcc00";
            ctx.font = "bold 60px 'Courier New'";
            ctx.textAlign = "center";
            ctx.fillText("PAUSED", w / 2, h / 2 - 160);

            // Re-spaced buttons
            this.drawBtn(ctx, centerX, centerY - 100, "RESUME");
            this.drawBtn(ctx, centerX, centerY - 20, "TUTORIAL");
            this.drawBtn(ctx, centerX, centerY + 60, "SOUND SETTINGS");
            this.drawBtn(ctx, centerX, centerY + 140, "MAIN MENU");
        }
    }

    drawTutorialMenu(ctx, centerX, centerY) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        ctx.fillStyle = "white";
        ctx.font = "30px 'Press Start 2P', Arial";
        ctx.textAlign = "center";
        ctx.fillText("GUIDE for the Chosen One", w / 2, h / 2 - 210);

        ctx.font = "20px Arial";
        ctx.fillText("Interact: Press E", w / 2, h / 2 - 150);
        ctx.fillText("Movement: WASD or Arrow Keys", w / 2, h / 2 - 100);
        ctx.fillText("Sprint: Hold SHIFT", w / 2, h / 2 - 50);
        ctx.fillText("Bite: Press SPACE ", w / 2, h / 2);
        ctx.fillText("Poison: Press 1", w / 2, h / 2 + 50);
        ctx.fillText("Tail Whip: Press 2", w / 2, h / 2 + 100);

        this.drawBtn(ctx, centerX, centerY + 160, "BACK");
    }

    drawSoundSettingsMenu(ctx, centerX, centerY) {
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 60px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("SOUND SETTINGS", ctx.canvas.width / 2, centerY - 120);

        this.sliderX = centerX + 20;
        this.sliderY = centerY;
        this.drawSoundSettings(ctx);

        this.drawBtn(ctx, centerX, centerY + 120, "BACK");
    }

    drawSoundSettings(ctx) {
        const volume = this.game.audio.volume;
        const isMuted = this.game.audio.muted;
        
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.fillText("VOLUME", this.sliderX, this.sliderY - 8);

        ctx.fillStyle = "#333333";
        ctx.fillRect(this.sliderX, this.sliderY, this.sliderWidth, this.sliderHeight);

        ctx.fillStyle = this.isDragging ? "#ffff00" : "#ffcc00";
        ctx.fillRect(this.sliderX, this.sliderY, this.sliderWidth * volume, this.sliderHeight);

        const knobX = this.sliderX + this.sliderWidth * volume;
        ctx.fillStyle = this.isDragging ? "#ffff00" : "white";
        ctx.beginPath();
        ctx.arc(knobX, this.sliderY + this.sliderHeight / 2, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`${Math.round(volume * 100)}%`, this.sliderX, this.sliderY + 35);

        const cbX = this.sliderX;
        const cbY = this.sliderY + 40;
        const cbSize = 24;

        ctx.fillStyle = "#222";
        ctx.fillRect(cbX, cbY, cbSize, cbSize);
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 2;
        ctx.strokeRect(cbX, cbY, cbSize, cbSize);

        if (isMuted) {
            ctx.strokeStyle = "#ffcc00";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cbX + 5, cbY + cbSize / 2);
            ctx.lineTo(cbX + cbSize / 2 - 2, cbY + cbSize - 6);
            ctx.lineTo(cbX + cbSize - 4, cbY + 6);
            ctx.stroke();
        }

        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Mute sound", cbX + cbSize + 10, cbY + cbSize - 6);
    }

    drawBtn(ctx, x, y, label) {
        ctx.fillStyle = "#5d4037";
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 3;
        ctx.fillRect(x, y, this.btnW, this.btnH);
        ctx.strokeRect(x, y, this.btnW, this.btnH);

        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 24px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText(label, x + this.btnW / 2, y + this.btnH / 2 + 8);
    }
}