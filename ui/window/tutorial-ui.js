import { BaseWindowUI } from './base-window-ui.js';
import { ScrollableGraphicsBuffer } from './components/scrollable-graphics-buffer.js';
import { wrapText } from '../../utils/text-utils.js';

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

        // Tutorial content
        this.tutorialContent = `
Welcome to LlamaSpace!

In this game, you'll explore a vast galaxy, complete missions, and manage your ship and crew. Here's what you need to know:

Basic Controls:
- Use WASD to move your ship
- Click on stars and planets to interact with them
- Use the mouse wheel to zoom in and out
- Press ESC to open the menu

Ship Management:
Your ship is your home in space. You can:
- View your ship's status and inventory
- Assign crew members to missions
- Manage your shuttlecraft
- Track your reputation

Missions:
Missions are the main way to progress in the game. You can:
- Accept missions from planets and space stations
- Assign crew members to complete them
- Earn rewards and reputation
- Face consequences for failure

Crew Management:
Your crew is essential for completing missions. You can:
- View crew member stats and skills
- Assign them to missions
- Track their performance
- Manage their equipment

Inventory:
Keep track of your resources:
- Research Probes for scanning
- Redshirts for dangerous missions
- EVA Suits for spacewalks
- Repair Drones for fixing damage

Tips:
- Always check mission requirements before accepting
- Keep an eye on your shuttlecraft's health
- Build up your reputation to unlock better missions
- Manage your resources carefully

Good luck, Captain! The galaxy awaits your exploration.
`;

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

        // Split content into paragraphs and handle each one
        const paragraphs = this.tutorialContent.split('\n\n');
        let contentY = this.graphicsBuffer.scrollOffset;
        let totalHeight = 0;
        const lineSpacing = 5; // Space between lines within a paragraph

        paragraphs.forEach(paragraph => {
            // Handle bullet points and numbered lists
            if (paragraph.startsWith('-') || paragraph.match(/^\d+\./)) {
                // For bullet points and numbered lists, wrap the entire line
                const wrappedLine = wrapText(buffer, paragraph, contentWidth - 20);
                const lines = wrappedLine.split('\n');
                lines.forEach(line => {
                    buffer.text(line, 10, contentY);
                    contentY += this.lineHeight + lineSpacing;
                    totalHeight += this.lineHeight + lineSpacing;
                });
            } else {
                // For regular paragraphs, wrap each line individually
                const lines = paragraph.split('\n');
                lines.forEach(line => {
                    if (line.trim() === '') {
                        // Empty line, just add spacing
                        contentY += this.lineHeight;
                        totalHeight += this.lineHeight;
                    } else {
                        // Wrap the line and draw each wrapped segment
                        const wrappedLine = wrapText(buffer, line, contentWidth - 20);
                        const wrappedSegments = wrappedLine.split('\n');
                        wrappedSegments.forEach(segment => {
                            buffer.text(segment, 10, contentY);
                            contentY += this.lineHeight + lineSpacing;
                            totalHeight += this.lineHeight + lineSpacing;
                        });
                    }
                });
            }
            // Add extra spacing between paragraphs
            contentY += this.paragraphSpacing;
            totalHeight += this.paragraphSpacing;
        });

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