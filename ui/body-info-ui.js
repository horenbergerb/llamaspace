export class BodyInfoUI {
    constructor(sketch, eventBus) {
        this.sketch = sketch;
        this.eventBus = eventBus;
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

        // Subscribe to spaceship state updates
        this.canSetDestination = true; // Default to true
        this.eventBus.on('spaceshipStateChanged', (state) => {
            this.canSetDestination = !state.inTransit;
        });

        // Subscribe to close all UIs event
        this.eventBus.on('closeAllInfoUIs', () => {
            this.close();
        });
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

    handleScroll(delta) {
        if (!this.isVisible) return;
        
        // Adjust scroll offset based on wheel delta
        this.scrollOffset = this.sketch.constrain(
            this.scrollOffset - delta,
            -this.maxScrollOffset,
            0
        );
    }

    // Helper method to measure total height of properties
    setMaxScrollOffset() {
        if (!this.body || !this.body.bodyProperties) return 0;
        
        // Count the number of simple properties
        let numProperties = Object.entries(this.body.bodyProperties)
            .filter(([key, value]) => typeof value !== 'object' && typeof value !== 'function')
            .length;
        
        // Calculate total height (20 pixels per line)
        let totalHeight = numProperties * 20;
        
        // Update max scroll offset
        this.maxScrollOffset = Math.max(0, totalHeight - this.propertiesHeight);
        
        return totalHeight;
    }

    handleMouseReleased(camera, mouseX, mouseY) {
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
        if (this.isCloseButtonClicked(mouseXTransformed, mouseYTransformed)) {
            this.close();
            return true;
        }

        // Check Set Destination button
        if (this.isDestinationButtonClicked(mouseXTransformed, mouseYTransformed)) {
            this.eventBus.emit('setDestination', this.body);
            this.close();
            return true;
        }

        // Check Enter System/Research button
        if (this.isActionButtonClicked(mouseXTransformed, mouseYTransformed)) {
            if (!this.inSystemMap) {
                this.eventBus.emit('enterSystem', this.body);
            } else {
                this.eventBus.emit('research', this.body);
            }
            this.close();
            return true;
        }

        // Check Return to Galaxy button if in system view and this is the central star
        if (this.inSystemMap && 
            this.body && 
            this.body.baseX === this.sketch.width / 2 && 
            this.body.baseY === this.sketch.height / 2 &&
            this.isReturnToGalaxyButtonClicked(mouseXTransformed, mouseYTransformed)) {
            this.eventBus.emit('returnToGalaxy');
            this.close();
            return true;
        }

        return true;
    }

    // Helper methods for button click detection
    isCloseButtonClicked(x, y) {
        let closeX = this.uiX + this.uiWidth - this.closeButtonSize - 5;
        let closeY = this.uiY + 5;
        return (x >= closeX && 
                x <= closeX + this.closeButtonSize && 
                y >= closeY && 
                y <= closeY + this.closeButtonSize);
    }

    isDestinationButtonClicked(x, y) {
        let destX = this.uiX + this.uiWidth - 120;
        let destY = this.uiY + this.uiHeight - 35;
        return (x >= destX && 
                x <= destX + 100 && 
                y >= destY && 
                y <= destY + 25);
    }

    isActionButtonClicked(x, y) {
        let actionX = this.uiX + 20;
        let actionY = this.uiY + this.uiHeight - 35;
        return (x >= actionX && 
                x <= actionX + 100 && 
                y >= actionY && 
                y <= actionY + 25);
    }

    isReturnToGalaxyButtonClicked(x, y) {
        let returnX = this.uiX + this.uiWidth / 2 - 60;
        let returnY = this.uiY + this.uiHeight - 70;
        return (x >= returnX && 
                x <= returnX + 120 && 
                y >= returnY && 
                y <= returnY + 25);
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
            this.scrollOffset - touchDelta * sensitivity,
            -this.maxScrollOffset,
            0
        );
        
        this.lastTouchY = touchY;
        return true;
    }

    handleTouchEnd(camera, touchX, touchY) {
        if (this.touchingButton) {
            // Simulate a mouse release at the touch position
            this.handleMouseReleased(camera, touchX, touchY);
        }
        
        this.touchStartX = null;
        this.touchStartY = null;
        this.lastTouchY = null;
        this.isDraggingScroll = false;
        this.touchingButton = false;
    }

    getProperties() {
        // This should be overridden by child classes
        throw new Error("Method 'getProperties' must be implemented by child classes");
    }
} 