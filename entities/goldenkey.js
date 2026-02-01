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
                        if (this.collected && this.showMessage) {
                            if (this.game.keys["Space"]) {
                                this.showMessage = false;
                                this.game.paused = false;
                                this.game.keys["Space"] = false; // reset to prevent immediate retrigger
                            }
                            return;
                        }
                        if (this.collected) {return;}

                        // pulsate effect
                        this.pulseTime += this.game.clockTick * this.pulseSpeed;
                        this.scale = this.baseScale + Math.sin(this.pulseTime) * this.pulseAmount;
                        this.width = this.sprite.width * this.scale;
                        this.height = this.sprite.height * this.scale;

                        // check collision with Rat
                        const rat = this.game.entities.find(e => e instanceof Rat);
                        if (rat) {
                            const ratBox = {
                                x: rat.x,
                                y: rat.y,
                                width: rat.animator.width * rat.scale,
                                height: rat.animator.height * rat.scale
                            };
                            const keyBox = {
                                x: this.x,
                                y: this.y,
                                width: this.width,
                                height: this.height
                            };

                            if (this.rectCollide(ratBox, keyBox)) {
                                this.collected = true;
                                this.showMessage = true;
                                this.game.paused = true;
                            }
                        }
                    }

                    rectCollide(boxA, boxB) {
                        return boxA.x < boxB.x + boxB.width && boxA.x + boxA.width > boxB.x &&
                               boxA.y < boxB.y + boxB.height && boxA.y + boxA.height > boxB.y;
                    }

                    draw(ctx) {
                        if (!this.collected) {
                            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
                        }

                        if (this.showMessage) {
                            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                            ctx.fillRect(this.game.ctx.canvas.width / 2 - 200, this.game.ctx.canvas.height / 2 - 50, 400, 100);
                            ctx.fillStyle = "gold";
                            ctx.font = "24px Arial";
                            ctx.textAlign = "center";
                            ctx.fillText("You've retrieved the key!!", this.game.ctx.canvas.width / 2, this.game.ctx.canvas.height / 2 - 10);
                            ctx.fillStyle = "white";
                            ctx.font = "16px Arial";
                            ctx.fillText("Press the spacebar to continue...", ctx.canvas.width / 2, ctx.canvas.height / 2 + 25);
                        }
                    }
                }