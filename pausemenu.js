class PauseMenu {
    constructor(game) {
        this.game = game;
        this.btnW = 240;
        this.btnH = 60;
    }

    update() {
        if (this.game.click) {
            const w = this.game.ctx.canvas.width;
            const h = this.game.ctx.canvas.height;
            const centerX = w / 2 - this.btnW / 2;
            const centerY = h / 2;

            const mouseX = this.game.click.x;
            const mouseY = this.game.click.y;

            // RESUME Button
            if (mouseX >= centerX && mouseX <= centerX + this.btnW &&
                mouseY >= centerY - 40 && mouseY <= centerY - 40 + this.btnH) {
                this.game.camera.paused = false;
            }

            // EXIT TO MAIN MENU Button
            if (mouseX >= centerX && mouseX <= centerX + this.btnW &&
                mouseY >= centerY + 40 && mouseY <= centerY + 40 + this.btnH) {
                this.game.camera.paused = false;
                this.game.camera.menuActive = true; 
                this.game.camera.menu.state = "START"; // Ensure the menu itself resets
                this.game.camera.state = 0; // State 0 is your Main Menu
            }
            this.game.click = null;
        }
    }

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Darken the game background
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 60px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", w / 2, h / 2 - 120);

        const centerX = w / 2 - this.btnW / 2;
        const centerY = h / 2;

        this.drawBtn(ctx, centerX, centerY - 40, "RESUME");
        this.drawBtn(ctx, centerX, centerY + 40, "MAIN MENU");
    }

    drawBtn(ctx, x, y, label) {
        ctx.fillStyle = "#5d4037"; // Wooden Brown
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 3;
        ctx.fillRect(x, y, this.btnW, this.btnH);
        ctx.strokeRect(x, y, this.btnW, this.btnH);

        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 24px 'Courier New'";
        ctx.fillText(label, x + this.btnW / 2, y + this.btnH / 2 + 8);
    }
}