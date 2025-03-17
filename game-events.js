export class GameEventBus {
    constructor() {
        this.subscribers = new Map();
    }
    
    emit(event, data) {
        if (this.subscribers.has(event)) {
            this.subscribers.get(event).forEach(callback => callback(data));
        }
    }
    
    on(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, new Set());
        }
        this.subscribers.get(event).add(callback);
    }

    off(event, callback) {
        if (this.subscribers.has(event)) {
            this.subscribers.get(event).delete(callback);
        }
    }
} 