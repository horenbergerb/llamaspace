export class MapBody {
    constructor(sketch) {
        if (this.constructor === MapBody) {
            throw new Error("Abstract class 'MapBody' cannot be instantiated.");
        }
        this.sketch = sketch;
        this.baseX = 0;
        this.baseY = 0;
        this.baseSize = 0;
        this.size = 0;
        this.pulseSpeed = 0;
        this.isSelected = false;
        this.name = "";
        this.color = sketch.color(255); // Default white
        this.bodyProperties = {}; // Dictionary for body-specific properties
    }

    getCoords() {
        return [this.baseX, this.baseY];
    }

    update() {
        // Default pulsing behavior
        this.size = this.baseSize + 1 * this.sketch.sin(this.sketch.frameCount * this.pulseSpeed);
    }

    drawSelector() {
        this.sketch.push();
        this.sketch.stroke(this.color.levels[0], this.color.levels[1], this.color.levels[2]);
        this.sketch.strokeWeight(2);
        this.sketch.noFill();
        this.sketch.ellipse(this.baseX, this.baseY, this.size + 10); // Outer ring
        this.sketch.pop();
    }

    draw() {
        // This should be overridden by child classes
        throw new Error("Method 'draw()' must be implemented by child classes.");
    }

    getDescription() {
        // Default implementation that can be overridden
        let desc = "";
        for (const [key, value] of Object.entries(this.bodyProperties)) {
            if (typeof value !== 'object' && typeof value !== 'function') {
                desc += `${key}: ${value}\n`;
            }
        }
        return desc;
    }
} 