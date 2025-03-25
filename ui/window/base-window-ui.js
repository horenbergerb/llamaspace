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

        // Set up common event subscriptions
        this.setupCommonEventSubscriptions();
    }

    setupCommonEventSubscriptions() {
        // Subscribe to scene changes
        this.eventBus.on('sceneChanged', (scene) => {
            this.currentScene = scene;
            this.isWindowVisible = false;
        });

        // Subscribe to close all UIs event
        this.eventBus.on('closeAllInfoUIs', () => {
            this.isWindowVisible = false;
            this.handleUIClosed();
        });

        // Subscribe to other UI open events to close this one
        const uiEvents = ['shipUIOpened', 'missionUIOpened', 'settingsUIOpened', 'scanUIOpened'];
        uiEvents.forEach(event => {
            if (!event.includes(this.constructor.name.toLowerCase())) { // Don't subscribe to our own open event
                this.eventBus.on(event, () => {
                    this.isWindowVisible = false;
                    this.handleUIClosed();
                });
            }
        });

        // Subscribe to our own UI events
        const thisUIBase = this.constructor.name.toLowerCase().replace('ui', '');
        this.eventBus.on(`${thisUIBase}UIOpened`, () => {
            this.isWindowVisible = true;
            this.handleUIOpened();
        });
        this.eventBus.on(`${thisUIBase}UIClosed`, () => {
            this.isWindowVisible = false;
            this.handleUIClosed();
        });
    }

    // Override these in child classes if needed
    handleUIOpened() {}
    handleUIClosed() {}

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

    // Shared mouse wheel handling
    handleMouseWheel(event) {
        if (this.isWindowVisible) {
            const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
            let x = (this.sketch.width - windowWidth) / 2;
            let y = (this.sketch.height - windowHeight) / 2;
            
            // Check if mouse is over the content area
            if (this.sketch.mouseX >= x && this.sketch.mouseX <= x + windowWidth &&
                this.sketch.mouseY >= y + this.contentStartY && 
                this.sketch.mouseY <= y + windowHeight - 20) {
                
                // Update scroll offset with a multiplier to make scrolling smoother
                const scrollMultiplier = 1.5;
                this.scrollOffset = Math.max(-this.maxScrollOffset, 
                    Math.min(0, this.scrollOffset - (event.deltaY * scrollMultiplier)));
                return true;
            }
        }
        return false;
    }

    // Shared touch handling
    handleTouchStart(camera, touchX, touchY) {
        if (this.isWindowVisible) {
            const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
            let x = (this.sketch.width - windowWidth) / 2;
            let y = (this.sketch.height - windowHeight) / 2;
            
            // Store touch start position and current scroll offset for drag calculations
            if (touchX >= x && touchX <= x + windowWidth &&
                touchY >= y + this.contentStartY && touchY <= y + windowHeight) {
                this.touchStartY = touchY;
                this.scrollStartOffset = this.scrollOffset;
            }
            
            return touchX >= x && touchX <= x + windowWidth &&
                   touchY >= y && touchY <= y + windowHeight;
        }
        return false;
    }

    handleTouchMove(camera, touchX, touchY) {
        if (this.isWindowVisible && this.touchStartY !== null) {
            const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
            let x = (this.sketch.width - windowWidth) / 2;
            let y = (this.sketch.height - windowHeight) / 2;
            
            // Only handle scroll if touch is within window bounds
            if (touchX >= x && touchX <= x + windowWidth &&
                touchY >= y && touchY <= y + windowHeight) {
                
                // Calculate touch movement
                const touchDelta = touchY - this.touchStartY;
                
                // Update scroll offset based on touch movement
                this.scrollOffset = Math.max(
                    -this.maxScrollOffset,
                    Math.min(0, this.scrollStartOffset + touchDelta)
                );
                
                return true;
            }
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