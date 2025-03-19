export class Mission {
    constructor(objective, details) {
        this.objective = objective;
        this.details = details;
        this.completed = false;
        this.createdAt = new Date();
    }

    complete() {
        this.completed = true;
    }

    toJSON() {
        return {
            objective: this.objective,
            details: this.details,
            completed: this.completed,
            createdAt: this.createdAt
        };
    }
} 