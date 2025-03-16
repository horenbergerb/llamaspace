export class Spaceship {
    static image = null;

    // Transit-related constants
    static ARRIVAL_DISTANCE = 20;  // Distance at which we consider arrival at a planet
    static SLOW_DOWN_DISTANCE = 50;  // Distance at which to start slowing down
    static ORBIT_RADIUS = 20;  // Distance to maintain in orbit
    static ORBIT_SPEED = 0.02;  // Speed of orbit rotation
    static MAX_TRANSIT_SPEED = 2;  // Maximum travel speed
    static ACCELERATION = 0.05;  // Acceleration per frame
    static DECELERATION = 0.09;  // Deceleration per frame
    static MIN_SPEED = 0.8;  // Minimum speed during transit

    constructor(sketch) {
        this.sketch = sketch;

        // Angle of the ship with respect to the planet it orbits
        this.orbitAngle = 0; 
        this.orbitBody = null;

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

        this.calculateInitialTransitAngle(newOrbitBody);
        this.transitSpeed = 0;
        this.destinationSet = true;
        this.newOrbitBody = newOrbitBody;

        if (this.isEitherBodyAPlanet()) {
            this.startImmediateTransit();
        }
    }

    calculateInitialTransitAngle(target) {
        const dx = target.baseX - this.orbitBody.baseX;
        const dy = target.baseY - this.orbitBody.baseY;
        this.transitAngle = Math.atan2(dy, dx);
    }

    isEitherBodyAPlanet() {
        return this.orbitBody.constructor.name === 'MapPlanet' || 
               this.newOrbitBody.constructor.name === 'MapPlanet';
    }

    startImmediateTransit() {
        this.inTransit = true;
        this.spaceshipAngle = this.transitAngle + Math.PI / 2;
    }

    updateSpaceshipInOrbit() {
        /* Orbits the spaceship about its orbitBody.
        Assumes the spaceship is already in orbit, i.e.
        that it's located at this.orbitAngle relative to the star */
        if (!this.orbitBody) return [0, 0, 0];

        // Update orbit angle
        this.orbitAngle = this.constrainAngle(this.orbitAngle + Spaceship.ORBIT_SPEED);

        // Update position
        this.spaceshipX = this.orbitBody.baseX + Spaceship.ORBIT_RADIUS * Math.cos(this.orbitAngle);
        this.spaceshipY = this.orbitBody.baseY + Spaceship.ORBIT_RADIUS * Math.sin(this.orbitAngle);

        // Face tangent to orbit
        this.spaceshipAngle = this.orbitAngle + Math.PI;
    }

    updateSpaceshipInTransit() {
        this.inTransit = true;
        
        const distToTarget = this.calculateDistanceToTarget();
        
        if (this.newOrbitBody.constructor.name === 'MapPlanet') {
            this.updateAngleForMovingTarget();
        }

        this.updateTransitSpeed(distToTarget);
        this.moveSpaceship();

        if (this.hasReachedDestination(distToTarget)) {
            this.completeTransit();
        } else {
            this.prevDist = distToTarget;
        }
    }

    calculateDistanceToTarget() {
        return Math.hypot(
            this.spaceshipX - this.newOrbitBody.baseX,
            this.spaceshipY - this.newOrbitBody.baseY
        );
    }

    updateAngleForMovingTarget() {
        const dx = this.newOrbitBody.baseX - this.spaceshipX;
        const dy = this.newOrbitBody.baseY - this.spaceshipY;
        this.transitAngle = Math.atan2(dy, dx);
        this.spaceshipAngle = this.transitAngle + Math.PI / 2;
    }

    updateTransitSpeed(distToTarget) {
        if (distToTarget > Spaceship.SLOW_DOWN_DISTANCE) {
            this.transitSpeed = Math.min(
                this.transitSpeed + Spaceship.ACCELERATION,
                Spaceship.MAX_TRANSIT_SPEED
            );
        } else {
            this.transitSpeed = Math.max(
                this.transitSpeed - Spaceship.DECELERATION,
                Spaceship.MIN_SPEED
            );
        }
    }

    moveSpaceship() {
        const speedX = this.transitSpeed * Math.cos(this.transitAngle);
        const speedY = this.transitSpeed * Math.sin(this.transitAngle);
        
        this.spaceshipX += speedX;
        this.spaceshipY += speedY;

        // Update angle for star-to-star travel (planet angles handled separately)
        if (this.newOrbitBody.constructor.name !== 'MapPlanet') {
            this.spaceshipAngle = this.transitAngle + Math.PI / 2;
        }
    }

    hasReachedDestination(distToTarget) {
        if (!this.prevDist) return false;

        if (this.newOrbitBody.constructor.name === 'MapPlanet') {
            return distToTarget < Spaceship.ARRIVAL_DISTANCE;
        } else {
            return distToTarget > this.prevDist;
        }
    }

    completeTransit() {
        this.inTransit = false;
        this.destinationSet = false;
        this.orbitBody = this.newOrbitBody;
        this.transitSpeed = 0;
        this.prevDist = null;
        this.updateSpaceshipInOrbit();
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

        const angle = this.constrainAngle(this.orbitAngle + Math.PI / 2);

        // Determine if we should be in transit
        if (this.inTransit || 
            (this.destinationSet && this.isEitherBodyAPlanet()) ||
            (this.destinationSet && Math.abs(angle - this.transitAngle) <= 0.02)) {
            this.updateSpaceshipInTransit();
        } else {
            this.updateSpaceshipInOrbit();
        }

        // Draw destination line
        if (this.destinationSet) {
            this.drawPulsingDashedLine();
        }

        this.drawSpaceshipSprite();
    }

    drawSpaceshipSprite() {
        this.sketch.push();
        this.sketch.translate(this.spaceshipX, this.spaceshipY);
        this.sketch.rotate(this.spaceshipAngle);
        this.sketch.imageMode(this.sketch.CENTER);

        // Draw glowing aura
        this.sketch.noStroke();
        for (let i = 5; i > 0; i--) {
            const alpha = 10 - i * 2;
            this.sketch.fill(204, 204, 204, alpha);
            this.sketch.ellipse(0, 0, 20 + i * 4);
        }

        // Draw ship
        this.sketch.noFill();
        this.sketch.image(Spaceship.image, 0, 0, 20, 20);
        this.sketch.pop();
    }
}
