export class Spaceship {
    constructor(sketch) {
        this.image;
        this.angle = 0; 
        this.orbitStar = null;
        this.orbitRadius = 20;

        this.transitX = 0;
        this.transitY = 0;
        this.inTransit = false;
        this.transitAngle = 0;
        this.transitSpeed = 0; // Start at 0 velocity
        this.maxTransitSpeed = 4; // Maximum travel speed
        this.transitAcceleration = 0.05; // Acceleration per frame
        this.newOrbitStar = null;
    }

    preload(sketch) {
        this.image = sketch.loadImage("spaceship.png");
    }

    setOrbitStar(newOrbitStar) {
        if (!this.orbitStar) {
            this.orbitStar = newOrbitStar;
            return;
        }

        // Calculate angle between current orbit star and new orbit star
        let dx = newOrbitStar.baseX - this.orbitStar.baseX;
        let dy = newOrbitStar.baseY - this.orbitStar.baseY;
        this.transitAngle = Math.atan2(dy, dx);

        // Set transit destination
        this.transitX = this.orbitStar.baseX;
        this.transitY = this.orbitStar.baseY;
        this.transitSpeed = 0; // Reset speed at start

        // Enable transit mode
        this.inTransit = true;
        this.newOrbitStar = newOrbitStar;
    }

    orbitSpaceShip() {
        if (!this.orbitStar) return [0, 0, 0];

        // Update orbit angle
        this.angle += 0.02;
        while (this.angle >= Math.PI){
            this.angle -= 2 * Math.PI;
        }
        while (this.angle < -Math.PI){
            this.angle += Math.PI;
        }

        // Calculate spaceship position in orbit
        let spaceshipX = this.orbitStar.baseX + this.orbitRadius * Math.cos(this.angle);
        let spaceshipY = this.orbitStar.baseY + this.orbitRadius * Math.sin(this.angle);

        // Adjust rotation to face forward
        let spaceshipAngle = this.angle + Math.PI;

        return [spaceshipX, spaceshipY, spaceshipAngle];
    }

    drawSpaceship(sketch) {
        if (!this.image || !this.orbitStar) return;

        let spaceshipX, spaceshipY, spaceshipAngle;

        let angle = this.angle + Math.PI / 2;
        while (angle >= Math.PI){
            angle -= 2 * Math.PI;
        }
        while (angle < -Math.PI){
            angle += Math.PI;
        }

        if (this.inTransit && Math.abs(angle - this.transitAngle) <= 0.02) {
            // Distance to target
            let distToTarget = Math.hypot(this.transitX - this.newOrbitStar.baseX, this.transitY - this.newOrbitStar.baseY);

            // Acceleration logic
            if (distToTarget > 100) {
                // Speed up until max speed
                this.transitSpeed = Math.min(this.transitSpeed + this.transitAcceleration, this.maxTransitSpeed);
            } else {
                // Slow down when close to target
                this.transitSpeed = Math.max(this.transitSpeed - this.transitAcceleration, 0.7);
            }

            // Move towards the new orbit star using transitAngle
            let speedX = this.transitSpeed * Math.cos(this.transitAngle);
            let speedY = this.transitSpeed * Math.sin(this.transitAngle);

            this.transitX += speedX;
            this.transitY += speedY;

            // Check if spaceship has reached new orbit star
            if (distToTarget <= this.orbitRadius + 1) {
                this.inTransit = false;
                this.orbitStar = this.newOrbitStar;
                this.transitSpeed = 0; // Reset speed
            }

            spaceshipX = this.transitX;
            spaceshipY = this.transitY;
            spaceshipAngle = this.transitAngle + Math.PI / 2; // Face movement direction
        } else {
            // Normal orbit
            [spaceshipX, spaceshipY, spaceshipAngle] = this.orbitSpaceShip(sketch);
            this.transitX = spaceshipX;
            this.transitY = spaceshipY;
        }

        sketch.push();
        sketch.translate(spaceshipX, spaceshipY);
        sketch.rotate(spaceshipAngle);
        sketch.imageMode(sketch.CENTER);

        // Glowing aura effect
        for (let i = 5; i > 0; i--) {
            let alpha = 10 - i * 2;
            sketch.fill(204, 204, 204, alpha);
            sketch.ellipse(0, 0, 20 + i * 4);
        }

        sketch.noFill();
        sketch.image(this.image, 0, 0, 20, 20);

        sketch.pop();
    }
}
