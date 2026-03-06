class GoldenKey {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.scale = 0.1; // scale down from 500x500 golden key png :0
        this.baseScale = 0.1;
        this.pulseSpeed = 2;
        this.pulseAmount = 0.02;
        this.pulseTime = 0;
        this.collected = false;
        this.showMessage = false;

        this.sprite = ASSET_MANAGER.getAsset("./assets/goldenkey.png");
        this.width = this.sprite.width * this.scale;
        this.height = this.sprite.height * this.scale;
    }

    update() {
        // 1. If we already have it, wait for Space to unpause


        if (this.collected) return;

        // 2. Animation logic
        this.pulseTime += this.game.clockTick * this.pulseSpeed;
        this.scale = this.baseScale + Math.sin(this.pulseTime) * this.pulseAmount;
        this.width = this.sprite.width * this.scale;
        this.height = this.sprite.height * this.scale;

        // 3. Collision Logic
        for (let i = 0; i < this.game.entities.length; i++) {
            let ent = this.game.entities[i];
            // Find the player (Rat)
            if (ent.constructor.name === "Rat") {
                // Check collision using the Rat's width/height or its BoundingBox if it has one
                let ratW = ent.width || 50;
                let ratH = ent.height || 50;
                if (this.x < ent.x + ratW && this.x + this.width > ent.x && this.y < ent.y + ratH && this.y + this.height > ent.y) {
                    this.collected = true;

                    // this saves "collected" state to SceneManager (Camera)
                    // so Door knows we have key even after object is removed
                    this.game.camera.hasGoldenKey = true;

                    const keyMessages = [
                        ["A BABY gate? They really thought that'd stop you?", "Adorable. Key acquired, gate's absolutely cooked."],
                        ["Snatched the key! Time to crash that embarrassing", "baby gate like the feral menace you truly are."],
                        ["This key unlocks the BABY GATE. You are one step", "closer to getting that golden wheel of cheese."],
                        ["Key secured. Go show that baby gate who runs", "these walls, you absolute little basement legend."],
                        ["Picked up the key! That sad little baby gate", "doesn't stand a chance against you. Destroy it."]
                    ];
                    const msg = keyMessages[Math.floor(Math.random() * keyMessages.length)];
                    let sm = this.game.camera;
                    sm.itemPopupText = msg;
                    sm.itemPopupActive = true;
                    this.game.paused = true;
                    this.game.keys["Space"] = false;

                    let dingRaw = ASSET_MANAGER.getAsset("./assets/ding.wav");
                    if (dingRaw) {
                        let dingSound = dingRaw.cloneNode();
                        dingSound.volume = 0.2;
                        dingSound.play().catch(e => console.error(e));
                    }
                    this.removeFromWorld = true;
                }
            }
        }
    }

    rectCollide(boxA, boxB) {
        return boxA.x < boxB.x + boxB.width && boxA.x + boxA.width > boxB.x && boxA.y < boxB.y + boxB.height && boxA.y + boxA.height > boxB.y;
    }

    draw(ctx) {
        // draw the key in world coordinates, moves with map
        if (!this.collected) {
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        }
    }
}