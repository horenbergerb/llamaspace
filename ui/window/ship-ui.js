import { BaseWindowUI } from './base-window-ui.js';
import { TextButton } from './text-button.js';

export class ShipUI extends BaseWindowUI {
    constructor(sketch, eventBus, initialScene, crewMembers) {
        super(sketch, eventBus, initialScene);
        this.crewMembers = crewMembers;
        this.reputation = 0; // Track reputation
        this.inventory = {}; // Track ship's inventory
        this.shuttlecraft = []; // Track shuttlecraft
        
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
        
        // Scroll properties for crew tab
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.crewPropertiesHeight = 0;
        this.crewPropertiesStartY = 60; // Start below tabs

        // Subscribe to UI visibility events
        this.eventBus.on('shipUIOpened', () => {
            this.isWindowVisible = true;
        });
        this.eventBus.on('shipUIClosed', () => {
            this.isWindowVisible = false;
        });
        this.eventBus.on('missionUIOpened', () => {
            this.isWindowVisible = false;
        });
        this.eventBus.on('settingsUIOpened', () => {
            this.isWindowVisible = false;
            this.activeTextField = null; // Reset active text field
        });

        // Subscribe to scan UI events
        this.eventBus.on('scanUIOpened', () => {
            this.isWindowVisible = false;
        });

        // Subscribe to scene changes
        this.eventBus.on('sceneChanged', (scene) => {
            this.isWindowVisible = false;
        });

        // Subscribe to window resize events
        this.eventBus.on('windowResized', () => {
            this.updateButtonPosition();
        });

        // Subscribe to reputation updates
        this.eventBus.on('reputationUpdated', (newReputation) => {
            this.reputation = newReputation;
        });

        // Subscribe to inventory updates
        this.eventBus.on('inventoryChanged', (newInventory) => {
            this.inventory = {...newInventory};
        });

        // Subscribe to shuttlecraft updates
        this.eventBus.on('shuttlecraftChanged', (newShuttlecraft) => {
            this.shuttlecraft = [...newShuttlecraft];
        });

        this.setupButton();
    }

    setupButton() {
        // Create ship button
        this.shipButton = new TextButton(
            this.sketch,
            this.buttonMargin,
            this.sketch.height - this.buttonHeight - this.buttonMargin,
            this.buttonWidth,
            this.buttonHeight,
            'Ship',
            () => {
                this.eventBus.emit('closeAllInfoUIs');
                if (!this.isWindowVisible) {
                    this.eventBus.emit('shipUIOpened');
                } else {
                    this.eventBus.emit('shipUIClosed');
                }
            }
        );

        // Initial button position update
        this.updateButtonPosition();
    }

    updateButtonPosition() {
        if (!this.shipButton) return;
        
        const y = this.sketch.height - this.buttonHeight - this.buttonMargin;
        this.shipButton.updatePosition(
            this.buttonMargin,
            y
        );
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

    renderButton(camera) {
        this.renderShipButton();
    }

    renderWindow(camera) {
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    renderShipButton() {
        this.shipButton.render();
    }

    renderMainWindow() {
        //Doesn't call super.renderMainWindow() because it draws close button after tabs
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;

        // Draw window background
        this.sketch.push();
        this.sketch.fill(40);
        this.sketch.stroke(100);
        this.sketch.strokeWeight(2);
        this.sketch.rect(x, y, windowWidth, windowHeight, 5);
        this.sketch.pop();

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

        // Draw close button on top of everything
        let closeX = x + windowWidth - this.closeButtonSize - 10;
        let closeY = y + 10;
        this.sketch.stroke(150);
        this.sketch.strokeWeight(2);
        this.sketch.line(closeX, closeY, closeX + this.closeButtonSize, closeY + this.closeButtonSize);
        this.sketch.line(closeX + this.closeButtonSize, closeY, closeX, closeY + this.closeButtonSize);

        // Draw content based on current tab
        this.renderTabContent(x, y + this.tabHeight, windowWidth, windowHeight - this.tabHeight);
    }

    renderTabContent(x, y, width, height) {
        this.sketch.fill(255);
        this.sketch.noStroke();
        this.sketch.textAlign(this.sketch.LEFT, this.sketch.TOP);
        this.sketch.textSize(14);
        
        let contentX = x + 20;
        let contentY = y + 20;

        if (this.currentTab === 'Ship') {
            // Create a graphics buffer for the ship tab content
            const contentWidth = width - 40; // Account for margins
            const contentHeight = height - 40; // Account for margins
            const pg = this.sketch.createGraphics(contentWidth, contentHeight);
            pg.background(0, 0, 0, 0);
            
            // Set up the graphics context
            pg.fill(255);
            pg.textAlign(this.sketch.LEFT, this.sketch.TOP);
            pg.textSize(14);
            
            const lineHeight = 20; // Fixed line height
            let infoY = this.scrollOffset;
            let totalHeight = 0;

            // Draw reputation
            pg.text(`Reputation: ${this.reputation}`, 0, infoY);
            infoY += lineHeight * 2; // Add extra space after reputation
            totalHeight += lineHeight * 2;

            // Draw shuttlecraft section
            pg.textSize(16);
            pg.text('Shuttlecraft:', 0, infoY);
            infoY += lineHeight * 1.5;
            totalHeight += lineHeight * 1.5;

            // Draw shuttlecraft status
            pg.textSize(14);
            this.shuttlecraft.forEach(shuttle => {
                // Choose color based on health
                if (shuttle.health <= 0) {
                    pg.fill(255, 0, 0); // Red for destroyed
                } else if (shuttle.health < 30) {
                    pg.fill(255, 100, 0); // Orange for critical
                } else if (shuttle.health < 70) {
                    pg.fill(255, 255, 0); // Yellow for damaged
                } else {
                    pg.fill(0, 255, 0); // Green for good condition
                }
                pg.text(`${shuttle.name}: ${shuttle.health}% health`, 10, infoY);
                pg.fill(255); // Reset to white
                infoY += lineHeight;
                totalHeight += lineHeight;
            });
            infoY += lineHeight; // Extra space after shuttlecraft
            totalHeight += lineHeight;

            // Draw inventory header
            pg.textSize(16);
            pg.fill(255);
            pg.text('Ship Inventory:', 0, infoY);
            infoY += lineHeight * 1.5;
            totalHeight += lineHeight * 1.5;

            // Draw inventory items
            pg.textSize(14);
            Object.entries(this.inventory).forEach(([item, quantity]) => {
                pg.text(`${item}: ${quantity}`, 10, infoY);
                infoY += lineHeight;
                totalHeight += lineHeight;
            });

            // Draw the graphics buffer
            this.sketch.image(pg, contentX, contentY);
            pg.remove();

            // Calculate max scroll offset based on total content height
            this.maxScrollOffset = Math.max(0, totalHeight - contentHeight);

            // Draw scroll indicator
            this.renderScrollIndicator(x, y, width, height, totalHeight, contentHeight);

        } else if (this.currentTab === 'Crew') {
            // Create a graphics buffer for the crew properties section
            const contentWidth = width - 40; // Account for margins
            const contentHeight = height - 40; // Account for margins
            const pg = this.sketch.createGraphics(contentWidth, contentHeight);
            pg.background(0, 0, 0, 0);
            
            // Set up the graphics context
            pg.fill(255);
            pg.textAlign(this.sketch.LEFT, this.sketch.TOP);
            pg.textSize(12);
            
            const lineHeight = 16; // Fixed line height for 12pt text

            // First pass: calculate total height needed
            let totalHeight = 0;
            for (const crew of this.crewMembers) {
                totalHeight += lineHeight; // Name and race
                totalHeight += lineHeight; // "Skills:" label
                totalHeight += Object.keys(crew.skillLevels).length * lineHeight; // Skills
                totalHeight += lineHeight; // "Demeanor:" label
                totalHeight += lineHeight; // Demeanor traits
                totalHeight += lineHeight * 1.5; // Extra space between crew members
            }

            // Draw crew members into the graphics buffer
            let infoY = this.scrollOffset;

            for (const crew of this.crewMembers) {
                // Draw crew member name and race
                pg.text(`${crew.name} (${crew.race})`, 0, infoY);
                infoY += lineHeight;

                // Draw skills
                pg.text('Skills:', 10, infoY);
                infoY += lineHeight;
                for (const [skill, level] of Object.entries(crew.skillLevels)) {
                    pg.text(`  ${skill}: ${level}/5`, 20, infoY);
                    infoY += lineHeight;
                }

                // Draw demeanor traits
                pg.text('Demeanor:', 10, infoY);
                infoY += lineHeight;
                pg.text(`  ${crew.demeanor.join(', ')}`, 20, infoY);
                infoY += lineHeight * 1.5; // Add extra space between crew members
            }

            // Draw the graphics buffer in the clipped region
            this.sketch.image(pg, contentX, contentY);
            pg.remove();

            // Calculate max scroll offset based on total content height
            this.maxScrollOffset = Math.max(0, totalHeight - contentHeight);

            // Draw scroll indicator
            this.renderScrollIndicator(x, y, width, height, totalHeight, contentHeight);
        }
    }

    handleMouseReleased(camera, mouseX, mouseY) {
        // Check ship button first (always visible)
        if (this.shipButton.handleClick(mouseX, mouseY)) {
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
                this.eventBus.emit('shipUIClosed');
                return true;
            }

            // Check tab clicks
            let tabWidth = windowWidth / this.tabs.length;
            this.tabs.forEach((tab, index) => {
                let tabX = x + (index * tabWidth);
                if (mouseX >= tabX && mouseX <= tabX + tabWidth &&
                    mouseY >= y && mouseY <= y + this.tabHeight) {
                    this.currentTab = tab;
                    // Reset scroll when changing tabs
                    this.scrollOffset = 0;
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

    handleMousePressed(camera, mouseX, mouseY) {
        // Only handle mouse press if window is visible
        if (!this.isWindowVisible) return false;

        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;

        // Return true if press is within window bounds to capture the interaction
        if (mouseX >= x && mouseX <= x + windowWidth &&
            mouseY >= y && mouseY <= y + windowHeight) {
            return true;
        }

        return false;
    }

    handleTouchEnd(camera, touchX, touchY) {
        // Check ship button first (always visible)
        if (this.shipButton.handleClick(touchX, touchY)) {
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
                this.eventBus.emit('shipUIClosed');
                return true;
            }

            // Check tab clicks
            let tabWidth = windowWidth / this.tabs.length;
            this.tabs.forEach((tab, index) => {
                let tabX = x + (index * tabWidth);
                if (touchX >= tabX && touchX <= tabX + tabWidth &&
                    touchY >= y && touchY <= y + this.tabHeight) {
                    this.currentTab = tab;
                    // Reset scroll when changing tabs
                    this.scrollOffset = 0;
                }
            });

            // Return true for any touch within the window bounds
            if (touchX >= x && touchX <= x + windowWidth &&
                touchY >= y && touchY <= y + windowHeight) {
                return true;
            }
        }

        return false;
    }
} 