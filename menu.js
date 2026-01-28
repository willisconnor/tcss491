// Jayda
class Menu {
    constructor(game) {
        this.game = game;
        // Center button on 1024x768 canvas
        this.playBtn = { x: 412, y: 350, w: 200, h: 60 };
    }

    update() {
        if (this.game.click) {
            const mouseX = this.game.click.x;
            const mouseY = this.game.click.y;

            // Check if Play Button is clicked
            if (mouseX >= this.playBtn.x && mouseX <= this.playBtn.x + this.playBtn.w &&
                mouseY >= this.playBtn.y && mouseY <= this.playBtn.y + this.playBtn.h) {
                
                this.game.camera.menuActive = false; // Turn off menu in SceneManager
                this.game.click = null; 
            }
        }
    }

    draw(ctx) {
        // Background
        ctx.fillStyle = "#2c2c2c"; 
        ctx.fillRect(0, 0, 1024, 768);

        // Title
        ctx.font = "60px 'Arial'";
        ctx.fillStyle = "#ffcc00"; // Cheese yellow
        ctx.textAlign = "center";
        ctx.fillText("RAT PLAYING GAME", 512, 250);

        // Play Button Box
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        ctx.strokeRect(this.playBtn.x, this.playBtn.y, this.playBtn.w, this.playBtn.h);

        // Play Button Text
        ctx.font = "30px 'Arial'";
        ctx.fillStyle = "white";
        ctx.fillText("PLAY GAME", 512, 390);
        
        // Exit Instructions
        ctx.font = "18px 'Arial'";
        ctx.fillText("Press Refresh to Exit", 512, 500);
    }
}

    draw(ctx) {
        if (!this.active) return;

        // 1. Draw Background
        ctx.fillStyle = "#4a4a4a"; // Rat-gray background
        ctx.fillRect(0, 0, 1024, 768);

        // 2. Draw Title
        ctx.font = "50px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("RAT PLAYING GAME", 512, 200);

        // 3. Draw Play Button
        ctx.fillStyle = "#ffcc00"; // Cheese yellow!
        ctx.fillRect(this.playBtn.x, this.playBtn.y, this.playBtn.w, this.playBtn.h);
        
        // 4. Button Text
        ctx.font = "30px Arial";
        ctx.fillStyle = "black";
        ctx.fillText("PLAY", this.playBtn.x + (this.playBtn.w / 2), this.playBtn.y + 40);
    }
}