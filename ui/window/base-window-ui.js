export class BaseWindowUI {
    constructor(sketch, eventBus, initialScene) {
        this.sketch = sketch;
        this.eventBus = eventBus;
        this.currentScene = initialScene;
        
        // Common button properties
        this.buttonWidth = 80;
        this.buttonHeight = 40;
        this.buttonMargin = 20;
        
        // Main UI window properties
        this.isWindowVisible = false;
        this.windowMargin = 50;
        
        // Close button properties
        this.closeButtonSize = 20;

        // Text field properties
        this.textFieldHeight = 30;
        this.textFieldMargin = 20;
        this.labelHeight = 20;

        // Cursor properties for text input
        this.cursorBlinkTimer = 0;
        this.showCursor = true;

        // Content scroll properties
        this.contentStartY = 60;
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;

        // Touch scrolling properties
        this.touchStartY = null;
        this.scrollStartOffset = 0;
    }

    // Calculate window dimensions based on sketch size
    getWindowDimensions() {
        // Width: 80% of sketch width, but capped at 800px
        const maxWidth = 800;
        const width = Math.min(this.sketch.width * 0.8, maxWidth);
        
        // Height: 70% of sketch height, with minimum margin of 40px top and bottom
        const minMargin = 40;
        const maxHeight = this.sketch.height - (minMargin * 2);
        const height = Math.min(this.sketch.height * 0.7, maxHeight);
        
        return { width, height };
    }

    // Helper method to check if coordinates are within window bounds
    isWithinWindowBounds(x, y) {
        if (!this.isWindowVisible) return false;
        
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        const windowX = (this.sketch.width - windowWidth) / 2;
        const windowY = (this.sketch.height - windowHeight) / 2;
        
        return x >= windowX && x <= windowX + windowWidth &&
               y >= windowY && y <= windowY + windowHeight;
    }

    // Base render method - should be overridden by child classes
    render(camera) {
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    // Shared window rendering logic
    renderMainWindow() {
        this.sketch.push();
        
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        
        // Center the window
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;

        // Draw window background
        this.sketch.fill(40);
        this.sketch.stroke(100);
        this.sketch.strokeWeight(2);
        this.sketch.rect(x, y, windowWidth, windowHeight, 5);

        // Draw close button
        let closeX = x + windowWidth - this.closeButtonSize - 10;
        let closeY = y + 10;
        this.sketch.stroke(150);
        this.sketch.line(closeX, closeY, closeX + this.closeButtonSize, closeY + this.closeButtonSize);
        this.sketch.line(closeX + this.closeButtonSize, closeY, closeX, closeY + this.closeButtonSize);

        this.sketch.pop();
    }

    // Shared scroll indicator rendering
    renderScrollIndicator(x, y, width, height, contentHeight, visibleHeight) {
        if (this.maxScrollOffset > 0) {
            // Calculate the visible portion ratio
            const visibleRatio = visibleHeight / contentHeight;
            // Calculate scroll bar height based on the ratio of visible content
            const scrollBarHeight = Math.max(30, visibleHeight * visibleRatio);
            
            // Calculate scroll position as a percentage (0 to 1)
            const scrollPercent = Math.abs(this.scrollOffset) / this.maxScrollOffset;
            // Calculate available scroll distance
            const availableScrollDistance = visibleHeight - scrollBarHeight;
            // Calculate final scroll bar position
            const scrollBarY = y + (availableScrollDistance * scrollPercent);
            
            this.sketch.fill(150, 150, 150, 100);
            this.sketch.noStroke();
            this.sketch.rect(x + width - 8, scrollBarY, 4, scrollBarHeight, 2);
        }
    }

    // Shared close button click detection
    isCloseButtonClicked(mouseX, mouseY) {
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;
        let closeX = x + windowWidth - this.closeButtonSize - 10;
        let closeY = y + 10;
        
        return mouseX >= closeX && mouseX <= closeX + this.closeButtonSize &&
               mouseY >= closeY && mouseY <= closeY + this.closeButtonSize;
    }

    // Base event handlers that check window bounds
    handleMouseWheel(event) {
        if (this.isWithinWindowBounds(this.sketch.mouseX, this.sketch.mouseY)) {
            // Child classes can override this to add behavior
            return true;
        }
        return false;
    }

    handleMousePressed(camera, mouseX, mouseY) {
        if (this.isWithinWindowBounds(mouseX, mouseY)) {
            // Child classes can override this to add behavior
            return true;
        }
        return false;
    }

    handleMouseReleased(camera, mouseX, mouseY) {
        if (this.isWithinWindowBounds(mouseX, mouseY)) {
            // Child classes can override this to add behavior
            return true;
        }
        return false;
    }

    handleTouchStart(camera, touchX, touchY) {
        if (this.isWithinWindowBounds(touchX, touchY)) {
            // Child classes can override this to add behavior
            return true;
        }
        return false;
    }

    handleTouchMove(camera, touchX, touchY) {
        if (this.isWithinWindowBounds(touchX, touchY)) {
            // Child classes can override this to add behavior
            return true;
        }
        return false;
    }

    handleTouchEnd(camera, touchX, touchY) {
        if (this.isWithinWindowBounds(touchX, touchY)) {
            // Child classes can override this to add behavior
            return true;
        }
        return false;
    }

    // Update cursor blink state
    updateCursorBlink() {
        this.cursorBlinkTimer++;
        if (this.cursorBlinkTimer > 30) {
            this.cursorBlinkTimer = 0;
            this.showCursor = !this.showCursor;
        }
    }
} 