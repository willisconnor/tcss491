class HeartContainer {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.collected = (game.camera && game.camera.heartContainerUsed) || false;        this.showPopup = false;
        this.selectedOption = 0; // 0 = yes, 1 = no
        this.navCooldown = 0;

        this.sprite = ASSET_MANAGER.getAsset("./assets/hearts.png");
        this.frameWidth = 200;
        this.frameHeight = 200;
        this.scale = 0.3;
        this.drawW = this.frameWidth * this.scale;
        this.drawH = this.frameHeight * this.scale;

        this.pulseTime = 0;
        this.pulseSpeed = 2;

        this.updateBB();
        if (this.collected) this.removeFromWorld = true;
    }

    updateBB() {
        this.BB = new BoundingBox(this.x, this.y, this.drawW, this.drawH);
        this.interactBox = new BoundingBox(this.x - 40, this.y - 40, this.drawW + 80, this.drawH + 80);
    }

    update() {
        if (this.collected) return;

        this.pulseTime += this.game.clockTick * this.pulseSpeed;
        const pulsedScale = this.scale + Math.sin(this.pulseTime) * 0.02;
        this.drawW = this.frameWidth * pulsedScale;
        this.drawH = this.frameHeight * pulsedScale;
        this.updateBB();

        const rat = this.game.entities.find(e => e.constructor.name === "Rat");
        if (!rat) return;

        if (this.showPopup) {
            if (this.navCooldown > 0) this.navCooldown -= this.game.clockTick;

            const leftPressed = this.game.keys["ArrowLeft"] || this.game.keys["KeyA"];
            const rightPressed = this.game.keys["ArrowRight"] || this.game.keys["KeyD"];

            if ((leftPressed || rightPressed) && this.navCooldown <= 0) {
                this.selectedOption = leftPressed ? 0 : 1;
                this.navCooldown = 0.2;
            }

            if (this.game.keys["Space"]) {
                this.game.keys["Space"] = false;
                if (this.selectedOption === 0) {
                    // yes — collect
                    this.collected = true;
                    this.game.camera.heartContainerUsed = true;
                    this.game.camera.ratLives = 4;
                    this.game.camera.maxLives = 4;
                    const r = this.game.entities.find(e => e.constructor.name === "Rat");
                    if (r) r.health = r.maxHealth;
                    this.removeFromWorld = true;
                }
                // no — just close
                this.showPopup = false;
                this.game.paused = false;
            }
            return;
        }

        if (!this.game.paused && this.interactBox.collide(rat.BB) && this.game.keys["KeyE"]) {
            this.game.keys["KeyE"] = false;
            InteractionFX.triggerShockwave(this.x + this.drawW / 2, this.y + this.drawH / 2, "#ff69b4");
            this.showPopup = true;
            this.selectedOption = 0;
            this.navCooldown = 0.3;
            this.game.paused = true;
        }
    }

    drawUI(ctx) {
        if (!this.showPopup || this.collected) return;

        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        ctx.save();
        ctx.resetTransform();

        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, w, h);

        const boxW = 580;
        const boxH = 310;
        const boxX = w / 2 - boxW / 2;
        const boxY = h / 2 - boxH / 2;

        // outer double border
        ctx.fillStyle = "#4a0030";
        ctx.fillRect(boxX - 7, boxY - 7, boxW + 14, boxH + 14);
        ctx.fillStyle = "#ff9ec8";
        ctx.fillRect(boxX - 3, boxY - 3, boxW + 6, boxH + 6);

        // pastel pink background
        ctx.fillStyle = "#ffe0f0";
        ctx.fillRect(boxX, boxY, boxW, boxH);

        // inner border
        ctx.strokeStyle = "#c0507a";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(boxX + 8, boxY + 8, boxW - 16, boxH - 16);
        ctx.setLineDash([]);

        // title
        ctx.fillStyle = "#ff6ba8";
        ctx.font = "bold 20px 'Press Start 2P', Courier";
        ctx.textAlign = "center";
        ctx.fillText("\u2665 HEART CONTAINER \u2665", w / 2, boxY + 52);

        // message
        ctx.fillStyle = "#5a0030";
        ctx.font = "10px 'Press Start 2P', Courier";
        ctx.fillText("Fully restores your health and raises", w / 2, boxY + 100);
        ctx.fillText("max lives to 4. Be strategic!!", w / 2, boxY + 122);
        ctx.fillText("Use it now or save it for later?", w / 2, boxY + 144);

        // yes / no buttons
        const btnW = 120;
        const btnH = 52;
        const yesX = w / 2 - 140;
        const noX  = w / 2 + 20;
        const btnY = boxY + 200;

        ["yes", "no"].forEach((label, i) => {
            const bx = i === 0 ? yesX : noX;
            const selected = this.selectedOption === i;

            ctx.fillStyle = selected ? "#ff9ec8" : "#f0b0d0";
            ctx.fillRect(bx, btnY, btnW, btnH);

            ctx.strokeStyle = selected ? "#ff1493" : "#c0507a";
            ctx.lineWidth = 3;
            if (selected) ctx.setLineDash([6, 3]);
            else ctx.setLineDash([]);
            ctx.strokeRect(bx, btnY, btnW, btnH);
            ctx.setLineDash([]);

            ctx.fillStyle = selected ? "#5a0030" : "#8a3060";
            ctx.font = "bold 14px 'Press Start 2P', Courier";
            ctx.textAlign = "center";
            ctx.fillText(label, bx + btnW / 2, btnY + btnH / 2 + 6);
        });

        // hint
        ctx.fillStyle = "#c0507a";
        ctx.font = "8px 'Press Start 2P', Courier";
        ctx.fillText("A/D or arrows to choose  |  SPACE to confirm", w / 2, boxY + boxH - 15);

        ctx.restore();
    }

    draw(ctx) {
        if (this.collected) return;

        ctx.save();
        ctx.drawImage(
            this.sprite,
            0, 0, this.frameWidth, this.frameHeight,
            this.x, this.y, this.drawW, this.drawH
        );
        ctx.restore();

        const rat = this.game.entities.find(e => e.constructor.name === "Rat");
        if (rat && this.interactBox.collide(rat.BB) && !this.game.paused) {
            InteractionFX.drawImageGlow(ctx, this.sprite, 0, 0, this.frameWidth, this.frameHeight, this.x, this.y, this.drawW, this.drawH, "#ff69b4");
        }
    }
}