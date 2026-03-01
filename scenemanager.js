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

        this.hasBeefJerky = false;
        this.yorkieGivenJerky = false;

        this.preDialogueActive = false;
        this.preDialogueTimer = 0;
        this.preDialogueDuration = 0;
        this._dialogueWasActive = false;
        this.paused = false;
        this.pauseMenu = new PauseMenu(this.game);

        this.cbX = 20;
        this.cbY = 20;
        this.cbSize = 24;

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
        this.snakeStates = new Map(); // Store snake states by unique ID

        // global rat health tracker
        this.ratHealth = 10;
        this.ratLives = 3;
        this.snakeEatAnim = new Animator(ASSET_MANAGER.getAsset("./assets/snake-eat-rat.png"), 0, 0, 728, 720, 2, 0.5, 0, false, true);

        this.isReloading = false;
        // looping crunch sound for lose scenario
        let crunchRaw = ASSET_MANAGER.getAsset("./assets/crunchy-bite.mp3");
        this.crunchSound = crunchRaw ? crunchRaw.cloneNode() : null;
        if (this.crunchSound) {
            this.crunchSound.loop = true;
            this.crunchSound.playbackRate = 3.1; // crunch speed
            this.crunchSound.volume = 0.2;
        }
        // cat lose scenario variables
        this.catLoseState = false;
        this.catEatAnim = new Animator(ASSET_MANAGER.getAsset("./assets/cat-defeat-rat.png"), 0, 0, 533.33, 529, 3, 0.3, 0, false, true);
        // looping punch sound for cat lose scenario
        let punchRaw = ASSET_MANAGER.getAsset("./assets/punch.mp3");
        this.punchSound = punchRaw ? punchRaw.cloneNode() : null;
        if (this.punchSound) {
            this.punchSound.loop = true;

            // 1.0 -> normal speed; ++ it -> 1.5, 2.0 makes punches faster
            //  -- it -> 0.8, 0.5 slows them down
            this.punchSound.playbackRate = 0.55; // #'s to adjust syncing w/ animation

            this.punchSound.volume = 0.05;
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
            // Check if click is inside the Debug Checkbox
            if (mouseX >= this.cbX && mouseX <= this.cbX + this.cbSize &&
                mouseY >= this.cbY && mouseY <= this.cbY + this.cbSize) {

                // ONLY toggle debug mode (removed the instant warp from here)
                this.game.options.debugging = !this.game.options.debugging;
                this.game.click = null; // Consume the click
                return;
            }

            // --- FIX: check for Warp Button clicks ONLY if debugging is ON AND computer UI is NOT active ---
            if (this.game.options && this.game.options.debugging) {
                let computer = this.game.entities.find(e => e instanceof Computer);

                // If computer exists and is active, let it handle clicks instead of the debug buttons
                if (!computer || !computer.active) {
                    // warp level 2 Button bounds [x: 20, y: 130, w: 220, h: 30]
                    if (mouseX >= 20 && mouseX <= 320 && mouseY >= 130 && mouseY <= 160) {
                        this.skipToLevel2Alive();
                        this.game.click = null;
                        return;
                    }
                    // warp level 3 Button bounds [x: 20, y: 170, w: 220, h: 30]
                    if (mouseX >= 20 && mouseX <= 320 && mouseY >= 170 && mouseY <= 200) {
                        this.skipToLevel3Dead();
                        this.game.click = null;
                        return;
                    }
                }
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
            if (rat) {
                rat.frozenForDialogue = true;
                rat.facing = 1;
                rat.animator = rat.animations.get("idle")[rat.facing];
            }
            if (stuart) {
                stuart.frozenForDialogue = true;
                stuart.facing = 0;
                stuart.animator = stuart.animations.get("idle")[stuart.facing];
            }
            this.game.paused = true;
        }

        if (this.menuActive) {
            this.menu.update();
            return;
        }
        if (this.paused) {
            this.pauseMenu.update();
            if (!this.paused) this.game.paused = false; else return;
        }
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
            if (rat) {
                rat.frozenForDialogue = false;
                rat.facing = 2;
                rat.animator = rat.animations.get("idle")[rat.facing];
            }
            let stuart = this.game.entities.find(e => e.constructor.name === "StuartBig");
            if (stuart) {
                stuart.frozenForDialogue = false;
                stuart.facing = 2;
                stuart.animator = stuart.animations.get("idle")[stuart.facing];
            }
            this.stuartIntroPlayed = true;
            this._dialogueWasActive = false;
        }

        let rat = this.game.entities.find(e => e.constructor.name === "Rat");
        if (rat) {
            // constantly backup the rats health to the SceneManager
            if (rat.health > 0) {
                this.ratHealth = rat.health;
            }
            let viewW = this.game.ctx.canvas.width / this.zoom;
            let viewH = this.game.ctx.canvas.height / this.zoom;
            this.x = rat.x - (viewW / 2);
            this.y = rat.y - (viewH / 2);
            this.x = Math.max(0, Math.min(this.x, this.worldWidth - viewW));
            this.y = Math.max(0, Math.min(this.y, this.worldHeight - viewH));
        }

        //snake state saving for level 2
        if (this.levelNumber === 2) {
            this.game.entities.forEach(entity => {
                // check for static id so movement doesn't break save state
                if (entity.constructor.name === "Snake" && entity.id) {
                    this.saveSnakeState(entity, entity.id);
                }
            });
        }
        // lose scenario trigger for level 2 if rat dies (no more E key debug box)
        if (!this.loseState && !this.catLoseState && rat && rat.health <= 0 && this.ratLives === 0) {
            this.loseState = true;
            this.loseTimer = 0;
            this.game.click = null;
            Object.keys(this.game.keys).forEach(k => this.game.keys[k] = false);

            // play music
            this.game.audio.playMusic("./assets/in-the-arms-of-an-angel.mp3", true);
        }
        if (this.loseState) {
            this.loseTimer += this.game.clockTick;

            // play crunch only after 5 second fade transition
            if (this.loseTimer >= 5 && this.loseTimer - this.game.clockTick < 5) {
                if (this.crunchSound) {
                    this.crunchSound.currentTime = 0;
                    this.crunchSound.play().catch(e => console.error(e));
                }
            }

            // restart logic, adjusted to 15 because of the 5 second delay
            if (this.loseTimer > 10) {
                let anyKeyPressed = Object.values(this.game.keys).some(k => k === true);

                if (!this.isReloading && (this.game.click || anyKeyPressed)) {
                    this.isReloading = true;
                    if (this.crunchSound) this.crunchSound.pause();
                    location.reload();
                }
            }
        }
        // level 3 cat lose scenario debug trigger
        if (this.levelNumber === 3) {
            let rat = this.game.entities.find(e => e.constructor.name === "Rat");
            let boxX = 138, boxY = 261, boxW = 50, boxH = 50;

            if (!this.catLoseState && rat &&
                rat.x < boxX + boxW && rat.x + (48 * rat.scale) > boxX &&
                rat.y < boxY + boxH && rat.y + (38 * rat.scale) > boxY) {

                if (this.game.keys["KeyE"]) {
                    this.catLoseState = true;
                    this.loseTimer = 0;
                    rat.health = 0;
                    this.ratLives = 0;

                    this.game.click = null;
                    Object.keys(this.game.keys).forEach(k => this.game.keys[k] = false);
                    this.game.keys["KeyE"] = false;
                    this.game.audio.playMusic("./assets/sad-meow-song.mp3", true);
                    // lower volume for this specific song
                    // default is 0.15, so 0.05 or 0.08 to make it quieter
                    this.game.audio.setVolume(0.05);
                }
            }
        }

        // timer logic for cat lose state
        if (this.catLoseState) {
            this.loseTimer += this.game.clockTick;

            // start punch sound exactly when the 5 second fade finishes
            if (this.loseTimer >= 5 && this.loseTimer - this.game.clockTick < 5) {
                if (this.punchSound) {
                    this.punchSound.currentTime = 0;
                    this.punchSound.play().catch(e => console.error(e));
                }
            }

            // wait 10 seconds->5 for fade 5 for scene before allowing restart
            if (this.loseTimer > 10) {
                let anyKeyPressed = Object.values(this.game.keys).some(k => k === true);
                if (!this.isReloading && (this.game.click || anyKeyPressed)) {
                    this.isReloading = true;
                    if (this.punchSound) this.punchSound.pause(); // stop punch sound on restart
                    location.reload();
                }
            }
        }}
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

        let rat = new Rat(this.game, 448, 196);
        rat.health = this.ratHealth; // restore health
        this.game.addEntity(rat);
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

        let rat;
        if (fromLevel === 3) {
            rat = new Rat(this.game, 707, 130);
        } else {
            // default spawn from level 1
            rat = new Rat(this.game, 250, 180);
        }
        rat.health = this.ratHealth; // restore health
        this.game.addEntity(rat);

        this.game.addEntity(new Door(this.game, 220, 90, "Level1", false));
        this.game.addEntity(new Door(this.game, 707, 32, "Level3", false));

        // Adjust the X (500) and Y (100) to fit your dining room map!
        this.game.addEntity(new Computer(this.game, 1280, 490));

        //ADD SNAKES TO LEVEL 2: restoring the state
        const stationarySnake = new Snake(this.game, 707, 130, null);

        // I fixed by giving snake persistent string ID so movement doesn't break saving
        stationarySnake.id = "level2_snake_main";
        this.loadSnakeState(stationarySnake, stationarySnake.id);

        // only add snake to the canvas if its still alive
        if (!stationarySnake.dead) {
            this.game.addEntity(stationarySnake);
        }
        console.log("Level 2 Loaded!");
    }

    loadLevelThree() {
        // clear current entities, preserves SceneManager state like yorkieDefeated
        this.game.entities.forEach(entity => {
            if (!(entity instanceof SceneManager)) entity.removeFromWorld = true;
        });

        if (!this.hasBeefJerky) {
            this.game.addEntity(new BeefJerky(this.game, 450, 420)); // Use your actual coordinates
        }

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
        let rat = new Rat(this.game, 80, 190);
        rat.health = this.ratHealth; // restore health
        this.game.addEntity(rat);

        // add door to return to Level 2
        this.game.addEntity(new Door(this.game, 80, 95, "Level2", false));


        console.log("Loaded level 3!");
    }

    saveSnakeState(snake, snakeId) {
        this.snakeStates.set(snakeId, {
            dead: snake.dead,
            health: snake.health,
            x: snake.x,
            y: snake.y
        });
    }

    loadSnakeState(snake, snakeId) {
        if (this.snakeStates.has(snakeId)) {
            const state = this.snakeStates.get(snakeId);
            snake.dead = state.dead;
            snake.health = state.health;
            snake.x = state.x;
            snake.y = state.y;

            if (snake.dead) {
                snake.onDeath();
            }
        }
    }


    draw(ctx) {
        if (this.menuActive) {
            this.menu.draw(ctx);
        } else {
            // if menu is NOT active, must draw the world
            this.drawWorld(ctx);
            this.drawOverlays(ctx);
        }
        // --- NEW DEBUG CHECKBOX ---
        const x = this.cbX;
        const y = this.cbY;
        const size = this.cbSize;

        ctx.save();

        ctx.fillStyle = "rgba(34, 34, 34, 0.8)";
        ctx.fillRect(x, y, size, size);

        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);

        ctx.fillStyle = "white";
        ctx.font = "12px 'Press Start 2P'";
        ctx.textAlign = "left";
        ctx.fillText("DEBUG MODE", x + size + 10, y + size - 6);
        // draw 'X' & Warp Buttons if debugging is on
        if (this.game.options && this.game.options.debugging) {
            ctx.fillStyle = "#39FF14";
            ctx.fillText("X", x + 5, y + size - 5);

            // draw warp buttons
            ctx.font = "10px 'Press Start 2P'"; // slightly smaller font for buttons

            // button 1: level 2 Alive -> Spawned below the hearts
            ctx.fillStyle = "rgba(34, 34, 34, 0.8)";
            ctx.fillRect(20, 130, 310, 30);
            ctx.strokeStyle = "#ffcc00";
            ctx.strokeRect(20, 130, 310, 30);
            ctx.fillStyle = "white";
            ctx.fillText("WARP Level 2 (SNAKE IS ALIVE)", 35, 151);

            // button 2: Level 3 Dead
            ctx.fillStyle = "rgba(34, 34, 34, 0.8)";
            ctx.fillRect(20, 170, 310, 30);
            ctx.strokeStyle = "#ffcc00";
            ctx.strokeRect(20, 170, 310, 30);
            ctx.fillStyle = "white";
            ctx.fillText("WARP Level 3 (SNAKE IS DEAD)", 35, 191);
        }
        ctx.restore();
    }

    drawWorld(ctx) {
        if (!this.mapCached) this.buildLevelCache();
        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);

        if (this.mapCached) {
            ctx.drawImage(this.mapCanvas, 0, 0);
        }

        if (this.game.options && this.game.options.debugging) {
            if (this.game.collisionManager) {
                this.game.collisionManager.draw(ctx);
            }
        }
        // draw the red trigger box in Level 3 for all players
        if (this.levelNumber === 3) {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.strokeRect(138, 261, 50, 50);

            ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
            ctx.fillRect(138, 261, 50, 50);

            ctx.fillStyle = "white";
            ctx.font = "10px 'Press Start 2P', Courier"; // slightly smaller font to fit
            // Drawing the text slightly above the box so it isn't too cluttered
            ctx.textAlign = "left";
            ctx.fillText("Press E for lvl 3 lose", 138, 245);
        }}

    drawOverlays(ctx) {
        ctx.restore();
        // updated lives hud - flashing red mechanism
        let heartAsset = ASSET_MANAGER.getAsset("./assets/hearts.png");
        if (heartAsset) {
            const heartWidth = 200;  // 600px total / 3 frames
            const heartHeight = 200;
            const scale = 0.40;      // scales it down
            const drawW = heartWidth * scale;
            const drawH = heartHeight * scale;
            const startX = 20;       // top left X position
            const startY = 30;       // pushed down slightly
            const spacing = 0;      // if you want spacing

            // Find the rat to check its recovery status and timer
            let rat = this.game.entities.find(e => e.constructor.name === "Rat");
            let isRecovering = rat && rat.isRecovering;
            let recoveryTimer = rat ? rat.recoveryTimer : 0;

            for (let i = 0; i < 3; i++) {
                let sourceX = 0; // default-> pink (Frame 0)

                if (i < this.ratLives) {
                    // if we are currently recovering AND this is the heart about to be lost
                    if (isRecovering && i === this.ratLives - 1) {
                        // flash red every 0.1 seconds
                        // Math.floor(timer / 0.1) % 2 toggles rapidly between true/false
                        let flashRed = Math.floor(recoveryTimer / 0.1) % 2 === 0;
                        sourceX = flashRed ? 200 : 0; // 200 is Red, 0 is Pink
                    } else {
                        // normal alive heart
                        sourceX = 0; // pink
                    }
                } else {
                    // life already lost
                    sourceX = 400; // gray (Frame 2)
                }

                ctx.drawImage(
                    heartAsset,
                    sourceX, 0, heartWidth, heartHeight, // source rectangle (clipping sprite)
                    startX + i * (drawW + spacing), startY, drawW, drawH // destination rectangle (on screen)
                );
            }
            // This is for the rat coordinate (bottom left) -> to help jayda w/ finding where computer is located
            if (this.game.options && this.game.options.debugging) {
                let rat = this.game.entities.find(e => e.constructor.name === "Rat");
                if (rat) {
                    ctx.save();
                    ctx.fillStyle = "red";
                    ctx.font = "bold 40px 'Courier New', Courier, monospace";
                    ctx.textAlign = "left";
                    // Draws text 20px from the left, 20px from the bottom
                    ctx.fillText(`X: ${Math.floor(rat.x)} | Y: ${Math.floor(rat.y)}`, 40, ctx.canvas.height - 40);
                    ctx.restore();
                }
            }
        }
        this.drawMinimap(ctx);
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

        // now pause menu overlay will draw ON TOP of the music button, we want to gray them out
        if (this.dialogueActive) this.dialogue.draw(ctx);
        if (this.paused) this.pauseMenu.draw(ctx);

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
            // slow fade to black
            if (this.loseTimer < 5) {
                ctx.save();
                ctx.fillStyle = "black";
                ctx.globalAlpha = Math.min(1, this.loseTimer / 5);
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
                return; // wait 5 seconds before showing snake eat animation
            }
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

            ctx.fillText("Look at you, where is our hero now?", ctx.canvas.width / 2, 70);
            ctx.fillText("You've been defeated by the silent slitherer...", ctx.canvas.width / 2, 105);
            ctx.fillText("Your fate is in their jaws.", ctx.canvas.width / 2, 140);

            if (this.loseTimer > 10) {
                ctx.font = "30px 'Press Start 2P', 'Courier New'";
                ctx.fillStyle = "red";
                ctx.fillText("PRESS ANY KEY TO RESTART", ctx.canvas.width / 2, ctx.canvas.height - 20);
            }
        }
        // draw cat lose screen
        if (this.catLoseState) {
            // slow fade to black
            if (this.loseTimer < 5) {
                ctx.save();
                ctx.fillStyle = "black";
                ctx.globalAlpha = Math.min(1, this.loseTimer / 5);
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
                return; // wait 5 seconds before showing animation
            }

            ctx.save();
            ctx.fillStyle = "black";
            ctx.globalAlpha = 1;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();

            // scaled up image
            const scale = 1.5; // 1.0 is normal; 2.0 is double size, settled for 1.5

            const frameWidth = 533.33 * scale;
            const frameHeight = 529 * scale;
            const xPos = (ctx.canvas.width - frameWidth) / 2;
            const yPos = (ctx.canvas.height - frameHeight) / 2;

            // pass the new scale variable as the last argument
            this.catEatAnim.drawFrame(this.game.clockTick, ctx, xPos, yPos, scale);

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

            ctx.fillText("A valiant effort, but you're out of luck.", ctx.canvas.width / 2, 70);
            ctx.fillText("Cats have nine lives. Rats? Not so much.", ctx.canvas.width / 2, 105);
            ctx.fillText("Enjoy your new life as a hairball.", ctx.canvas.width / 2, 140);

            if (this.loseTimer > 10) {
                ctx.font = "30px 'Press Start 2P', 'Courier New'";
                ctx.fillStyle = "white";
                ctx.fillText("PRESS ANY KEY TO RESTART", ctx.canvas.width / 2, ctx.canvas.height - 40);
            }
        }
        let computer = this.game.entities.find(e => e instanceof Computer);
        if (computer) {
            computer.drawUI(ctx);
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
                ctx.fillStyle = "#39FF14";
                ctx.fill();
            } else if (entity.constructor.name === "Yorkie") {
                ctx.arc(entX, entY, 4, 0, Math.PI * 2);
                ctx.fillStyle = "red";
                ctx.fill();
            } else if (entity.constructor.name === "StuartBig") {
                ctx.arc(entX, entY, 3, 0, Math.PI * 2);
                ctx.fillStyle = "cyan";
                ctx.fill();
            } else if (entity.constructor.name === "Snake" && !entity.dead) {
                ctx.arc(entX, entY, 4, 0, Math.PI * 2);
                ctx.fillStyle = "#031c04";
                ctx.fill();
            } else if (entity.constructor.name === "GoldenKey" && !entity.collected) {
                ctx.arc(entX, entY, 3, 0, Math.PI * 2);
                ctx.fillStyle = "gold";
                ctx.fill();
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
                    // check for tiled hidden rotation/flip flags using bitwise math
                    let hFlipped = (gid & 0x80000000) !== 0; // Horizontal flip
                    let vFlipped = (gid & 0x40000000) !== 0; // Vertical flip
                    let dFlipped = (gid & 0x20000000) !== 0; // Diagonal flip; 90 deg rotation

                    // clear flags from GID to get actual sprite number
                    let cleanGid = gid & 0x0FFFFFFF;

                    if (cleanGid > 0) {
                        const mapX = (i % layer.width) * destSize;
                        const mapY = Math.floor(i / layer.width) * destSize;
                        const spriteId = cleanGid - 1;
                        const sourceX = (spriteId % columns) * sourceSize;
                        const sourceY = Math.floor(spriteId / columns) * sourceSize;

                        // if it has rotation or flip transform canvas before drawing
                        if (hFlipped || vFlipped || dFlipped) {
                            this.mapCtx.save();

                            // move canvas 'pen' to exact center of where tile goes
                            this.mapCtx.translate(mapX + destSize / 2, mapY + destSize / 2);

                            // apply tiled specific diagonal flip logic; rotate 90 CW + flip X
                            if (dFlipped) {
                                this.mapCtx.rotate(Math.PI / 2);
                                this.mapCtx.scale(-1, 1);
                            }
                            // apply horizontal or vertical flips
                            if (hFlipped) this.mapCtx.scale(-1, 1);
                            if (vFlipped) this.mapCtx.scale(1, -1);

                            // draw image centered around translated point
                            this.mapCtx.drawImage(
                                this.spritesheet,
                                sourceX, sourceY, sourceSize, sourceSize,
                                -destSize / 2, -destSize / 2, destSize, destSize
                            );

                            this.mapCtx.restore();
                        } else {
                            // standard unrotated draw; for 99% of tiles, keeps performance fast (no lag)
                            this.mapCtx.drawImage(
                                this.spritesheet,
                                sourceX, sourceY, sourceSize, sourceSize,
                                mapX, mapY, destSize, destSize
                            );
                        }
                    }
                });
            }
        });
        this.mapCached = true;
        console.log("Map cached successfully at scale " + this.scale);
    }

    skipToLevel2Alive() {
        console.log("DEBUG: Instant Warp to Level 2 (Snake Alive)...");

        // Force the snake to be alive and at full health in the persistence map
        this.snakeStates.set("level2_snake_main", {dead: false, health: 3, x: 707, y: 130});

        this.levelNumber = 2;
        this.storyState = "LEVEL2";
        this.yorkieDefeated = true;
        this.stuartIntroPlayed = true;
        this.hasGoldenKey = true;

        this.menuActive = false;
        this.dialogueActive = false;
        this.game.paused = false;

        this.game.entities.forEach(entity => {
            if (entity !== this) entity.removeFromWorld = true;
        });

        this.loadLevelTwo(1);
        this.mapCached = false;
    }

    skipToLevel3Dead() {
        console.log("DEBUG: Instant Warp to Level 3 (Snake Dead)...");

        // Force the snake to be dead in the persistence map so returning to Level 2 is a clear campus
        this.snakeStates.set("level2_snake_main", {dead: true, health: 0, x: 707, y: 130});

        this.levelNumber = 3;
        this.storyState = "LEVEL3";
        this.yorkieDefeated = true;
        this.stuartIntroPlayed = true;
        this.hasGoldenKey = true;

        this.menuActive = false;
        this.dialogueActive = false;
        this.game.paused = false;

        this.game.entities.forEach(entity => {
            if (entity !== this) entity.removeFromWorld = true;
        });

        this.loadLevelThree();
        this.mapCached = false;
    }
}