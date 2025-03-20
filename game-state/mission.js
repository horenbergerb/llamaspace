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