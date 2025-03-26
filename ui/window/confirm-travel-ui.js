import { BaseWindowUI } from './base-window-ui.js';
import { TextButton } from './components/text-button.js';

export class ConfirmTravelUI extends BaseWindowUI {
    constructor(sketch, eventBus) {
        super(sketch, eventBus, null); // ConfirmTravelUI doesn't need scene tracking
        
        // Main UI window properties
        this.isWindowVisible = false;
        this.windowMargin = 50;
        
        // Button properties
        this.buttonHeight = 40;
        this.buttonWidth = 120;
        this.buttonMargin = 20;

        // Create buttons
        this.continueButton = null;
        this.cancelButton = null;

        this.eventBus.on('setDestination', () => {
            this.isWindowVisible = true;
        });
        // Subscribe to UI visibility events
        this.eventBus.on('confirmTravelUIOpened', () => {
            this.isWindowVisible = true;
        });
        this.eventBus.on('confirmTravelUIClosed', () => {
            this.isWindowVisible = false;
        });

        // Subscribe to close all UIs event
        this.eventBus.on('closeAllInfoUIs', () => {
            this.isWindowVisible = false;
        });
    }

    renderButton(camera) {
        // This UI doesn't have a persistent button, so this method is empty
    }

    render(camera) {
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    renderWindow(camera) {
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    renderMainWindow() {
        super.renderMainWindow();
        
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        
        // Center the window
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;

        // Draw title
        this.sketch.fill(255);
        this.sketch.noStroke();
        this.sketch.textAlign(this.sketch.LEFT, this.sketch.TOP);
        this.sketch.textSize(16);
        this.sketch.text('Confirm Travel', x + 20, y + 20);

        // Create a graphics buffer for the content section
        const contentWidth = windowWidth - 40; // Account for margins
        const contentHeight = windowHeight - this.contentStartY - 20; // Leave some bottom padding
        const pg = this.sketch.createGraphics(contentWidth, contentHeight);
        pg.background(0, 0, 0, 0);
        
        // Set up the graphics context
        pg.fill(255);
        pg.textAlign(this.sketch.LEFT, this.sketch.TOP);
        pg.textSize(14);

        // Draw warning text
        const warningText = "Warning: Traveling to a new body will cancel any in-progress missions. Are you sure you want to continue?";
        const lines = this.wrapText(pg, warningText, contentWidth - 20);
        let contentY = 20;
        
        lines.forEach(line => {
            pg.text(line, 10, contentY);
            contentY += 20;
        });

        // Create and render buttons
        const buttonY = contentHeight - this.buttonHeight - 20;
        
        // Create Continue button
        this.continueButton = new TextButton(
            pg,
            contentWidth - this.buttonWidth - this.buttonMargin,
            buttonY,
            this.buttonWidth,
            this.buttonHeight,
            'Continue',
            () => this.handleContinue(),
            null
        );

        // Create Cancel button
        this.cancelButton = new TextButton(
            pg,
            this.buttonMargin,
            buttonY,
            this.buttonWidth,
            this.buttonHeight,
            'Cancel',
            () => this.handleCancel(),
            null
        );

        // Render the buttons
        this.continueButton.render();
        this.cancelButton.render();

        // Draw the graphics buffer
        this.sketch.image(pg, x + 20, y + this.contentStartY);
        pg.remove();
    }

    wrapText(pg, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = pg.textWidth(currentLine + ' ' + word);
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);

        return lines;
    }

    handleMouseReleased(camera, mouseX, mouseY) {
        if (!this.isWindowVisible) return false;

        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;

        // Check close button
        if (this.isCloseButtonClicked(mouseX, mouseY)) {
            this.isWindowVisible = false;
            this.eventBus.emit('confirmTravelUIClosed');
            return true;
        }

        // Check if click is within the content area
        const contentX = x + 20;
        const contentY = y + this.contentStartY;
        const contentWidth = windowWidth - 40;
        const contentHeight = windowHeight - this.contentStartY - 20;

        if (mouseX >= contentX && mouseX <= contentX + contentWidth &&
            mouseY >= contentY && mouseY <= contentY + contentHeight) {
            
            // Check if click is on Continue button
            if (this.continueButton && this.continueButton.handleClick(mouseX - contentX, mouseY - contentY)) {
                return true;
            }

            // Check if click is on Cancel button
            if (this.cancelButton && this.cancelButton.handleClick(mouseX - contentX, mouseY - contentY)) {
                return true;
            }
            
            return true;
        }

        return false;
    }

    handleTouchEnd(camera, touchX, touchY) {
        if (!this.isWindowVisible) return false;

        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;

        // Check close button
        if (this.isCloseButtonClicked(touchX, touchY)) {
            this.isWindowVisible = false;
            this.eventBus.emit('confirmTravelUIClosed');
            return true;
        }

        // Check if touch ended within the content area
        const contentX = x + 20;
        const contentY = y + this.contentStartY;
        const contentWidth = windowWidth - 40;
        const contentHeight = windowHeight - this.contentStartY - 20;

        if (touchX >= contentX && touchX <= contentX + contentWidth &&
            touchY >= contentY && touchY <= contentY + contentHeight) {
            
            // Check if touch ended on Continue button
            if (this.continueButton && this.continueButton.handleClick(touchX - contentX, touchY - contentY)) {
                return true;
            }

            // Check if touch ended on Cancel button
            if (this.cancelButton && this.cancelButton.handleClick(touchX - contentX, touchY - contentY)) {
                return true;
            }
            
            return true;
        }

        return false;
    }

    handleContinue() {
        // TODO: Implement continue action
        this.isWindowVisible = false;
        this.eventBus.emit('confirmTravelUIClosed');
    }

    handleCancel() {
        this.isWindowVisible = false;
        this.eventBus.emit('confirmTravelUIClosed');
    }
} 