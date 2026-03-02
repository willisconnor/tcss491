// This game shell was happily modified from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

class GameEngine {
    constructor(options) {
        // What you will use to draw
        // Documentation: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
        this.ctx = null;

        // Everything that will be updated and drawn each frame
        this.entities = [];
        this.paused = false;

        // Initializes audio class
        this.audio = new SceneAudio();
        
        // Information on the input
        this.click = null;
        this.mouse = null;
        this.wheel = null;
        this.typing = false; // When true, WASD won't move the rat
        this.keys = {
            "Escape": false, // Jayda added
            "ShiftLeft" : false,
            "ArrowRight" : false,
            "ArrowUp" : false,
            "ArrowDown" : false,
            "ArrowLeft" : false,
            "Digit1": false,
            "Space" : false,
            "KeyD" : false,
            "KeyW" : false,
            "KeyS" : false,
            "KeyA" : false,
            "KeyE": false,
            // X is for testing death animation
            "KeyX" : false
        };

        // Options and the Details
        this.options = options || {
            debugging: false,
        };
    };

    init(ctx) {
        this.ctx = ctx;
        this.startInput();
        this.timer = new Timer();
    };

    start() {
        this.running = true;
        const gameLoop = () => {
            this.loop();
            requestAnimFrame(gameLoop, this.ctx.canvas);
        };
        gameLoop();
    };

    stop() { //Jayda added this method 
    this.running = false;
    this.entities = [];
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    // Optional: Draw a final "Goodbye" message
    this.ctx.fillStyle = "white";
    this.ctx.font = "30px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Game Session Ended. Refresh to Restart.", this.ctx.canvas.width/2, this.ctx.canvas.height/2);
    };

    startInput() {
        this.ctx.canvas.tabIndex = 0;
    
        // Define the coordinate helper first
        const getXandY = e => {
            const rect = this.ctx.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (this.ctx.canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (this.ctx.canvas.height / rect.height);
            return { x: x, y: y };
        };

        // Now attach the listeners
        this.ctx.canvas.addEventListener("mousemove", e => {
            if (this.options.debugging) console.log("MOUSE_MOVE", getXandY(e));
            this.mouse = getXandY(e);
        });

        this.ctx.canvas.addEventListener("click", e => {
            if (this.options.debugging) console.log("CLICK", getXandY(e));
            this.click = getXandY(e);

            // force Chrome to recognize the interaction immediately
            // if SceneAudio uses a Web Audio API context; resumes it directly inside trusted user event
            if (this.audio && this.audio.ctx && this.audio.ctx.state === 'suspended') {
                this.audio.ctx.resume().catch(err => console.log(err));
            } else if (this.audio && this.audio.audioContext && this.audio.audioContext.state === 'suspended') {
                this.audio.audioContext.resume().catch(err => console.log(err));
            }
        });

        this.ctx.canvas.addEventListener("wheel", e => {
         if (this.options.debugging) console.log("WHEEL", getXandY(e), e.wheelDelta);
         e.preventDefault(); 
         this.wheel = e;
        });

     this.ctx.canvas.addEventListener("contextmenu", e => {
          if (this.options.debugging) console.log("RIGHT_CLICK", getXandY(e));
          e.preventDefault(); 
           this.rightclick = getXandY(e);
        });

        // KEYBOARD INPUT WITH TYPING LOGIC
        this.ctx.canvas.addEventListener("keydown", event => {
            if (this.typing) {
                // If the game is in 'typing mode', capture the literal key (e.g., "a", "Enter")
                // This prevents the Rat from walking while the player types their name
               this.lastInput = event.key; 
            } else {
             // Normal gameplay movement
               this.keys[event.code] = true;
            }
        });

        this.ctx.canvas.addEventListener("keyup", event => {
           this.keys[event.code] = false;
        });
    };

    addEntity(entity) {
        this.entities.push(entity);
    };

    draw() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.imageSmoothingEnabled = false;
        // if Menu active, let SceneManager handle everything
        if (this.camera && this.camera.menuActive) {
            this.camera.draw(this.ctx);
            return;
        }

        // draw background (world tiles)
        if (this.camera) {
            this.camera.drawWorld(this.ctx);
        }

        // draw Entities (characters, items)
        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            // do not draw camera (SceneManager) here, we handle it manually
            if (entity !== this.camera) {
                entity.draw(this.ctx, this);
            }
        }

        // draw overlays (dialogue, fade, pause) on TOP of entities
        if (this.camera) {
            this.camera.drawOverlays(this.ctx);
        }
    }



    update() {
        let entitiesCount = this.entities.length;
        if (this.camera) this.camera.update();

        for (let i = 0; i < entitiesCount; i++) {
            let entity = this.entities[i];

            if (this.camera && this.camera.menuActive) {
                if (entity === this.camera) entity.update();
            } else {
                // Add Yorkie and PoisonParticle to the list of things that NEVER stop
                let isEssential = entity.constructor.name === "GoldenKey" ||
                    entity.constructor.name === "BeefJerky" ||
                    entity.constructor.name === "Yorkie" || 
                    entity.constructor.name === "PoisonParticle" ||
                    entity === this.camera;

                if (!this.paused || isEssential) {
                    if (!entity.removeFromWorld) {
                        entity.update();
                    }
                }
            }
        }
        for (let i = this.entities.length - 1; i >= 0; --i) {
            if (this.entities[i].removeFromWorld) {
                this.entities.splice(i, 1);
            }
        }
    }

    loop() {
        this.clockTick = this.timer.tick();
        this.update();
        this.draw();
    };

}

// KV Le was here :)