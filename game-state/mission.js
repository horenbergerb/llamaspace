export class Mission {
    constructor(objective, details, assignedCrew = null) {
        this.objective = objective;
        this.details = details;
        this.steps = [];
        this.completed = false;
        this.createdAt = new Date();
        this.assignedCrew = assignedCrew;
    }

    complete() {
        this.completed = true;
    }

    assignTo(crewMember) {
        this.assignedCrew = crewMember;
    }

    async generateSteps(textGenerator) {
        const prompt = `This is for a roleplaying game focused on space exploration. The game is serious with hints of humor in the vein of Douglas Adams's "The Hitchhiker's Guide to the Galaxy." A small starship known as the Galileo is on a research mission in a remote part of the galaxy. The starship is similar in capabilities to the Federation starship Enterprise from Star Trek, albeit smaller and lower quality (it's one of the oldest ships in the fleet). It was designed for a crew of 15.

A crew member has just been assigned a task. The task will be completed in steps which are displayed to the player.

Break down this task into 1-10 steps based on its complexity. The task is:

Objective: ${this.objective}
Additional Details: ${this.details}

Format your response exactly like this, with one step per line starting with a number and period:
1. First step here
2. Second step here
etc.

Keep steps clear and actionable. Write them in plaintext with no titles or other formatting. Number of steps should reflect task complexity. Routine tasks like surveys are simpler and have fewer steps. Complex tasks like engineering challenges will require more steps. Prioritize making each step entertaining rather than logical.`;

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
            this.steps = stepLines
                .map(line => {
                    // Match lines that start with a number followed by a period
                    const match = line.match(/^\d+\.\s*(.+)$/);
                    return match ? match[1].trim() : null;
                })
                .filter(step => step !== null); // Remove any non-matching lines

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
            assignedCrew: this.assignedCrew
        };
    }
} 