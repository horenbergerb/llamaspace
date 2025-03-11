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
        this.transitSpeed = 2; // Pixels per frame while traveling
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

        // Enable transit mode
        this.inTransit = true;
        this.newOrbitStar = newOrbitStar;
    }

    orbitSpaceShip(sketch) {
        if (!this.orbitStar) return [0, 0, 0];

        // Update orbit angle
        this.angle += 0.02;
        while (this.angle >= Math.PI){
            this.angle = this.angle - 2*Math.PI;
        }
        while (this.angle < -Math.PI){
            this.angle = this.angle + Math.PI;
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

        let angle = this.angle + Math.PI/2;
        while (angle >= Math.PI){
            angle = angle - 2*Math.PI;
        }
        while (angle < -Math.PI){
            angle = angle + Math.PI;
        }

        if (this.inTransit && Math.abs(angle - this.transitAngle) <= 0.02) {

            // Move towards the new orbit star using transitAngle
            let speedX = this.transitSpeed * Math.cos(this.transitAngle);
            let speedY = this.transitSpeed * Math.sin(this.transitAngle);

            this.transitX += speedX;
            this.transitY += speedY;


            // Check if spaceship has reached new orbit star
            let distToTarget = Math.hypot(this.transitX - this.newOrbitStar.baseX, this.transitY - this.newOrbitStar.baseY);
            if (distToTarget <= this.orbitRadius + 3) {
                this.inTransit = false;
                this.orbitStar = this.newOrbitStar;
                //this.angle = Math.PI - this.angle;
            }

            spaceshipX = this.transitX;
            spaceshipY = this.transitY;
            spaceshipAngle = this.transitAngle + Math.PI/2; // Face movement direction
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
