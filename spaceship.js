export class Spaceship {
    constructor(sketch) {
        this.sketch = sketch;

        this.image;
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

    preload() {
        this.image = this.sketch.loadImage("spaceship.png");
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
        if (!this.image || !this.orbitStar) return;

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
        this.sketch.image(this.image, 0, 0, 20, 20);

        this.sketch.pop();
    }
}
