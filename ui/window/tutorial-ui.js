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

        this.viewed = false;

        this.tutorialStep = 0;
        this.tutorialContent = [`Transmission from Admiral Bofa:
Good to hear from you, Captain Wobbleton. The committee was pleased to hear that the Gallileo has finally arrived in sector D-124. We have our scientists looking into the time dilation phenomenon you reported. Thank you for the various theories. If you had not noticed the discrepancy, we would have thought you were simply 2 months behind schedule.
It seems your journey is already yielding interesting results. Nonetheless, please remember that your primary objective is a planetary survey. Now that you are in the correct sector, your next course of action should be dropping out of warp space and entering a local star system.
Objective:
- Left-click a nearby star in the galaxy map to travel to it.
- Right-click the star you are orbiting. Press "Enter System" to enter the system.`,
`Report from Quartermaster Xri:
Captain Wobbleton, this is to inform you that the matter of ship's inventory has reached a state of provisional resolution. A number of essential units—Most notably two EVA suits—were discovered to be missing from their designated compartments. I have performed a full recount and an investigation into the matter.
It appears that Technician Bartu and several Ensigns appropriated the items for some kind of cultural performance, which, unfortunately, deteriorated into a substantial brawl. Both suits were damaged beyond repair. He has expressed what I believe to be remorse. I have chosen to delay punitive response until a more culturally appropriate time.
You may now access the ship's inventory to confirm our current stock. Many items are required for research procedures, and the nature of research is such that it is not uncommon to lose items. Please keep this in mind when planning missions.
Objective:
- Click the "Ship" button to review your inventory
- Note that items may be lost during failed missions. Difficult or dangerous missions are more likely to lose items.`,
`Report from Chief Science Officer Lieutenant Thompson:
Hey Captain, we're all good to go down here. We got the probes polished, and Bartu fixed that weird grinding noise the scanner was making.
Once we're in orbit around a planet, the scanner should give us an idea of what's down there. Thompson is very excited to write up reports for every single planet, and again, he's also very sorry about the whole coffee debacle. The replicator really should not let it get that hot.
If you see anything interesting in the reports, ask us to investigate. That's what we're all here for, isn't it?
Objective:
- Left-click planets to fly to them
- Right-click visited planets to read the planetary report
- Click the "Mission" button to see missions for the current planet
- Press the "+" button to create a new mission
  - Try something like "Send down a research probe to investigate"`];

        // Initialize scrollable graphics buffer
        this.graphicsBuffer = new ScrollableGraphicsBuffer(sketch);

        // Subscribe to UI visibility events
        this.eventBus.on('tutorialUIOpened', () => {
            this.isWindowVisible = true;
            this.viewed = true;
        });
        this.eventBus.on('tutorialUIClosed', () => {
            this.isWindowVisible = false;
            this.graphicsBuffer.scrollOffset = 0;
        });
        this.eventBus.on('settingsUIOpened', () => {
            this.isWindowVisible = false;
        });
        this.eventBus.on('missionUIOpened', () => {
            this.isWindowVisible = false;
        });
        this.eventBus.on('shipUIOpened', () => {
            if (this.tutorialStep === 1) {
                this.tutorialStep = 2;
                this.viewed = false;
            }
            this.isWindowVisible = false;
        });

        // Subscribe to close all UIs event
        this.eventBus.on('closeAllInfoUIs', () => {
            this.isWindowVisible = false;
        });

        // Add event listener for scene changes
        this.eventBus.on('sceneChanged', (scene) => {
            if (scene.systemView && this.tutorialStep === 0) {
                this.tutorialStep = 1;
                this.viewed = false;
            }
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

        // Draw exclamation point if not viewed
        if (!this.viewed) {
            this.sketch.noStroke();
            this.sketch.fill(255, 165, 0); // Orange color for the tutorial indicator
            this.sketch.textSize(24);
            this.sketch.textAlign(this.sketch.RIGHT, this.sketch.TOP);
            this.sketch.text('!', x - 5, y - 5);
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
        const paragraphs = this.tutorialContent[this.tutorialStep].split('\n\n');
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