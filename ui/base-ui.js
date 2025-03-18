export class BaseUI {
    constructor(sketch, eventBus) {
        this.sketch = sketch;
        this.eventBus = eventBus;
        
        // Ship button properties
        this.buttonWidth = 80;
        this.buttonHeight = 40;
        this.buttonMargin = 20;
        
        // Main UI window properties
        this.isWindowVisible = false;
        this.windowMargin = 50;
        
        // Tab properties
        this.currentTab = 'Ship';
        this.tabs = ['Ship', 'Crew'];
        this.tabHeight = 40;
        
        // Close button properties
        this.closeButtonSize = 20;

        // Subscribe to close other UIs when this opens
        this.eventBus.on('closeAllInfoUIs', () => {
            // This event will be handled by other UIs
        });
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

    render(camera) {
        // Always render the ship button
        this.renderShipButton();

        // Render the main window if visible
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    renderShipButton() {
        this.sketch.push();
        
        // Position in bottom left, accounting for camera
        let x = this.buttonMargin;
        let y = this.sketch.height - this.buttonHeight - this.buttonMargin;

        // Draw button background
        this.sketch.fill(40);
        this.sketch.stroke(100);
        this.sketch.strokeWeight(2);
        this.sketch.rect(x, y, this.buttonWidth, this.buttonHeight, 5);

        // Draw button text
        this.sketch.fill(255);
        this.sketch.noStroke();
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.textSize(16);
        this.sketch.text('Ship', x + this.buttonWidth/2, y + this.buttonHeight/2);

        this.sketch.pop();
    }

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

        // Draw tabs
        let tabWidth = windowWidth / this.tabs.length;
        this.tabs.forEach((tab, index) => {
            let tabX = x + (index * tabWidth);
            
            // Draw tab background
            this.sketch.fill(tab === this.currentTab ? 40 : 20);
            this.sketch.rect(tabX, y, tabWidth, this.tabHeight, 5, 5, 0, 0);
            
            // Draw tab text
            this.sketch.push();
            this.sketch.fill(255);
            this.sketch.noStroke();
            this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
            this.sketch.textSize(16);
            this.sketch.text(tab, tabX + tabWidth/2, y + this.tabHeight/2);
            this.sketch.pop();
        });

        // Draw close button
        let closeX = x + windowWidth - this.closeButtonSize - 10;
        let closeY = y + 10;
        this.sketch.stroke(150);
        this.sketch.line(closeX, closeY, closeX + this.closeButtonSize, closeY + this.closeButtonSize);
        this.sketch.line(closeX + this.closeButtonSize, closeY, closeX, closeY + this.closeButtonSize);

        // Draw content based on current tab
        this.renderTabContent(x, y + this.tabHeight, windowWidth, windowHeight - this.tabHeight);

        this.sketch.pop();
    }

    renderTabContent(x, y, width, height) {
        this.sketch.fill(255);
        this.sketch.noStroke();
        this.sketch.textAlign(this.sketch.LEFT, this.sketch.TOP);
        this.sketch.textSize(14);
        
        let contentX = x + 20;
        let contentY = y + 20;

        if (this.currentTab === 'Ship') {
            this.sketch.text('Ship Status:', contentX, contentY);
            // Add more ship-related content here
        } else if (this.currentTab === 'Crew') {
            this.sketch.text('Crew Members:', contentX, contentY);
            // Add more crew-related content here
        }
    }

    handleMouseReleased(camera, mouseX, mouseY) {
        // Check ship button first (always visible)
        if (this.isShipButtonClicked(mouseX, mouseY)) {
            this.eventBus.emit('closeAllInfoUIs');
            this.isWindowVisible = !this.isWindowVisible;
            return true;
        }

        // If window is visible, check window interactions
        if (this.isWindowVisible) {
            const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
            let x = (this.sketch.width - windowWidth) / 2;
            let y = (this.sketch.height - windowHeight) / 2;

            // Check close button
            if (this.isCloseButtonClicked(mouseX, mouseY)) {
                this.isWindowVisible = false;
                return true;
            }

            // Check tab clicks
            let tabWidth = windowWidth / this.tabs.length;
            this.tabs.forEach((tab, index) => {
                let tabX = x + (index * tabWidth);
                if (mouseX >= tabX && mouseX <= tabX + tabWidth &&
                    mouseY >= y && mouseY <= y + this.tabHeight) {
                    this.currentTab = tab;
                }
            });

            // Return true for any click within the window bounds
            if (mouseX >= x && mouseX <= x + windowWidth &&
                mouseY >= y && mouseY <= y + windowHeight) {
                return true;
            }
        }

        return false;
    }

    isShipButtonClicked(mouseX, mouseY) {
        let x = this.buttonMargin;
        let y = this.sketch.height - this.buttonHeight - this.buttonMargin;
        
        return mouseX >= x && mouseX <= x + this.buttonWidth &&
               mouseY >= y && mouseY <= y + this.buttonHeight;
    }

    isCloseButtonClicked(mouseX, mouseY) {
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;
        let closeX = x + windowWidth - this.closeButtonSize - 10;
        let closeY = y + 10;
        
        return mouseX >= closeX && mouseX <= closeX + this.closeButtonSize &&
               mouseY >= closeY && mouseY <= closeY + this.closeButtonSize;
    }

    handleTouchStart(camera, touchX, touchY) {
        // Similar logic to handleMouseReleased
        return this.handleMouseReleased(camera, touchX, touchY);
    }

    handleTouchMove(camera, touchX, touchY) {
        // For now, just prevent camera movement if touching the UI
        if (this.isWindowVisible) {
            const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
            let x = (this.sketch.width - windowWidth) / 2;
            let y = (this.sketch.height - windowHeight) / 2;
            
            return touchX >= x && touchX <= x + windowWidth &&
                   touchY >= y && touchY <= y + windowHeight;
        }
        return false;
    }

    handleTouchEnd(camera, touchX, touchY) {
        // No special handling needed for touch end currently
    }
} 