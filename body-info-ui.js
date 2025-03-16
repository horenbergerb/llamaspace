export class BodyInfoUI {
    constructor(sketch) {
        this.sketch = sketch;
        this.isVisible = false;
        this.body = null;
        this.uiX = 0;
        this.uiY = 0;
        this.uiWidth = 300;
        this.uiHeight = 200;
        this.closeButtonSize = 20;
        this.inSystemMap = false;
    }

    open(body) {
        this.body = body;
        this.isVisible = true;

        // Position the UI just below the body
        this.uiX = body.baseX - this.uiWidth / 2;
        this.uiY = body.baseY + 30;
    }

    close() {
        this.isVisible = false;
        this.body = null;
    }

    drawCommonButtons(spaceship) {
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.textSize(12);
        
        // Set Destination button (available everywhere)
        const canSetDestination = !spaceship.inTransit;
        this.sketch.fill(canSetDestination ? 50 : 30, 255, canSetDestination ? 100 : 60);
        this.sketch.rect(this.uiX + this.uiWidth - 120, this.uiY + this.uiHeight - 40, 100, 25, 5);
        this.sketch.fill(255);
        this.sketch.stroke(100);
        const destButtonY = this.uiY + this.uiHeight - 40 + 25/2; // Center vertically in button
        this.sketch.text("Set Destination", this.uiX + this.uiWidth - 70, destButtonY);

        if (!this.inSystemMap) {
            // Enter System button (only in galaxy view)
            this.sketch.fill(50, 150, 255);
            this.sketch.rect(this.uiX + 20, this.uiY + this.uiHeight - 40, 100, 25, 5);
            this.sketch.fill(255);
            const enterButtonY = this.uiY + this.uiHeight - 40 + 25/2; // Center vertically in button
            this.sketch.text("Enter System", this.uiX + 70, enterButtonY);
        } else {
            // Research button (only in system view)
            this.sketch.fill(255, 150, 50);
            this.sketch.rect(this.uiX + 20, this.uiY + this.uiHeight - 40, 100, 25, 5);
            this.sketch.fill(255);
            const researchButtonY = this.uiY + this.uiHeight - 40 + 25/2; // Center vertically in button
            this.sketch.text("Research", this.uiX + 70, researchButtonY);
        }
    }

    drawCloseButton() {
        // Close Button
        this.sketch.fill(255, 0, 0);
        this.sketch.rect(this.uiX + this.uiWidth - this.closeButtonSize - 5, this.uiY + 5, 
                        this.closeButtonSize, this.closeButtonSize, 5);
        this.sketch.fill(255);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.text("X", this.uiX + this.uiWidth - this.closeButtonSize / 2 - 5, 
                        this.uiY + this.closeButtonSize / 2 + 5);
    }

    drawUI(spaceship) {
        if (!this.isVisible || !this.body) return;

        this.sketch.push();

        // Draw background panel
        this.sketch.fill(0, 0, 0, 180);
        this.sketch.stroke(255);
        this.sketch.rect(this.uiX, this.uiY, this.uiWidth, this.uiHeight, 10);

        // Draw name
        this.sketch.fill(255);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.TOP);
        this.sketch.text(this.body.name, this.uiX + this.uiWidth / 2, this.uiY + 10);

        // Draw properties
        this.sketch.textAlign(this.sketch.LEFT, this.sketch.TOP);
        this.sketch.textSize(12);
        let infoY = this.uiY + 40;
        
        // Draw body-specific properties
        this.drawProperties(infoY);

        // Draw common buttons
        this.drawCommonButtons(spaceship);
        
        // Draw close button
        this.drawCloseButton();

        this.sketch.pop();
    }

    drawProperties(startY) {
        // This should be overridden by child classes
        throw new Error("Method 'drawProperties' must be implemented by child classes");
    }

    handleMouseReleased(camera, mouseX, mouseY, spaceship) {
        if (!this.isVisible) return false;

        let mouseXTransformed = (mouseX - camera.panX) / camera.scaleFactor;
        let mouseYTransformed = (mouseY - camera.panY) / camera.scaleFactor;

        // Check if click is within UI bounds
        let capturedMouse = (mouseXTransformed >= this.uiX && 
                           mouseXTransformed <= this.uiX + this.uiWidth && 
                           mouseYTransformed >= this.uiY && 
                           mouseYTransformed <= this.uiY + this.uiHeight);
        
        if (!capturedMouse) return false;

        // Check close button
        let closeX = this.uiX + this.uiWidth - this.closeButtonSize - 5;
        let closeY = this.uiY + 5;
        if (mouseXTransformed >= closeX && 
            mouseXTransformed <= closeX + this.closeButtonSize && 
            mouseYTransformed >= closeY && 
            mouseYTransformed <= closeY + this.closeButtonSize) {
            this.close();
            return true;
        }

        // Check Set Destination button
        let destX = this.uiX + this.uiWidth - 120;
        let destY = this.uiY + this.uiHeight - 40;
        if (mouseXTransformed >= destX && 
            mouseXTransformed <= destX + 100 && 
            mouseYTransformed >= destY && 
            mouseYTransformed <= destY + 25) {
            if (!spaceship.inTransit) {
                console.log(`Setting course for ${this.body.name}...`);
                spaceship.setOrbitBody(this.body);
                this.close();
            }
            return true;
        }

        // Check Enter System/Research button
        let actionX = this.uiX + 20;
        let actionY = this.uiY + this.uiHeight - 40;
        if (mouseXTransformed >= actionX && 
            mouseXTransformed <= actionX + 100 && 
            mouseYTransformed >= actionY && 
            mouseYTransformed <= actionY + 25) {
            if (!this.inSystemMap) {
                console.log(`Entering System ${this.body.name}...`);
                window.enterStarSystem(this.body);
            } else {
                console.log(`Researching ${this.body.name}...`);
                // TODO: Implement research functionality
            }
            this.close();
            return true;
        }

        return true;
    }
} 