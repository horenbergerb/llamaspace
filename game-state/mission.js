export class Mission {
    constructor(objective, details, assignedCrew = null) {
        this.objective = objective;
        this.details = details;
        this.steps = [];
        this.completed = false;
        this.createdAt = new Date();
        this.assignedCrew = assignedCrew;
        this.currentStep = 0;
        this.lastStepTime = Date.now();
        this.pulseScale = 1;
        this.pulseDirection = 1;
        this.stepInterval = 5000; // 5 seconds in milliseconds
        this.pulseSpeed = 1; // Speed in cycles per second
        this.lastUpdateTime = Date.now();
        this.quality = null;
        this.orbitingBody = null; // Store the body where the mission was performed
        this.outcome = null;
    }

    complete() {
        this.completed = true;
        console.log(`Mission "${this.objective}" completed!`);
    }

    assignTo(crewMember) {
        this.assignedCrew = crewMember;
    }

    update() {
        if (this.completed) return;

        // Calculate delta time in seconds
        const now = Date.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = now;

        // Update pulse animation using delta time
        const pulseSpeed = this.pulseSpeed * deltaTime;
        this.pulseScale += pulseSpeed * this.pulseDirection;
        if (this.pulseScale >= 1.2) {
            this.pulseScale = 1.2;
            this.pulseDirection = -1;
        } else if (this.pulseScale <= 0.8) {
            this.pulseScale = 0.8;
            this.pulseDirection = 1;
        }

        // Check if we should increment the step
        const timeSinceLastStep = now - this.lastStepTime;
        
        if (timeSinceLastStep >= this.stepInterval) {
            this.lastStepTime = now;
            if (this.currentStep < this.steps.length) {
                this.currentStep++;
                console.log(`Mission "${this.objective}" progressed to step ${this.currentStep}/${this.steps.length}`);
                
                if (this.currentStep >= this.steps.length) {
                    this.complete();
                }
            }
        }
    }

    getStepColor(stepIndex) {
        if (this.completed) {
            return '#4CAF50'; // All steps green when completed
        }
        
        if (stepIndex < this.currentStep) {
            return '#4CAF50'; // Green for completed steps
        } else if (stepIndex === this.currentStep) {
            return '#FFA500'; // Orange for current step
        } else {
            return '#FFA500'; // Orange for future steps
        }
    }

    getStepScale(stepIndex) {
        if (this.completed) return 1;
        
        if (stepIndex === this.currentStep) {
            return this.pulseScale;
        }
        return 1;
    }

    async generateDifficultyAndQuality(textGenerator, currentScene, orbitingBody) {
        let bodyContext = '';

        // Only planets have a parent star
        if (!orbitingBody.parentStar) {
            bodyContext = `The ship is orbiting a star named ${orbitingBody.name}. `;
        } else {
            bodyContext = `The ship is orbiting a planet named ${orbitingBody.name} in the ${orbitingBody.parentStar.name} system. `;
        }

        const prompt = `This is for a roleplaying game focused on space exploration. The game is serious with hints of humor in the vein of Douglas Adams's "The Hitchhiker's Guide to the Galaxy."

The player is Donald, captain of a small starship known as the Galileo. The Galileo is on a research mission in a remote part of the galaxy. The starship is similar in capabilities to the Federation starship Enterprise from Star Trek, albeit smaller and lower quality (it's one of the oldest ships in the fleet). It was designed for a crew of 15.

The Galileo is equipped with standard research equipment and meagre weaponry. It has a small replicator and two shuttlecraft. It has most of the resources needed to sustain a crew of 15 for a year.

Donald, his ship, and his crew are all nobodies. Donald's promotion to captain was something of a nepotism scandal. His crew is composed of misfits and those with complicated pasts in the service. The ship itself is old and worn out, but everyone on board is used to getting the short end of the stick. This research mission to the D-124 star system is an exile, but it's also a chance for the entire crew to redeem themselves.

${bodyContext}

Here is some information about the body the ship is orbiting:

${orbitingBody.getDescription()}
Donald has just assigned a research mission to a bridge crew member named ${this.assignedCrew.name}. ${this.assignedCrew.name} is a ${this.assignedCrew.race}. ${this.assignedCrew.races[this.assignedCrew.race].description}

${this.assignedCrew.name} is often described as ${this.assignedCrew.demeanor.join(", ")}.

Objective: ${this.objective}
Additional Details: ${this.details}

Rate the difficulty from 1 to 10. 10 is impossible, 5 is harder than average, 1 is a trivial task.

Additionally, rate the quality of the mission from 1 to 10. High-quality missions ask interesting questions regarding the body that the Galileo is orbiting. Low-quality missions are irrelevant to the body, trivial, or uninteresting.

Format your response exactly like this:

Considerations: *Reason about the difficulty of the mission*
Difficulty: X

Considerations: *Reason about the quality of the mission*
Quality: Y

Be realistic about what is possible for the Galileo and its crew.`;

        let difficultyText = '';
        try {
            await textGenerator.generateText(
                prompt,
                (text) => { difficultyText = text; },
                1.0, // Lower temperature for more focused output
                1000  // Max tokens
            );
            console.log(difficultyText);
            // Extract difficulty rating from response
            const difficultyMatch = difficultyText.match(/Difficulty:\s*(\d+)/);
            if (difficultyMatch) {
                this.difficulty = parseInt(difficultyMatch[1]);
            } else {
                // Default to medium difficulty if parsing fails
                this.difficulty = 5;
                console.warn('Could not parse difficulty from response, defaulting to 5');
            }
            const qualityMatch = difficultyText.match(/Quality:\s*(\d+)/);
            if (qualityMatch) {
                this.quality = parseInt(qualityMatch[1]);
            } else {
                // Default to medium quality if parsing fails
                this.quality = 5;
                console.warn('Could not parse quality from response, defaulting to 5');
            }
        } catch (error) {
            console.error('Error parsing difficulty and quality:', error);
            // Set a default step if generation fails
            this.difficulty = 5;
            this.quality = 5;
        }
    }

    async generateSteps(textGenerator, currentScene, orbitingBody) {

        await this.generateDifficultyAndQuality(textGenerator, currentScene, orbitingBody);

        let successProbability = 100 - this.difficulty * 10;
        this.outcome = Math.random() < successProbability / 100;

        let bodyContext = '';

        // Only planets have a parent star
        if (!orbitingBody.parentStar) {
            bodyContext = `The ship is orbiting a star named ${orbitingBody.name}. `;
        } else {
            bodyContext = `The ship is orbiting a planet named ${orbitingBody.name} in the ${orbitingBody.parentStar.name} system. `;
        }

        const prompt = `This is for a roleplaying game focused on space exploration. The game is serious with hints of humor in the vein of Douglas Adams's "The Hitchhiker's Guide to the Galaxy."

The player is Donald, captain of a small starship known as the Galileo. The Galileo is on a research mission in a remote part of the galaxy. The starship is similar in capabilities to the Federation starship Enterprise from Star Trek, albeit smaller and lower quality (it's one of the oldest ships in the fleet). It was designed for a crew of 15.

The Galileo is equipped with standard research equipment and meagre weaponry. It has a small replicator and two shuttlecraft. It has most of the resources needed to sustain a crew of 15 for a year.

Donald, his ship, and his crew are all nobodies. Donald's promotion to captain was something of a nepotism scandal. His crew is composed of misfits and those with complicated pasts in the service. The ship itself is old and worn out, but everyone on board is used to getting the short end of the stick. This research mission to the D-124 star system is an exile, but it's also a chance for the entire crew to redeem themselves.

${bodyContext}

Here is some information about the body the ship is orbiting:

${orbitingBody.getDescription()}
Donald assigned a research mission to a bridge crew member named ${this.assignedCrew.name}. ${this.assignedCrew.name} is a ${this.assignedCrew.race}. ${this.assignedCrew.races[this.assignedCrew.race].description}

${this.assignedCrew.name} is often described as ${this.assignedCrew.demeanor.join(", ")}.

The research mission was a ${this.outcome ? 'success' : 'failure'}. Here was the mission objective:

Objective: ${this.objective}
Additional Details: ${this.details}

The research mission was documented in ${this.difficulty} phases.

Each phase should be phrased as a progress report from ${this.assignedCrew.name} written in their log. It should be a single sentence or two.
Format your response exactly like this, with one step per line starting with a number and period:

1. First report
2. Second report here
etc.

Keep steps clear and actionable. Write them in plaintext with no titles or other formatting. The number of steps should reflect task complexity relative to standard operations. Routine tasks like planetary surveys are simpler and have fewer steps. Be realistic about what is possible for the Galileo.`;

        let stepsText = '';
        try {
            await textGenerator.generateText(
                prompt,
                (text) => { stepsText = text; },
                1.0, // Lower temperature for more focused output
                1000  // Max tokens
            );
            console.log(stepsText);
            // Parse the steps from the response
            const stepLines = stepsText.split('\n');
            this.steps = stepLines
                .map(line => {
                    // Match lines that start with a number followed by a period
                    const match = line.match(/^\d+\.\s*(.+)$/);
                    return match ? match[1].trim() : null;
                })
                .filter(step => step !== null); // Remove any non-matching lines
                
            this.lastStepTime = Date.now();
            this.currentStep = 0;

        } catch (error) {
            console.error('Error generating steps:', error);
            // Set a default step if generation fails
            this.steps = ['Complete the mission'];
        }
    }

    toJSON() {
        return {
            objective: this.objective,
            details: this.details,
            completed: this.completed,
            createdAt: this.createdAt,
            steps: this.steps,
            assignedCrew: this.assignedCrew,
            currentStep: this.currentStep,
            lastStepTime: this.lastStepTime
        };
    }
} 