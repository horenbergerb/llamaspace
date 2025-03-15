export class Spaceship {
    static image = null;

    constructor(sketch) {
        this.sketch = sketch;

        // Angle of the ship with respect to the planet it orbits
        this.orbitAngle = 0; 
        this.orbitStar = null;
        this.orbitRadius = 20;

        // The angle of rotation of the spaceship's image
        this.spaceshipAngle = 0;
        this.spaceshipX = 0;
        this.spaceshipY = 0;

        this.destinationSet = false;
        // Whether the spaceship has departed orbit
        // Used to prevent changing destinations on the fly
        this.inTransit = false;

        this.transitAngle = 0;
        this.transitSpeed = 0; // Start at 0 velocity
        this.maxTransitSpeed = 2; // Maximum travel speed
        this.transitAcceleration = 0.05; // Acceleration per frame
        this.transitDecceleration = 0.09
        this.newOrbitStar = null;

        this.prevDist = null;
    }

    static preload(sketch) {
        Spaceship.image = sketch.loadImage("spaceship.png");
    }

    constrainAngle(angle){
        /* Annoying wrangling of angles to make sure that we can compare them
        Keeps them between -pi and pi */

        while (angle >= Math.PI){
            angle -= 2 * Math.PI;
        }
        while (angle < -Math.PI){
            angle += Math.PI;
        }     
        return angle; 
    }

    setOrbitStar(newOrbitStar) {
        /* Determines the star around which the spaceship will orbit.
        If the spaceship is already at a star, it will begin the process of traveling
        to the new star. 
        
        Note that we calculate the angle between the stars, but
        we will travel along a line parallel to the connecting line between these stars.
        We leave our orbit on a tangent trajectory and arrive at the new orbit on a tangent trajectory.*/
        if (!this.orbitStar) {
            this.orbitStar = newOrbitStar;
            return;
        }

        // Calculate angle between current orbit star and new orbit star
        let dx = newOrbitStar.baseX - this.orbitStar.baseX;
        let dy = newOrbitStar.baseY - this.orbitStar.baseY;
        this.transitAngle = Math.atan2(dy, dx);

        this.transitSpeed = 0; // Reset speed at start

        this.destinationSet = true;
        this.newOrbitStar = newOrbitStar;
    }

    updateSpaceshipInOrbit() {
        /* Orbits the spaceship about its orbitStar.
        Assumes the spaceship is already in orbit, i.e.
        that it's located at this.orbitAngle relative to the star */
        if (!this.orbitStar) return [0, 0, 0];

        // Update orbit angle
        this.orbitAngle += 0.02;
        this.orbitAngle = this.constrainAngle(this.orbitAngle);

        // Increment the spaceship position in orbit
        this.spaceshipX = this.orbitStar.baseX + this.orbitRadius * Math.cos(this.orbitAngle);
        this.spaceshipY = this.orbitStar.baseY + this.orbitRadius * Math.sin(this.orbitAngle);

        // Adjust rotation to face forward
        this.spaceshipAngle = this.orbitAngle + Math.PI;
    }

    updateSpaceshipInTransit(){
        this.inTransit = true;

        /* Progresses the spaceship towards its target orbit. */
        let distToTarget = Math.hypot(this.spaceshipX - this.newOrbitStar.baseX, this.spaceshipY - this.newOrbitStar.baseY);

        // Acceleration logic
        if (distToTarget > 50) {
            // Speed up until max speed
            this.transitSpeed = Math.min(this.transitSpeed + this.transitAcceleration, this.maxTransitSpeed);
        } else {
            // Slow down when close to target
            this.transitSpeed = Math.max(this.transitSpeed - this.transitDecceleration, 0.8);
        }

        // Check if spaceship has reached new orbit star
        // i.e. if continuing forward would start taking us further from our target
        if ( this.prevDist != null  && distToTarget > this.prevDist) {
            this.inTransit = false;
            this.destinationSet = false;
            this.orbitStar = this.newOrbitStar;
            this.transitSpeed = 0; // Reset speed
            this.prevDist = null;
            this.updateSpaceshipInOrbit();
        }
        else {
            this.prevDist = distToTarget;
            // Move towards the new orbit star using transitAngle
            let speedX = this.transitSpeed * Math.cos(this.transitAngle);
            let speedY = this.transitSpeed * Math.sin(this.transitAngle);

            this.spaceshipX += speedX;
            this.spaceshipY += speedY;
            this.spaceshipAngle = this.transitAngle + Math.PI / 2;
        }
    }

    drawSpaceship() {
        /* Draws the spaceship. This handles two cases:
        1) the spaceship is in orbit around a star
        2) the spaceship is traveling between stars */
        if (!Spaceship.image || !this.orbitStar) return;

        let angle = this.orbitAngle + Math.PI / 2;
        angle = this.constrainAngle(angle);

        // Case where the ship has a destination and is facing the right direction to travel to it
        if (this.destinationSet && Math.abs(angle - this.transitAngle) <= 0.02) {
            this.updateSpaceshipInTransit();
        } else {
            // Normal orbit
            this.updateSpaceshipInOrbit();
        }

        this.sketch.push();
        this.sketch.translate(this.spaceshipX, this.spaceshipY);
        this.sketch.rotate(this.spaceshipAngle);
        this.sketch.imageMode(this.sketch.CENTER);

        // Glowing aura effect
        for (let i = 5; i > 0; i--) {
            let alpha = 10 - i * 2;
            this.sketch.fill(204, 204, 204, alpha);
            this.sketch.ellipse(0, 0, 20 + i * 4);
        }

        this.sketch.noFill();
        this.sketch.image(Spaceship.image, 0, 0, 20, 20);

        this.sketch.pop();

        // **Draw the pulsing dashed line to destination**
        if (this.destinationSet) {
            this.drawPulsingDashedLine();
        }
    }

    drawPulsingDashedLine() {
        if (!this.orbitStar || !this.newOrbitStar) return;
    
        let ctx = this.sketch.drawingContext;
    
        let x1 = this.orbitStar.baseX;
        let y1 = this.orbitStar.baseY;
        let x2 = this.newOrbitStar.baseX;
        let y2 = this.newOrbitStar.baseY;
    
        // Compute vector direction from start to destination
        let dx = x2 - x1;
        let dy = y2 - y1;
        let dist = Math.sqrt(dx * dx + dy * dy);
    
        // Normalize the direction vector
        let nx = dx / dist;
        let ny = dy / dist;
    
        // Shorten the line by trimming both ends
        let shortenAmount = 15; // Adjust this to change the trim distance
        x1 += nx * shortenAmount;
        y1 += ny * shortenAmount;
        x2 -= nx * shortenAmount;
        y2 -= ny * shortenAmount;
    
        // Pulsing effect
        let pulseFactor = (this.sketch.sin(this.sketch.frameCount * 0.1) + 1) / 2; // Pulse between 0 and 1
        let alpha = 75 + pulseFactor * 50; // Fades between 100 and 200
    
        this.sketch.push();
        this.sketch.stroke(255, 255, 255, alpha); // White with pulsing opacity
        this.sketch.strokeWeight(2);
        ctx.setLineDash([10, 10]); // Dashed pattern
    
        this.sketch.line(x1, y1, x2, y2);
    
        ctx.setLineDash([]); // Reset to solid line for other drawings
        this.sketch.pop();
    }
}
