import { Spaceship } from '../map-objects/map-spaceship.js';

export class SpaceshipRenderer {
    constructor(sketch, spaceship) {
        this.sketch = sketch;
        this.spaceship = spaceship;
    }

    render() {
        if (!this.spaceship || !this.spaceship.orbitBody) return;

        // Draw destination line if needed
        if (this.spaceship.destinationSet) {
            this.renderPulsingDashedLine(this.spaceship);
        }

        this.renderSpaceshipSprite(this.spaceship);
    }

    renderPulsingDashedLine() {
        if (!this.spaceship.orbitBody || !this.spaceship.newOrbitBody) return;
    
        let ctx = this.sketch.drawingContext;
    
        let x1 = this.spaceship.orbitBody.baseX;
        let y1 = this.spaceship.orbitBody.baseY;
        let x2 = this.spaceship.newOrbitBody.baseX;
        let y2 = this.spaceship.newOrbitBody.baseY;
    
        // Compute vector direction from start to destination
        let dx = x2 - x1;
        let dy = y2 - y1;
        let dist = Math.sqrt(dx * dx + dy * dy);
    
        // Normalize the direction vector
        let nx = dx / dist;
        let ny = dy / dist;
    
        // Shorten the line by trimming both ends
        let shortenAmount = 15;
        x1 += nx * shortenAmount;
        y1 += ny * shortenAmount;
        x2 -= nx * shortenAmount;
        y2 -= ny * shortenAmount;
    
        // Pulsing effect
        let pulseFactor = (this.sketch.sin(this.sketch.frameCount * 0.1) + 1) / 2;
        let alpha = 75 + pulseFactor * 50;
    
        this.sketch.push();
        this.sketch.stroke(255, 255, 255, alpha);
        this.sketch.strokeWeight(2);
        ctx.setLineDash([10, 10]);
    
        this.sketch.line(x1, y1, x2, y2);
    
        ctx.setLineDash([]);
        this.sketch.pop();
    }

    renderSpaceshipSprite() {
        if (!Spaceship.image) return;

        this.sketch.push();
        this.sketch.translate(this.spaceship.spaceshipX, this.spaceship.spaceshipY);
        this.sketch.rotate(this.spaceship.spaceshipAngle);
        this.sketch.imageMode(this.sketch.CENTER);

        // Draw glowing aura
        this.renderGlowingAura();

        // Draw ship
        this.sketch.noFill();
        this.sketch.image(Spaceship.image, 0, 0, 20, 20);
        this.sketch.pop();
    }

    renderGlowingAura() {
        this.sketch.noStroke();
        for (let i = 5; i > 0; i--) {
            const alpha = 10 - i * 2;
            this.sketch.fill(204, 204, 204, alpha);
            this.sketch.ellipse(0, 0, 20 + i * 4);
        }
    }
} 