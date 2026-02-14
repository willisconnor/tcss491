class SceneManager {
    constructor(game) {
        this.game = game;
        this.game.camera = this;

        // camera coordinates
        this.x = 0;
        this.y = 0;

        // map scale
        this.scale = 6;

        // camera zoom preferred by team
        this.zoom = 1.25;

        this.fadeAlpha = 1;
        this.isFading = true;

        // track music
        this.currentMusicPath = "./assets/background_music.wav";

        this.yorkieDefeated = false;
        this.stuartIntroPlayed = false;
        this.storyState = "STUART_TALK";

        this.preDialogueActive = false;
        this.preDialogueTimer = 0;
        this.preDialogueDuration = 0; //How long before Stuart starts speaking (if we wanted to implement an exclamation or other intro)
        this._dialogueWasActive = false;
        this.paused = false;
        this.pauseMenu = new PauseMenu(this.game);

        this.menuActive = true;
        this.menu = new Menu(this.game);
        this.dialogueActive = false;
        this.dialogue = new Dialogue(this.game, this);

        this.level = ASSET_MANAGER.getAsset("./assets/Level1LivingRoom.json");
        // Load spritesheet
        this.spritesheet = ASSET_MANAGER.getAsset("./assets/global.png");

        // optimization: Cache the map b/c sprites were laggy :(
        this.mapCached = false;
        this.mapCanvas = document.createElement('canvas');
        this.mapCtx = this.mapCanvas.getContext('2d');
        // disable smoothing on the offscreen canvas to prevent blur
        this.mapCtx.imageSmoothingEnabled = false;

        this.worldWidth = 0;
        this.worldHeight = 0;

        if (this.game.collisionManager) {
            this.game.collisionManager.loadFromTiledJSON(this.level);
        }

        // minimap constants
        this.minimapWidth = 250;
        this.minimapMargin = 10;
    }

    update() {

        // audio UI input logic
        if (this.game.click) {
            const mouseX = this.game.click.x;
            const mouseY = this.game.click.y;

            // calculate dynamic UI positions to match drawOverlays
            const aspect = this.worldWidth > 0 ? this.worldHeight / this.worldWidth : 0.5;
            const mapH = this.minimapWidth * aspect;

            // mute Button Dimensions
            const muteW = 60;
            const muteH = 30;

            // mute Button Coords; Bottom RIGHT of Minimap
            // X = Right edge of canvas - margin - button width
            const muteX = this.game.ctx.canvas.width - this.minimapMargin - muteW;
            const muteY = this.minimapMargin + mapH + 10; // 10px padding below map

            // collision check
            if (mouseX >= muteX && mouseX <= muteX + muteW && mouseY >= muteY && mouseY <= muteY + muteH) {
                this.game.audio.toggleMute();
                this.game.click = null;
                return;
            }
        }
        // 1. Toggle pause or skip menu with Escape
        if (this.game.keys["Escape"]) {
            this.game.keys["Escape"] = false;
            if (this.menuActive) {
                // If in intro/tutorial, ESC returns to Start Menu
                if (this.menu.state === "STORY" || this.menu.state === "TUTORIAL") {
                    this.menu.state = "START";
                }
            } else {
                // Toggle pause during gameplay
                this.paused = !this.paused;
                if (!this.paused) this.game.paused = false;
            }
        }
        // sync game.paused with SceneManager states
        // if we are in ESC Pause or Dialogue force GameEngine to pause
        if (this.paused || this.dialogueActive) {
            this.game.paused = true;
        }

        // If dialogue was triggered (e.g., from Menu) and it's the Stuart intro, intercept
        if (this.dialogueActive && this.storyState === "STUART_TALK" && !this.preDialogueActive && !this._dialogueWasActive && !this.stuartIntroPlayed) {
            this.preDialogueActive = true;
            this.preDialogueTimer = this.preDialogueDuration;
            // prevent Dialogue from running immediately
            this.dialogueActive = false;
            this._dialogueWasActive = true;

            // lock facings and freeze movement for involved entities
            let rat = this.game.entities.find(e => e.constructor.name === "Rat");
            let stuart = this.game.entities.find(e => e.constructor.name === "StuartBig");
            if (rat) {
                rat.frozenForDialogue = true;
                rat.facing = 1; // look right
                rat.animator = rat.animations.get("idle")[rat.facing];
            }
            if (stuart) {
                stuart.frozenForDialogue = true;
                stuart.facing = 0; // look left
                stuart.animator = stuart.animations.get("idle")[stuart.facing];
            }
            // keep game paused while pre-dialogue runs
            this.game.paused = true;
        }
        // 2. Main Menu Logic
        if (this.menuActive) {
            this.menu.update();
            return; // Stop here so game doesn't run behind menu
        }

        // 3. Pause Menu Logic
        if (this.paused) {
            this.pauseMenu.update();
            // check if PauseMenu (Resume button) turned off pause just now
            // if it did must unpause GameEngine immediately.
            if (!this.paused) {
                this.game.paused = false;
            } else {
                return; // Still paused, stop here
            }
        }
        // 4. Dialogue Logic (Stuart Big or Key Picked Up)
        if (this.dialogueActive) {
            this.dialogue.update(); // This allows Space bar to advance text
            // world is frozen b/c we exit update early by not running the rest of the function;
            // no explicit 'return' needed if this is already the last statement
        }

        // Handle pre-dialogue cutscene that shows exclamation and zooms before dialogue starts
        if (this.preDialogueActive) {
            // decrement timer
            this.preDialogueTimer -= this.game.clockTick;
            if (this.preDialogueTimer <= 0) {
                // End pre-dialogue: start actual dialogue
                this.preDialogueActive = false;
                this.dialogueActive = true;
                // ensure game remains paused during dialogue
                this.game.paused = true;
            } else {
                // While pre-dialogue is active we don't run normal camera centering below
                return;
            }
        }

        // If we previously intercepted a dialogue and that dialogue just finished, restore state
        if (!this.dialogueActive && this._dialogueWasActive && !this.preDialogueActive) {
            // unlock entities and reset to front-facing idle
            let rat = this.game.entities.find(e => e.constructor.name === "Rat");
            let stuart = this.game.entities.find(e => e.constructor.name === "StuartBig");
            if (rat) {
                rat.frozenForDialogue = false;
                rat.facing = 2; // front-facing idle
                rat.animator = rat.animations.get("idle")[rat.facing];
            }
            if (stuart) {
                stuart.frozenForDialogue = false;
                stuart.facing = 2;
                stuart.animator = stuart.animations.get("idle")[stuart.facing];
            }
            // mark intro as played so it won't trigger again this session
            this.stuartIntroPlayed = true;
            this._dialogueWasActive = false;
        }

        // camera scrolling logic (zoomed)
        let rat = this.game.entities.find(e => e.constructor.name === "Rat");

        if (rat) {
            // viewport width in WORLD units; Screen Width / Zoom Level
            let viewW = this.game.ctx.canvas.width / this.zoom;
            let viewH = this.game.ctx.canvas.height / this.zoom;

            // center camera on Rat
            this.x = rat.x - (viewW / 2);
            this.y = rat.y - (viewH / 2);

            // clamp camera in place
            this.x = Math.max(0, Math.min(this.x, this.worldWidth - viewW));
            this.y = Math.max(0, Math.min(this.y, this.worldHeight - viewH));
        }


    }

    loadLevelOne() {
        this.game.entities.forEach(entity => {
            if (!(entity instanceof SceneManager)) entity.removeFromWorld = true;
        });

        this.level = ASSET_MANAGER.getAsset("./assets/Level1LivingRoom.json");
        this.mapCached = false;

        if (this.game.collisionManager) {
            this.game.collisionManager.loadFromTiledJSON(this.level);
        }

        // update track
        this.currentMusicPath = "./assets/background_music.wav";
        this.game.audio.playMusic(this.currentMusicPath);

        this.game.addEntity(new Rat(this.game, 448, 190));
        this.game.addEntity(new StuartBig(this.game, 200, 215, 2));

        if (!this.yorkieDefeated) {
            this.game.addEntity(new Yorkie(this.game, 320, 150));
        } else {
            // Even if defeated, we add him so he can spawn in his bed
            this.game.addEntity(new Yorkie(this.game, 320, 150));
        }

        this.game.addEntity(new Door(this.game, 448, 128, "Level2", true));

        console.log("Level 1 Loaded!");
    }

    loadLevelTwo() {
        this.game.entities.forEach(entity => {
            if (!(entity instanceof SceneManager)) entity.removeFromWorld = true;
        });

        this.level = ASSET_MANAGER.getAsset("./assets/Level2DiningRoom.json");
        this.mapCached = false;

        if (this.game.collisionManager) {
            this.game.collisionManager.loadFromTiledJSON(this.level);
        }

        // update track
        this.currentMusicPath = "./assets/Desert.mp3";
        this.game.audio.playMusic(this.currentMusicPath);

        this.game.addEntity(new Rat(this.game, 256, 160));
        this.game.addEntity(new Door(this.game, 256, 160, "Level1", false));

        console.log("Level 2 Loaded!");
    }

    draw(ctx) {
        if (this.menuActive) {
            this.menu.draw(ctx);
            return;
        }

        this.drawWorld(ctx);
        // Entities are drawn by GameEngine here
        this.drawOverlays(ctx);
    }

    drawWorld(ctx) {
        if (!this.mapCached) {
            this.buildLevelCache();
        }

        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);

        if (this.mapCached) {
            ctx.drawImage(this.mapCanvas, 0, 0);
        }
        // No restore here; GameEngine draws entities next
    }

    drawOverlays(ctx) {
        ctx.restore(); // Restore scale/translation for UI

        // --- MINIMAP ---
        this.drawMinimap(ctx);

        // --- Dialogue & Pause ---
        if (this.dialogueActive) this.dialogue.draw(ctx);
        if (this.paused) this.pauseMenu.draw(ctx);

        // --- Mute Toggle (Relative to Minimap) ---
        const aspect = this.worldHeight / this.worldWidth;
        const mapH = this.minimapWidth * aspect;
        const w = 60, h = 30, radius = h / 2;

        // Bottom RIGHT of Minimap
        const x = ctx.canvas.width - this.minimapMargin - w;
        const y = this.minimapMargin + mapH + 10;

        const isMuted = this.game.audio.muted;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.fillStyle = isMuted ? "#ccc" : "#4CD964";
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Knob
        ctx.beginPath();
        const knobX = isMuted ? x + radius : x + w - radius;
        ctx.arc(knobX, y + radius, radius - 4, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();

        // Text
        ctx.font = "bold 12px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("MUSIC", x + w / 2, y + h + 15);
        ctx.restore();

        // --- Fade Effect ---
        if (this.isFading) {
            ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            this.fadeAlpha -= 0.01;
            if (this.fadeAlpha <= 0) {
                this.fadeAlpha = 0;
                this.isFading = false;
            }
        }
    }

    drawMinimap(ctx) {
        if (!this.mapCached) return;

        // Minimap Layout
        const mapW = this.minimapWidth;
        const mapH = mapW * (this.worldHeight / this.worldWidth);
        const mapX = ctx.canvas.width - mapW - this.minimapMargin;
        const mapY = this.minimapMargin;

        // 1. Draw Background
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(mapX - 2, mapY - 2, mapW + 4, mapH + 4);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(mapX - 2, mapY - 2, mapW + 4, mapH + 4);

        // 2. Draw Cached Map
        ctx.drawImage(this.mapCanvas, mapX, mapY, mapW, mapH);

        // Constants for coordinate conversion
        const ratioX = mapW / this.worldWidth;
        const ratioY = mapH / this.worldHeight;

        // 3. Draw Entities
        this.game.entities.forEach(entity => {
            // Default: use top-left x/y
            let worldX = entity.x;
            let worldY = entity.y;

            // FIX: For Yorkie, use the CENTER of the bounding box
            if (entity.constructor.name === "Yorkie") {
                worldX += entity.width / 2;
                worldY += entity.height / 2;
            }

            const entX = mapX + (worldX * ratioX);
            const entY = mapY + (worldY * ratioY);

            ctx.beginPath();

            if (entity.constructor.name === "Rat") {
                // Player: Bright Green
                ctx.arc(entX, entY, 4, 0, Math.PI * 2);
                ctx.fillStyle = "#39FF14";
                ctx.fill();
            } else if (entity.constructor.name === "Yorkie") {
                // Enemy: Red
                ctx.arc(entX, entY, 4, 0, Math.PI * 2);
                ctx.fillStyle = "red";
                ctx.fill();
            } else if (entity.constructor.name === "StuartBig") {
                // Ghost/NPC: Cyan
                ctx.arc(entX, entY, 3, 0, Math.PI * 2);
                ctx.fillStyle = "cyan";
                ctx.fill();
            } else if (entity.constructor.name === "GoldenKey" && !entity.collected) {
                // Item: Gold
                ctx.arc(entX, entY, 3, 0, Math.PI * 2);
                ctx.fillStyle = "gold";
                ctx.fill();
            }
        });

        // 4. Draw Viewport Rectangle
        let viewW = ctx.canvas.width / this.zoom;
        let viewH = ctx.canvas.height / this.zoom;

        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(mapX + (this.x * ratioX), mapY + (this.y * ratioY), viewW * ratioX, viewH * ratioY);
        ctx.restore();
    }

    buildLevelCache() {
        if (!this.level || !this.level.layers) return;

        const sourceSize = 16;
        const destSize = sourceSize * this.scale;
        const columns = 270;

        this.worldWidth = this.level.width * destSize;
        this.worldHeight = this.level.height * destSize;

        this.mapCanvas.width = this.worldWidth;
        this.mapCanvas.height = this.worldHeight;

        this.mapCtx.imageSmoothingEnabled = false;

        this.level.layers.forEach(layer => {
            if (layer.type === "tilelayer") {
                layer.data.forEach((gid, i) => {
                    if (gid > 0) {
                        const mapX = (i % layer.width) * destSize;
                        const mapY = Math.floor(i / layer.width) * destSize;
                        const spriteId = gid - 1;
                        const sourceX = (spriteId % columns) * sourceSize;
                        const sourceY = Math.floor(spriteId / columns) * sourceSize;
                        this.mapCtx.drawImage(this.spritesheet, sourceX, sourceY, sourceSize, sourceSize, mapX, mapY, destSize, destSize);
                    }
                });
            }
        });
        this.mapCached = true;
        console.log("Map cached successfully at scale " + this.scale);
    }
}
