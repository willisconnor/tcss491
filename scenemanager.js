class SceneManager {
    constructor(game) {
        this.game = game;
        this.game.camera = this;

        this.x = 0;
        this.y = 0;

        // map scale
        this.scale = 4;

        // camera zoom preferred by team
        this.zoom = 1.75;

        this.fadeAlpha = 1;
        this.isFading = true;
        this.currentMusicPath = "./assets/background_music.wav";

        this.yorkieDefeated = false;
        this.stuartIntroPlayed = false;
        this.storyState = "STUART_TALK";

        this.preDialogueActive = false;
        this.preDialogueTimer = 0;
        this.preDialogueDuration = 0;
        this._dialogueWasActive = false;
        this.paused = false;
        this.pauseMenu = new PauseMenu(this.game);

        this.menuActive = true;
        this.menu = new Menu(this.game);
        this.dialogueActive = false;
        this.dialogue = new Dialogue(this.game, this);

        this.level = ASSET_MANAGER.getAsset("./assets/Level1LivingRoom.json");
        this.levelNumber = 1;
        this.spritesheet = ASSET_MANAGER.getAsset("./assets/global.png");

        this.mapCached = false;
        this.mapCanvas = document.createElement('canvas');
        this.mapCtx = this.mapCanvas.getContext('2d');
        this.mapCtx.imageSmoothingEnabled = false;

        this.worldWidth = 0;
        this.worldHeight = 0;

        if (this.game.collisionManager) {
            this.game.collisionManager.loadFromTiledJSON(this.level);
        }

        this.minimapWidth = 250;
        this.minimapMargin = 10;

        this.stuartIntroPlayed = false;
        this.gameplayStarted = false;
        // lose scenario variables
        this.loseState = false;
        this.loseTimer = 0;

        this.snakeEatAnim = new Animator(ASSET_MANAGER.getAsset("./assets/snake-eat-rat.png"), 0, 0, 728, 720, 2, 0.5, 0, false, true);

        // looping crunch sound for lose scenario
        let crunchRaw = ASSET_MANAGER.getAsset("./assets/crunchy-bite.mp3");
        this.crunchSound = crunchRaw ? crunchRaw.cloneNode() : null;
        if (this.crunchSound) {
            this.crunchSound.loop = true;
            this.crunchSound.playbackRate = 3.1; // crunch speed
        }
    }

    update() {

        // audio UI input logic
        if (this.game.click) {
            const mouseX = this.game.click.x;
            const mouseY = this.game.click.y;
            const aspect = this.worldWidth > 0 ? this.worldHeight / this.worldWidth : 0.5;
            const mapH = this.minimapWidth * aspect;
            const muteX = this.game.ctx.canvas.width - this.minimapMargin - 60;
            const muteY = this.minimapMargin + mapH + 10;

            if (mouseX >= muteX && mouseX <= muteX + 60 && mouseY >= muteY && mouseY <= muteY + 30) {
                this.game.audio.toggleMute();
                this.game.click = null;
                return;
            }
        }

        if (this.game.keys["Escape"]) {
            if (!this.menuActive) {
                this.game.keys["Escape"] = false;
                this.paused = !this.paused;
                if (!this.paused) this.game.paused = false;
            }
        }

        if (this.paused || this.dialogueActive) {
            this.game.paused = true;
        }

        if (this.dialogueActive && this.storyState === "STUART_TALK" && !this.preDialogueActive && !this._dialogueWasActive && !this.stuartIntroPlayed) {
            this.preDialogueActive = true;
            this.preDialogueTimer = this.preDialogueDuration;
            this.dialogueActive = false;
            this._dialogueWasActive = true;

            let rat = this.game.entities.find(e => e.constructor.name === "Rat");
            let stuart = this.game.entities.find(e => e.constructor.name === "StuartBig");
            if (rat) { rat.frozenForDialogue = true; rat.facing = 1; rat.animator = rat.animations.get("idle")[rat.facing]; }
            if (stuart) { stuart.frozenForDialogue = true; stuart.facing = 0; stuart.animator = stuart.animations.get("idle")[stuart.facing]; }
            this.game.paused = true;
        }

        if (this.menuActive) { this.menu.update(); return; }
        if (this.paused) { this.pauseMenu.update(); if (!this.paused) this.game.paused = false; else return; }
        if (this.dialogueActive) this.dialogue.update();

        if (this.preDialogueActive) {
            this.preDialogueTimer -= this.game.clockTick;
            if (this.preDialogueTimer <= 0) {
                this.preDialogueActive = false;
                this.dialogueActive = true;
                this.game.paused = true;
            } else {
                return;
            }
        }

        if (!this.dialogueActive && this._dialogueWasActive && !this.preDialogueActive) {
            let rat = this.game.entities.find(e => e.constructor.name === "Rat");
            if (rat) { rat.frozenForDialogue = false; rat.facing = 2; rat.animator = rat.animations.get("idle")[rat.facing]; }
            let stuart = this.game.entities.find(e => e.constructor.name === "StuartBig");
            if (stuart) { stuart.frozenForDialogue = false; stuart.facing = 2; stuart.animator = stuart.animations.get("idle")[stuart.facing]; }
            this.stuartIntroPlayed = true;
            this._dialogueWasActive = false;
        }

        let rat = this.game.entities.find(e => e.constructor.name === "Rat");
        if (rat) {
            let viewW = this.game.ctx.canvas.width / this.zoom;
            let viewH = this.game.ctx.canvas.height / this.zoom;
            this.x = rat.x - (viewW / 2);
            this.y = rat.y - (viewH / 2);
            this.x = Math.max(0, Math.min(this.x, this.worldWidth - viewW));
            this.y = Math.max(0, Math.min(this.y, this.worldHeight - viewH));
        }

        // lose scenario trigger for level 2
        if (this.levelNumber === 2 && !this.loseState && rat) {
            let dist = Math.sqrt(Math.pow(rat.x - 960, 2) + Math.pow(rat.y - 128, 2));
            if (dist < 100 && this.game.keys["KeyE"]) {
                this.loseState = true;
                this.loseTimer = 0;

                this.game.click = null;
                Object.keys(this.game.keys).forEach(k => this.game.keys[k] = false);

                // play music
                this.game.audio.playMusic("./assets/in-the-arms-of-an-angel.mp3", true);

                // play crunch
                if (this.crunchSound) {
                    this.crunchSound.currentTime = 0;
                    this.crunchSound.play().catch(e => console.error(e));
                }
            }
        }

        if (this.loseState) {
            this.loseTimer += this.game.clockTick;

            // restart logic
            if (this.loseTimer > 10) {
                let anyKeyPressed = Object.values(this.game.keys).some(k => k === true);

                if (this.game.click || anyKeyPressed) {
                    if (this.crunchSound) this.crunchSound.pause();
                    location.reload();
                }
            }
        }
    }

    loadLevelOne() {
        this.gameplayStarted = true;
        this.game.entities.forEach(entity => {
            if (!(entity instanceof SceneManager)) entity.removeFromWorld = true;
        });

        this.level = ASSET_MANAGER.getAsset("./assets/Level1LivingRoom.json");
        this.levelNumber = 1;
        this.mapCached = false; // Important: This triggers the map to redraw at the correct scale

        if (this.game.collisionManager) {
            this.game.collisionManager.loadFromTiledJSON(this.level);
        }

        this.game.addEntity(new Rat(this.game, 448, 196));
        this.game.addEntity(new StuartBig(this.game, 200, 215, 2));
        this.game.addEntity(new Yorkie(this.game, 420, 420));
        this.game.addEntity(new Door(this.game, 420, 90, "Level2", true));

        // Play music
        this.currentMusicPath = "./assets/background_music.wav";
        this.game.audio.playMusic(this.currentMusicPath);

        console.log("Loaded level one!");
    }

    loadLevelTwo(fromLevel) {
        this.game.entities.forEach(entity => {
            if (!(entity instanceof SceneManager)) entity.removeFromWorld = true;
        });

        this.level = ASSET_MANAGER.getAsset("./assets/Level2DiningRoom.json");
        this.levelNumber = 2;
        this.mapCached = false; // Forces buildLevelCache to run next draw

        if (this.game.collisionManager) {
            this.game.collisionManager.loadFromTiledJSON(this.level);
        }

        this.currentMusicPath = "./assets/Desert.mp3";
        this.game.audio.playMusic(this.currentMusicPath);

        if (fromLevel === 3) {
            this.game.addEntity(new Rat(this.game, 707, 130));
        } else {
            // default spawn from level 1
            this.game.addEntity(new Rat(this.game, 250, 180));
        }
        this.game.addEntity(new Door(this.game, 220, 90, "Level1", false));
        this.game.addEntity(new Door(this.game, 707, 32, "Level3", false));
        console.log("Loaded level 2!");
    }

    loadLevelThree() {
        // clear current entities, preserves SceneManager state like yorkieDefeated
        this.game.entities.forEach(entity => {
            if (!(entity instanceof SceneManager)) entity.removeFromWorld = true;
        });

        // load new Kitchen Map
        this.level = ASSET_MANAGER.getAsset("./assets/Level3Kitchen.json");
        this.levelNumber = 3;
        this.mapCached = false;

        // load collisions
        if (this.game.collisionManager) {
            this.game.collisionManager.loadFromTiledJSON(this.level);
        }
        this.currentMusicPath = "./assets/MiiParade.mp3";
        this.game.audio.playMusic(this.currentMusicPath);

        // place Rat at entrance to kitchen door
        this.game.addEntity(new Rat(this.game, 80, 190));

        // add door to return to Level 2
        this.game.addEntity(new Door(this.game, 80, 95, "Level2", false));

        //ADD SNAKES TO LEVEL 2
        const stationarySnake = new Snake(this.game, 400, 200, 32, 32, null);
        this.game.addEntity(stationarySnake);

        console.log("Level 2 Loaded!");
        console.log("Loaded level 3!");
    }

    draw(ctx) {
        if (this.menuActive) {
            this.menu.draw(ctx);
        } else {
            // if menu is NOT active, must draw the world
            this.drawWorld(ctx);
            this.drawOverlays(ctx);
        }
    }

    drawWorld(ctx) {
        if (!this.mapCached) this.buildLevelCache();
        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);

        if (this.mapCached) {
            ctx.drawImage(this.mapCanvas, 0, 0);
        }

        if (this.levelNumber === 2 && !this.loseState) {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 3;
            ctx.strokeRect(960, 128, 50, 50);
            ctx.fillStyle = "red";
            ctx.font = "20px Arial";
            ctx.fillText("Press E to see Lvl 2 Lose", 1000, 120);
        }

        if (this.game.options && this.game.options.debugging) {
            if (this.game.collisionManager) {
                this.game.collisionManager.draw(ctx);
            }
        }
    }

    drawOverlays(ctx) {
        ctx.restore();
        this.drawMinimap(ctx);
        if (this.dialogueActive) this.dialogue.draw(ctx);
        if (this.paused) this.pauseMenu.draw(ctx);

        const aspect = this.worldHeight / this.worldWidth;
        const mapH = this.minimapWidth * aspect;
        const x = ctx.canvas.width - this.minimapMargin - 60;
        const y = this.minimapMargin + mapH + 10;
        const isMuted = this.game.audio.muted;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, 60, 30, 15);
        ctx.fillStyle = isMuted ? "#ccc" : "#4CD964";
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        const knobX = isMuted ? x + 15 : x + 60 - 15;
        ctx.arc(knobX, y + 15, 11, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.font = "bold 12px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("MUSIC", x + 30, y + 45);
        ctx.restore();

        if (this.isFading) {
            ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            this.fadeAlpha -= 0.01;
            if (this.fadeAlpha <= 0) {
                this.fadeAlpha = 0;
                this.isFading = false;
            }
        }

        // draw lose screen
        if (this.loseState) {
            ctx.save();
            ctx.fillStyle = "black";
            ctx.globalAlpha = 1;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();

            const frameWidth = 728;
            const frameHeight = 720;
            const xPos = (ctx.canvas.width - frameWidth) / 2;
            const yPos = (ctx.canvas.height - frameHeight) / 2;

            this.snakeEatAnim.drawFrame(this.game.clockTick, ctx, xPos, yPos, 1);

            ctx.fillStyle = "white";
            ctx.font = "20px 'Press Start 2P', 'Courier New'";
            ctx.textAlign = "center";

            let boxWidth = 950;
            let boxHeight = 150;
            let boxX = (ctx.canvas.width - boxWidth) / 2;
            let boxY = 30;

            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            ctx.strokeStyle = "white";
            ctx.lineWidth = 4;
            ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
            ctx.restore();

            ctx.fillText("Look at you, where is our hero now?", ctx.canvas.width/2, 70);
            ctx.fillText("You've been defeated by the silent slitherer...", ctx.canvas.width/2, 105);
            ctx.fillText("Your fate is in their jaws.", ctx.canvas.width/2, 140);

            if (this.loseTimer > 10) {
                ctx.font = "30px 'Press Start 2P', 'Courier New'";
                ctx.fillStyle = "red";
                ctx.fillText("PRESS ANY KEY TO RESTART", ctx.canvas.width/2, ctx.canvas.height - 20);
            }
        }
    }

    drawMinimap(ctx) {
        if (!this.mapCached) return;
        const mapW = this.minimapWidth;
        const mapH = mapW * (this.worldHeight / this.worldWidth);
        const mapX = ctx.canvas.width - mapW - this.minimapMargin;
        const mapY = this.minimapMargin;

        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(mapX - 2, mapY - 2, mapW + 4, mapH + 4);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(mapX - 2, mapY - 2, mapW + 4, mapH + 4);
        ctx.drawImage(this.mapCanvas, mapX, mapY, mapW, mapH);

        const ratioX = mapW / this.worldWidth;
        const ratioY = mapH / this.worldHeight;

        this.game.entities.forEach(entity => {
            let worldX = entity.x;
            let worldY = entity.y;
            if (entity.constructor.name === "Yorkie") {
                worldX += entity.width / 2;
                worldY += entity.height / 2;
            }
            const entX = mapX + (worldX * ratioX);
            const entY = mapY + (worldY * ratioY);
            ctx.beginPath();
            if (entity.constructor.name === "Rat") {
                ctx.arc(entX, entY, 4, 0, Math.PI * 2);
                ctx.fillStyle = "#39FF14"; ctx.fill();
            } else if (entity.constructor.name === "Yorkie") {
                ctx.arc(entX, entY, 4, 0, Math.PI * 2);
                ctx.fillStyle = "red"; ctx.fill();
            } else if (entity.constructor.name === "StuartBig") {
                ctx.arc(entX, entY, 3, 0, Math.PI * 2);
                ctx.fillStyle = "cyan"; ctx.fill();
            } else if (entity.constructor.name === "GoldenKey" && !entity.collected) {
                ctx.arc(entX, entY, 3, 0, Math.PI * 2);
                ctx.fillStyle = "gold"; ctx.fill();
            }
        });

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