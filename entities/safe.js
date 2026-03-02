class Safe {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 100;
        this.height = 100;
        this.isOpen = false;
        
        this.updateBB();
    }

    updateBB() {
        this.BB = new BoundingBox(this.x, this.y, this.width, this.height);
    }

    // Called externally by the Keypad when the correct code is entered
    openSafe() {
        if (!this.isOpen) {
            this.isOpen = true;
            // Optional: Play a victory sound! 
            // this.game.audio.playMusic("./assets/victory_fanfare.mp3"); 
        }
    }

    update() {
        // The safe itself is static and waits for the keypad to act upon it.
    }

    draw(ctx) {
        ctx.save();
        
        // Draw the main safe box
        ctx.fillStyle = "#555555";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = "#222222";
        ctx.lineWidth = 4;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        if (this.isOpen) {
            // Dark interior
            ctx.fillStyle = "#111111";
            ctx.fillRect(this.x + 10, this.y + 10, this.width - 20, this.height - 20);
            
            // The Golden Wheel
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // Add a glowing effect to the cheese
            ctx.shadowColor = "gold";
            ctx.shadowBlur = 15;
            ctx.stroke();
        } else {
            // Draw a closed vault door and handle
            ctx.fillStyle = "#777777";
            ctx.fillRect(this.x + 10, this.y + 10, this.width - 20, this.height - 20);
            
            ctx.fillStyle = "#333333";
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}