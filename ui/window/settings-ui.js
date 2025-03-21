import { TextGeneratorOpenRouter } from '../../text-gen-openrouter.js';
import { BaseWindowUI } from './base-window-ui.js';

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

        // Text input state
        this.activeTextField = null; // 'apiKey' or null
        this.apiKeyText = '';
        this.cursorBlinkTimer = 0;
        this.showCursor = true;

        // Connection status
        this.connectionStatus = null; // null, 'connected', or 'disconnected'
        this.connectionError = null; // Error message if disconnected

        // Load saved API key if it exists
        const savedApiKey = localStorage.getItem('openRouterApiKey');
        if (savedApiKey) {
            this.apiKeyText = savedApiKey;
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

        // Create hidden input elements for mobile
        this.createMobileInputs();

        // Scroll properties
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.contentStartY = 60; // Start below top buttons

        // Subscribe to UI visibility events
        this.eventBus.on('settingsUIOpened', () => {
            this.isWindowVisible = true;
            this.activeTextField = null; // Reset active text field
            this.hideMobileInputs();
        });
        this.eventBus.on('settingsUIClosed', () => {
            this.isWindowVisible = false;
            this.activeTextField = null; // Reset active text field
            this.hideMobileInputs();
        });
        this.eventBus.on('missionUIOpened', () => {
            this.isWindowVisible = false;
            this.activeTextField = null;
            this.hideMobileInputs();
        });
        this.eventBus.on('shipUIOpened', () => {
            this.isWindowVisible = false;
            this.activeTextField = null;
            this.hideMobileInputs();
        });

        // Subscribe to close all UIs event
        this.eventBus.on('closeAllInfoUIs', () => {
            this.isWindowVisible = false;
            this.activeTextField = null;
            this.hideMobileInputs();
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

    createMobileInputs() {
        // Create API key input
        this.apiKeyInput = document.createElement('input');
        this.apiKeyInput.type = 'text';
        this.apiKeyInput.style.position = 'absolute';
        this.apiKeyInput.style.display = 'none';
        this.apiKeyInput.style.border = '1px solid #666';
        this.apiKeyInput.style.background = '#333';
        this.apiKeyInput.style.color = '#fff';
        this.apiKeyInput.style.padding = '5px';
        this.apiKeyInput.style.fontSize = '14px';
        document.body.appendChild(this.apiKeyInput);

        // Add input event listeners
        this.apiKeyInput.addEventListener('input', () => {
            this.apiKeyText = this.apiKeyInput.value;
        });

        // Add blur event listener to hide input when focus is lost
        this.apiKeyInput.addEventListener('blur', () => {
            setTimeout(() => this.hideMobileInputs(), 100);
        });
    }

    showMobileInput(x, y, width, height) {
        this.apiKeyInput.style.left = x + 'px';
        this.apiKeyInput.style.top = y + 'px';
        this.apiKeyInput.style.width = width + 'px';
        this.apiKeyInput.style.height = height + 'px';
        this.apiKeyInput.style.display = 'block';
        this.apiKeyInput.value = this.apiKeyText;
        this.apiKeyInput.focus();
    }

    hideMobileInputs() {
        if (this.apiKeyInput) this.apiKeyInput.style.display = 'none';
        this.activeTextField = null;
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
        
        // Draw API key text field
        pg.fill(this.activeTextField === 'apiKey' ? 80 : 60);
        pg.stroke(100);
        pg.strokeWeight(1);
        pg.rect(0, contentY, contentWidth, this.textFieldHeight, 3);

        // Draw API key text and cursor
        pg.fill(255);
        pg.noStroke();
        pg.textAlign(this.sketch.LEFT, this.sketch.CENTER);
        pg.text(this.apiKeyText, 5, contentY + this.textFieldHeight/2);
        
        // Draw cursor if this field is active
        if (this.activeTextField === 'apiKey' && this.showCursor) {
            const textWidth = pg.textWidth(this.apiKeyText);
            pg.stroke(255);
            pg.line(5 + textWidth, contentY + 5, 5 + textWidth, contentY + this.textFieldHeight - 5);
        }

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

        // Draw Save button
        let buttonY = contentY + 20; // Add some space after the API key field
        let buttonX = (contentWidth - this.saveButtonWidth) / 2;
        
        // Button background
        pg.fill(60);
        pg.stroke(100);
        pg.strokeWeight(1);
        pg.rect(buttonX, buttonY, this.saveButtonWidth, this.saveButtonHeight, 5);

        // Button text
        pg.fill(255);
        pg.noStroke();
        pg.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        pg.textSize(14);
        pg.text('Save Settings', buttonX + this.saveButtonWidth/2, buttonY + this.saveButtonHeight/2);

        // Draw the graphics buffer in the clipped region
        this.sketch.image(pg, x + 20, y + this.contentStartY);
        pg.remove();

        // Calculate max scroll offset based on total content height
        this.maxScrollOffset = Math.max(0, totalContentHeight - contentHeight);

        // Draw scroll indicator
        this.renderScrollIndicator(x, y, windowWidth, windowHeight, totalContentHeight, contentHeight);

        // Update cursor blink state
        this.updateCursorBlink();
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
                
                // Check if click is on API key text field
                const apiKeyFieldY = contentY + this.scrollOffset + this.labelHeight;
                if (mouseY >= apiKeyFieldY && mouseY <= apiKeyFieldY + this.textFieldHeight) {
                    this.activeTextField = 'apiKey';
                    return true;
                }

                // Check if click is on Save button
                if (this.isSaveButtonClicked(mouseX, mouseY)) {
                    this.handleSaveSettings();
                    return true;
                }
                
                return true;
            }

            // Return true for any click within the window bounds
            if (mouseX >= x && mouseX <= x + windowWidth &&
                mouseY >= y && mouseY <= y + windowHeight) {
                return true;
            }

            // If we clicked outside the window, deactivate text fields
            this.activeTextField = null;
        }

        return false;
    }

    isSettingsButtonClicked(mouseX, mouseY) {
        let x = this.sketch.width - this.buttonWidth - this.buttonMargin;
        let y = this.sketch.height - this.buttonHeight - this.buttonMargin;
        
        return mouseX >= x && mouseX <= x + this.buttonWidth &&
               mouseY >= y && mouseY <= y + this.buttonHeight;
    }


    isSaveButtonClicked(mouseX, mouseY) {
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;
        
        // Calculate button position including scroll offset
        const contentX = x + 20;
        const contentY = y + this.contentStartY;
        const buttonX = contentX + (windowWidth - 40 - this.saveButtonWidth) / 2;
        
        // Calculate button Y position including scroll offset
        const buttonY = contentY + this.scrollOffset + 
            this.labelHeight + // API Key label
            this.textFieldHeight + // API Key field
            this.textFieldMargin + // Margin
            20 + // Status text height
            20 + // Padding before button
            20; // Extra padding
        
        return mouseX >= buttonX && mouseX <= buttonX + this.saveButtonWidth &&
               mouseY >= buttonY && mouseY <= buttonY + this.saveButtonHeight;
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
                
                // Check if touch ended on API key text field
                const apiKeyFieldY = contentY + this.scrollOffset + this.labelHeight;
                if (touchY >= apiKeyFieldY && touchY <= apiKeyFieldY + this.textFieldHeight) {
                    this.activeTextField = 'apiKey';
                    this.showMobileInput(
                        contentX, 
                        apiKeyFieldY, 
                        contentWidth, 
                        this.textFieldHeight);
                    return true;
                }

                // Check if touch ended on Save button
                if (this.isSaveButtonClicked(touchX, touchY)) {
                    this.handleSaveSettings();
                    return true;
                }
                
                return true;
            }

            // Return true for any touch within the window bounds
            if (touchX >= x && touchX <= x + windowWidth &&
                touchY >= y && touchY <= y + windowHeight) {
                return true;
            }

            // If we touched outside the window, deactivate text fields
            this.activeTextField = null;
            this.hideMobileInputs();
        }

        return false;
    }

    handleSaveSettings() {
        // Save the API key
        if (this.apiKeyText.trim() !== '') {
            // Save to localStorage
            localStorage.setItem('openRouterApiKey', this.apiKeyText.trim());
            // Emit an event with the new API key
            this.eventBus.emit('apiKeyUpdated', this.apiKeyText.trim());
            // Close the settings window
            this.isWindowVisible = false;
            this.eventBus.emit('settingsUIClosed');
        }
    }

    handleKeyDown(event) {
        if (!this.isWindowVisible || !this.activeTextField) {
            return false;
        }

        // Handle special keys
        switch (event.key) {
            case 'Backspace':
                if (this.activeTextField === 'apiKey') {
                    this.apiKeyText = this.apiKeyText.slice(0, -1);
                }
                return true;

            case 'v':
                // Handle paste (Ctrl+V)
                if (event.ctrlKey || event.metaKey) {
                    navigator.clipboard.readText().then(text => {
                        if (this.activeTextField === 'apiKey') {
                            this.apiKeyText += text;
                        }
                    });
                    return true;
                }
                return false;
        }

        return false;
    }

    handleKeyPress(event) {
        if (!this.isWindowVisible || !this.activeTextField) {
            return false;
        }

        // Ignore special keys
        if (event.key === 'Enter' || event.key === 'Tab') {
            return false;
        }

        // Add the typed character to the API key field
        if (this.activeTextField === 'apiKey') {
            this.apiKeyText += event.key;
        }

        return true;
    }
} 