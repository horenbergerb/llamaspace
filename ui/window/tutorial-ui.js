import { BaseWindowUI } from './base-window-ui.js';
import { ScrollableGraphicsBuffer } from './components/scrollable-graphics-buffer.js';

export class TutorialUI extends BaseWindowUI {
    constructor(sketch, eventBus) {
        super(sketch, eventBus, null); // Tutorial UI doesn't need scene tracking
        
        // Tutorial button properties
        this.buttonWidth = 40;
        this.buttonHeight = 40;
        this.buttonMargin = 20;
        
        // Main UI window properties
        this.isWindowVisible = false;
        this.windowMargin = 50;
        
        // Content properties
        this.contentStartY = 60; // Start below top buttons
        this.textSize = 14;
        this.lineHeight = 20;
        this.paragraphSpacing = 30;

        // Initialize scrollable graphics buffer
        this.graphicsBuffer = new ScrollableGraphicsBuffer(sketch);

        // Subscribe to UI visibility events
        this.eventBus.on('tutorialUIOpened', () => {
            this.isWindowVisible = true;
        });
        this.eventBus.on('tutorialUIClosed', () => {
            this.isWindowVisible = false;
        });
        this.eventBus.on('settingsUIOpened', () => {
            this.isWindowVisible = false;
        });
        this.eventBus.on('missionUIOpened', () => {
            this.isWindowVisible = false;
        });
        this.eventBus.on('shipUIOpened', () => {
            this.isWindowVisible = false;
        });

        // Subscribe to close all UIs event
        this.eventBus.on('closeAllInfoUIs', () => {
            this.isWindowVisible = false;
        });
    }

    render(camera) {
        // Always render the tutorial button
        this.renderTutorialButton();

        // Render the main window if visible
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    renderButton(camera) {
        this.renderTutorialButton();
    }

    renderWindow(camera) {
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    renderTutorialButton() {
        this.sketch.push();
        
        // Position in bottom right, next to settings button
        let x = this.sketch.width - (this.buttonWidth * 2) - (this.buttonMargin * 2);
        let y = this.sketch.height - this.buttonHeight - this.buttonMargin;

        // Draw button background
        this.sketch.fill(40);
        this.sketch.stroke(100);
        this.sketch.strokeWeight(2);
        this.sketch.rect(x, y, this.buttonWidth, this.buttonHeight, 5);

        // Draw question mark
        this.sketch.fill(255);
        this.sketch.noStroke();
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.textSize(24);
        this.sketch.text('?', x + this.buttonWidth/2, y + this.buttonHeight/2);

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
        this.sketch.text('Tutorial', x + 20, y + 20);

        // Initialize graphics buffer if needed
        const contentWidth = windowWidth - 40; // Account for margins
        const contentHeight = windowHeight - this.contentStartY - 20; // Leave some bottom padding
        this.graphicsBuffer.initialize(contentWidth, contentHeight);
        
        // Set up the graphics context
        const buffer = this.graphicsBuffer.getBuffer();
        buffer.fill(255);
        buffer.textAlign(this.sketch.LEFT, this.sketch.TOP);
        buffer.textSize(this.textSize);

        // Sample tutorial content
        const tutorialContent = [
            "Welcome to the Tutorial!",
            "This is a sample tutorial section that will help you get started with the game.",
            "Here are some basic controls:",
            "- Use WASD to move your character",
            "- Click on objects to interact with them",
            "- Press ESC to open the menu",
            "Game Features:",
            "1. Character Customization",
            "2. Mission System",
            "3. Inventory Management",
            "4. Crafting System",
            "5. Multiplayer Support",
            "Tips and Tricks:",
            "- Always keep an eye on your health bar",
            "- Collect resources whenever possible",
            "- Complete missions to earn rewards",
            "- Upgrade your equipment regularly",
            "Advanced Features:",
            "The game includes a complex crafting system that allows you to create various items.",
            "You can trade with other players in the multiplayer mode.",
            "Complete achievements to unlock special rewards.",
            "Join guilds to participate in group activities."
        ];

        // Calculate total content height
        let contentY = this.graphicsBuffer.scrollOffset;
        let totalHeight = 0;

        // Draw content with scroll offset
        for (let i = 0; i < tutorialContent.length; i++) {
            const text = tutorialContent[i];
            if (text.startsWith("-") || text.match(/^\d+\./)) {
                buffer.text("  " + text, 0, contentY);
            } else {
                buffer.text(text, 0, contentY);
            }
            contentY += this.lineHeight;
            totalHeight += this.lineHeight;
            
            // Add extra spacing for section headers
            if (text.endsWith(":")) {
                contentY += this.paragraphSpacing;
                totalHeight += this.paragraphSpacing;
            }
        }

        // Set max scroll offset based on total content height
        this.graphicsBuffer.setMaxScrollOffset(totalHeight);

        // Render the graphics buffer
        this.graphicsBuffer.render(x + 20, y + this.contentStartY);
    }

    handleMouseReleased(camera, mouseX, mouseY) {
        // Check tutorial button first (always visible)
        if (this.isTutorialButtonClicked(mouseX, mouseY)) {
            this.eventBus.emit('closeAllInfoUIs');
            if (!this.isWindowVisible) {
                this.eventBus.emit('tutorialUIOpened');
            } else {
                this.eventBus.emit('tutorialUIClosed');
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
                this.eventBus.emit('tutorialUIClosed');
                return true;
            }

            // Return true for any click within the window bounds
            if (mouseX >= x && mouseX <= x + windowWidth &&
                mouseY >= y && mouseY <= y + windowHeight) {
                return true;
            }
        }

        return false;
    }

    handleMouseWheel(event) {
        if (this.isWindowVisible) {
            return this.graphicsBuffer.handleMouseWheel(event);
        }
        return false;
    }

    handleTouchStart(camera, touchX, touchY) {
        if (this.isWindowVisible) {
            return this.graphicsBuffer.handleTouchStart(touchX, touchY);
        }
        return false;
    }

    handleTouchMove(camera, touchX, touchY) {
        if (this.isWindowVisible) {
            return this.graphicsBuffer.handleTouchMove(touchX, touchY);
        }
        return false;
    }

    handleTouchEnd(camera, touchX, touchY) {
        // Check tutorial button first (always visible)
        if (this.isTutorialButtonClicked(touchX, touchY)) {
            this.eventBus.emit('closeAllInfoUIs');
            if (!this.isWindowVisible) {
                this.eventBus.emit('tutorialUIOpened');
            } else {
                this.eventBus.emit('tutorialUIClosed');
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
                this.eventBus.emit('tutorialUIClosed');
                return true;
            }

            // Handle touch end for graphics buffer
            if (this.graphicsBuffer.handleTouchEnd()) {
                return true;
            }

            // Return true for any touch within the window bounds
            if (touchX >= x && touchX <= x + windowWidth &&
                touchY >= y && touchY <= y + windowHeight) {
                return true;
            }
        }

        return false;
    }

    isTutorialButtonClicked(mouseX, mouseY) {
        let x = this.sketch.width - (this.buttonWidth * 2) - (this.buttonMargin * 2);
        let y = this.sketch.height - this.buttonHeight - this.buttonMargin;
        
        return mouseX >= x && mouseX <= x + this.buttonWidth &&
               mouseY >= y && mouseY <= y + this.buttonHeight;
    }
} 