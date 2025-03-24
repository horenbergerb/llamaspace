export class Shuttlecraft {
    constructor(id) {
        this.id = id;
        this.health = 100;
        this.name = `Shuttle ${id}`;
    }

    damage(amount) {
        this.health = Math.max(0, Math.min(100, this.health - amount));
        return this.health > 0;
    }

    repair(amount) {
        this.health = Math.max(0, Math.min(100, this.health + amount));
        return this.health === 100;
    }

    isOperational() {
        return this.health > 0;
    }
} 