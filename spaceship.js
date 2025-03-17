export class Spaceship {
    static image = null;

    // Transit-related constants
    static ARRIVAL_DISTANCE = 20;  // Distance at which we consider arrival at destination
    static SLOW_DOWN_DISTANCE = 50;  // Distance at which to start slowing down
    static BASE_ORBIT_RADIUS = 20;  // Base distance to maintain in orbit (for galaxy view)
    static ORBIT_RADIUS_FACTOR = 1.5;  // Multiplier for orbit radius relative to body size
    static ORBIT_SPEED = 0.02;  // Speed of orbit rotation (adjusted for deltaTime)
    static MAX_TRANSIT_SPEED = 2.0;  // Maximum travel speed (adjusted for deltaTime)
    static ACCELERATION = 0.05;  // Acceleration per frame (adjusted for deltaTime)
    static DECELERATION = 0.09;  // Deceleration per frame (adjusted for deltaTime)
    static MIN_SPEED = 0.8;  // Minimum speed during transit (adjusted for deltaTime)

    constructor(sketch) {
        this.sketch = sketch;

        // Angle of the ship with respect to the body it orbits
        this.orbitAngle = 0; 
        this.orbitBody = null;

        // The angle of rotation of the spaceship's image
        this.spaceshipAngle = 0;
        this.spaceshipX = 0;
        this.spaceshipY = 0;

        this.destinationSet = false;
        this.inTransit = false;
        this.transitAngle = 0;
        this.transitSpeed = 0;
        this.newOrbitBody = null;
        this.prevDist = null;

        // Track which map we're in
        this.inSystemMap = false;
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

    setInSystemMap(isInSystem) {
        this.inSystemMap = isInSystem;
    }

    setOrbitBody(newOrbitBody) {
        if (!this.orbitBody) {
            this.orbitBody = newOrbitBody;
            return;
        }

        this.calculateInitialTransitAngle(newOrbitBody);
        this.transitSpeed = 0;
        this.destinationSet = true;
        this.newOrbitBody = newOrbitBody;

        // In system map, start transit immediately
        if (this.inSystemMap) {
            this.startImmediateTransit();
        }
    }

    calculateInitialTransitAngle(target) {
        const dx = target.baseX - this.orbitBody.baseX;
        const dy = target.baseY - this.orbitBody.baseY;
        this.transitAngle = Math.atan2(dy, dx);
    }

    startImmediateTransit() {
        this.inTransit = true;
        this.spaceshipAngle = this.transitAngle + Math.PI / 2;
    }

    updateSpaceshipInOrbit() {
        if (!this.orbitBody) return;

        // Update orbit angle using deltaTime
        const deltaTimeSeconds = this.sketch.deltaTime / 1000;
        this.orbitAngle = this.constrainAngle(this.orbitAngle + Spaceship.ORBIT_SPEED * deltaTimeSeconds * 60);

        // Calculate orbit radius based on context
        const orbitRadius = this.inSystemMap ? 
            this.orbitBody.size * Spaceship.ORBIT_RADIUS_FACTOR : 
            Spaceship.BASE_ORBIT_RADIUS;

        // Update position
        this.spaceshipX = this.orbitBody.baseX + orbitRadius * Math.cos(this.orbitAngle);
        this.spaceshipY = this.orbitBody.baseY + orbitRadius * Math.sin(this.orbitAngle);

        // Face tangent to orbit
        this.spaceshipAngle = this.orbitAngle + Math.PI;
    }

    updateSpaceshipInTransit() {
        this.inTransit = true;
        
        const distToTarget = this.calculateDistanceToTarget();
        
        // In system map, continuously update angle to track target
        if (this.inSystemMap) {
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
        const deltaTimeSeconds = this.sketch.deltaTime / 1000;
        const timeScale = deltaTimeSeconds * 60; // Scale to 60fps equivalent

        if (distToTarget > Spaceship.SLOW_DOWN_DISTANCE) {
            this.transitSpeed = Math.min(
                this.transitSpeed + Spaceship.ACCELERATION * timeScale,
                Spaceship.MAX_TRANSIT_SPEED
            );
        } else {
            this.transitSpeed = Math.max(
                this.transitSpeed - Spaceship.DECELERATION * timeScale,
                Spaceship.MIN_SPEED
            );
        }
    }

    moveSpaceship() {
        const deltaTimeSeconds = this.sketch.deltaTime / 1000;
        const timeScale = deltaTimeSeconds * 60; // Scale to 60fps equivalent
        
        const speedX = this.transitSpeed * Math.cos(this.transitAngle) * timeScale;
        const speedY = this.transitSpeed * Math.sin(this.transitAngle) * timeScale;
        
        this.spaceshipX += speedX;
        this.spaceshipY += speedY;

        // Only update angle in galaxy map, system map angles are handled separately
        if (!this.inSystemMap) {
            this.spaceshipAngle = this.transitAngle + Math.PI / 2;
        }
    }

    hasReachedDestination(distToTarget) {
        if (!this.prevDist) return false;

        if (this.inSystemMap) {
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

    update() {
        if (!this.orbitBody) return;

        const angle = this.constrainAngle(this.orbitAngle + Math.PI / 2);

        // Determine if we should be in transit
        if (this.inTransit || 
            (this.destinationSet && this.inSystemMap) ||
            (this.destinationSet && Math.abs(angle - this.transitAngle) <= 0.02)) {
            this.updateSpaceshipInTransit();
        } else {
            this.updateSpaceshipInOrbit();
        }
    }
}
