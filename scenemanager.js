class SceneManager {
    constructor(game) {
        this.game = game;
        this.game.camera = this;
        this.itemPopupActive = false;
        this.itemPopupText = [];
        this.x = 0;
        this.y = 0;

        this.stuartFadeAlpha = 0;
        this.level2StuartSpawned = false;

        // map scale
        this.scale = 4;

        // camera zoom preferred by team
        this.zoom = 1.75;

        this.fadeAlpha = 0;
        this.isFading = false;
        this.currentMusicPath = "./assets/background_music.wav";

        this.yorkieDefeated = false;
        this.stuartIntroPlayed = false;
        this.storyState = "STUART_TALK";

        this.snakeIntroPlayed = false;
        this.cameraState = "FOLLOW_RAT"; // "FOLLOW_RAT", "PAN_TO_SNAKE", "PAN_TO_RAT"
        this.hasBeefJerky = false;
        this.yorkieGivenJerky = false;

        // persistent States
        this.gateUnlocked = false;
        this.catState = null;
        this.yorkieState = null;
        this.safeUnlocked = false;
        this.winState = false;
        this.winTimer = 0;

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
        // Interactable shape polygons parsed from Tiled JSON layers
        this.interactableShapes = {};

        // Iris transition state (Animal Crossing style)
        this.iris = {
            active: false,
            phase: "none",       // "closing", "loading", "opening", "none"
            progress: 0,         // 0 = open, 1 = closed
            speed: 1.8,          // ~0.55s to close/open
            holdTimer: 0,
            holdDuration: 1.0,   // seconds of black screen between levels
            pendingDestination: null,
            pendingFromLevel: null
        };
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
        this.parseInteractableLayers();

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
        this.catIntroPlayed = false;
        this.heartContainerUsed = false;
        this.maxLives = 3;
        this.snakeDefeatTextPlayed = false;
        this.debugUnlimitedHealth = false;
        this.debugOnePunch = false;
        this.debugNoDialogue = false;
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

            // restrict all debug clicks to main menu only
            if (this.menuActive) {
                if (mouseX >= this.cbX && mouseX <= this.cbX + this.cbSize &&
                    mouseY >= this.cbY && mouseY <= this.cbY + this.cbSize) {
                    this.game.options.debugging = !this.game.options.debugging;
                    this.game.click = null;
                    return;
                }
                if (this.game.options && this.game.options.debugging) {
                    if (mouseX >= 20 && mouseX <= 320 && mouseY >= 130 && mouseY <= 160) {
                        this.skipToLevel1();
                        this.game.click = null;
                        return;
                    }
                    if (mouseX >= 20 && mouseX <= 320 && mouseY >= 170 && mouseY <= 200) {
                        this.skipToLevel2Alive();
                        this.game.click = null;
                        return;
                    }
                    if (mouseX >= 20 && mouseX <= 320 && mouseY >= 210 && mouseY <= 240) {
                        this.skipToLevel3Dead();
                        this.game.click = null;
                        return;
                    }
                    if (mouseX >= 20 && mouseX <= 320 && mouseY >= 250 && mouseY <= 280) {
                        this.debugUnlimitedHealth = !this.debugUnlimitedHealth;
                        this.game.click = null;
                        return;
                    }
                    if (mouseX >= 20 && mouseX <= 320 && mouseY >= 290 && mouseY <= 320) {
                        this.debugOnePunch = !this.debugOnePunch;
                        this.game.click = null;
                        return;
                    }
                    if (mouseX >= 20 && mouseX <= 320 && mouseY >= 330 && mouseY <= 360) {
                        this.debugNoDialogue = !this.debugNoDialogue;
                        this.game.click = null;
                        return;
                    }
                }
            }
        }

        if (this.game.keys["Escape"]) {
            // Let the player skip the combat tutorial without opening the pause menu
            if (this.dialogueActive && this.dialogue.phase === "COMBAT_TUTORIAL") {
                this.game.keys["Escape"] = false;
                this.dialogueActive = false;
                this.game.paused = false;
                this.dialogue.phase = "INTRO";
            } 
            // Otherwise, normal pause menu logic
            else if (!this.menuActive) {
                this.game.keys["Escape"] = false;
                this.paused = !this.paused;
                if (!this.paused) this.game.paused = false;
            }
        }

        // Only force a game pause if the dialogue is NOT the combat tutorial
        let hc = this.game.entities.find(e => e.constructor.name === "HeartContainer");
        let hcActive = hc && hc.showPopup;
        this.game.paused = this.paused || (this.dialogueActive && this.dialogue.phase !== "COMBAT_TUTORIAL") || this.itemPopupActive || hcActive;

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
// Iris transition update
        if (this.iris.active) {
            const tick = this.game.clockTick;
            if (this.iris.phase === "closing") {
                this.iris.progress += this.iris.speed * tick;
                if (this.iris.progress >= 1) {
                    this.iris.progress = 1;
                    this.iris.phase = "loading";
                }
            } else if (this.iris.phase === "loading") {
                // Perform the level load now (screen is fully black)
                const dest = this.iris.pendingDestination;
                const from = this.iris.pendingFromLevel;
                this.game.paused = false;
                if (dest === "Level1") this.loadLevelOne();
                else if (dest === "Level2") this.loadLevelTwo(from);
                else if (dest === "Level3") this.loadLevelThree();
                this.iris.phase = "holding";
                this.iris.holdTimer = this.iris.holdDuration;
                this.iris.progress = 1;
                this.game.paused = false;
            } else if (this.iris.phase === "holding") {
                // Black screen pause before revealing new level
                this.iris.holdTimer -= tick;
                if (this.iris.holdTimer <= 0) {
                    this.iris.phase = "opening";
                    this.iris.progress = 1;
                }
            } else if (this.iris.phase === "opening") {
                this.iris.progress -= this.iris.speed * tick;
                if (this.iris.progress <= 0) {
                    this.iris.progress = 0;
                    this.iris.phase = "none";
                    this.iris.active = false;
                }
            }
            // Skip rest of update during iris transition closing phase
            if (this.iris.phase === "closing" || this.iris.phase === "loading") return;
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
        if (this.itemPopupActive) {
            if (this.game.keys["Space"]) {
                this.itemPopupActive = false;
                this.game.paused = false;
                this.game.keys["Space"] = false;
            }
            return;
        }
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
            if (rat.health > 0) this.ratHealth = rat.health;

            let viewW = this.game.ctx.canvas.width / this.zoom;
            let viewH = this.game.ctx.canvas.height / this.zoom;

            // Spawn Stuart Big in after you defeat the snake
            if (this.levelNumber === 2 && this.snakeDefeatTextPlayed && !this.level2StuartSpawned) {
                let stuart = this.game.entities.find(e => e.constructor.name === "StuartBig");

                // Only spawn him if he doesn't exist yet
                if (!stuart) {
                    stuart = new StuartBig(this.game, 817, 104, 2); // Spawn by door
                    this.game.addEntity(stuart);
                    this.stuartFadeAlpha = 0;
                }

                // Gradually fade him in
                if (this.stuartFadeAlpha < 1) {
                    this.stuartFadeAlpha += 0.25 * this.game.clockTick;
                    if (this.stuartFadeAlpha > 1) this.stuartFadeAlpha = 1;
                } else {
                    this.level2StuartSpawned = true;
                }
            }

            if (this.levelNumber === 2 && !this.snakeIntroPlayed) {
                let snake = this.game.entities.find(e => e.constructor.name === "Snake" && e.id === "level2_snake_main");
                if (snake && rat.x > 300 && this.cameraState === "FOLLOW_RAT") {
                    if (this.debugNoDialogue) {
                        this.snakeIntroPlayed = true;
                    } else {
                        this.cameraState = "PAN_TO_SNAKE";
                        this.game.paused = true;
                        snake.facing = 0;
                    }
                }
            }

            if (this.cameraState === "PAN_TO_SNAKE") {
                this.game.paused = true;
                let snake = this.game.entities.find(e => e.constructor.name === "Snake" && e.id === "level2_snake_main");
                let targetZoom = 3.0;
                this.zoom += (targetZoom - this.zoom) * 0.05;

                viewW = this.game.ctx.canvas.width / this.zoom;
                viewH = this.game.ctx.canvas.height / this.zoom;

                let targetX = snake.x - (viewW / 2);
                let targetY = snake.y - (viewH / 2);

                targetX = Math.max(0, Math.min(targetX, this.worldWidth - viewW));
                targetY = Math.max(0, Math.min(targetY, this.worldHeight - viewH));

                this.x += (targetX - this.x) * 0.05;
                this.y += (targetY - this.y) * 0.05;

                if (Math.abs(this.x - targetX) < 5 && Math.abs(this.y - targetY) < 5 && Math.abs(this.zoom - targetZoom) < 0.05) {
                    this.cameraState = "DIALOGUE";
                    this.dialogue.phase = "INTRO";
                    this.dialogue.currentIndex = 0;
                    this.dialogue.charIndex = 0;
                    this.dialogue.displayText = "";
                    this.game.click = null;
                    this.game.keys["Space"] = false;
                    this.dialogue.portrait = ASSET_MANAGER.getAsset("./assets/snake-portrait.png");
                    this.dialogue.speaker = "Silent Slitherer";
                    this.dialogue.dialogues = [
                        {speaker: "Snake", text: "Isss-sss that a sss-nack I ssssmell?", type: "dialogue"},
                        {
                            speaker: "Snake", text: "", type: "choice", choices: [
                                {text: "I'm no food", response: "You are to me"},
                                {text: "I'm not afraid of you.", response: "Fear changes nothing."},
                                {text: "You're in my way", response: "Then come closer"},
                                {text: "Please let me pass.", response: "Begging only makes you softer."}
                            ], nextIndex: 2
                        }
                    ];
                    this.dialogueActive = true;
                }
            } else if (this.cameraState === "DIALOGUE") {
                this.game.paused = true;
                if (!this.dialogueActive) {
                    this.cameraState = "PAN_TO_RAT";
                    this.snakeIntroPlayed = true;
                }
            } else if (this.cameraState === "PAN_TO_RAT") {
                this.game.paused = true;
                let targetZoom = 1.75;
                this.zoom += (targetZoom - this.zoom) * 0.05;

                viewW = this.game.ctx.canvas.width / this.zoom;
                viewH = this.game.ctx.canvas.height / this.zoom;

                let targetX = rat.x - (viewW / 2);
                let targetY = rat.y - (viewH / 2);

                targetX = Math.max(0, Math.min(targetX, this.worldWidth - viewW));
                targetY = Math.max(0, Math.min(targetY, this.worldHeight - viewH));

                this.x += (targetX - this.x) * 0.05;
                this.y += (targetY - this.y) * 0.05;

                if (Math.abs(this.x - targetX) < 5 && Math.abs(this.y - targetY) < 5 && Math.abs(this.zoom - targetZoom) < 0.05) {
                    this.cameraState = "FOLLOW_RAT";
                    this.game.paused = false;
                    this.zoom = 1.75;
                }
            } else {
                // FOLLOW_RAT -> Normal gameplay
                if (this.game.entities.find(e => e.constructor.name === "Rat").slidePhase === 0) {
                    this.x = rat.x - (viewW / 2);
                    this.y = rat.y - (viewH / 2);
                }
            }

            this.x = Math.max(0, Math.min(this.x, this.worldWidth - viewW));
            this.y = Math.max(0, Math.min(this.y, this.worldHeight - viewH));
        }

        if (this.levelNumber === 2) {
            this.game.entities.forEach(entity => {
                if (entity.constructor.name === "Snake" && entity.id) {
                    this.saveSnakeState(entity, entity.id);
                }
                if (entity.constructor.name === "Computer") {
                    this.saveComputerState(entity);
                }
            });
        }
        if (this.levelNumber === 1) {
            this.game.entities.forEach(entity => {
                if (entity.constructor.name === "Yorkie") {
                    this.saveYorkieState(entity);
                }
            });
        }

        if (this.levelNumber === 3) {
            this.game.entities.forEach(entity => {
                if (entity.constructor.name === "Cat") {
                    this.saveCatState(entity);
                }
            });
        }
        // win logic
        if (this.winState) {
            this.winTimer += this.game.clockTick;
            if (this.winTimer > 5) {
                let anyKeyPressed = Object.values(this.game.keys).some(k => k === true);
                if (!this.isReloading && (this.game.click || anyKeyPressed)) {
                    this.isReloading = true;
                    location.reload();
                }
            }
            return; // stops rest of game logic from updating while win screen plays
        }

        // Death Trigger Logic
        if (!this.loseState && !this.catLoseState && !this.computerLoseState && !this.safeLoseState && rat && rat.health <= 0 && this.ratLives === 0) {
            if (this.deathReason === "COMPUTER") {
                this.computerLoseState = true;
                this.loseTimer = 0;
                this.game.click = null;
                Object.keys(this.game.keys).forEach(k => this.game.keys[k] = false);

                // music will loop continuously
                this.game.audio.playMusic("./assets/loseHumanVerification.mp3", true);
                this.game.audio.setVolume(0.75);

            } else if (this.deathReason === "SAFE") {
                this.safeLoseState = true;
                this.loseTimer = 0;
                this.game.click = null;
                Object.keys(this.game.keys).forEach(k => this.game.keys[k] = false);
            } else if (this.levelNumber === 3) {
                this.catLoseState = true;
                this.loseTimer = 0;
                this.game.click = null;
                Object.keys(this.game.keys).forEach(k => this.game.keys[k] = false);
                this.game.audio.playMusic("./assets/sad-meow-song.mp3", true);
                this.game.audio.setVolume(0.05);
            } else {
                this.loseState = true;
                this.loseTimer = 0;
                this.game.click = null;
                Object.keys(this.game.keys).forEach(k => this.game.keys[k] = false);
                this.game.audio.playMusic("./assets/in-the-arms-of-an-angel.mp3", true);
            }
        }

        // Default / Snake Lose
        if (this.loseState) {
            this.loseTimer += this.game.clockTick;
            if (this.loseTimer >= 5 && this.loseTimer - this.game.clockTick < 5) {
                if (this.crunchSound) {
                    this.crunchSound.currentTime = 0;
                    this.crunchSound.play().catch(e => console.error(e));
                }
            }
            if (this.loseTimer > 10) {
                let anyKeyPressed = Object.values(this.game.keys).some(k => k === true);
                if (!this.isReloading && (this.game.click || anyKeyPressed)) {
                    this.isReloading = true;
                    if (this.crunchSound) this.crunchSound.pause();
                    location.reload();
                }
            }
        }

        // cat Lose
        if (this.catLoseState) {
            this.loseTimer += this.game.clockTick;
            if (this.loseTimer >= 5 && this.loseTimer - this.game.clockTick < 5) {
                if (this.punchSound) {
                    this.punchSound.currentTime = 0;
                    this.punchSound.play().catch(e => console.error(e));
                }
            }
            if (this.loseTimer > 10) {
                let anyKeyPressed = Object.values(this.game.keys).some(k => k === true);
                if (!this.isReloading && (this.game.click || anyKeyPressed)) {
                    this.isReloading = true;
                    if (this.punchSound) this.punchSound.pause();
                    location.reload();
                }
            }
        }

        // computer / safe Lose
        if (this.computerLoseState || this.safeLoseState) {
            this.loseTimer += this.game.clockTick;
            if (this.loseTimer > 5) {
                let anyKeyPressed = Object.values(this.game.keys).some(k => k === true);
                if (!this.isReloading && (this.game.click || anyKeyPressed)) {
                    this.isReloading = true;
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
        this.mapCached = false; //triggers the map to redraw at the correct scale

        if (this.game.collisionManager) {
            this.game.collisionManager.loadFromTiledJSON(this.level);
        }

        let rat = new Rat(this.game, 448, 196);
        rat.health = this.ratHealth; //restore health
        this.game.addEntity(rat);
        this.game.addEntity(new StuartBig(this.game, 200, 215, 2));
        let yorkieX = 320;
        let yorkieY = 150;
        if (this.yorkieState) {
            yorkieX = this.yorkieState.x;
            yorkieY = this.yorkieState.y;
        }
        let yorkieEnt = new Yorkie(this.game, yorkieX, yorkieY);
        if (this.yorkieState) {
            yorkieEnt.actionState = this.yorkieState.actionState;
            yorkieEnt.facing = this.yorkieState.facing;
            yorkieEnt.animator = yorkieEnt.animations.get(
                yorkieEnt.actionState === "SLEEPING" || yorkieEnt.actionState === "JERKY_IDLE" ? "sleep" : "sleep"
            )[yorkieEnt.facing];
        }
        this.game.addEntity(yorkieEnt);
        this.game.addEntity(new Door(this.game, 420, 90, "Level2", true));
        if (!this.hasGoldenKey) {
            this.game.addEntity(new GoldenKey(this.game, 65, 120));
        }

        // Play music
        this.currentMusicPath = "./assets/background_music.wav";
        this.game.audio.playMusic(this.currentMusicPath);
        this.game.addEntity(new HeartContainer(this.game, 1375, 540));
        this.parseInteractableLayers();
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

        let myComputer = new Computer(this.game, 1280, 490);

        // restore previous state if returning from level 1 or 3
        if (this.computerState) {
            myComputer.resumeState = this.computerState.resumeState;
            myComputer.isLoggedIn = this.computerState.isLoggedIn;
            myComputer.isUnlocked = this.computerState.isUnlocked;
            myComputer.verifyStep = this.computerState.verifyStep;
            myComputer.progress = this.computerState.progress;
            myComputer.state = myComputer.resumeState;
        }

        this.game.addEntity(myComputer);
        //ADD SNAKES TO LEVEL 2: restoring the state
        const stationarySnake = new Snake(this.game, 707, 130, null);

        // I fixed by giving snake persistent string ID so movement doesn't break saving
        stationarySnake.id = "level2_snake_main";
        this.loadSnakeState(stationarySnake, stationarySnake.id);

        // only add snake to the canvas if it's still alive
        if (!stationarySnake.dead && stationarySnake.health > 0) {
            this.game.addEntity(stationarySnake);

        }

        this.parseInteractableLayers();
        console.log("Level 2 Loaded!");
    }

    loadLevelThree() {
        // clear current entities, preserves SceneManager state like yorkieDefeated
        this.game.entities.forEach(entity => {
            if (!(entity instanceof SceneManager)) entity.removeFromWorld = true;
        });

        if (!this.hasBeefJerky) {
            this.game.addEntity(new BeefJerky(this.game, 450, 420));
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

        let safeX = 1075;
        let safeY = 90;

        // Create the Safe first
        let mySafe = new Safe(this.game, safeX, safeY);
        this.game.addEntity(mySafe);

        // Create the Keypad and pass the mySafe reference into it
        // Place the keypad near the safe on the wall
        let myKeypad = new Keypad(this.game, safeX - 60, safeY + 30, mySafe);
        this.game.addEntity(myKeypad);

        // place Rat at entrance to kitchen door
        let rat = new Rat(this.game, 80, 190);
        rat.health = this.ratHealth; // restore health
        this.game.addEntity(rat);

        this.game.addEntity(new BabyGate(this.game, 200, 470));
        // add door to return to Level 2
        this.game.addEntity(new Door(this.game, 80, 95, "Level2", false));

        //add cat in location that has yet to be determined
        let myCat = new Cat(this.game, 600, 200);
        if (this.catState) {
            myCat.health = this.catState.health;
            myCat.x = this.catState.x;
            myCat.y = this.catState.y;
            myCat.state = this.catState.state;

            // fast forward if already defeated
            if (myCat.state === "DEFEATED_WALK" || myCat.state === "SLEEPING") {
                myCat.state = "SLEEPING";
                myCat.x = 1170;
                myCat.y = 490;
                myCat.facing = 2; // down
                myCat.currentAnimation = myCat.animations.get("death")[myCat.facing];
            }
        }
        this.game.addEntity(myCat);
        this.parseInteractableLayers();
        //can add a patrol path too for it to be dynamic
        console.log("Loaded level 3!");
    }

    parseInteractableLayers() {
        this.interactableShapes = {};
        if (!this.level || !this.level.layers) return;
        const scale = this.scale; // 4
        for (const layer of this.level.layers) {
            if (layer.type === "objectgroup" && layer.name !== "collisions") {
                const allPoints = [];
                for (const obj of layer.objects) {
                    if (obj.polygon) {
                        const pts = obj.polygon.map(p => ({
                            x: (obj.x + p.x) * scale,
                            y: (obj.y + p.y) * scale
                        }));
                        allPoints.push(pts);
                    }
                }
                if (allPoints.length > 0) {
                    this.interactableShapes[layer.name] = allPoints;
                }
            }
        }
    }

    startIrisTransition(destination) {
        if (this.iris.active) return; // prevent double-trigger
        this.iris.active = true;
        this.iris.phase = "closing";
        this.iris.progress = 0;
        this.iris.pendingDestination = destination;
        this.iris.pendingFromLevel = this.levelNumber;
        this.game.paused = true;
    }

    saveSnakeState(snake, snakeId) {
        this.snakeStates.set(snakeId, {
            dead: snake.dead || snake.health <= 0, // fallback check if animation didn't finish
            health: snake.health,
            x: snake.x,
            y: snake.y
        });
    }

    saveYorkieState(yorkie) {
        this.yorkieState = {
            x: yorkie.x,
            y: yorkie.y,
            actionState: yorkie.actionState,
            facing: yorkie.facing
        };
    }

    saveComputerState(computer) {
        this.computerState = {
            resumeState: computer.resumeState,
            isLoggedIn: computer.isLoggedIn,
            isUnlocked: computer.isUnlocked,
            verifyStep: computer.verifyStep,
            progress: computer.progress
        };
    }

    saveCatState(cat) {
        this.catState = {
            state: cat.state,
            health: cat.health,
            x: cat.x,
            y: cat.y
        };
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

        // ONLY DRAW DEBUG STUFF IF WE ARE ON THE MAIN MENU and not in story intro
        // Drawn LAST so it renders on top of rat portraits
        if (this.menuActive && this.menu.state === "START") {
            const x = this.cbX;
            const y = this.cbY;
            const size = this.cbSize;

            ctx.save();

            // Debug checkbox — always visible on menu
            ctx.fillStyle = "rgba(34, 34, 34, 0.85)";
            ctx.fillRect(x - 4, y - 4, size + 140, size + 8);
            ctx.fillStyle = "rgba(34, 34, 34, 0.8)";
            ctx.fillRect(x, y, size, size);
            ctx.strokeStyle = "#ffcc00";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, size, size);
            ctx.fillStyle = "white";
            ctx.font = "12px 'Press Start 2P'";
            ctx.textAlign = "left";
            ctx.fillText("DEBUG MODE", x + size + 10, y + size - 6);

            // Draw debug panel with solid background to cover Rat4
            if (this.game.options && this.game.options.debugging) {
                ctx.fillStyle = "#39FF14";
                ctx.fillText("X", x + 5, y + size - 5);

                // Solid black background panel behind all debug buttons
                ctx.fillStyle = "rgba(10, 10, 10, 0.92)";
                ctx.fillRect(14, 120, 325, 260);
                ctx.strokeStyle = "#ffcc00";
                ctx.lineWidth = 2;
                ctx.strokeRect(14, 120, 325, 260);

                ctx.font = "10px 'Press Start 2P'";

                // button 1: Level 1 post intro
                ctx.fillStyle = "rgba(34, 34, 34, 0.9)";
                ctx.fillRect(20, 130, 310, 30);
                ctx.strokeStyle = "#ffcc00";
                ctx.strokeRect(20, 130, 310, 30);
                ctx.fillStyle = "white";
                ctx.fillText("WARP Level 1 (PRE-FIGHT)", 35, 151);

                // button 2: level 2 Alive
                ctx.fillStyle = "rgba(34, 34, 34, 0.9)";
                ctx.fillRect(20, 170, 310, 30);
                ctx.strokeStyle = "#ffcc00";
                ctx.strokeRect(20, 170, 310, 30);
                ctx.fillStyle = "white";
                ctx.fillText("WARP Level 2 (SNAKE ALIVE)", 35, 191);

                // button 3: Level 3 Snake Dead
                ctx.fillStyle = "rgba(34, 34, 34, 0.9)";
                ctx.fillRect(20, 210, 310, 30);
                ctx.strokeStyle = "#ffcc00";
                ctx.strokeRect(20, 210, 310, 30);
                ctx.fillStyle = "white";
                ctx.fillText("WARP Level 3 (SNAKE DEAD)", 35, 231);

                ctx.fillStyle = "rgba(34, 34, 34, 0.9)";
                ctx.fillRect(20, 250, 310, 30);
                ctx.strokeStyle = this.debugUnlimitedHealth ? "#39FF14" : "#ffcc00";
                ctx.strokeRect(20, 250, 310, 30);
                ctx.fillStyle = this.debugUnlimitedHealth ? "#39FF14" : "white";
                ctx.fillText(`UNLIMITED HEALTH: ${this.debugUnlimitedHealth ? "ON" : "OFF"}`, 35, 271);

                ctx.fillStyle = "rgba(34, 34, 34, 0.9)";
                ctx.fillRect(20, 290, 310, 30);
                ctx.strokeStyle = this.debugOnePunch ? "#39FF14" : "#ffcc00";
                ctx.strokeRect(20, 290, 310, 30);
                ctx.fillStyle = this.debugOnePunch ? "#39FF14" : "white";
                ctx.fillText(`ONE PUNCH MAN: ${this.debugOnePunch ? "ON" : "OFF"}`, 35, 311);

                ctx.fillStyle = "rgba(34, 34, 34, 0.9)";
                ctx.fillRect(20, 330, 310, 30);
                ctx.strokeStyle = this.debugNoDialogue ? "#39FF14" : "#ffcc00";
                ctx.strokeRect(20, 330, 310, 30);
                ctx.fillStyle = this.debugNoDialogue ? "#39FF14" : "white";
                ctx.fillText(`NO DIALOGUE: ${this.debugNoDialogue ? "ON" : "OFF"}`, 35, 351);
            }
            ctx.restore();
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

        if (this.game.options && this.game.options.debugging) {
            if (this.game.collisionManager) {
                this.game.collisionManager.draw(ctx);
            }
        }
    }

    drawOverlays(ctx) {
        ctx.restore();
        let heartAsset = ASSET_MANAGER.getAsset("./assets/hearts.png");
        let hpBarAsset = ASSET_MANAGER.getAsset("./assets/HPBar.png");
        let rat = this.game.entities.find(e => e.constructor.name === "Rat");

        if (heartAsset && rat) {
            // HP BAR, top-left, drawn FIRST
            const hpFrameH = 300;
            const hpFrameW = 300 * (hpBarAsset ? hpBarAsset.width / hpBarAsset.height : 1);
            const hpBarX = 10;
            const hpBarY = -100;
            const healthPct = Math.max(0, this.ratHealth / 10);

            if (hpBarAsset) {
                const insetLeft = hpFrameW * 0.18;
                const insetRight = hpFrameW * 0.065;
                const insetTop = hpFrameH * 0.432;
                const insetBottom = hpFrameH * 0.485;

                const fillX = hpBarX + insetLeft;
                const fillY = hpBarY + insetTop;
                const fillMaxW = hpFrameW - insetLeft - insetRight;
                const fillH = hpFrameH - insetTop - insetBottom;

                ctx.save();

                // Clip to inner fill area
                ctx.beginPath();
                ctx.rect(fillX, fillY, fillMaxW, fillH);
                ctx.clip();

                // dark background for empty portion
                ctx.fillStyle = "#2a0000";
                ctx.fillRect(fillX, fillY, fillMaxW, fillH);

                // Multi color health fill: green → yellow → orange → red
                if (healthPct > 0) {
                    let r, g, b = 30;
                    if (healthPct > 0.75) {
                        // Green to Yellow (75%-100%)
                        const t = (healthPct - 0.75) / 0.25;
                        r = Math.floor(255 * (1 - t));
                        g = 220;
                    } else if (healthPct > 0.5) {
                        // Yellow to Orange (50%-75%)
                        const t = (healthPct - 0.5) / 0.25;
                        r = 255;
                        g = Math.floor(120 + 100 * t);
                    } else if (healthPct > 0.25) {
                        // Orange to Red (25%-50%)
                        const t = (healthPct - 0.25) / 0.25;
                        r = 255;
                        g = Math.floor(120 * t);
                    } else {
                        // Deep Red (0%-25%)
                        r = 200;
                        g = 0;
                    }
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    ctx.fillRect(fillX, fillY, fillMaxW * healthPct, fillH);
                }

                ctx.restore(); // release clip

                // draw frame on top
                ctx.drawImage(hpBarAsset, hpBarX, hpBarY, hpFrameW, hpFrameH);
            }

            // LIVES, hearts drawn BELOW the HP bar
            const heartWidth = 200;
            const heartHeight = 200;
            const heartScale = 0.40;
            const drawW = heartWidth * heartScale;
            const drawH = heartHeight * heartScale;
            const startX = hpBarX + 25;
            const startY = hpBarY + hpFrameH - 125;

            const spacing = 0;

            let isRecovering = rat && rat.isRecovering;
            let recoveryTimer = rat ? rat.recoveryTimer : 0;

            for (let i = 0; i < this.maxLives; i++) {
                let sourceX = 0;
                if (i < this.ratLives) {
                    if (isRecovering && i === this.ratLives - 1) {
                        let flashRed = Math.floor(recoveryTimer / 0.1) % 2 === 0;
                        sourceX = flashRed ? 200 : 0;
                    } else {
                        sourceX = 0;
                    }
                } else {
                    sourceX = 400;
                }

                ctx.drawImage(
                    heartAsset,
                    sourceX, 0, heartWidth, heartHeight,
                    startX + i * (drawW + spacing), startY, drawW, drawH
                );
            }

            // poison meter UI (bottom-right corner)
            let poisonMeterAsset = ASSET_MANAGER.getAsset("./assets/poisonmeter.png");
            if (poisonMeterAsset && rat) {
                const meterH = 210;
                const meterW = Math.round(meterH * (poisonMeterAsset.width / poisonMeterAsset.height));
                const meterX = ctx.canvas.width - meterW - 20;
                const meterY = ctx.canvas.height - meterH - 30;

                const cooldownPct = rat.poisonCooldown > 0 ? rat.poisonCooldown / rat.poisonCooldownMax : 0;
                const fillPct = 1 - cooldownPct;

                const pInsetLeft = meterW * 0.25;     // left border thickness
                const pInsetRight = meterW * 0.3;    // right border thickness
                const pInsetTop = meterH * 0.065;      // top cap thickness
                const pInsetBottom = meterH * 0.02;   // bottom cap thickness

                const pFillX = meterX + pInsetLeft;
                const pFillMaxW = meterW - pInsetLeft - pInsetRight;
                const pFillMaxH = meterH - pInsetTop - pInsetBottom;
                const pFillBaseY = meterY + pInsetTop; // top of the fillable area

                ctx.save();

                // Clip to inner area so green can NEVER bleed past the frame
                ctx.beginPath();
                ctx.rect(pFillX, pFillBaseY, pFillMaxW, pFillMaxH);
                ctx.clip();

                // Draw filled portion from bottom up
                if (fillPct > 0) {
                    const fillH = pFillMaxH * fillPct;
                    const fillY = pFillBaseY + pFillMaxH - fillH;
                    ctx.fillStyle = "#39FF14";
                    ctx.globalAlpha = 0.7;
                    ctx.fillRect(pFillX, fillY, pFillMaxW, fillH);
                    ctx.globalAlpha = 1;
                }

                ctx.restore(); // releases clip

                // draw the meter frame image ON TOP so borders cover edges
                ctx.drawImage(poisonMeterAsset, meterX, meterY, meterW, meterH);

                // "POISON" label below
                ctx.save();
                ctx.fillStyle = fillPct >= 1 ? "#39FF14" : "#666666";
                ctx.font = "10px 'Press Start 2P', Courier";
                ctx.textAlign = "center";
                ctx.fillText("POISON", meterX + meterW / 2, meterY + meterH + 16);
                ctx.restore();
            }

            if (poisonMeterAsset && rat && rat.maxStamina) {
                const sMeterH = 210;
                const sMeterW = Math.round(sMeterH * (poisonMeterAsset.width / poisonMeterAsset.height));
                const sMeterX = ctx.canvas.width - (sMeterW * 2) - 70;
                const sMeterY = ctx.canvas.height - sMeterH - 30;

                const staminaPct = Math.max(0, Math.min(1, rat.stamina / rat.maxStamina));

                // Using the exact same insets as the poison meter to fit the bottle frame perfectly
                const sInsetLeft = sMeterW * 0.25;
                const sInsetRight = sMeterW * 0.3;
                const sInsetTop = sMeterH * 0.065;
                const sInsetBottom = sMeterH * 0.02;

                const sFillX = sMeterX + sInsetLeft;
                const sFillMaxW = sMeterW - sInsetLeft - sInsetRight;
                const sFillMaxH = sMeterH - sInsetTop - sInsetBottom;
                const sFillBaseY = sMeterY + sInsetTop;

                ctx.save();

                // Clip to inner area so the blue doesn't bleed out of the bottle
                ctx.beginPath();
                ctx.rect(sFillX, sFillBaseY, sFillMaxW, sFillMaxH);
                ctx.clip();

                // Draw filled portion from bottom up
                if (staminaPct > 0) {
                    const fillH = sFillMaxH * staminaPct;
                    const fillY = sFillBaseY + sFillMaxH - fillH;

                    // Turns grey when the rat is locked in the exhausted state
                    ctx.fillStyle = rat.isExhausted ? "#888888" : "#00FFFF";
                    ctx.globalAlpha = 0.7;
                    ctx.fillRect(sFillX, fillY, sFillMaxW, fillH);
                    ctx.globalAlpha = 1;
                }

                ctx.restore();

                // Draw the recycled frame image on top
                ctx.drawImage(poisonMeterAsset, sMeterX, sMeterY, sMeterW, sMeterH);

                // "STAMINA" label
                ctx.save();
                ctx.fillStyle = staminaPct >= 1 ? "#00FFFF" : (rat.isExhausted ? "#888888" : "#00CCCC");
                ctx.font = "10px 'Press Start 2P', Courier";
                ctx.textAlign = "center";
                ctx.fillText("STAMINA", sMeterX + sMeterW / 2, sMeterY + sMeterH + 16);
                ctx.restore();
            }

            if (this.game.options && this.game.options.debugging) {
                if (rat) {
                    ctx.save();
                    ctx.fillStyle = "red";
                    ctx.font = "bold 40px 'Courier New', Courier, monospace";
                    ctx.textAlign = "left";
                    ctx.fillText(`X: ${Math.floor(rat.x)} | Y: ${Math.floor(rat.y)}`, 40, ctx.canvas.height - 40);
                    // FPS counter
                    let fps = Math.round(1 / this.game.clockTick);

                    // multi-tier color system for performance tracking
                    if (fps >= 100) {
                        ctx.fillStyle = "#00FFFF"; // Cyan: Ultra-smooth (120Hz ProMotion)
                    } else if (fps >= 55) {
                        ctx.fillStyle = "#39FF14"; // Neon Green: Standard smooth (60 FPS)
                    } else if (fps >= 40) {
                        ctx.fillStyle = "yellow";  // Yellow: Slight frame drops
                    } else {
                        ctx.fillStyle = "red";     // Red: Noticeable lag
                    }

                    ctx.fillText(`FPS: ${fps}`, 40, ctx.canvas.height - 90);
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

        if (this.dialogueActive) this.dialogue.draw(ctx);
        if (this.paused) this.pauseMenu.draw(ctx);
        if (this.itemPopupActive) {
            let textBox = ASSET_MANAGER.getAsset("./assets/text-box.png");
            if (textBox) {
                let boxW = 1200;
                let boxH = 120 + (this.itemPopupText.length * 40);
                let boxX = (ctx.canvas.width - boxW) / 2;
                let boxY = ctx.canvas.height - boxH - 40;

                ctx.drawImage(textBox, boxX, boxY, boxW, boxH);
                ctx.fillStyle = "black";
                ctx.font = "20px 'Press Start 2P', Courier";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                for (let i = 0; i < this.itemPopupText.length; i++) {
                    ctx.fillText(this.itemPopupText[i], ctx.canvas.width / 2, boxY + 80 + (i * 40));
                }

                if (Math.floor(Date.now() / 500) % 2 === 0) {
                    ctx.font = "12px 'Press Start 2P', Courier";
                    ctx.fillStyle = "#333333";
                    ctx.fillText("Press SPACE to continue", ctx.canvas.width / 2, boxY + boxH - 60);
                }
                ctx.textBaseline = "alphabetic";
            }
            return;
        }
        // Iris transition overlay
        if (this.iris.active && this.iris.progress > 0) {
            let rat = this.game.entities.find(e => e.constructor.name === "Rat");
            let focusX = ctx.canvas.width / 2;
            let focusY = ctx.canvas.height / 2;
            if (rat) {
                // Convert rat world-space to screen-space
                focusX = (rat.x - this.x) * this.zoom + (24 * rat.scale * this.zoom);
                focusY = (rat.y - this.y) * this.zoom + (19 * rat.scale * this.zoom);
            }
            // Ease-in for closing, ease-out for opening (snappy feel)
            let eased = this.iris.progress;
            if (this.iris.phase === "closing") {
                eased = eased * eased; // accelerate toward black
            } else if (this.iris.phase === "opening") {
                eased = 1 - Math.pow(1 - eased, 2); // decelerate as it opens
            }
            InteractionFX.drawIris(ctx, focusX, focusY, eased, ctx.canvas.width, ctx.canvas.height);
        }
        if (this.isFading) {
            ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            this.fadeAlpha -= 0.01;
            if (this.fadeAlpha <= 0) {
                this.fadeAlpha = 0;
                this.isFading = false;
            }
        }
        // win logic
        if (this.winState) {
            ctx.save();
            ctx.fillStyle = "black";
            // ensure valid alpha
            let alpha = Math.max(0, Math.min(1, this.winTimer / 2));
            if (isNaN(alpha)) alpha = 1;
            ctx.globalAlpha = alpha;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();

            if (this.winTimer > 2) {
                let boxWidth = 950;
                let boxHeight = 350;
                let boxX = (ctx.canvas.width - boxWidth) / 2;
                let boxY = ctx.canvas.height / 2 - boxHeight / 2;

                ctx.save();
                ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
                ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
                ctx.strokeStyle = "gold";
                ctx.lineWidth = 4;
                ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

                ctx.textAlign = "center";
                ctx.fillStyle = "gold";
                ctx.font = "bold 48px 'Press Start 2P', Courier";
                ctx.fillText("YOU SECURED THE 🧀", ctx.canvas.width / 2, boxY + 80);

                ctx.fillStyle = "white";
                ctx.font = "16px 'Press Start 2P', Courier";
                ctx.fillText("The colony is saved, and you've officially earned", ctx.canvas.width / 2, boxY + 140);
                ctx.fillText("the title of a true hero in the basement walls.", ctx.canvas.width / 2, boxY + 180);
                ctx.fillText("You are safe for infinite winters.", ctx.canvas.width / 2, boxY + 220);

                // Replaced the emoji with text to prevent the canvas crash
                ctx.font = "bold 60px 'Press Start 2P', Courier";
                ctx.fillText("WIN", ctx.canvas.width / 2, boxY + 310);

                if (this.winTimer > 5) {
                    ctx.font = "30px 'Press Start 2P', Courier";
                    ctx.fillStyle = "gold";
                    ctx.fillText("PRESS ANY KEY TO RESTART", ctx.canvas.width / 2, ctx.canvas.height - 40);
                }
                ctx.restore();
            }
            return;
        }
        if (this.loseState) {
            if (this.loseTimer < 5) {
                ctx.save();
                ctx.fillStyle = "black";
                ctx.globalAlpha = Math.min(1, this.loseTimer / 5);
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
                return;
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

        if (this.catLoseState) {
            if (this.loseTimer < 5) {
                ctx.save();
                ctx.fillStyle = "black";
                ctx.globalAlpha = Math.min(1, this.loseTimer / 5);
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
                return;
            }

            ctx.save();
            ctx.fillStyle = "black";
            ctx.globalAlpha = 1;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();

            const scale = 1.5;
            const frameWidth = 533.33 * scale;
            const frameHeight = 529 * scale;
            const xPos = (ctx.canvas.width - frameWidth) / 2;
            const yPos = (ctx.canvas.height - frameHeight) / 2;

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
        if (this.winState) {
            ctx.save();
            ctx.fillStyle = "black";
            ctx.globalAlpha = Math.min(1, this.winTimer / 2);
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();

            if (this.winTimer > 2) {
                let boxWidth = 950;
                let boxHeight = 350;
                let boxX = (ctx.canvas.width - boxWidth) / 2;
                let boxY = ctx.canvas.height / 2 - boxHeight / 2;

                ctx.save();
                ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
                ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
                ctx.strokeStyle = "gold";
                ctx.lineWidth = 4;
                ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
                ctx.restore();

                ctx.textAlign = "center";

                ctx.fillStyle = "gold";
                ctx.font = "bold 48px 'Press Start 2P', Courier";
                ctx.fillText("YOU SECURED THE BAG!", ctx.canvas.width / 2, boxY + 80);

                ctx.fillStyle = "white";
                ctx.font = "16px 'Press Start 2P', Courier";
                ctx.fillText("The colony is saved, and you've officially earned", ctx.canvas.width / 2, boxY + 140);
                ctx.fillText("the title of a true hero in the basement walls.", ctx.canvas.width / 2, boxY + 180);
                ctx.fillText("You are safe for infinite winters.", ctx.canvas.width / 2, boxY + 220);

                ctx.font = "bold 80px 'Press Start 2P', Courier";
                ctx.fillText("🧀", ctx.canvas.width / 2, boxY + 310);

                if (this.winTimer > 5) {
                    ctx.font = "30px 'Press Start 2P', Courier";
                    ctx.fillStyle = "gold";
                    ctx.fillText("PRESS ANY KEY TO RESTART", ctx.canvas.width / 2, ctx.canvas.height - 40);
                }
            }
            return;
        }
        if (this.computerLoseState || this.safeLoseState) {
            ctx.save();
            ctx.fillStyle = "black";
            ctx.globalAlpha = Math.min(1, this.loseTimer / 2);
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();

            if (this.loseTimer > 2) {
                let boxWidth = 950;
                let boxHeight = 300;
                let boxX = (ctx.canvas.width - boxWidth) / 2;
                let boxY = ctx.canvas.height / 2 - boxHeight / 2;

                ctx.save();
                ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
                ctx.strokeStyle = "white";
                ctx.lineWidth = 4;
                ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
                ctx.restore();

                ctx.textAlign = "center";

                if (this.computerLoseState) {
                    ctx.fillStyle = "red";
                    // game over text
                    ctx.font = "bold 48px 'Press Start 2P', Courier";
                    ctx.fillText("GAME OVER", ctx.canvas.width / 2, boxY + 60);

                    // smaller subtext
                    ctx.font = "20px 'Press Start 2P', Courier";
                    ctx.fillText("Security tripped! The giants are coming", ctx.canvas.width / 2, boxY + 110);
                    ctx.fillText("and they brought the big traps.", ctx.canvas.width / 2, boxY + 150);
                    ctx.font = "bold 100px 'Press Start 2P', Courier";
                    ctx.fillText("🤡", ctx.canvas.width / 2, boxY + 250);
                } else if (this.safeLoseState) {
                    ctx.fillStyle = "white";
                    ctx.font = "20px 'Press Start 2P', Courier";
                    ctx.fillText("Game Over: You've been locked out.", ctx.canvas.width / 2, boxY + 60);
                    ctx.fillText("The colony will starve, but hey,", ctx.canvas.width / 2, boxY + 95);
                    ctx.fillText("at least you tried... poorly.", ctx.canvas.width / 2, boxY + 130);
                }

                if (this.loseTimer > 5) {
                    ctx.font = "30px 'Press Start 2P', Courier";
                    ctx.fillStyle = "red";
                    ctx.textAlign = "center";
                    ctx.fillText("PRESS ANY KEY TO RESTART", ctx.canvas.width / 2, ctx.canvas.height - 40);
                }
            }
        }

        let computer = this.game.entities.find(e => e instanceof Computer);
        if (computer) {
            computer.drawUI(ctx);
        }
        let keypad = this.game.entities.find(e => e instanceof Keypad);
        if (keypad) keypad.drawUI(ctx);

        let heartContainer = this.game.entities.find(e => e.constructor.name === "HeartContainer");
        if (heartContainer) heartContainer.drawUI(ctx);
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
            } else if (entity.constructor.name === "Computer") {
                ctx.fillStyle = "blue";
                ctx.fillRect(entX - 3, entY - 3, 6, 6);
            } else if (entity.constructor.name === "BeefJerky") {
                ctx.fillStyle = "brown";
                ctx.fillRect(entX - 2, entY - 2, 4, 4);
            } else if (entity.constructor.name === "Cat") {
                ctx.arc(entX + 7, entY + 5, 5, 0, Math.PI * 2);
                ctx.fillStyle = "orange";
                ctx.fill();
            } else if (entity.constructor.name === "Safe") {
                ctx.fillStyle = "#f6ff00";
                ctx.fillRect(entX - 20, entY, 10, 10);
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

    skipToLevel1() {
        this.stuartIntroPlayed = true;
        this.loreCompleted = true;
        this.yorkieDefeated = false;
        this.storyState = "YORKIE_CHALLENGE";
        // key has NOT been collected so the player must still find it
        this.hasGoldenKey = false;
        this.menuActive = false;
        this.dialogueActive = false;
        this.game.paused = false;
        this.game.entities.forEach(entity => {
            if (entity !== this) entity.removeFromWorld = true;
        });
        this.loadLevelOne();
        let yorkie = this.game.entities.find(e => e.constructor.name === "Yorkie");
        if (yorkie) {
            yorkie.actionState = "PRE_FIGHT";
            yorkie.animator = yorkie.animations.get("sleep")[yorkie.facing];
        }
        this.mapCached = false;
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
        this.snakeDefeatTextPlayed = false;
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
        this.snakeDefeatTextPlayed = true;
        this.loadLevelThree();
        this.mapCached = false;
    }
}