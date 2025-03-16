export class StarInfoUI {
    constructor(sketch) {
        this.sketch = sketch;
        this.isVisible = false;
        this.star = null;
        this.uiX = 0;
        this.uiY = 0;
        this.uiWidth = 300;
        this.uiHeight = 200;
        this.closeButtonSize = 20;
        this.inSystemView = false; // Track if we're in system view
    }

    open(star) {
        this.star = star;
        this.isVisible = true;

        // Position the UI just below the star
        this.uiX = star.baseX - this.uiWidth / 2;
        this.uiY = star.baseY + 30;
    }

    close() {
        this.isVisible = false;
        this.star = null;
    }

    drawUI() {
        if (!this.isVisible || !this.star) return;

        this.sketch.push();

        // Draw background panel
        this.sketch.fill(0, 0, 0, 180);
        this.sketch.stroke(255);
        this.sketch.rect(this.uiX, this.uiY, this.uiWidth, this.uiHeight, 10);

        this.sketch.stroke(100);

        // Star Name
        this.sketch.fill(255);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.TOP);
        this.sketch.text(this.star.name, this.uiX + this.uiWidth / 2, this.uiY + 10);

        // Star Details
        this.sketch.textAlign(this.sketch.LEFT, this.sketch.TOP);
        this.sketch.textSize(12);
        let infoY = this.uiY + 40;
        this.sketch.text(`Spectral Class: ${this.star.bodyProperties.type}`, this.uiX + 15, infoY);
        this.sketch.text(`Temperature: ${Math.round(this.star.bodyProperties.temperature)} K`, this.uiX + 15, infoY + 20);
        this.sketch.text(`Mass: ${this.star.bodyProperties.mass.toFixed(2)} M☉`, this.uiX + 15, infoY + 40);
        this.sketch.text(`Planets: ${this.star.bodyProperties.hasPlanets ? this.star.bodyProperties.numPlanets : "None"}`, this.uiX + 15, infoY + 60);
        this.sketch.text(`Flare Activity: ${this.star.bodyProperties.flareActivity}`, this.uiX + 15, infoY + 80);

        this.sketch.stroke(255);
        // Close Button
        this.sketch.fill(255, 0, 0);
        this.sketch.rect(this.uiX + this.uiWidth - this.closeButtonSize - 5, this.uiY + 5, this.closeButtonSize, this.closeButtonSize, 5);
        this.sketch.fill(255);

        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.stroke(100);
        this.sketch.text("X", this.uiX + this.uiWidth - this.closeButtonSize / 2 - 5, this.uiY + this.closeButtonSize / 2 + 5);
        this.sketch.stroke(255);

        // Action Buttons
        if (!this.inSystemView) {
            // Enter System button (only show in galaxy view)
            this.sketch.fill(50, 150, 255);
            this.sketch.rect(this.uiX + 20, this.uiY + this.uiHeight - 40, 100, 25, 5);
            this.sketch.fill(255);
            this.sketch.textSize(12);
            this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
            this.sketch.stroke(100);
            this.sketch.text("Enter System", this.uiX + 70, this.uiY + this.uiHeight - 28);
            this.sketch.stroke(255);

            // Set Destination button (only in galaxy view)
            this.sketch.fill(50, 255, 100);
            this.sketch.rect(this.uiX + this.uiWidth - 120, this.uiY + this.uiHeight - 40, 100, 25, 5);
            this.sketch.fill(255);
            this.sketch.stroke(100);
            this.sketch.text("Set Destination", this.uiX + this.uiWidth - 70, this.uiY + this.uiHeight - 28);
            this.sketch.stroke(255);
        } else {
            // Return to Galaxy button (only show in system view)
            this.sketch.fill(50, 150, 255);
            this.sketch.rect(this.uiX + this.uiWidth / 2 - 60, this.uiY + this.uiHeight - 40, 120, 25, 5);
            this.sketch.fill(255);
            this.sketch.textSize(12);
            this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
            this.sketch.stroke(100);
            this.sketch.text("Return to Galaxy", this.uiX + this.uiWidth / 2, this.uiY + this.uiHeight - 28);
            this.sketch.stroke(255);
        }

        this.sketch.pop();
    }

    handleMouseReleased(camera, mouseX, mouseY, spaceship) {
        if (!this.isVisible) return false;

        let mouseXTransformed = (mouseX - camera.panX) / camera.scaleFactor;
        let mouseYTransformed = (mouseY - camera.panY) / camera.scaleFactor;

        let capturedMouse = (mouseXTransformed >= this.uiX && mouseXTransformed <= this.uiX + this.uiWidth && mouseYTransformed >= this.uiY && mouseYTransformed <= this.uiY + this.uiHeight);
        if (!capturedMouse)
            return capturedMouse;

        // Check if clicking the close button
        let closeX = this.uiX + this.uiWidth - this.closeButtonSize - 5;
        let closeY = this.uiY + 5;
        if (mouseXTransformed >= closeX && mouseXTransformed <= closeX + this.closeButtonSize && mouseYTransformed >= closeY && mouseYTransformed <= closeY + this.closeButtonSize) {
            this.close();
            return capturedMouse;
        }

        if (!this.inSystemView) {
            // Check if clicking the "Enter System" button (only in galaxy view)
            let enterX = this.uiX + 20;
            let enterY = this.uiY + this.uiHeight - 40;
            if (mouseXTransformed >= enterX && mouseXTransformed <= enterX + 100 && mouseYTransformed >= enterY && mouseYTransformed <= enterY + 25) {
                console.log(`Entering System ${this.star.name}...`);
                window.enterStarSystem(this.star);
                this.close();
                return capturedMouse;
            }

            // Check if clicking the "Set Destination" button (only in galaxy view)
            let destX = this.uiX + this.uiWidth - 120;
            let destY = this.uiY + this.uiHeight - 40;
            if (mouseXTransformed >= destX && mouseXTransformed <= destX + 100 && mouseYTransformed >= destY && mouseYTransformed <= destY + 25) {
                if (!spaceship.inTransit) {
                    console.log(`Setting course for ${this.star.name}...`);
                    spaceship.setOrbitBody(this.star);
                    this.close();
                }
                return capturedMouse;
            }
        } else {
            // Check if clicking the "Return to Galaxy" button (only in system view)
            let returnX = this.uiX + this.uiWidth / 2 - 60;
            let returnY = this.uiY + this.uiHeight - 40;
            if (mouseXTransformed >= returnX && mouseXTransformed <= returnX + 120 && mouseYTransformed >= returnY && mouseYTransformed <= returnY + 25) {
                console.log(`Returning to galaxy map...`);
                window.returnToGalaxyMap();
                this.inSystemView = false;
                this.close();
                return capturedMouse;
            }
        }

        return capturedMouse;
    }
}
