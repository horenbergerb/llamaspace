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

    async generateSteps(textGenerator) {
        const prompt = `This is for a roleplaying game focused on space exploration. The game is serious with hints of humor in the vein of Douglas Adams's "The Hitchhiker's Guide to the Galaxy." A small starship known as the Galileo is on a research mission in a remote part of the galaxy. The starship is similar in capabilities to the Federation starship Enterprise from Star Trek, albeit smaller and lower quality (it's one of the oldest ships in the fleet). It was designed for a crew of 15.

A crew member named ${this.assignedCrew.name} has just been assigned a task. ${this.assignedCrew.name} is a ${this.assignedCrew.race}. ${this.assignedCrew.races[this.assignedCrew.race].description}

${this.assignedCrew.name} is often described as ${this.assignedCrew.demeanor.join(", ")}.

The task will be completed in steps which the player can track.

Break down this task into a number of steps based on its complexity. The number can range from 0 to 10. The task is:

Objective: ${this.objective}
Additional Details: ${this.details}

Start by determining the difficulty of the task. Rate the difficulty from 1 to 10. 10 is nearly impossible, 5 is harder than average, 1 is a trivial task. You should create the same number of steps as the difficulty rating.
Format your response exactly like this, with one step per line starting with a number and period:
Difficulty: X
1. First step here
2. Second step here
etc.

Keep steps clear and actionable. Write them in plaintext with no titles or other formatting. The number of steps should reflect task complexity relative to standard operations. Routine tasks like surveys are simpler and have fewer steps. Complex tasks like engineering challenges will require more steps.`;

        let stepsText = '';
        try {
            await textGenerator.generateText(
                prompt,
                (text) => { stepsText = text; },
                1.0, // Lower temperature for more focused output
                1000  // Max tokens
            );

            // Parse the steps from the response
            const stepLines = stepsText.split('\n');
            const difficultyLine = stepLines.shift(); // Remove the difficulty line
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