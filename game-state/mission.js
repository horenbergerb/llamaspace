export class Mission {
    constructor(objective, details) {
        this.objective = objective;
        this.details = details;
        this.steps = [];
        this.completed = false;
        this.createdAt = new Date();
    }

    complete() {
        this.completed = true;
    }

    async generateSteps(textGenerator) {
        const prompt = `A small starship is on a research mission in a remote part of the galaxy. The starship is similar in capabilities to the Federation starship Enterprise from Star Trek, albeit smaller and lower quality. It was designed for a crew of 15. A crew member has just been assigned a task.
        
Break down this task into 1-10 steps based on its complexity. The task is:

Objective: ${this.objective}
Additional Details: ${this.details}

Format your response exactly like this, with one step per line starting with a number and period:
1. First step here
2. Second step here
etc.

Keep steps clear and actionable. Number of steps should reflect task complexity.`;

        let stepsText = '';
        try {
            await textGenerator.generateText(
                prompt,
                (text) => { stepsText = text; },
                0.7, // Lower temperature for more focused output
                500  // Max tokens
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
            steps: this.steps
        };
    }
} 