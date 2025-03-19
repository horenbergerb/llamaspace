export class ShipUI {
    constructor(sketch, eventBus, initialScene, crewMembers) {
        this.sketch = sketch;
        this.eventBus = eventBus;
        this.crewMembers = crewMembers;
        
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

        // Scroll properties for crew tab
        this.crewScrollOffset = 0;
        this.crewMaxScrollOffset = 0;
        this.crewPropertiesHeight = 0;
        this.crewPropertiesStartY = 60; // Start below tabs

        // Scene tracking - initialize with the provided scene
        this.currentScene = initialScene;

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

        // Subscribe to scene changes
        this.eventBus.on('sceneChanged', (scene) => {
            this.currentScene = scene;
            // Close the window when changing scenes
            this.isWindowVisible = false;
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

    renderButton(camera) {
        this.renderShipButton();
    }

    renderWindow(camera) {
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    renderShipButton() {
        this.sketch.push();
        
        // Position in bottom left, accounting for camera
        let x = this.buttonMargin;
        let y = this.sketch.height - this.buttonHeight - this.buttonMargin;

        // Draw button background with different color based on scene
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
            let infoY = this.crewScrollOffset;

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
            this.crewMaxScrollOffset = Math.max(0, totalHeight - contentHeight);

            // Draw scroll indicator if needed
            if (this.crewMaxScrollOffset > 0) {
                const scrollPercent = -this.crewScrollOffset / this.crewMaxScrollOffset;
                const scrollBarHeight = Math.max(30, (contentHeight / totalHeight) * contentHeight);
                const scrollBarY = y + (height - scrollBarHeight) * scrollPercent;
                
                this.sketch.fill(150, 150, 150, 100);
                this.sketch.noStroke();
                this.sketch.rect(x + width - 8, scrollBarY, 4, scrollBarHeight, 2);
            }
        }
    }

    handleMouseReleased(camera, mouseX, mouseY) {
        // Check ship button first (always visible)
        if (this.isShipButtonClicked(mouseX, mouseY)) {
            // Only toggle if we have a valid scene
            if (this.currentScene) {
                this.eventBus.emit('closeAllInfoUIs');
                if (!this.isWindowVisible) {
                    this.eventBus.emit('shipUIOpened');
                } else {
                    this.eventBus.emit('shipUIClosed');
                }
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
                    this.crewScrollOffset = 0;
                }
            });

            // Handle crew tab scrolling
            if (this.currentTab === 'Crew') {
                const contentY = y + this.crewPropertiesStartY;
                if (mouseX >= x && mouseX <= x + windowWidth &&
                    mouseY >= contentY && mouseY <= y + windowHeight) {
                    // Handle mouse wheel scrolling
                    if (this.sketch.mouseWheel) {
                        this.crewScrollOffset = Math.max(-this.crewMaxScrollOffset, 
                            Math.min(0, this.crewScrollOffset + this.sketch.mouseWheel));
                    }
                }
            }

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
        // Just prevent camera movement if touching the UI
        if (this.isWindowVisible) {
            const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
            let x = (this.sketch.width - windowWidth) / 2;
            let y = (this.sketch.height - windowHeight) / 2;
            
            return touchX >= x && touchX <= x + windowWidth &&
                   touchY >= y && touchY <= y + windowHeight;
        }
        return false;
    }

    handleTouchMove(camera, touchX, touchY) {
        // Just prevent camera movement if touching the UI
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
        // Check ship button first (always visible)
        if (this.isShipButtonClicked(touchX, touchY)) {
            // Only toggle if we have a valid scene
            if (this.currentScene) {
                this.eventBus.emit('closeAllInfoUIs');
                if (!this.isWindowVisible) {
                    this.eventBus.emit('shipUIOpened');
                } else {
                    this.eventBus.emit('shipUIClosed');
                }
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
                    this.crewScrollOffset = 0;
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

    handleMouseWheel(event) {
        // Only handle scrolling if we're in the crew tab and the window is visible
        if (this.isWindowVisible && this.currentTab === 'Crew') {
            const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
            let x = (this.sketch.width - windowWidth) / 2;
            let y = (this.sketch.height - windowHeight) / 2;
            
            // Check if mouse is over the crew content area
            if (this.sketch.mouseX >= x && this.sketch.mouseX <= x + windowWidth &&
                this.sketch.mouseY >= y + this.crewPropertiesStartY && 
                this.sketch.mouseY <= y + windowHeight) {
                
                // Update scroll offset with a multiplier to make scrolling smoother
                const scrollMultiplier = 1.5;
                this.crewScrollOffset = Math.max(-this.crewMaxScrollOffset, 
                    Math.min(0, this.crewScrollOffset - (event.deltaY * scrollMultiplier)));
                return true;
            }
        }
        return false;
    }
} 