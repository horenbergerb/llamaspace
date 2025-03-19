export class MissionUI {
    constructor(sketch, eventBus, initialScene) {
        this.sketch = sketch;
        this.eventBus = eventBus;
        
        // Mission button properties
        this.buttonWidth = 80;
        this.buttonHeight = 40;
        this.buttonMargin = 20;
        
        // Main UI window properties
        this.isWindowVisible = false;
        this.windowMargin = 50;
        
        // Close button properties
        this.closeButtonSize = 20;

        // Add button properties
        this.addButtonSize = 24;
        this.addButtonMargin = 10;

        // Back arrow properties
        this.backArrowSize = 24;
        this.backArrowMargin = 10;

        // Text field properties
        this.textFieldHeight = 30;
        this.textFieldMargin = 20;
        this.labelHeight = 20;
        this.createButtonHeight = 40;
        this.createButtonWidth = 150;

        // Scroll properties for add mission page
        this.missionScrollOffset = 0;
        this.missionMaxScrollOffset = 0;
        this.missionContentStartY = 60; // Start below top buttons

        // Page state
        this.currentPage = 'list'; // 'list' or 'add'

        // Scene tracking - initialize with the provided scene
        this.currentScene = initialScene;

        // Subscribe to UI visibility events
        this.eventBus.on('missionUIOpened', () => {
            this.isWindowVisible = true;
            this.currentPage = 'list'; // Reset to list page when opening
        });
        this.eventBus.on('missionUIClosed', () => {
            this.isWindowVisible = false;
            this.currentPage = 'list'; // Reset to list page when closing
        });
        this.eventBus.on('shipUIOpened', () => {
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
        // Always render the mission button
        this.renderMissionButton();

        // Render the main window if visible
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    renderButton(camera) {
        this.renderMissionButton();
    }

    renderWindow(camera) {
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    renderMissionButton() {
        this.sketch.push();
        
        // Position in bottom left, next to ship button
        let x = this.buttonMargin + this.buttonWidth + this.buttonMargin;
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
        this.sketch.text('Missions', x + this.buttonWidth/2, y + this.buttonHeight/2);

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

        // Draw close button
        let closeX = x + windowWidth - this.closeButtonSize - 10;
        let closeY = y + 10;
        this.sketch.stroke(150);
        this.sketch.line(closeX, closeY, closeX + this.closeButtonSize, closeY + this.closeButtonSize);
        this.sketch.line(closeX + this.closeButtonSize, closeY, closeX, closeY + this.closeButtonSize);

        // Render the appropriate page based on current state
        if (this.currentPage === 'list') {
            this.renderMissionListPage(x, y, windowWidth, windowHeight);
        } else {
            this.renderAddMissionPage(x, y, windowWidth, windowHeight);
        }

        this.sketch.pop();
    }

    renderMissionListPage(x, y, width, height) {
        // Draw add button in top left
        let addX = x + this.addButtonMargin;
        let addY = y + this.addButtonMargin;
        this.sketch.stroke(150);
        this.sketch.line(addX, addY + this.addButtonSize/2, addX + this.addButtonSize, addY + this.addButtonSize/2);
        this.sketch.line(addX + this.addButtonSize/2, addY, addX + this.addButtonSize/2, addY + this.addButtonSize);

        // Draw mission list content
        this.sketch.fill(255);
        this.sketch.noStroke();
        this.sketch.textAlign(this.sketch.LEFT, this.sketch.TOP);
        this.sketch.textSize(14);
        
        let contentX = x + 20;
        let contentY = y + 60; // Start below the top buttons

        this.sketch.text('Mission List:', contentX, contentY);
        // Add more mission list content here
    }

    renderAddMissionPage(x, y, width, height) {
        // Draw back arrow in top left
        let backX = x + this.backArrowMargin;
        let backY = y + this.backArrowMargin;
        this.sketch.stroke(150);
        this.sketch.line(backX + this.backArrowSize/2, backY, backX, backY + this.backArrowSize/2);
        this.sketch.line(backX, backY + this.backArrowSize/2, backX + this.backArrowSize/2, backY + this.backArrowSize);

        // Draw page title
        this.sketch.fill(255);
        this.sketch.noStroke();
        this.sketch.textAlign(this.sketch.LEFT, this.sketch.TOP);
        this.sketch.textSize(16);
        this.sketch.text('Add New Mission:', x + 20, y + 20);

        // Create a graphics buffer for the content section
        const contentWidth = width - 40; // Account for margins
        const contentHeight = height - this.missionContentStartY - 20; // Leave some bottom padding
        const pg = this.sketch.createGraphics(contentWidth, contentHeight);
        pg.background(0, 0, 0, 0);
        
        // Set up the graphics context
        pg.fill(255);
        pg.textAlign(this.sketch.LEFT, this.sketch.TOP);
        pg.textSize(14);

        // First calculate total content height without scroll offset
        const totalContentHeight = 
            this.labelHeight + // Objective label
            this.textFieldHeight + // Objective field
            this.textFieldMargin + // Margin
            this.labelHeight + // Details label
            this.textFieldHeight * 3 + // Details field
            this.textFieldMargin + // Margin
            20 + // Padding before button
            this.createButtonHeight + // Button height
            20; // Padding after button

        // Calculate max scroll offset based on total content height
        this.missionMaxScrollOffset = Math.max(0, totalContentHeight - contentHeight + 20);

        // Now draw content with scroll offset
        let contentY = this.missionScrollOffset;

        // Draw Mission Objective field
        pg.text('Mission Objective:', 0, contentY);
        contentY += this.labelHeight;
        
        // Draw objective text field
        pg.fill(60);
        pg.stroke(100);
        pg.strokeWeight(1);
        pg.rect(0, contentY, contentWidth, this.textFieldHeight, 3);
        contentY += this.textFieldHeight + this.textFieldMargin;

        // Draw Mission Details field
        pg.fill(255);
        pg.noStroke();
        pg.text('Mission Details:', 0, contentY);
        contentY += this.labelHeight;
        
        // Draw details text field (larger)
        pg.fill(60);
        pg.stroke(100);
        pg.strokeWeight(1);
        pg.rect(0, contentY, contentWidth, this.textFieldHeight * 3, 3);
        contentY += this.textFieldHeight * 3 + this.textFieldMargin;

        // Draw Create Mission button
        let buttonY = contentY + 20; // Add some space after the details field
        let buttonX = (contentWidth - this.createButtonWidth) / 2;
        
        // Button background
        pg.fill(60);
        pg.stroke(100);
        pg.strokeWeight(1);
        pg.rect(buttonX, buttonY, this.createButtonWidth, this.createButtonHeight, 5);

        // Button text
        pg.fill(255);
        pg.noStroke();
        pg.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        pg.textSize(14);
        pg.text('Create Mission', buttonX + this.createButtonWidth/2, buttonY + this.createButtonHeight/2);

        // Draw the graphics buffer in the clipped region
        this.sketch.image(pg, x + 20, y + this.missionContentStartY);
        pg.remove();

        // Draw scroll indicator if needed
        if (this.missionMaxScrollOffset > 0) {
            // Calculate the visible portion ratio
            const visibleRatio = contentHeight / totalContentHeight;
            // Calculate scroll bar height based on the ratio of visible content
            const scrollBarHeight = Math.max(30, contentHeight * visibleRatio);
            
            // Calculate scroll position as a percentage (0 to 1)
            const scrollPercent = Math.abs(this.missionScrollOffset) / this.missionMaxScrollOffset;
            // Calculate available scroll distance (content height minus scroll bar height)
            const availableScrollDistance = contentHeight - scrollBarHeight;
            // Calculate final scroll bar position
            const scrollBarY = y + this.missionContentStartY + (availableScrollDistance * scrollPercent);
            
            this.sketch.fill(150, 150, 150, 100);
            this.sketch.noStroke();
            this.sketch.rect(x + width - 8, scrollBarY, 4, scrollBarHeight, 2);
        }
    }

    handleMouseReleased(camera, mouseX, mouseY) {
        // Check mission button first (always visible)
        if (this.isMissionButtonClicked(mouseX, mouseY)) {
            // Only toggle if we have a valid scene
            if (this.currentScene) {
                this.eventBus.emit('closeAllInfoUIs');
                if (!this.isWindowVisible) {
                    this.eventBus.emit('missionUIOpened');
                } else {
                    this.eventBus.emit('missionUIClosed');
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
                this.eventBus.emit('missionUIClosed');
                return true;
            }

            // Handle page-specific button clicks
            if (this.currentPage === 'list') {
                if (this.isAddButtonClicked(mouseX, mouseY)) {
                    this.currentPage = 'add';
                    this.missionScrollOffset = 0; // Reset scroll when changing pages
                    return true;
                }
            } else {
                if (this.isBackButtonClicked(mouseX, mouseY)) {
                    this.currentPage = 'list';
                    this.missionScrollOffset = 0; // Reset scroll when changing pages
                    return true;
                }

                // Check if click is within the content area
                const contentX = x + 20;
                const contentY = y + this.missionContentStartY;
                const contentWidth = windowWidth - 40;
                const contentHeight = windowHeight - this.missionContentStartY - 20;

                if (mouseX >= contentX && mouseX <= contentX + contentWidth &&
                    mouseY >= contentY && mouseY <= contentY + contentHeight) {
                    
                    // If it's a click on the Create Mission button, handle it
                    if (this.isCreateButtonClicked(mouseX, mouseY)) {
                        // TODO: Handle mission creation
                        return true;
                    }
                    
                    // Return true for any click within the content area to prevent content disappearing
                    return true;
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

    isMissionButtonClicked(mouseX, mouseY) {
        let x = this.buttonMargin + this.buttonWidth + this.buttonMargin;
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

    isAddButtonClicked(mouseX, mouseY) {
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;
        let addX = x + this.addButtonMargin;
        let addY = y + this.addButtonMargin;
        
        return mouseX >= addX && mouseX <= addX + this.addButtonSize &&
               mouseY >= addY && mouseY <= addY + this.addButtonSize;
    }

    isBackButtonClicked(mouseX, mouseY) {
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;
        let backX = x + this.backArrowMargin;
        let backY = y + this.backArrowMargin;
        
        return mouseX >= backX && mouseX <= backX + this.backArrowSize &&
               mouseY >= backY && mouseY <= backY + this.backArrowSize;
    }

    isCreateButtonClicked(mouseX, mouseY) {
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;
        
        // Calculate button position including scroll offset
        const contentX = x + 20;
        const contentY = y + this.missionContentStartY;
        const buttonX = contentX + (windowWidth - 40 - this.createButtonWidth) / 2;
        
        // Calculate button Y position including scroll offset
        const buttonY = contentY + this.missionScrollOffset + 
            this.labelHeight + // Objective label
            this.textFieldHeight + // Objective field
            this.textFieldMargin + // Margin
            this.labelHeight + // Details label
            this.textFieldHeight * 3 + // Details field
            this.textFieldMargin + // Margin
            20; // Padding before button
        
        return mouseX >= buttonX && mouseX <= buttonX + this.createButtonWidth &&
               mouseY >= buttonY && mouseY <= buttonY + this.createButtonHeight;
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

    handleMouseWheel(event) {
        // Only handle scrolling if we're in the add mission page and the window is visible
        if (this.isWindowVisible && this.currentPage === 'add') {
            const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
            let x = (this.sketch.width - windowWidth) / 2;
            let y = (this.sketch.height - windowHeight) / 2;
            
            // Check if mouse is over the content area
            if (this.sketch.mouseX >= x && this.sketch.mouseX <= x + windowWidth &&
                this.sketch.mouseY >= y + this.missionContentStartY && 
                this.sketch.mouseY <= y + windowHeight - 20) {
                
                // Update scroll offset with a multiplier to make scrolling smoother
                const scrollMultiplier = 1.5;
                this.missionScrollOffset = Math.max(-this.missionMaxScrollOffset, 
                    Math.min(0, this.missionScrollOffset - (event.deltaY * scrollMultiplier)));
                return true;
            }
        }
        return false;
    }
} 