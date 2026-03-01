class Dialogue {
    constructor(game, sceneManager) {
        this.game = game;
        this.sceneManager = sceneManager;
        this.portrait = ASSET_MANAGER.getAsset("./assets/StuartBigDialogue.png");
        this.speaker = "Stuart Big";
        this.playerName = "";

        this.portraitFrame = 0;
        this.portraitTimer = 0;
        this.currentIndex = 0;
        this.displayText = "";
        this.currentIndex = 0;
        this.displayText = "";
        this.charIndex = 0;
        this.typeTimer = 0;
        
        // Old line-based system (for Yorkie and other NPCs)
        this.lines = [];
        this.currentLine = 0;
        
        this.phase = "INTRO"; // INTRO or INQUIRY
        this.selectedChoiceIndex = null; // which choice was selected
        this.displayingChoiceResponse = false; // track if showing a choice response
        this.selectedQuestions = new Set(); // track which Phase 2 questions were asked
        this.currentQuestionIndex = null; // for tracking Deep Inquiry state
        this.askingFollowUp = false; // tracking which question shows a follow-up
        this.exitingAfterResponse = false; // flag to exit after showing exit response
        this.mouseX = 0;
        this.mouseY = 0;

        // Phase 1: Interactive Introduction with choices
        this.dialogues = [
            // 1. Opening
            { speaker: "Stuart Big", text: "Squeak! A new set of whiskers in the walls? I haven't seen a living soul since... well, since I lost mine.", type: "dialogue" },
            { speaker: "Stuart Big", text: "", type: "choice", choices: [
                { text: "Wait... you're a ghost?", response: "In the fur. Or lack thereof. I'm a lingering echo of what happens when a rat's ambition exceeds his reach." },
                { text: "I'm sorry for your loss.", response: "Don't be. It's much quieter this way. No fleas, and I never have to worry about a mousetrap again." }
            ], nextIndex: 2 },
            // 2. Name asking
            { speaker: "Stuart Big", text: "Tell me, young scout... what do they call you in the Great Below?", type: "dialogue" },
            { speaker: "Stuart Big", text: "", type: "input_name", nextIndex: 4 },
            // 3. (skipped, input_name uses nextIndex)
            // 4. Name acknowledgment
            { speaker: "Stuart Big", text: "Ah, {NAME}... a fine name for a scout. I am Stuart Big, once the Chosen, now your spirit guide.", type: "dialogue" },
            // 5. Golden Wheel and Chosen explanation
            { speaker: "Stuart Big", text: "I sought the legendary Golden Wheel once—a treasure of infinite bounty—but my paws slipped at the Great Gate. My poor tail still aches from the fall.", type: "dialogue" },
            { speaker: "Stuart Big", text: "", type: "choice", choices: [
                { text: "What does it mean to be 'The Chosen'?", response: "It's a heavy title for a small rat. It means the colony has pinned their hopes of survival on your paws. Don't let the pressure go to your head." },
                { text: "The Golden Wheel is actually real?", response: "Real enough to die for, as I can attest. It is a wheel of cheddar so aged and pure it glows like the sun. The Giants hide it in the Forbidden Hearth." }
            ], nextIndex: 7 },
            // 7. Baby Gate
            { speaker: "Stuart Big", text: "Listen well: To reach the Forbidden Hearth, you must find the Golden Key to unlock the Baby Gate.", type: "dialogue" },
            // 8. Edgar and Yorkie
            { speaker: "Stuart Big", text: "The key is guarded by Edgar Barkley, a Yorkie in the living room. He is technically an ally, but he is a creature of hollow loyalty and bottomless greed.", type: "dialogue" },
            // 9. Beasts threat
            { speaker: "Stuart Big", text: "He's terrified of the 'Beasts'—the Giants' other pets—who have taken over the path to the kitchen. He won't let you pass unless you prove you can clear a way for his snacks.", type: "dialogue" },
            // 10. Final question before Deep Inquiry
            { speaker: "Stuart Big", text: "He treats that key like a relic. Now, any last questions before you face the beast?", type: "dialogue" },
            { speaker: "Stuart Big", text: "", type: "end_of_intro", nextIndex: -1 } // -1 means go to Phase 2
        ];

        // Phase 2: Deep Inquiry - Question Menu for Stuart
        this.stuartQuestions = [
            { text: "The Golden Wheel... tell me the full legend.", response: "It is more than just a meal, {NAME}. The elders say it was carved from the first harvest of the Great Meadow before the Giants ever built these walls. It never spoils, and a single bite can sustain a rat for a month. To our colony, it is the difference between a winter of starvation and a golden age of plenty. I saw it once—sitting atop the Hearth like a fallen sun." },
            { text: "How exactly did you... pass away?", response: "A tragic slip from the rafters, a 40-foot tumble, and a very unfortunate encounter with the Giants' vacuum cleaner. Let's just say I'm much more aerodynamic now than I was then.", followUp: { text: "Wait... tell me the rest of that story.", response: "I was inches away, {NAME}. I could smell the sharp tang of the Wheel. I heard the 'Beasts' shout below, and I panicked. I jumped for a curtain rod that wasn't there. As I fell, I saw the Giant's youngest pet—the cat—watching me with those cold, green eyes. I didn't even hit the floor before the vacuum was switched on. It was... efficient. Don't let your greed outpace your grip." } },
            { text: "Why are the Giant's pets called 'Beasts'?", response: "Because to a rat, a 'pet' is just a monster with a collar. The Giants pamper them with soft beds and silver bowls, while we dodge their claws in the dark. They've grown territorial and mean. They aren't just animals anymore; they are the house's standing army." },
            { text: "Why do we call it the Great Below?", response: "It is our kingdom—the pipes, the insulation, the dark corners. To us, it is a palace. To the Giants, it's just 'the basement.' Perspective is everything, {NAME}." },
            { text: "I'm ready. I'll go find Edgar.", response: "Good luck, {NAME}. Show him the 'tooth and claw' tactics of the Great Below, and don't let your tail drag!", exit: true }
        ];

        // Inquiry questions for Edgar the Yorkie
        this.yorkieQuestions = [
            { text: "What was the computer password again?", response: "Seriously? It's 'LoveEdgar123'. Hard to forget the name of the favorite child, isn't it?" },
            { text: "Who's a good boy?", response: "I am! I—wait, no! I'm a fierce guardian of the hall! Stop patronizing me with Giant-talk!" },
            { text: "I'll leave you to your jerky.", response: "Mmph... *chomp*... yeah, beat it. Let me eat in peace.", exit: true }
        ];

        // Active deep questions array
        this.deepQuestions = this.stuartQuestions;
    }

    // --- NEW METHODS FOR YORKIE REWARDS ---
    startJerkyRewardDialogue() {
        this.lines = [
            "Sniff... sniff... is that...",
            "PREMIUM BEEF JERKY?! Finally! Service around here is terrible.",
            "Hand it over, pipsqueak! ... *chomp chomp chomp*",
            "Ahhh, that hits the spot. A deal is a deal.",
            "To get the Golden Wheel, you need to unlock the Giants' Safe via the computer in the bedroom.",
            "The password is 'LoveEdgar123'. Obviously. It's a tribute to perfection. Memorize it.",
            "Now leave me be, I have a food coma to catch and your scent is ruining the ambiance."
        ];
        this.speaker = "Edgar Barkley (Yorkie)";
        this.portrait = ASSET_MANAGER.getAsset("./assets/EdgarDialogue.png");
        this.currentLine = 0;
        this.displayText = "";
        this.charIndex = 0;
        this.typeTimer = 0;
        this.sceneManager.dialogueActive = true;
    }

    startYorkieOptionsDialogue() {
        this.deepQuestions = this.yorkieQuestions;
        this.speaker = "Edgar Barkley (Yorkie)";
        this.portrait = ASSET_MANAGER.getAsset("./assets/EdgarDialogue.png");
        this.phase = "INQUIRY";
        this.currentQuestionIndex = null;
        this.displayText = "";
        this.charIndex = 0;
        this.selectedQuestions.clear();
        this.askingFollowUp = false;
        this.exitingAfterResponse = false;
        this.sceneManager.dialogueActive = true;
    }
    // ----------------------------------------

    update() {
        // animate snake's portrait
        if (this.speaker === "Silent Slitherer" && this.portrait) {
            this.portraitTimer += this.game.clockTick;
            if (this.portraitTimer > 0.30) { // flips frame every 0.15 seconds
                this.portraitFrame = (this.portraitFrame + 1) % 4; // cycles 0, 1, 2, 3
                this.portraitTimer = 0;
            }
        }
        // OLD LINE-BASED SYSTEM (for Yorkie and other NPCs)
        if (this.lines && this.lines.length > 0) {
            const rawLine = this.lines[this.currentLine];
            if (!rawLine) return;
            
            // Replace {NAME} with player's name
            const currentLine = rawLine.replace("{NAME}", this.playerName);
            
            // Typewriter effect
            if (this.charIndex < currentLine.length) {
                this.typeTimer += this.game.clockTick;
                if (this.typeTimer > 0.03) {
                    this.displayText += currentLine[this.charIndex];
                    this.charIndex++;
                    this.typeTimer = 0;
                }
            }
            
            // Advance dialogue with Space/Click
            if (this.game.click || this.game.keys["Space"]) {
                this.game.click = null;
                this.game.keys["Space"] = false;
                
                if (this.charIndex < currentLine.length) {
                    // Finish typing current line
                    this.displayText = currentLine;
                    this.charIndex = currentLine.length;
                } else {
                    // Move to next line
                    this.currentLine++;
                    if (this.currentLine >= this.lines.length) {
                        // Dialogue finished
                        this.sceneManager.dialogueActive = false;
                        this.game.paused = false;
                        this.lines = [];
                        this.currentLine = 0;
                    } else {
                        this.displayText = "";
                        this.charIndex = 0;
                    }
                }
            }
            return; // Don't process phase-based system if using line system
        }
        
        // PHASE 1: Interactive Introduction
        if (this.phase === "INTRO") {
            const current = this.dialogues[this.currentIndex];
            if (!current) return;

            // Handle INPUT_NAME type
            if (current.type === "input_name") {
                this.game.typing = true;
                if (this.game.lastInput === "Enter" && this.playerName.length > 0) {
                    this.game.typing = false;
                    this.currentIndex = current.nextIndex;
                    this.game.lastInput = null;
                    this.displayText = "";
                    this.charIndex = 0;
                } else if (this.game.lastInput === "Backspace") {
                    this.playerName = this.playerName.slice(0, -1);
                    this.game.lastInput = null;
                } else if (this.game.lastInput && this.game.lastInput.length === 1) {
                    if (this.playerName.length < 12) this.playerName += this.game.lastInput;
                    this.game.lastInput = null;
                }
                return;
            }

            // If we're displaying a choice response, handle that FIRST
            if (this.displayingChoiceResponse) {
                // Process typewriter effect for the response
                const fullResponse = this.displayText;
                if (this.charIndex < fullResponse.length) {
                    this.typeTimer += this.game.clockTick;
                    if (this.typeTimer > 0.03) {
                        this.charIndex++;
                        this.typeTimer = 0;
                    }
                }

                if (this.game.click || this.game.keys["Space"]) {
                    this.game.click = null;
                    this.game.keys["Space"] = false;

                    // allow user to skip typing effect without exiting prematurely
                    if (this.charIndex < fullResponse.length) {
                        this.charIndex = fullResponse.length;
                        return;
                    }

                    this.displayingChoiceResponse = false;
                    const current = this.dialogues[this.currentIndex];
                    this.currentIndex = current.nextIndex;

                    // exit cleanly if out of bounds -> used for cutscenes
                    if (this.currentIndex >= this.dialogues.length) {
                        this.sceneManager.dialogueActive = false;
                        this.game.paused = false;
                        return;
                    }

                    this.displayText = "";
                    this.charIndex = 0;
                    this.selectedChoiceIndex = null;
                }
                return;
            }

            // Handle CHOICE type
            if (current.type === "choice") {
                if (this.game.click) {
                    const mouseX = this.game.click.x;
                    const mouseY = this.game.click.y;
                    this.game.click = null;

                    // Check which choice was clicked
                    const choiceButtons = this.getChoiceButtonBounds(current.choices);
                    for (let i = 0; i < choiceButtons.length; i++) {
                        const btn = choiceButtons[i];
                        if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
                            // Choice selected
                            this.selectedChoiceIndex = i;
                            this.displayText = current.choices[i].response.replace("{NAME}", this.playerName);
                            this.charIndex = 0;
                            // Next time update is called, advance to next index
                            this.displayingChoiceResponse = true;
                            return;
                        }
                    }
                }
                return; // Wait for choice click
            }

            // Advance on end_of_intro: handle question clicks
            if (current.type === "end_of_intro") {
                if (this.game.click) {
                    const mouseX = this.game.click.x;
                    const mouseY = this.game.click.y;
                    this.game.click = null;

                    const questionBounds = this.getQuestionButtonBounds();
                    for (let i = 0; i < questionBounds.length; i++) {
                        const btn = questionBounds[i];
                        if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
                            const question = this.deepQuestions[i];
                            // Show question response
                            this.phase = "INQUIRY";
                            this.currentQuestionIndex = i;
                            this.displayText = question.response.replace("{NAME}", this.playerName);
                            this.charIndex = 0;
                            this.askingFollowUp = false;
                            this.selectedQuestions.add(i);
                            this.exitingAfterResponse = question.exit || false;
                            return;
                        }
                    }
                }
                return;
            }

            // Normal dialogue process
            let processedLine = current.text.replace("{NAME}", this.playerName);
            if (this.charIndex < processedLine.length) {
                this.typeTimer += this.game.clockTick;
                if (this.typeTimer > 0.03) {
                    this.displayText += processedLine[this.charIndex];
                    this.charIndex++;
                    this.typeTimer = 0;
                }
            }

            // Advance dialogue with Space/Click
            if (this.game.click || this.game.keys["Space"]) {
                this.game.click = null;
                this.game.keys["Space"] = false;

                if (this.charIndex < processedLine.length) {
                    this.displayText = processedLine;
                    this.charIndex = processedLine.length;
                } else {
                    // Move to next dialogue
                    this.currentIndex++;
                    this.displayText = "";
                    this.charIndex = 0;
                    this.selectedChoiceIndex = null;
                }
            }
        }

        // PHASE 2: Deep Inquiry Menu
        else if (this.phase === "INQUIRY") {
            if (this.currentQuestionIndex === null) {
                // User is viewing the question menu - waiting for a click
                if (this.game.click) {
                    const mouseX = this.game.click.x;
                    const mouseY = this.game.click.y;
                    this.game.click = null;

                    const questionBounds = this.getQuestionButtonBounds();
                    for (let i = 0; i < questionBounds.length; i++) {
                        const btn = questionBounds[i];
                        if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
                            const question = this.deepQuestions[i];
                            // Show question response
                            this.currentQuestionIndex = i;
                            this.displayText = question.response.replace("{NAME}", this.playerName);
                            this.charIndex = 0;
                            this.askingFollowUp = false;
                            this.selectedQuestions.add(i);
                            this.exitingAfterResponse = question.exit || false;
                            return;
                        }
                    }
                }
            } else {
                // User is reading a question's response
                const question = this.deepQuestions[this.currentQuestionIndex];
                let processedLine = this.displayText;

                // Typewriter effect
                if (this.charIndex < processedLine.length) {
                    this.typeTimer += this.game.clockTick;
                    if (this.typeTimer > 0.03) {
                        this.charIndex++;
                        this.typeTimer = 0;
                    }
                }

                // Check for Space/Click to continue or advance
                if (this.game.click || this.game.keys["Space"]) {
                    this.game.click = null;
                    this.game.keys["Space"] = false;

                    if (this.charIndex < processedLine.length) {
                        // Finish typing current response
                        this.displayText = processedLine;
                        this.charIndex = processedLine.length;
                    } else {
                        // If this was the exit question, exit now
                        if (this.exitingAfterResponse) {
                            this.sceneManager.dialogueActive = false;
                            this.game.paused = false;
                            if (this.sceneManager.storyState === "STUART_TALK") {
                                this.sceneManager.storyState = "YORKIE_CHALLENGE";
                            }
                            this.exitingAfterResponse = false;
                            return;
                        }

                        if (question.followUp && !this.askingFollowUp) {
                            // Show follow-up question
                            this.displayText = question.followUp.response.replace("{NAME}", this.playerName);
                            this.charIndex = 0;
                            this.askingFollowUp = true;
                        } else {
                            // Return to question menu
                            this.currentQuestionIndex = null;
                            this.displayText = "";
                            this.charIndex = 0;
                            this.askingFollowUp = false;
                        }
                    }
                }
            }
        }
    }

    getChoiceButtonBounds(choices) {
        const w = this.game.ctx.canvas.width;
        const h = this.game.ctx.canvas.height;
        let boxW = 1200;
        let boxH = 280;
        let boxX = (w - boxW) / 2;
        let boxY = h - boxH - 40;
        let btnHeight = 45;
        let btnPadding = 10;
        let btnWidth = 550;
        let btnX = boxX + 280;
        let startY = boxY + 110;

        // shrink bounds and push options up for Level 2 Snake
        if (this.speaker === "Silent Slitherer") {
            boxW = 700;
            boxH = 200;
            boxX = (w - boxW) / 2;
            boxY = h - boxH - 20;

            btnHeight = 28;
            btnPadding = 5;
            // push buttons right to clear the portrait
            // framePadding (15) + frameSize (170) + text spacing (30) = 215
            btnX = boxX + 215;

            // shrink width so it stays inside the 700px box
            btnWidth = 450;

            startY = boxY + 65;        }

        return choices.map((_, i) => ({
            x: btnX,
            y: startY + i * (btnHeight + btnPadding),
            w: btnWidth,
            h: btnHeight
        }));
    }

    getQuestionButtonBounds() {
        const w = this.game.ctx.canvas.width;
        const h = this.game.ctx.canvas.height;
        const boxW = 1200;
        const boxH = 280;
        const boxX = (w - boxW) / 2;
        const boxY = h - boxH - 40;

        const btnHeight = 32;
        const btnPadding = 5;
        const btnWidth = 550;
        const btnX = boxX + 280;
        const startY = boxY + 85;

        return this.deepQuestions.map((_, i) => ({
            x: btnX,
            y: startY + i * (btnHeight + btnPadding),
            w: btnWidth,
            h: btnHeight
        }));
    }

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        if (this.game.mouse) {
            this.mouseX = this.game.mouse.x;
            this.mouseY = this.game.mouse.y;
        }

        // OLD LINE-BASED SYSTEM
        if (this.lines && this.lines.length > 0) {
            // custom victory screen for system message
            if (this.speaker === "System") {
                let customBox = ASSET_MANAGER.getAsset("./assets/text-box.png");

                // scale multiplier: 0.30
                // can increase or decrease decimal
                let scale = 0.30;
                let drawW = 1744 * scale;
                let drawH = 988 * scale;

                let drawX = (w - drawW) / 2;
                let drawY = h - drawH - 20; // pushed against the bottom of the screen

                if (customBox) {
                    ctx.drawImage(customBox, drawX, drawY, drawW, drawH);
                }

                // setup the black, centered Press Start 2P font
                ctx.fillStyle = "black";
                ctx.font = "18px 'Press Start 2P', Courier";
                ctx.textAlign = "center"; // forces wrapText to center everything

                // calculate vertical center
                let textY = drawY + (drawH / 2) - 10;
                const textToShow = this.displayText.substring(0, this.charIndex);

                // because textAlign is 'center', passing (w / 2) flawlessly centers the text!
                this.wrapText(ctx, textToShow, w / 2, textY, drawW - 100, 35);

                // flashing continue prompt
                if (this.charIndex >= this.displayText.length) {
                    ctx.font = "12px 'Press Start 2P', Courier";
                    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                    ctx.fillText("Press SPACE to continue...", w / 2, drawY + drawH - 40);
                }

                return;
            }
            // -------------------------------------------------
            const boxW = 1200;
            const boxH = 280;
            const boxX = (w - boxW) / 2;
            const boxY = h - boxH - 40;

            ctx.fillStyle = "rgba(20, 20, 20, 0.9)";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4;
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            const framePadding = 15;
            const frameSize = boxH - (framePadding * 2);
            const frameX = boxX + framePadding;
            const frameY = boxY + framePadding;

            ctx.fillStyle = "#3a3a3a";
            ctx.fillRect(frameX, frameY, frameSize, frameSize);

            if (this.portrait) {
                ctx.drawImage(this.portrait, Math.floor(frameX + 5), Math.floor(frameY + 5), Math.floor(frameSize - 10), Math.floor(frameSize - 10));
            }

            ctx.strokeStyle = "#ffcc00";
            ctx.lineWidth = 3;
            ctx.strokeRect(frameX, frameY, frameSize, frameSize);

            const textX = frameX + frameSize + 30;
            const textY = boxY + 50;
            const maxTextWidth = boxW - frameSize - 80;

            ctx.fillStyle = "#aaaaff";
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "left";
            ctx.fillText(this.speaker, textX, textY - 10);

            ctx.fillStyle = "white";
            ctx.font = "22px 'Courier New'";

            const textToShow = this.displayText.substring(0, this.charIndex);
            this.wrapText(ctx, textToShow, textX, textY + 30, maxTextWidth, 32);

            if (this.charIndex >= this.displayText.length) {
                ctx.font = "16px Arial";
                ctx.fillStyle = "#888";
                ctx.textAlign = "right";
                ctx.fillText("Press SPACE to continue...", boxX + boxW - 20, boxY + boxH - 20);
            }
            return;
        }

        // PHASE 1: Introduction
        if (this.phase === "INTRO") {
            const current = this.dialogues[this.currentIndex];
            if (!current) return;

            let boxW = 1200;
            let boxH = 280;
            let boxX = (w - boxW) / 2;
            let boxY = h - boxH - 40;

            // shrink dialogue box if Snake is speaking
            if (this.speaker === "Silent Slitherer") {
                boxW = 700;
                boxH = 200;
                boxX = (w - boxW) / 2;
                boxY = h - boxH - 20;
            }

            ctx.fillStyle = "rgba(20, 20, 20, 0.9)";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4;
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            const framePadding = 15;
            const frameSize = boxH - (framePadding * 2);
            const frameX = boxX + framePadding;
            const frameY = boxY + framePadding;

            // only draw gray square if portrait exists
            let textX = boxX + 30;
            let maxTextWidth = boxW - 60;

            if (this.portrait) {
                ctx.fillStyle = "#3a3a3a";
                ctx.fillRect(frameX, frameY, frameSize, frameSize);

                // crop sprite sheet if it's the Snake
                if (this.speaker === "Silent Slitherer") {
                    ctx.drawImage(
                        this.portrait,
                        this.portraitFrame * 736, 0, 736, 736, // Source: X, Y, Width, Height
                        Math.floor(frameX + 5), Math.floor(frameY + 5), Math.floor(frameSize - 10), Math.floor(frameSize - 10) // destination
                    );
                } else {
                    // normal drawing for Stuart Big and Yorkie
                    ctx.drawImage(this.portrait, Math.floor(frameX + 5), Math.floor(frameY + 5), Math.floor(frameSize - 10), Math.floor(frameSize - 10));
                }
                // --------------------------------------------------

                ctx.strokeStyle = "#ffcc00";
                ctx.lineWidth = 3;
                ctx.strokeRect(frameX, frameY, frameSize, frameSize);

                textX = frameX + frameSize + 30;
                maxTextWidth = boxW - frameSize - 80;
            }
            const textY = boxY + 50;

            ctx.fillStyle = "#aaaaff";
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "left";
            ctx.fillText(this.speaker, textX, textY - 10);
            ctx.fillStyle = "white";
            ctx.font = "22px 'Courier New'";

            if (this.displayingChoiceResponse) {
                const textToShow = this.displayText.substring(0, this.charIndex);
                this.wrapText(ctx, textToShow, textX, textY + 30, maxTextWidth, 32);
                
                ctx.font = "16px Arial";
                ctx.fillStyle = "#888";
                ctx.textAlign = "right";
                ctx.fillText("Click or press SPACE to continue...", boxX + boxW - 20, boxY + boxH - 20);
            }
            else if (current.type === "input_name") {
                ctx.fillText("Type your name and press Enter:", textX, textY + 40);
                ctx.fillStyle = "#ffcc00";
                ctx.fillText("> " + this.playerName + "_", textX, textY + 80);
            } else {
                const textToShow = this.displayText.substring(0, this.charIndex);
                this.wrapText(ctx, textToShow, textX, textY + 30, maxTextWidth, 32);

                if (this.charIndex >= this.displayText.length && current.type === "dialogue") {
                    ctx.font = "16px Arial";
                    ctx.fillStyle = "#888";
                    ctx.textAlign = "right";
                    ctx.fillText("Click or press SPACE to continue...", boxX + boxW - 20, boxY + boxH - 20);
                }
            }

            if (current.type === "choice" && this.selectedChoiceIndex === null && !this.displayingChoiceResponse) {
                const choiceButtons = this.getChoiceButtonBounds(current.choices);

                current.choices.forEach((choice, i) => {
                    const btn = choiceButtons[i];
                    const isHovered = this.mouseX >= btn.x && this.mouseX <= btn.x + btn.w && this.mouseY >= btn.y && this.mouseY <= btn.y + btn.h;
                    ctx.save();
                    if (isHovered) {
                        ctx.fillStyle = "rgba(200, 160, 60, 0.3)";
                        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
                    }
                    ctx.fillStyle = isHovered ? "#FFE080" : "#FFD700";
                    ctx.font = "22px 'Courier New'";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "middle";
                    ctx.fillText("• " + choice.text, btn.x + 10, btn.y + btn.h / 2);
                    ctx.restore();
                });
            }

            if (current.type === "end_of_intro") {
                const questionBounds = this.getQuestionButtonBounds();

                this.deepQuestions.forEach((question, i) => {
                    const btn = questionBounds[i];
                    const isHovered = this.mouseX >= btn.x && this.mouseX <= btn.x + btn.w && this.mouseY >= btn.y && this.mouseY <= btn.y + btn.h;
                    const isAnswered = this.selectedQuestions.has(i);

                    ctx.save();
                    if (isHovered) {
                        ctx.fillStyle = "rgba(200, 160, 60, 0.3)";
                        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
                    }

                    let textColor = "#FFD700";
                    if (isHovered) textColor = "#FFE080";
                    if (isAnswered) textColor = "#C0A830";

                    ctx.fillStyle = textColor;
                    ctx.font = "22px 'Courier New'";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "middle";
                    const displayText = (isAnswered ? "✓ " : "• ") + question.text;
                    ctx.fillText(displayText, btn.x + 10, btn.y + btn.h / 2);
                    ctx.restore();
                });
            }
        }

        // PHASE 2: Deep Inquiry Menu
        else if (this.phase === "INQUIRY") {
            if (this.currentQuestionIndex === null) {
                const boxW = 1200;
                const boxH = 280;
                const boxX = (w - boxW) / 2;
                const boxY = h - boxH - 40;

                ctx.fillStyle = "rgba(20, 20, 20, 0.9)";
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 4;
                ctx.fillRect(boxX, boxY, boxW, boxH);
                ctx.strokeRect(boxX, boxY, boxW, boxH);

                const framePadding = 15;
                const frameSize = boxH - (framePadding * 2);
                const frameX = boxX + framePadding;
                const frameY = boxY + framePadding;

                ctx.fillStyle = "#3a3a3a";
                ctx.fillRect(frameX, frameY, frameSize, frameSize);

                if (this.portrait) {
                    ctx.drawImage(this.portrait, Math.floor(frameX + 5), Math.floor(frameY + 5), Math.floor(frameSize - 10), Math.floor(frameSize - 10));
                }

                ctx.strokeStyle = "#ffcc00";
                ctx.lineWidth = 3;
                ctx.strokeRect(frameX, frameY, frameSize, frameSize);

                const textX = frameX + frameSize + 30;
                const textY = boxY + 50;

                ctx.fillStyle = "#aaaaff";
                ctx.font = "bold 24px Arial";
                ctx.textAlign = "left";
                // Fixed hardcoded name to dynamic speaker
                ctx.fillText(this.speaker, textX, textY - 10); 

                const questionBounds = this.getQuestionButtonBounds();

                this.deepQuestions.forEach((question, i) => {
                    const btn = questionBounds[i];
                    const isHovered = this.mouseX >= btn.x && this.mouseX <= btn.x + btn.w && this.mouseY >= btn.y && this.mouseY <= btn.y + btn.h;
                    const isAnswered = this.selectedQuestions.has(i);

                    ctx.save();
                    if (isHovered) {
                        ctx.fillStyle = "rgba(200, 160, 60, 0.3)";
                        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
                    }

                    let textColor = "#FFD700";
                    if (isHovered) textColor = "#FFE080";
                    if (isAnswered) textColor = "#C0A830";

                    ctx.fillStyle = textColor;
                    ctx.font = "22px 'Courier New'";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "middle";
                    const displayText = (isAnswered ? "✓ " : "• ") + question.text;
                    ctx.fillText(displayText, btn.x + 10, btn.y + btn.h / 2);

                    ctx.restore();
                });
            } else {
                const boxW = 1200;
                const boxH = 280;
                const boxX = (w - boxW) / 2;
                const boxY = h - boxH - 40;

                ctx.fillStyle = "rgba(20, 20, 20, 0.95)";
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 4;
                ctx.fillRect(boxX, boxY, boxW, boxH);
                ctx.strokeRect(boxX, boxY, boxW, boxH);

                const framePadding = 15;
                const frameSize = boxH - (framePadding * 2);
                const frameX = boxX + framePadding;
                const frameY = boxY + framePadding;

                ctx.fillStyle = "#3a3a3a";
                ctx.fillRect(frameX, frameY, frameSize, frameSize);

                if (this.portrait) {
                    ctx.drawImage(this.portrait, Math.floor(frameX + 5), Math.floor(frameY + 5), Math.floor(frameSize - 10), Math.floor(frameSize - 10));
                }

                ctx.strokeStyle = "#ffcc00";
                ctx.lineWidth = 3;
                ctx.strokeRect(frameX, frameY, frameSize, frameSize);

                const textX = frameX + frameSize + 30;
                const textY = boxY + 50;
                const maxTextWidth = boxW - frameSize - 80;

                ctx.fillStyle = "#aaaaff";
                ctx.font = "bold 24px Arial";
                ctx.textAlign = "left";
                // Fixed hardcoded name to dynamic speaker
                ctx.fillText(this.speaker, textX, textY - 10); 

                ctx.fillStyle = "white";
                ctx.font = "22px 'Courier New'";

                const textToShow = this.displayText.substring(0, this.charIndex);
                this.wrapText(ctx, textToShow, textX, textY + 20, maxTextWidth, 28);

                ctx.font = "14px Arial";
                ctx.fillStyle = "#888";
                ctx.textAlign = "right";
                ctx.fillText("Press SPACE to continue...", boxX + boxW - 20, boxY + boxH - 20);
            }
        }
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        let words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }
}