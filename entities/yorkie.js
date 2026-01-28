// Author: Connor Willis

//Notes:
//yorkie is an entity that is going to stand in front of the door
//when the rat player interacts with said yorkie, it will give dialogue
//the yorkie will then intiaite a psuedo fight, in which the yorkie simply stands up and does not move
//after the rat attacks the yorkie 5 times, the yorkie will then move out of the way, allowing the rat to pass
//however, it will request dog treats from the new room the rat is going to enter
//then, in the new spot, it will fall back to sleep until the rat interacts with it
//while it has the dog treats.

class Yorkie {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        
        this.facing = 0;
        this.scale = 1;
        this.showMessage = false; //flag to show message when interacting, change later when
        //interaction system is in place

        this.sprite = ASSET_MAMAGER.getAsset("./assets/yorkie animation.png");
        this.width = this.sprite.width * this.scale;
        this.height = this.sprite.height * this.scale;
        this.canvas = document.getElementById("gameWorld");
        // 0 = left, 1 = right, 2 = down, 3 = up
        
        
    };

    update() {
       



        //check rat collision
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
                }
            }
    }

    rectCollide(boxA, boxB) {
        return boxA.x < boxB.x + boxB.width && boxA.x + boxA.width > boxB.x &&
                boxA.y < boxB.y + boxB.height && boxA.y + boxA.height > boxB.y;
    }

    draw(ctx) {
        ctx.imageSmoothingEnabled = false;
        this.animator.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.scale);
    };

}