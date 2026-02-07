class PauseMenu {
    constructor(game) {
        this.game = game;
        this.btnW = 240;
        this.btnH = 60;

        // Volume slider properties
        this.sliderX = 0; // Will be calculated in draw
        this.sliderY = 0; // Will be calculated in draw
        this.sliderWidth = 180; // Slightly smaller to fit with checkbox
        this.sliderHeight = 20;
        this.isDragging = false;

        // Sound settings state
        this.soundSettingsOpen = false;
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
                // Keep slider coords in sync with draw so clicks register
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

                // Checkbox area (includes label click)
                const cbX = this.sliderX;
                const cbY = this.sliderY + 40;
                const cbSize = 24;
                const cbLabelW = 200; // clickable area to the right for the label
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
            } else {
                // Normal pause menu interactions
                // RESUME Button
                if (mouseX >= centerX && mouseX <= centerX + this.btnW &&
                    mouseY >= centerY && mouseY <= centerY + this.btnH) {
                    this.game.camera.paused = false;
                    this.isDragging = false;
                    this.soundSettingsOpen = false;
                }

                // SOUND SETTINGS Button
                else if (mouseX >= centerX && mouseX <= centerX + this.btnW &&
                    mouseY >= centerY + 80 && mouseY <= centerY + 80 + this.btnH) {
                    this.soundSettingsOpen = true;
                }

                // MAIN MENU Button
                else if (mouseX >= centerX && mouseX <= centerX + this.btnW &&
                    mouseY >= centerY + 160 && mouseY <= centerY + 160 + this.btnH) {
                    // Clear any active dialogue or pre-dialogue to avoid stuck state
                    this.game.camera.paused = false;
                    this.game.paused = false;
                    this.game.camera.dialogueActive = false;
                    this.game.typing = false;
                    // clear dialogue buffers
                    if (this.game.camera.dialogue) {
                        this.game.camera.dialogue.displayText = "";
                        this.game.camera.dialogue.charIndex = 0;
                        this.game.camera.dialogue.typeTimer = 0;
                        this.game.camera.dialogue.currentQuestionIndex = null;
                        this.game.camera.dialogue.displayingChoiceResponse = false;
                    }
                    // stop pre-dialogue state
                    this.game.camera.preDialogueActive = false;
                    this.game.camera._dialogueWasActive = false;

                    this.game.camera.menuActive = true;
                    this.game.camera.menu.state = "START";
                    this.isDragging = false;
                    this.soundSettingsOpen = false;
                }
            }
            this.game.click = null;
        }

        // Stop dragging when mouse is released
        if (!this.game.keys["MouseDown"]) {
            this.isDragging = false;
        }
    }

    updateVolume(mouseX) {
        // Calculate volume from slider position (0 to 1)
        let volume = (mouseX - this.sliderX) / this.sliderWidth;
        volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
        this.game.audio.setVolume(volume);
    }

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Darken the game background
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, w, h);

        const centerX = w / 2 - this.btnW / 2;
        const centerY = h / 2;

        if (this.soundSettingsOpen) {
            // Sound settings menu
            this.drawSoundSettingsMenu(ctx, centerX, centerY);
        } else {
            // Normal pause menu
            ctx.fillStyle = "#ffcc00";
            ctx.font = "bold 60px 'Courier New'";
            ctx.textAlign = "center";
            ctx.fillText("PAUSED", w / 2, h / 2 - 120);

            this.drawBtn(ctx, centerX, centerY, "RESUME");
            this.drawBtn(ctx, centerX, centerY + 80, "SOUND SETTINGS");
            this.drawBtn(ctx, centerX, centerY + 160, "MAIN MENU");
        }
    }

    drawSoundSettingsMenu(ctx, centerX, centerY) {
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 60px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("SOUND SETTINGS", ctx.canvas.width / 2, centerY - 120);

        // Draw volume slider
        this.sliderX = centerX + 20;
        this.sliderY = centerY;
        this.drawSoundSettings(ctx);

        // Back button
        this.drawBtn(ctx, centerX, centerY + 120, "BACK");
    }

    drawSoundSettings(ctx) {
        const volume = this.game.audio.volume;
        const isMuted = this.game.audio.muted;
        
        // Label
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.fillText("VOLUME", this.sliderX, this.sliderY - 8);

        // Background track
        ctx.fillStyle = "#333333";
        ctx.fillRect(this.sliderX, this.sliderY, this.sliderWidth, this.sliderHeight);

        // Filled track
        ctx.fillStyle = this.isDragging ? "#ffff00" : "#ffcc00";
        ctx.fillRect(this.sliderX, this.sliderY, this.sliderWidth * volume, this.sliderHeight);

        // Slider knob
        const knobX = this.sliderX + this.sliderWidth * volume;
        ctx.fillStyle = this.isDragging ? "#ffff00" : "white";
        ctx.beginPath();
        ctx.arc(knobX, this.sliderY + this.sliderHeight / 2, 8, 0, Math.PI * 2);
        ctx.fill();

        // Knob outline
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Volume percentage
        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`${Math.round(volume * 100)}%`, this.sliderX, this.sliderY + 35);

        // Mute checkbox (styled like a checkbox with label under the slider)
        const cbX = this.sliderX;
        const cbY = this.sliderY + 40;
        const cbSize = 24;

        // Checkbox background
        ctx.fillStyle = "#222";
        ctx.fillRect(cbX, cbY, cbSize, cbSize);
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 2;
        ctx.strokeRect(cbX, cbY, cbSize, cbSize);

        // Checkmark if muted
        if (isMuted) {
            ctx.strokeStyle = "#ffcc00";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cbX + 5, cbY + cbSize / 2);
            ctx.lineTo(cbX + cbSize / 2 - 2, cbY + cbSize - 6);
            ctx.lineTo(cbX + cbSize - 4, cbY + 6);
            ctx.stroke();
        }

        // Label next to checkbox
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