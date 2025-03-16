export class BodyInfoUI {
    constructor(sketch) {
        this.sketch = sketch;
        this.isVisible = false;
        this.body = null;
        this.uiX = 0;
        this.uiY = 0;
        this.uiWidth = 300;
        this.uiHeight = 230;
        this.closeButtonSize = 20;
        this.inSystemMap = false;
        
        // Scroll-related properties
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.propertiesStartY = 40; // Where properties start
        this.propertiesEndY = this.uiHeight - 70; // Increased space for buttons at bottom
        this.propertiesHeight = this.propertiesEndY - this.propertiesStartY;
        
        // Touch scrolling properties
        this.touchStartX = null;
        this.touchStartY = null;
        this.lastTouchY = null;
        this.isDraggingScroll = false;
        this.touchingButton = false;
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
        this.sketch.rect(this.uiX + this.uiWidth - 120, this.uiY + this.uiHeight - 35, 100, 25, 5);
        this.sketch.fill(255);
        this.sketch.stroke(100);
        const destButtonY = this.uiY + this.uiHeight - 35 + 25/2; // Center vertically in button
        this.sketch.text("Set Destination", this.uiX + this.uiWidth - 70, destButtonY);

        if (!this.inSystemMap) {
            // Enter System button (only in galaxy view)
            this.sketch.fill(50, 150, 255);
            this.sketch.rect(this.uiX + 20, this.uiY + this.uiHeight - 35, 100, 25, 5);
            this.sketch.fill(255);
            const enterButtonY = this.uiY + this.uiHeight - 35 + 25/2; // Center vertically in button
            this.sketch.text("Enter System", this.uiX + 70, enterButtonY);
        } else {
            // Research button (only in system view)
            this.sketch.fill(255, 150, 50);
            this.sketch.rect(this.uiX + 20, this.uiY + this.uiHeight - 35, 100, 25, 5);
            this.sketch.fill(255);
            const researchButtonY = this.uiY + this.uiHeight - 35 + 25/2; // Center vertically in button
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

    handleScroll(delta) {
        if (!this.isVisible) return;
        
        // Adjust scroll offset based on wheel delta
        this.scrollOffset = this.sketch.constrain(
            this.scrollOffset + delta,
            -this.maxScrollOffset,
            0
        );
    }

    drawUI(spaceship) {
        if (!this.isVisible || !this.body) return;

        // Store spaceship reference for touch handling
        this._spaceship = spaceship;

        this.sketch.push();

        // Draw background panel
        this.sketch.fill(0, 0, 0, 180);
        this.sketch.stroke(255);
        this.sketch.rect(this.uiX, this.uiY, this.uiWidth, this.uiHeight, 10);

        // Draw name
        this.sketch.fill(255);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.TOP);
        this.sketch.text(this.body.name, this.uiX + this.uiWidth / 2, this.uiY + 10);

        // Create a graphics buffer for the properties section
        const pg = this.sketch.createGraphics(this.uiWidth, this.propertiesHeight);
        pg.background(0, 0, 0, 0); // Transparent background
        
        // Set up the graphics context
        pg.fill(255);
        pg.textAlign(this.sketch.LEFT, this.sketch.TOP);
        pg.textSize(12);

        // Draw properties into the graphics buffer
        this.drawProperties(0, pg); // Pass 0 as Y since we're in the buffer's coordinate space

        // Draw the graphics buffer in the clipped region
        this.sketch.image(pg, this.uiX, this.uiY + this.propertiesStartY);
        pg.remove(); // Clean up the buffer

        // Draw common buttons
        this.drawCommonButtons(spaceship);
        
        // Draw close button
        this.drawCloseButton();

        // Draw scroll indicator if needed
        if (this.maxScrollOffset > 0) {
            const scrollPercent = -this.scrollOffset / this.maxScrollOffset;
            const scrollBarHeight = Math.max(30, (this.propertiesHeight / (this.propertiesHeight + this.maxScrollOffset)) * this.propertiesHeight);
            const scrollBarY = this.uiY + this.propertiesStartY + (this.propertiesHeight - scrollBarHeight) * scrollPercent;
            
            this.sketch.fill(150, 150, 150, 100);
            this.sketch.noStroke();
            this.sketch.rect(this.uiX + this.uiWidth - 8, scrollBarY, 4, scrollBarHeight, 2);
        }

        this.sketch.pop();
    }

    drawProperties(startY, pg) {
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
        let destY = this.uiY + this.uiHeight - 35;
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
        let actionY = this.uiY + this.uiHeight - 35;
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

    // Helper method to measure total height of properties
    measurePropertiesHeight() {
        let height = 0;
        this.sketch.push();
        this.sketch.textSize(12);
        
        // Create a temporary graphics buffer to measure text
        const g = this.sketch.createGraphics(1, 1);
        g.textSize(12);
        
        // Simulate drawing properties to calculate height
        const tempDraw = (y) => {
            if (!this.body || !this.body.bodyProperties) return 0;
            for (const [key, value] of Object.entries(this.body.bodyProperties)) {
                if (typeof value !== 'object' && typeof value !== 'function') {
                    height += 20; // Standard line height
                }
            }
            return height;
        };
        
        const totalHeight = tempDraw(0);
        this.maxScrollOffset = Math.max(0, totalHeight - this.propertiesHeight);
        
        g.remove();
        this.sketch.pop();
        return totalHeight;
    }

    handleTouchStart(camera, touchX, touchY) {
        if (!this.isVisible) return false;

        let touchXTransformed = (touchX - camera.panX) / camera.scaleFactor;
        let touchYTransformed = (touchY - camera.panY) / camera.scaleFactor;

        // Check if touch is within UI bounds
        let isTouchInUI = (touchXTransformed >= this.uiX && 
                          touchXTransformed <= this.uiX + this.uiWidth && 
                          touchYTransformed >= this.uiY && 
                          touchYTransformed <= this.uiY + this.uiHeight);

        if (!isTouchInUI) return false;

        // Store touch start position for button handling
        this.touchStartX = touchXTransformed;
        this.touchStartY = touchYTransformed;

        // Check if touch is in button areas first
        let isInButtonArea = touchYTransformed >= this.uiY + this.propertiesEndY;
        let isInCloseButton = (touchXTransformed >= this.uiX + this.uiWidth - this.closeButtonSize - 5 &&
                              touchXTransformed <= this.uiX + this.uiWidth - 5 &&
                              touchYTransformed >= this.uiY + 5 &&
                              touchYTransformed <= this.uiY + this.closeButtonSize + 5);

        if (isInButtonArea || isInCloseButton) {
            this.touchingButton = true;
            return true;
        }

        // Check if touch is in the scrollable area
        let isTouchInScrollArea = (touchYTransformed >= this.uiY + this.propertiesStartY && 
                                 touchYTransformed <= this.uiY + this.propertiesEndY);

        if (isTouchInScrollArea) {
            this.lastTouchY = touchY;
            this.isDraggingScroll = true;
        }

        return true; // Capture all touches within UI
    }

    handleTouchMove(camera, touchX, touchY) {
        if (this.touchingButton) {
            // If we're touching a button and move too far, cancel the button press
            let touchXTransformed = (touchX - camera.panX) / camera.scaleFactor;
            let touchYTransformed = (touchY - camera.panY) / camera.scaleFactor;
            let dist = Math.sqrt(
                Math.pow(touchXTransformed - this.touchStartX, 2) + 
                Math.pow(touchYTransformed - this.touchStartY, 2)
            );
            if (dist > 10) {
                this.touchingButton = false;
            }
            return true;
        }

        if (!this.isDraggingScroll) return false;

        // Calculate touch delta and update scroll
        const touchDelta = this.lastTouchY - touchY;
        const sensitivity = 0.5; // Reduce scrolling speed
        this.scrollOffset = this.sketch.constrain(
            this.scrollOffset + touchDelta * sensitivity,
            -this.maxScrollOffset,
            0
        );
        
        this.lastTouchY = touchY;
        return true;
    }

    handleTouchEnd(camera, touchX, touchY) {
        if (this.touchingButton) {
            // Simulate a mouse release at the touch position
            this.handleMouseReleased(camera, touchX, touchY, this._spaceship);
        }
        
        this.touchStartX = null;
        this.touchStartY = null;
        this.lastTouchY = null;
        this.isDraggingScroll = false;
        this.touchingButton = false;
    }
} 