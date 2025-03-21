import { TextGeneratorOpenRouter } from '../../text-gen-openrouter.js';
import { BaseWindowUI } from './base-window-ui.js';
import { TextBox } from './text-box.js';
import { TextButton } from './text-button.js';

export class SettingsUI extends BaseWindowUI {
    constructor(sketch, eventBus) {
        super(sketch, eventBus, null); // Settings UI doesn't need scene tracking
        
        // Settings button properties
        this.buttonWidth = 40;
        this.buttonHeight = 40;
        this.buttonMargin = 20;
        
        // Main UI window properties
        this.isWindowVisible = false;
        this.windowMargin = 50;
        
        // Text field properties
        this.textFieldHeight = 30;
        this.textFieldMargin = 20;
        this.labelHeight = 20;
        this.saveButtonHeight = 40;
        this.saveButtonWidth = 150;

        // Create text box for API key
        this.apiKeyTextBox = new TextBox(sketch, eventBus, {
            width: 400,
            height: this.textFieldHeight,
            placeholder: 'Enter your OpenRouter API key'
        });

        // Create save button
        this.saveButton = null; // Will be created in renderMainWindow

        // Connection status
        this.connectionStatus = null; // null, 'connected', or 'disconnected'
        this.connectionError = null; // Error message if disconnected

        // Load saved API key if it exists
        const savedApiKey = localStorage.getItem('openRouterApiKey');
        if (savedApiKey) {
            this.apiKeyTextBox.setText(savedApiKey);
            // Emit the API key event on startup if we have a saved key
            this.eventBus.emit('apiKeyUpdated', savedApiKey);
        }

        // Subscribe to API key updates to test connection
        this.eventBus.on('apiKeyUpdated', async (apiKey) => {
            this.connectionStatus = 'testing';
            const textGenerator = new TextGeneratorOpenRouter(apiKey);
            try {
                await textGenerator.generateText(
                    "Say 'API key test successful!' if you receive this message.",
                    (text) => {},
                    0.7,
                    50
                );
                this.connectionStatus = 'connected';
                this.connectionError = null;
            } catch (error) {
                this.connectionStatus = 'disconnected';
                this.connectionError = error.message;
                console.error("Error testing API key:", error);
            }
        });

        // Scroll properties
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.contentStartY = 60; // Start below top buttons

        // Subscribe to UI visibility events
        this.eventBus.on('settingsUIOpened', () => {
            this.isWindowVisible = true;
            this.apiKeyTextBox.setActive(false);
        });
        this.eventBus.on('settingsUIClosed', () => {
            this.isWindowVisible = false;
            this.apiKeyTextBox.setActive(false);
        });
        this.eventBus.on('missionUIOpened', () => {
            this.isWindowVisible = false;
            this.apiKeyTextBox.setActive(false);
        });
        this.eventBus.on('shipUIOpened', () => {
            this.isWindowVisible = false;
            this.apiKeyTextBox.setActive(false);
        });

        // Subscribe to close all UIs event
        this.eventBus.on('closeAllInfoUIs', () => {
            this.isWindowVisible = false;
            this.apiKeyTextBox.setActive(false);
        });

        // Set up keyboard event listeners
        window.addEventListener('keydown', (e) => {
            if (this.handleKeyDown(e)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keypress', (e) => {
            if (this.handleKeyPress(e)) {
                e.preventDefault();
            }
        });
    }

    // Calculate window dimensions based on sketch size
    getWindowDimensions() {
        // Width: 60% of sketch width, but capped at 600px
        const maxWidth = 600;
        const width = Math.min(this.sketch.width * 0.6, maxWidth);
        
        // Height: 50% of sketch height, with minimum margin of 40px top and bottom
        const minMargin = 40;
        const maxHeight = this.sketch.height - (minMargin * 2);
        const height = Math.min(this.sketch.height * 0.5, maxHeight);
        
        return { width, height };
    }

    render(camera) {
        // Always render the settings button
        this.renderSettingsButton();

        // Render the main window if visible
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    renderButton(camera) {
        this.renderSettingsButton();
    }

    renderWindow(camera) {
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    renderSettingsButton() {
        this.sketch.push();
        
        // Position in bottom right
        let x = this.sketch.width - this.buttonWidth - this.buttonMargin;
        let y = this.sketch.height - this.buttonHeight - this.buttonMargin;

        // Draw button background
        this.sketch.fill(40);
        this.sketch.stroke(100);
        this.sketch.strokeWeight(2);
        this.sketch.rect(x, y, this.buttonWidth, this.buttonHeight, 5);

        // Draw gear icon
        this.sketch.stroke(255);
        this.sketch.noFill();
        this.sketch.strokeWeight(2);
        let centerX = x + this.buttonWidth/2;
        let centerY = y + this.buttonHeight/2;
        let radius = 12;
        
        // Draw gear circle
        this.sketch.circle(centerX, centerY, radius * 2);
        
        // Draw gear teeth
        for (let i = 0; i < 8; i++) {
            let angle = (i * Math.PI * 2) / 8;
            let innerX = centerX + Math.cos(angle) * radius;
            let innerY = centerY + Math.sin(angle) * radius;
            let outerX = centerX + Math.cos(angle) * (radius + 6);
            let outerY = centerY + Math.sin(angle) * (radius + 6);
            this.sketch.line(innerX, innerY, outerX, outerY);
        }

        this.sketch.pop();
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
        this.sketch.text('Settings', x + 20, y + 20);

        // Create a graphics buffer for the content section
        const contentWidth = windowWidth - 40; // Account for margins
        const contentHeight = windowHeight - this.contentStartY - 20; // Leave some bottom padding
        const pg = this.sketch.createGraphics(contentWidth, contentHeight);
        pg.background(0, 0, 0, 0);
        
        // Set up the graphics context
        pg.fill(255);
        pg.textAlign(this.sketch.LEFT, this.sketch.TOP);
        pg.textSize(14);

        // Calculate total content height
        const totalContentHeight = 
            this.labelHeight + // API Key label
            this.textFieldHeight + // API Key field
            this.textFieldMargin + // Margin
            20 + // Status text height
            20 + // Padding before button
            this.saveButtonHeight + // Save button height
            20; // Extra padding

        // Draw content with scroll offset
        let contentY = this.scrollOffset;

        // Draw API Key field
        pg.text('OpenRouter API Key:', 0, contentY);
        contentY += this.labelHeight;
        
        // Draw API key text box
        pg.push();
        pg.translate(0, contentY);
        this.apiKeyTextBox.render(0, 0, pg);
        pg.pop();

        contentY += this.textFieldHeight + 10;

        // Draw connection status
        pg.textAlign(this.sketch.LEFT, this.sketch.TOP);
        if (this.connectionStatus === 'connected') {
            pg.fill(0, 255, 0);
            pg.text('Connected', 5, contentY);
        } else if (this.connectionStatus === 'disconnected') {
            pg.fill(255, 0, 0);
            pg.text('Disconnected', 5, contentY);
            if (this.connectionError) {
                pg.textSize(12);
                pg.text(this.connectionError, 5, contentY + 15);
            }
        } else if (this.connectionStatus === 'testing') {
            pg.fill(255, 255, 0);
            pg.text('Testing connection...', 5, contentY);
        }

        contentY += this.textFieldMargin + 10;

        // Create and render Save button
        const buttonX = (contentWidth - this.saveButtonWidth) / 2;
        const buttonY = contentY + 20;
        
        this.saveButton = new TextButton(
            this.sketch,
            buttonX,
            buttonY,
            this.saveButtonWidth,
            this.saveButtonHeight,
            'Save Settings',
            () => this.handleSaveSettings(),
            pg
        );

        // Render the Save button
        this.saveButton.render();

        // Draw the graphics buffer in the clipped region
        this.sketch.image(pg, x + 20, y + this.contentStartY);
        pg.remove();

        // Calculate max scroll offset based on total content height
        this.maxScrollOffset = Math.max(0, totalContentHeight - contentHeight);

        // Draw scroll indicator
        this.renderScrollIndicator(x, y, windowWidth, windowHeight, totalContentHeight, contentHeight);
    }

    handleMouseReleased(camera, mouseX, mouseY) {
        // Check settings button first (always visible)
        if (this.isSettingsButtonClicked(mouseX, mouseY)) {
            this.eventBus.emit('closeAllInfoUIs');
            if (!this.isWindowVisible) {
                this.eventBus.emit('settingsUIOpened');
            } else {
                this.eventBus.emit('settingsUIClosed');
            }
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
                this.eventBus.emit('settingsUIClosed');
                return true;
            }

            // Check if click is within the content area
            const contentX = x + 20;
            const contentY = y + this.contentStartY;
            const contentWidth = windowWidth - 40;
            const contentHeight = windowHeight - this.contentStartY - 20;

            if (mouseX >= contentX && mouseX <= contentX + contentWidth &&
                mouseY >= contentY && mouseY <= contentY + contentHeight) {
                
                // Check if click is on API key text box
                const apiKeyFieldY = contentY + this.scrollOffset + this.labelHeight;
                if (mouseY >= apiKeyFieldY && mouseY <= apiKeyFieldY + this.textFieldHeight) {
                    this.apiKeyTextBox.handleClick(mouseX - contentX, mouseY - apiKeyFieldY);
                    return true;
                }

                // Check if click is on Save button
                if (this.saveButton && this.saveButton.handleClick(mouseX - contentX, mouseY - contentY)) {
                    return true;
                }
                
                return true;
            }

            // Return true for any click within the window bounds
            if (mouseX >= x && mouseX <= x + windowWidth &&
                mouseY >= y && mouseY <= y + windowHeight) {
                return true;
            }

            // If we clicked outside the window, deactivate text box
            this.apiKeyTextBox.setActive(false);
        }

        return false;
    }

    isSettingsButtonClicked(mouseX, mouseY) {
        let x = this.sketch.width - this.buttonWidth - this.buttonMargin;
        let y = this.sketch.height - this.buttonHeight - this.buttonMargin;
        
        return mouseX >= x && mouseX <= x + this.buttonWidth &&
               mouseY >= y && mouseY <= y + this.buttonHeight;
    }

    handleTouchEnd(camera, touchX, touchY) {
        // Check settings button first (always visible)
        if (this.isSettingsButtonClicked(touchX, touchY)) {
            this.eventBus.emit('closeAllInfoUIs');
            if (!this.isWindowVisible) {
                this.eventBus.emit('settingsUIOpened');
            } else {
                this.eventBus.emit('settingsUIClosed');
            }
            return true;
        }

        // If window is visible, handle window interactions
        if (this.isWindowVisible) {
            const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
            let x = (this.sketch.width - windowWidth) / 2;
            let y = (this.sketch.height - windowHeight) / 2;

            // Check close button
            if (this.isCloseButtonClicked(touchX, touchY)) {
                this.isWindowVisible = false;
                this.eventBus.emit('settingsUIClosed');
                return true;
            }

            // Check if touch ended within the content area
            const contentX = x + 20;
            const contentY = y + this.contentStartY;
            const contentWidth = windowWidth - 40;
            const contentHeight = windowHeight - this.contentStartY - 20;

            if (touchX >= contentX && touchX <= contentX + contentWidth &&
                touchY >= contentY && touchY <= contentY + contentHeight) {
                
                // Check if touch ended on API key text box
                const apiKeyFieldY = contentY + this.scrollOffset + this.labelHeight;
                if (touchY >= apiKeyFieldY && touchY <= apiKeyFieldY + this.textFieldHeight) {
                    this.apiKeyTextBox.handleTouchEnd(touchX - contentX, touchY - apiKeyFieldY);
                    return true;
                }

                // Check if touch ended on Save button
                if (this.saveButton && this.saveButton.handleClick(touchX - contentX, touchY - contentY)) {
                    return true;
                }
                
                return true;
            }

            // Return true for any touch within the window bounds
            if (touchX >= x && touchX <= x + windowWidth &&
                touchY >= y && touchY <= y + windowHeight) {
                return true;
            }

            // If we touched outside the window, deactivate text box
            this.apiKeyTextBox.setActive(false);
        }

        return false;
    }

    handleSaveSettings() {
        // Save the API key
        const apiKey = this.apiKeyTextBox.getText().trim();
        if (apiKey !== '') {
            // Save to localStorage
            localStorage.setItem('openRouterApiKey', apiKey);
            // Emit an event with the new API key
            this.eventBus.emit('apiKeyUpdated', apiKey);
            // Close the settings window
            this.isWindowVisible = false;
            this.eventBus.emit('settingsUIClosed');
        }
    }

    handleKeyDown(event) {
        if (!this.isWindowVisible) {
            return false;
        }

        return this.apiKeyTextBox.handleKeyDown(event);
    }

    handleKeyPress(event) {
        if (!this.isWindowVisible) {
            return false;
        }

        return this.apiKeyTextBox.handleKeyPress(event);
    }
} 