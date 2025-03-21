import { Mission } from '../../game-state/mission.js';
import { BaseWindowUI } from './base-window-ui.js';
import { TextGeneratorOpenRouter } from '../../text-gen-openrouter.js';
import { TextButton } from './text-button.js';
import { TextBox } from './text-box.js';

export class MissionUI extends BaseWindowUI {
    constructor(sketch, eventBus, initialScene, missions) {
        super(sketch, eventBus, initialScene);
        this.missions = missions;
        this.textGenerator = null; // Will be set when API key is available
        this.crewMembers = []; // Will be populated from event
        this.isInSystemScene = false; // Track if we're in a system scene
        
        // Mission button properties
        this.buttonWidth = 80;
        this.buttonHeight = 40;
        this.buttonMargin = 20;
        
        // Main UI window properties
        this.isWindowVisible = false;
        this.windowMargin = 50;

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

        // Dropdown properties
        this.selectedCrewIndex = -1;
        this.isDropdownOpen = false;

        // Create text boxes
        this.objectiveTextBox = new TextBox(sketch, eventBus, {
            width: 400,
            height: this.textFieldHeight,
            placeholder: ''
        });

        this.detailsTextBox = new TextBox(sketch, eventBus, {
            width: 400,
            height: this.textFieldHeight * 3,
            multiline: true,
            placeholder: ''
        });

        // Loading state
        this.isGeneratingMission = false;
        this.loadingAngle = 0;

        // Scroll properties for add mission page
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.contentStartY = 60; // Start below top buttons

        // Page state
        this.currentPage = 'list'; // 'list' or 'add'

        // Graphics buffer for content
        this.contentBuffer = null;

        // Set up animation frame callback
        this.sketch.registerMethod('pre', () => {
            if (this.isGeneratingMission) {
                this.loadingAngle += 10; // Rotate 10 degrees per frame
            }
        });

        // Subscribe to UI visibility events
        this.eventBus.on('missionUIOpened', () => {
            this.isWindowVisible = true;
            this.currentPage = 'list'; // Reset to list page when opening
            this.objectiveTextBox.setActive(false);
            this.detailsTextBox.setActive(false);
            this.objectiveTextBox.setText(''); // Clear text fields when opening
            this.detailsTextBox.setText('');
        });
        this.eventBus.on('missionUIClosed', () => {
            this.isWindowVisible = false;
            this.currentPage = 'list'; // Reset to list page when closing
            this.objectiveTextBox.setActive(false);
            this.detailsTextBox.setActive(false);
            this.objectiveTextBox.hideMobileInput();
            this.detailsTextBox.hideMobileInput();
        });
        this.eventBus.on('shipUIOpened', () => {
            this.isWindowVisible = false;
            this.objectiveTextBox.setActive(false);
            this.detailsTextBox.setActive(false);
            this.objectiveTextBox.hideMobileInput();
            this.detailsTextBox.hideMobileInput();
        });
        this.eventBus.on('settingsUIOpened', () => {
            this.isWindowVisible = false;
            this.objectiveTextBox.setActive(false);
            this.detailsTextBox.setActive(false);
            this.objectiveTextBox.hideMobileInput();
            this.detailsTextBox.hideMobileInput();
        });

        // Subscribe to scene changes
        this.eventBus.on('sceneChanged', (scene) => {
            this.currentScene = scene;
            // Close the window when changing scenes
            this.isWindowVisible = false;
            this.objectiveTextBox.setActive(false);
            this.detailsTextBox.setActive(false);
            this.objectiveTextBox.hideMobileInput();
            this.detailsTextBox.hideMobileInput();
        });

        // Subscribe to system enter/exit events
        this.eventBus.on('enterSystem', () => {
            this.isInSystemScene = true;
        });

        this.eventBus.on('returnToGalaxy', () => {
            this.isInSystemScene = false;
            // Close the window when returning to galaxy
            this.isWindowVisible = false;
            this.objectiveTextBox.setActive(false);
            this.detailsTextBox.setActive(false);
            this.objectiveTextBox.hideMobileInput();
            this.detailsTextBox.hideMobileInput();
        });

        // Subscribe to API key updates
        this.eventBus.on('apiKeyUpdated', (apiKey) => {
            this.textGenerator = new TextGeneratorOpenRouter(apiKey);
        });

        // Subscribe to crew updates
        this.eventBus.on('crewUpdated', (crew) => {
            this.crewMembers = crew;
            if (this.selectedCrewIndex >= this.crewMembers.length) {
                this.selectedCrewIndex = -1;
            }
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

        // Set up buttons
        this.setupButtons();
    }

    setupButtons() {
        // Create mission button
        this.missionButton = new TextButton(
            this.sketch,
            this.buttonMargin + this.buttonWidth + this.buttonMargin,
            this.sketch.height - this.buttonHeight - this.buttonMargin,
            this.buttonWidth,
            this.buttonHeight,
            'Missions',
            () => {
                if (this.currentScene) {
                    this.eventBus.emit('closeAllInfoUIs');
                    if (!this.isWindowVisible) {
                        this.eventBus.emit('missionUIOpened');
                    } else {
                        this.eventBus.emit('missionUIClosed');
                    }
                }
            }
        );

        // Create mission button (will be updated in renderAddMissionPage)
        this.createMissionButton = null;
    }

    updateButtonPosition() {
        if (!this.missionButton) return;
        
        const y = this.sketch.height - this.buttonHeight - this.buttonMargin;
        this.missionButton.updatePosition(
            this.buttonMargin + this.buttonWidth + this.buttonMargin,
            y
        );
    }

    renderMissionButton() {
        // Don't render the button if we're not in a system scene
        if (!this.isInSystemScene) return;
        this.missionButton.render();
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
        const contentHeight = height - this.contentStartY - 20; // Leave some bottom padding
        this.contentBuffer = this.sketch.createGraphics(contentWidth, contentHeight);
        this.contentBuffer.background(0, 0, 0, 0);
        
        // Set up the graphics context
        this.contentBuffer.fill(255);
        this.contentBuffer.textAlign(this.sketch.LEFT, this.sketch.TOP);
        this.contentBuffer.textSize(14);

        // First calculate total content height without scroll offset
        const totalContentHeight = 
            this.labelHeight + // Objective label
            this.textFieldHeight + // Objective field
            this.textFieldMargin + // Margin
            this.labelHeight + // Details label
            this.textFieldHeight * 3 + // Details field
            this.textFieldMargin + // Margin
            this.labelHeight + // Crew Member label
            this.textFieldHeight + // Crew Member field
            this.textFieldMargin + // Margin
            20 + // Padding before button
            this.createButtonHeight + // Button height
            20; // Padding after button

        // Calculate max scroll offset based on total content height
        this.maxScrollOffset = Math.max(0, totalContentHeight - contentHeight + 20);

        // Now draw content with scroll offset
        let contentY = this.scrollOffset;

        // Draw Mission Objective field
        this.contentBuffer.text('Mission Objective:', 0, contentY);
        contentY += this.labelHeight;
        
        // Draw objective text box
        this.contentBuffer.push();
        this.contentBuffer.translate(0, contentY);
        this.objectiveTextBox.render(0, 0, this.contentBuffer);
        this.contentBuffer.pop();

        contentY += this.textFieldHeight + this.textFieldMargin;

        // Draw Mission Details field and text
        this.contentBuffer.fill(255);
        this.contentBuffer.noStroke();
        this.contentBuffer.textAlign(this.sketch.LEFT, this.sketch.TOP);
        this.contentBuffer.text('Mission Details:', 0, contentY);
        contentY += this.labelHeight;
        
        // Draw details text box
        this.contentBuffer.push();
        this.contentBuffer.translate(0, contentY);
        this.detailsTextBox.render(0, 0, this.contentBuffer);
        this.contentBuffer.pop();

        contentY += this.textFieldHeight * 3 + this.textFieldMargin;

        // Draw Crew Assignment dropdown
        this.contentBuffer.fill(255);
        this.contentBuffer.noStroke();
        this.contentBuffer.textAlign(this.sketch.LEFT, this.sketch.TOP);
        this.contentBuffer.text('Assign To:', 0, contentY);
        contentY += this.labelHeight;

        // Draw dropdown
        this.contentBuffer.fill(this.isDropdownOpen ? 80 : 60);
        this.contentBuffer.stroke(100);
        this.contentBuffer.strokeWeight(1);
        this.contentBuffer.rect(0, contentY, contentWidth, this.textFieldHeight, 3);

        // Draw selected crew member or placeholder
        this.contentBuffer.fill(255);
        this.contentBuffer.noStroke();
        this.contentBuffer.textAlign(this.sketch.LEFT, this.sketch.CENTER);
        const selectedText = this.selectedCrewIndex >= 0 
            ? this.crewMembers[this.selectedCrewIndex].name 
            : 'Select crew member...';
        this.contentBuffer.text(selectedText, 5, contentY + this.textFieldHeight/2);

        // Draw dropdown arrow
        this.contentBuffer.stroke(255);
        this.contentBuffer.strokeWeight(2);
        const arrowX = contentWidth - 20;
        const arrowY = contentY + this.textFieldHeight/2;
        this.contentBuffer.line(arrowX, arrowY - 3, arrowX + 5, arrowY + 3);
        this.contentBuffer.line(arrowX + 10, arrowY - 3, arrowX + 5, arrowY + 3);

        // Draw dropdown options if open
        if (this.isDropdownOpen && this.crewMembers.length > 0) {
            const dropdownHeight = this.crewMembers.length * this.textFieldHeight;
            this.contentBuffer.fill(80);
            this.contentBuffer.stroke(100);
            this.contentBuffer.rect(0, contentY + this.textFieldHeight, contentWidth, dropdownHeight, 3);

            this.crewMembers.forEach((crew, index) => {
                const optionY = contentY + this.textFieldHeight + (index * this.textFieldHeight);
                if (index === this.selectedCrewIndex) {
                    this.contentBuffer.fill(100);
                    this.contentBuffer.noStroke();
                    this.contentBuffer.rect(0, optionY, contentWidth, this.textFieldHeight);
                }
                this.contentBuffer.fill(255);
                this.contentBuffer.noStroke();
                this.contentBuffer.textAlign(this.sketch.LEFT, this.sketch.CENTER);
                this.contentBuffer.text(crew.name, 5, optionY + this.textFieldHeight/2);
            });
        }

        contentY += this.textFieldHeight + (this.isDropdownOpen ? this.crewMembers.length * this.textFieldHeight : 0) + this.textFieldMargin;

        // Create and render Create Mission button
        const buttonX = (contentWidth - this.createButtonWidth) / 2;
        const buttonY = contentY + 20;
        
        this.createMissionButton = new TextButton(
            this.sketch,
            buttonX,
            buttonY,
            this.createButtonWidth,
            this.createButtonHeight,
            this.isGeneratingMission ? 'Generating...' : 'Create Mission',
            () => this.handleCreateMission(),
            this.contentBuffer
        );

        // Render the Create Mission button
        this.createMissionButton.render();

        // Draw the graphics buffer in the clipped region
        this.sketch.image(this.contentBuffer, x + 20, y + this.contentStartY);
        this.contentBuffer.remove();

        // Draw scroll indicator
        this.renderScrollIndicator(x, y, width, height, totalContentHeight, contentHeight);
    }

    handleMouseReleased(camera, mouseX, mouseY) {
        // Don't handle clicks if we're not in a system scene
        if (!this.isInSystemScene) return false;

        // Check mission button first (always visible)
        if (this.missionButton.handleClick(mouseX, mouseY)) {
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
                    this.scrollOffset = 0; // Reset scroll when changing pages
                    return true;
                }
            } else {
                if (this.isBackButtonClicked(mouseX, mouseY)) {
                    this.currentPage = 'list';
                    this.scrollOffset = 0; // Reset scroll when changing pages
                    this.objectiveTextBox.setActive(false);
                    this.detailsTextBox.setActive(false);
                    return true;
                }

                // Check if click is within the content area
                const contentX = x + 20;
                const contentY = y + this.contentStartY;
                const contentWidth = windowWidth - 40;
                const contentHeight = windowHeight - this.contentStartY - 20;

                if (mouseX >= contentX && mouseX <= contentX + contentWidth &&
                    mouseY >= contentY && mouseY <= contentY + contentHeight) {
                    
                    // Calculate field positions including scroll offset
                    const objectiveFieldY = contentY + this.scrollOffset + this.labelHeight;
                    const detailsFieldY = objectiveFieldY + this.textFieldHeight + this.textFieldMargin + this.labelHeight;
                    const dropdownY = detailsFieldY + this.textFieldHeight * 3 + this.textFieldMargin + this.labelHeight;

                    // Check if click is on objective text box
                    if (mouseY >= objectiveFieldY && mouseY <= objectiveFieldY + this.textFieldHeight) {
                        this.objectiveTextBox.handleClick(mouseX - contentX, mouseY - objectiveFieldY);
                        this.detailsTextBox.setActive(false); // Deactivate details box
                        return true;
                    }

                    // Check if click is on details text box
                    if (mouseY >= detailsFieldY && mouseY <= detailsFieldY + (this.textFieldHeight * 3)) {
                        this.detailsTextBox.handleClick(mouseX - contentX, mouseY - detailsFieldY);
                        this.objectiveTextBox.setActive(false); // Deactivate objective box
                        return true;
                    }

                    // Check if click is on crew dropdown
                    if (mouseY >= dropdownY && mouseY <= dropdownY + this.textFieldHeight) {
                        this.isDropdownOpen = !this.isDropdownOpen;
                        return true;
                    }

                    // Check if click is on dropdown options
                    if (this.isDropdownOpen) {
                        const optionsStartY = dropdownY + this.textFieldHeight;
                        const optionsEndY = optionsStartY + (this.crewMembers.length * this.textFieldHeight);
                        
                        if (mouseY >= optionsStartY && mouseY <= optionsEndY) {
                            const clickedIndex = Math.floor((mouseY - optionsStartY) / this.textFieldHeight);
                            if (clickedIndex >= 0 && clickedIndex < this.crewMembers.length) {
                                this.selectedCrewIndex = clickedIndex;
                                this.isDropdownOpen = false;
                                return true;
                            }
                        }
                    }

                    // Check if click is on Create Mission button
                    if (this.createMissionButton && this.createMissionButton.handleClick(mouseX - contentX, mouseY - contentY)) {
                        return true;
                    }
                    
                    return true;
                }
            }

            // Return true for any click within the window bounds
            if (mouseX >= x && mouseX <= x + windowWidth &&
                mouseY >= y && mouseY <= y + windowHeight) {
                return true;
            }

            // If we clicked outside the window, deactivate text boxes
            this.objectiveTextBox.setActive(false);
            this.detailsTextBox.setActive(false);
        }

        // Close dropdown if clicking outside
        this.isDropdownOpen = false;

        return false;
    }

    handleTouchEnd(camera, touchX, touchY) {
        // Don't handle touches if we're not in a system scene
        if (!this.isInSystemScene) return false;

        // Check mission button first (always visible)
        if (this.missionButton.handleClick(touchX, touchY)) {
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
                this.eventBus.emit('missionUIClosed');
                return true;
            }

            // Handle page-specific button clicks
            if (this.currentPage === 'list') {
                if (this.isAddButtonClicked(touchX, touchY)) {
                    this.currentPage = 'add';
                    this.scrollOffset = 0; // Reset scroll when changing pages
                    return true;
                }
            } else {
                if (this.isBackButtonClicked(touchX, touchY)) {
                    this.currentPage = 'list';
                    this.scrollOffset = 0; // Reset scroll when changing pages
                    this.objectiveTextBox.setActive(false);
                    this.detailsTextBox.setActive(false);
                    return true;
                }

                // Check if touch ended within the content area
                const contentX = x + 20;
                const contentY = y + this.contentStartY;
                const contentWidth = windowWidth - 40;
                const contentHeight = windowHeight - this.contentStartY - 20;

                if (touchX >= contentX && touchX <= contentX + contentWidth &&
                    touchY >= contentY && touchY <= contentY + contentHeight) {
                    
                    // Calculate field positions including scroll offset
                    const objectiveFieldY = contentY + this.scrollOffset + this.labelHeight;
                    const detailsFieldY = objectiveFieldY + this.textFieldHeight + this.textFieldMargin + this.labelHeight;
                    const dropdownY = detailsFieldY + this.textFieldHeight * 3 + this.textFieldMargin + this.labelHeight;

                    // Check if touch ended on objective text box
                    if (touchY >= objectiveFieldY && touchY <= objectiveFieldY + this.textFieldHeight) {
                        this.objectiveTextBox.handleTouchEnd(touchX - contentX, touchY - objectiveFieldY);
                        this.detailsTextBox.setActive(false); // Deactivate details box
                        return true;
                    }

                    // Check if touch ended on details text box
                    if (touchY >= detailsFieldY && touchY <= detailsFieldY + (this.textFieldHeight * 3)) {
                        this.detailsTextBox.handleTouchEnd(touchX - contentX, touchY - detailsFieldY);
                        this.objectiveTextBox.setActive(false); // Deactivate objective box
                        return true;
                    }

                    // Check if touch ended on crew dropdown
                    if (touchY >= dropdownY && touchY <= dropdownY + this.textFieldHeight) {
                        this.isDropdownOpen = !this.isDropdownOpen;
                        return true;
                    }

                    // Check if touch ended on dropdown options
                    if (this.isDropdownOpen) {
                        const optionsStartY = dropdownY + this.textFieldHeight;
                        const optionsEndY = optionsStartY + (this.crewMembers.length * this.textFieldHeight);
                        
                        if (touchY >= optionsStartY && touchY <= optionsEndY) {
                            const clickedIndex = Math.floor((touchY - optionsStartY) / this.textFieldHeight);
                            if (clickedIndex >= 0 && clickedIndex < this.crewMembers.length) {
                                this.selectedCrewIndex = clickedIndex;
                                this.isDropdownOpen = false;
                                return true;
                            }
                        }
                    }

                    // Check if touch ended on Create Mission button
                    if (this.createMissionButton && this.createMissionButton.handleClick(touchX - contentX, touchY - contentY)) {
                        return true;
                    }
                    
                    return true;
                }
            }

            // Return true for any touch within the window bounds
            if (touchX >= x && touchX <= x + windowWidth &&
                touchY >= y && touchY <= y + windowHeight) {
                return true;
            }

            // If we touched outside the window, deactivate text boxes
            this.objectiveTextBox.setActive(false);
            this.detailsTextBox.setActive(false);
        }

        // Close dropdown if touching outside
        this.isDropdownOpen = false;

        return false;
    }

    handleKeyDown(event) {
        if (!this.isWindowVisible || this.currentPage !== 'add') {
            return false;
        }

        return this.objectiveTextBox.handleKeyDown(event) || 
               this.detailsTextBox.handleKeyDown(event);
    }

    handleKeyPress(event) {
        if (!this.isWindowVisible || this.currentPage !== 'add') {
            return false;
        }

        return this.objectiveTextBox.handleKeyPress(event) || 
               this.detailsTextBox.handleKeyPress(event);
    }

    async handleCreateMission() {
        const objective = this.objectiveTextBox.getText().trim();
        const details = this.detailsTextBox.getText().trim();
        
        if (objective === '' || this.selectedCrewIndex < 0) {
            return;
        }

        // Create new mission
        const mission = new Mission(
            objective,
            details,
            this.selectedCrewIndex >= 0 ? this.crewMembers[this.selectedCrewIndex] : null
        );
        
        // Generate steps if text generator is available
        if (this.textGenerator) {
            try {
                this.isGeneratingMission = true;
                await mission.generateSteps(this.textGenerator);
            } catch (error) {
                console.error('Failed to generate mission steps:', error);
            } finally {
                this.isGeneratingMission = false;
            }
        }

        this.missions.push(mission);

        // Clear input fields and return to list
        this.objectiveTextBox.setText('');
        this.detailsTextBox.setText('');
        this.selectedCrewIndex = -1;
        this.currentPage = 'list';
        this.objectiveTextBox.setActive(false);
        this.detailsTextBox.setActive(false);
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

    renderMainWindow() {
        super.renderMainWindow();
        
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;

        // Render the appropriate page based on current state
        if (this.currentPage === 'list') {
            this.renderMissionListPage(x, y, windowWidth, windowHeight);
        } else {
            this.renderAddMissionPage(x, y, windowWidth, windowHeight);
        }
    }

    renderMissionListPage(x, y, width, height) {
        // Draw add button in top left
        let addX = x + this.addButtonMargin;
        let addY = y + this.addButtonMargin;
        this.sketch.stroke(150);
        this.sketch.line(addX, addY + this.addButtonSize/2, addX + this.addButtonSize, addY + this.addButtonSize/2);
        this.sketch.line(addX + this.addButtonSize/2, addY, addX + this.addButtonSize/2, addY + this.addButtonSize);

        // Create a graphics buffer for the content section
        const contentWidth = width - 40; // Account for margins
        const contentHeight = height - this.contentStartY - 20; // Leave some bottom padding
        const pg = this.sketch.createGraphics(contentWidth, contentHeight);
        pg.background(0, 0, 0, 0);

        // Set up the graphics context
        pg.fill(255);
        pg.textAlign(this.sketch.LEFT, this.sketch.TOP);
        pg.textSize(14);

        // Calculate total content height
        const missionHeight = 90; // Height of each mission box
        const totalContentHeight = (this.missions.length * missionHeight) + 30; // Add some padding

        // Calculate max scroll offset based on total content height
        this.maxScrollOffset = Math.max(0, totalContentHeight - contentHeight + 20);

        // Draw mission list title
        pg.text('Mission List:', 0, this.scrollOffset);
        
        // Draw each mission with scroll offset
        let contentY = this.scrollOffset + 30;

        this.missions.forEach((mission, index) => {
            // Draw mission box
            pg.fill(60);
            pg.stroke(100);
            pg.strokeWeight(1);
            pg.rect(0, contentY, contentWidth, 80, 3);

            // Draw mission content
            pg.fill(255);
            pg.noStroke();
            pg.textAlign(this.sketch.LEFT, this.sketch.TOP);
            
            // Draw objective with wrapping
            pg.textSize(16);
            const maxObjectiveWidth = contentWidth - 120; // Leave space for status
            const wrappedObjective = this.wrapText(pg, mission.objective, maxObjectiveWidth);
            pg.text(wrappedObjective, 10, contentY + 10);
            
            // Draw details with wrapping
            pg.textSize(12);
            pg.fill(200);
            const maxDetailsWidth = contentWidth - 20;
            const wrappedDetails = this.wrapText(pg, mission.details, maxDetailsWidth);
            pg.text(wrappedDetails, 10, contentY + 35);

            // Draw completion status
            pg.textAlign(this.sketch.RIGHT, this.sketch.TOP);
            pg.fill(mission.completed ? '#4CAF50' : '#FFA500');
            pg.text(mission.completed ? 'Completed' : 'In Progress', contentWidth - 10, contentY + 10);

            // Draw assigned crew member
            if (mission.assignedCrew) {
                pg.textAlign(this.sketch.RIGHT, this.sketch.TOP);
                pg.fill(150);
                pg.text(`Assigned to: ${mission.assignedCrew.name}`, contentWidth - 10, contentY + 30);
            }

            // Draw step graph
            if (mission.steps && mission.steps.length > 0) {
                const graphStartX = 10;
                const graphY = contentY + 60;
                const nodeSpacing = Math.min(30, (contentWidth - 20) / mission.steps.length);
                const nodeRadius = 4;

                mission.steps.forEach((step, stepIndex) => {
                    const nodeX = graphStartX + (stepIndex * nodeSpacing);

                    // Draw connecting line to next node
                    if (stepIndex < mission.steps.length - 1) {
                        pg.stroke(100);
                        pg.strokeWeight(1);
                        pg.line(nodeX + nodeRadius, graphY, 
                               nodeX + nodeSpacing - nodeRadius, graphY);
                    }

                    // Draw node
                    pg.noStroke();
                    pg.fill(mission.completed ? '#4CAF50' : '#FFA500');
                    pg.circle(nodeX, graphY, nodeRadius * 2);

                    // Store node position for tooltip handling
                    const absoluteX = x + 20 + nodeX;
                    const absoluteY = y + this.contentStartY + graphY;
                    this.checkStepNodeHover(absoluteX, absoluteY, nodeRadius, step);
                });
            }

            contentY += missionHeight;
        });

        // Draw the graphics buffer in the clipped region
        this.sketch.image(pg, x + 20, y + this.contentStartY);
        pg.remove();

        // Draw scroll indicator
        this.renderScrollIndicator(x, y, width, height, totalContentHeight, contentHeight);

        // Draw step tooltip if hovering
        this.renderStepTooltip();
    }

    wrapText(pg, text, maxWidth) {
        if (!text) return '';
        
        const words = text.split(' ');
        let lines = [];
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

        return lines.join('\n');
    }

    checkStepNodeHover(nodeX, nodeY, nodeRadius, stepText) {
        const mouseX = this.sketch.mouseX;
        const mouseY = this.sketch.mouseY;
        const dist = this.sketch.dist(mouseX, mouseY, nodeX, nodeY);
        
        if (dist <= nodeRadius * 2) {
            this.hoveredStep = {
                x: nodeX,
                y: nodeY,
                text: stepText
            };
        }
    }

    renderStepTooltip() {
        if (!this.hoveredStep) return;

        this.sketch.push();
        
        // Draw tooltip background
        this.sketch.fill(0, 0, 0, 200);
        this.sketch.noStroke();
        
        // Calculate text dimensions with wrapping
        this.sketch.textSize(12);
        const maxTooltipWidth = 200; // Maximum width for tooltip
        const padding = 5;
        const lineHeight = 16;
        
        // Create a temporary graphics buffer for text wrapping
        const pg = this.sketch.createGraphics(maxTooltipWidth, 100);
        pg.textSize(12);
        const wrappedText = this.wrapText(pg, this.hoveredStep.text, maxTooltipWidth - (padding * 2));
        const lines = wrappedText.split('\n');
        pg.remove();
        
        // Calculate tooltip dimensions
        const tooltipWidth = Math.min(maxTooltipWidth, this.sketch.textWidth(this.hoveredStep.text) + (padding * 2));
        const tooltipHeight = (lines.length * lineHeight) + (padding * 2);
        
        // Calculate initial tooltip position
        let tooltipX = this.hoveredStep.x - (tooltipWidth / 2);
        let tooltipY = this.hoveredStep.y - tooltipHeight - 10;
        
        // Adjust position to keep tooltip within screen bounds
        tooltipX = Math.max(padding, Math.min(tooltipX, this.sketch.width - tooltipWidth - padding));
        tooltipY = Math.max(padding, Math.min(tooltipY, this.sketch.height - tooltipHeight - padding));
        
        // Draw tooltip background with rounded corners
        this.sketch.rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5);
        
        // Draw tooltip text, line by line
        this.sketch.fill(255);
        this.sketch.textAlign(this.sketch.LEFT, this.sketch.TOP);
        lines.forEach((line, index) => {
            this.sketch.text(
                line,
                tooltipX + padding,
                tooltipY + padding + (index * lineHeight)
            );
        });
        
        this.sketch.pop();
        
        // Reset hover state for next frame
        this.hoveredStep = null;
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
} 