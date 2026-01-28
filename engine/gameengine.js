// This game shell was happily modified from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

class GameEngine {
    constructor(options) {
        // What you will use to draw
        // Documentation: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
        this.ctx = null;

        // Everything that will be updated and drawn each frame
        this.entities = [];

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
            "Space" : false,
            "KeyD" : false,
            "KeyW" : false,
            "KeyS" : false,
            "KeyA" : false,
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
        const getXandY = e => ({
         x: e.clientX - this.ctx.canvas.getBoundingClientRect().left,
         y: e.clientY - this.ctx.canvas.getBoundingClientRect().top
        });

     this.ctx.canvas.addEventListener("mousemove", e => {
         if (this.options.debugging) console.log("MOUSE_MOVE", getXandY(e));
         this.mouse = getXandY(e);
        });

        this.ctx.canvas.addEventListener("click", e => {
         if (this.options.debugging) console.log("CLICK", getXandY(e));
            this.click = getXandY(e);
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

    for (let i = this.entities.length - 1; i >= 0; i--) {
        let entity = this.entities[i];
        
        // --- ADD THIS CHECK ---
        // If menu is active, ONLY draw the SceneManager (which draws the menu)
        if (this.camera && this.camera.menuActive) {
            if (entity === this.camera) entity.draw(this.ctx, this);
        } else {
            entity.draw(this.ctx, this);
        }
    }
};

    update() {
    let entitiesCount = this.entities.length;

    for (let i = 0; i < entitiesCount; i++) {
        let entity = this.entities[i];

        if (!entity.removeFromWorld) {
            /** * This check ensures that if the menu is active, 
             * only the SceneManager (this.camera) logic runs.
             */
            if (this.camera && this.camera.menuActive) {
                if (entity === this.camera) {
                    entity.update();
                }
            } else {
                // If menu is NOT active, update everything normally
                entity.update();
            }
        }
    }

    // This part stays at the bottom to clean up dead entities
    for (let i = this.entities.length - 1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }
};

    loop() {
        this.clockTick = this.timer.tick();
        this.update();
        this.draw();
    };

}

// KV Le was here :)