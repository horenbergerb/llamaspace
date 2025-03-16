export class Spaceship {
    static image = null;

    constructor(sketch) {
        this.sketch = sketch;

        // Angle of the ship with respect to the planet it orbits
        this.orbitAngle = 0; 
        this.orbitBody = null;
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
        this.newOrbitBody = null;

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

    setOrbitBody(newOrbitBody) {
        /* Determines the body around which the spaceship will orbit.
        If the spaceship is already at a body, it will begin the process of traveling
        to the new body. 
        
        For star-to-star travel: we wait until facing the right direction before departing
        For any travel involving planets: we depart immediately */
        if (!this.orbitBody) {
            this.orbitBody = newOrbitBody;
            return;
        }

        // Calculate angle between current orbit body and new orbit body
        let dx = newOrbitBody.baseX - this.orbitBody.baseX;
        let dy = newOrbitBody.baseY - this.orbitBody.baseY;
        this.transitAngle = Math.atan2(dy, dx);

        this.transitSpeed = 0; // Reset speed at start
        this.destinationSet = true;
        this.newOrbitBody = newOrbitBody;

        // If either body is a planet (instanceof MapPlanet), start transit immediately
        if (this.orbitBody.constructor.name === 'MapPlanet' || newOrbitBody.constructor.name === 'MapPlanet') {
            this.inTransit = true;
            // Update angle to face the destination immediately
            this.spaceshipAngle = this.transitAngle + Math.PI / 2;
        }
    }

    updateSpaceshipInOrbit() {
        /* Orbits the spaceship about its orbitBody.
        Assumes the spaceship is already in orbit, i.e.
        that it's located at this.orbitAngle relative to the star */
        if (!this.orbitBody) return [0, 0, 0];

        // Update orbit angle
        this.orbitAngle += 0.02;
        this.orbitAngle = this.constrainAngle(this.orbitAngle);

        // Increment the spaceship position in orbit
        this.spaceshipX = this.orbitBody.baseX + this.orbitRadius * Math.cos(this.orbitAngle);
        this.spaceshipY = this.orbitBody.baseY + this.orbitRadius * Math.sin(this.orbitAngle);

        // Adjust rotation to face forward
        this.spaceshipAngle = this.orbitAngle + Math.PI;
    }

    updateSpaceshipInTransit(){
        this.inTransit = true;

        /* Progresses the spaceship towards its target orbit. */
        let distToTarget = Math.hypot(this.spaceshipX - this.newOrbitBody.baseX, this.spaceshipY - this.newOrbitBody.baseY);

        // If destination is a planet, continuously update transit angle to follow its movement
        if (this.newOrbitBody.constructor.name === 'MapPlanet') {
            let dx = this.newOrbitBody.baseX - this.spaceshipX;
            let dy = this.newOrbitBody.baseY - this.spaceshipY;
            this.transitAngle = Math.atan2(dy, dx);
            // Update spaceship angle to face the moving target
            this.spaceshipAngle = this.transitAngle + Math.PI / 2;
        }

        // Acceleration logic
        if (distToTarget > 50) {
            // Speed up until max speed
            this.transitSpeed = Math.min(this.transitSpeed + this.transitAcceleration, this.maxTransitSpeed);
        } else {
            // Slow down when close to target
            this.transitSpeed = Math.max(this.transitSpeed - this.transitDecceleration, 0.8);
        }

        // Move towards the target using transitAngle
        let speedX = this.transitSpeed * Math.cos(this.transitAngle);
        let speedY = this.transitSpeed * Math.sin(this.transitAngle);

        this.spaceshipX += speedX;
        this.spaceshipY += speedY;
        
        // Only update angle for star-to-star travel, planet angles are handled above
        if (this.newOrbitBody.constructor.name !== 'MapPlanet') {
            this.spaceshipAngle = this.transitAngle + Math.PI / 2;
        }

        // Check if spaceship has reached new orbit body, but only if:
        // 1. We've gotten close enough to the target (within 100 pixels)
        // 2. We've been tracking the previous distance
        // 3. The distance is now increasing (we've passed the closest point)
        if ((this.prevDist !== null && this.newOrbitBody.constructor.name == 'MapPlanet' && distToTarget < 20) ||
            (this.prevDist !== null && this.newOrbitBody.constructor.name == 'MapStar' && distToTarget > this.prevDist)) {
            this.inTransit = false;
            this.destinationSet = false;
            this.orbitBody = this.newOrbitBody;
            this.transitSpeed = 0; // Reset speed
            this.prevDist = null;
            this.updateSpaceshipInOrbit();
        } else {
            this.prevDist = distToTarget;
        }
    }

    drawPulsingDashedLine() {
        if (!this.orbitBody || !this.newOrbitBody) return;
    
        let ctx = this.sketch.drawingContext;
    
        let x1 = this.orbitBody.baseX;
        let y1 = this.orbitBody.baseY;
        let x2 = this.newOrbitBody.baseX;
        let y2 = this.newOrbitBody.baseY;
    
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
        let alpha = 75 + pulseFactor * 50; // Fades between 75 and 125
    
        this.sketch.push();
        this.sketch.stroke(255, 255, 255, alpha); // White with pulsing opacity
        this.sketch.strokeWeight(2);
        ctx.setLineDash([10, 10]); // Dashed pattern
    
        this.sketch.line(x1, y1, x2, y2);
    
        ctx.setLineDash([]); // Reset to solid line for other drawings
        this.sketch.pop();
    }

    drawSpaceship() {
        /* Draws the spaceship. This handles three cases:
        1) the spaceship is in orbit around a body
        2) the spaceship is traveling between stars (requires proper angle)
        3) the spaceship is traveling to/from a planet (departs immediately) */
        if (!Spaceship.image || !this.orbitBody) return;

        let angle = this.orbitAngle + Math.PI / 2;
        angle = this.constrainAngle(angle);

        // If we're already in transit or if either body is a planet and we have a destination
        if (this.inTransit || 
            (this.destinationSet && 
             (this.orbitBody.constructor.name === 'MapPlanet' || 
              this.newOrbitBody.constructor.name === 'MapPlanet'))) {
            this.updateSpaceshipInTransit();
        }
        // For star-to-star travel, wait until facing the right direction
        else if (this.destinationSet && Math.abs(angle - this.transitAngle) <= 0.02) {
            this.updateSpaceshipInTransit();
        } else {
            // Normal orbit
            this.updateSpaceshipInOrbit();
        }

        // Draw the pulsing dashed line to destination first (behind ship)
        if (this.destinationSet) {
            this.drawPulsingDashedLine();
        }

        this.sketch.push();
        this.sketch.translate(this.spaceshipX, this.spaceshipY);
        this.sketch.rotate(this.spaceshipAngle);
        this.sketch.imageMode(this.sketch.CENTER);

        // Glowing aura effect
        this.sketch.noStroke();
        for (let i = 5; i > 0; i--) {
            let alpha = 10 - i * 2;
            this.sketch.fill(204, 204, 204, alpha);
            this.sketch.ellipse(0, 0, 20 + i * 4);
        }

        this.sketch.noFill();
        this.sketch.image(Spaceship.image, 0, 0, 20, 20);

        this.sketch.pop();
    }
}
