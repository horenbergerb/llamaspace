import { Mission } from '../../../game-state/mission.js';
import { BaseWindowUI } from '../base-window-ui.js';
import { TextGeneratorOpenRouter } from '../../../text-gen-openrouter.js';
import { TextButton } from '../components/text-button.js';
import { TextBox } from '../components/text-box.js';
import { MissionButton } from './mission-button.js';
import { ScrollableGraphicsBuffer } from '../components/scrollable-graphics-buffer.js';
import { Dropdown } from '../components/dropdown.js';
import { wrapText } from '../../../utils/text-utils.js';
import { MissionInfoUI } from './mission-info-ui.js';

export class MissionUI extends BaseWindowUI {
    constructor(sketch, eventBus, initialScene, missions) {
        super(sketch, eventBus, initialScene);
        this.missions = missions;
        this.textGenerator = null; // Will be set when API key is available
        this.crewMembers = []; // Will be populated from event
        this.isInSystemScene = false; // Track if we're in a system scene
        this.currentScene = initialScene; // Track current scene
        this.orbitingBody = null; // Track current orbiting body
        
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

        // Tooltip properties
        this.tooltipText = null;
        this.tooltipTimeout = null;
        this.tooltipDuration = 2000; // Duration in milliseconds

        // Hover state
        this.hoveredMissionIndex = -1;

        // Create text boxes
        this.objectiveTextBox = new TextBox(sketch, eventBus, {
            width: 400,
            height: this.textFieldHeight,
            placeholder: ''
        });

        // Create crew dropdown
        this.crewDropdown = new Dropdown(sketch, eventBus, {
            width: 400,
            height: this.textFieldHeight,
            placeholder: 'Select crew member...',
            onSelect: (index) => {
                this.selectedCrewIndex = index;
            }
        });

        // Loading state
        this.isGeneratingMission = false;
        this.loadingAngle = 0;

        // Content start Y position
        this.contentStartY = 60; // Start below top buttons

        // Page state
        this.currentPage = 'list'; // 'list' or 'add'

        // Create graphics buffers for both pages
        this.listBuffer = new ScrollableGraphicsBuffer(sketch);
        this.addBuffer = new ScrollableGraphicsBuffer(sketch);

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
            this.objectiveTextBox.setText(''); // Clear text fields when opening
            this.listBuffer.resetScroll();
            this.addBuffer.resetScroll();
        });
        this.eventBus.on('missionUIAddPage', () => {
            if (this.hasMissionInProgress()) {
                this.showTemporaryTooltip("A mission is already in progress on this planet");
                this.currentPage = 'list';
            } else {
                this.currentPage = 'add';
                this.addBuffer.resetScroll();
            }
        });
        this.eventBus.on('shipUIOpened', () => {
            this.closeWindow();
        });
        this.eventBus.on('settingsUIOpened', () => {
            this.closeWindow();
        });

        // Subscribe to scene changes
        this.eventBus.on('sceneChanged', (scene) => {
            this.currentScene = scene;
            this.closeWindow();
        });

        // Subscribe to orbit body changes
        this.eventBus.on('orbitBodyChanged', (body) => {
            this.orbitingBody = body;
            this.closeWindow();
        });

        // Subscribe to system enter/exit events
        this.eventBus.on('enterSystem', () => {
            this.isInSystemScene = true;
        });

        this.eventBus.on('returnToGalaxy', () => {
            this.isInSystemScene = false;
            this.closeWindow();
        });

        // Subscribe to API key updates
        this.eventBus.on('apiKeyUpdated', (apiKey) => {
            this.textGenerator = new TextGeneratorOpenRouter(apiKey);
        });

        // Subscribe to crew updates
        this.eventBus.on('crewUpdated', (crew) => {
            this.crewMembers = crew;
            this.crewDropdown.setOptions(crew);
        });

        window.addEventListener('keypress', (e) => {
            if (this.handleKeyPress(e)) {
                e.preventDefault();
            }
        });

        // Initialize mission button
        this.missionButton = new MissionButton(sketch, eventBus);
    }

    closeWindow() {
        if (this.isWindowVisible) {
            this.missions.forEach(mission => {
                mission.viewed = true;
            });
        }
        this.currentPage = 'list';
        this.isWindowVisible = false;
        this.objectiveTextBox.setActive(false);
        this.objectiveTextBox.hideMobileInput();
    }

    updateButtonPosition() {
        if (!this.missionButton) return;
        this.missionButton.updatePosition();
    }

    // Change this to not render if we're not at a planet
    renderMissionButton() {
        // Don't render the button if we're not in a system scene
        if (!this.isInSystemScene || !this.orbitingBody || !this.orbitingBody.isPlanet) return;
        
        // Render the mission button
        this.missionButton.render();
        
        // Check if there are any unviewed missions for this body
        if (this.orbitingBody.missions && this.orbitingBody.missions.some(mission => !mission.viewed)) {
            // Draw exclamation point indicator
            this.sketch.noStroke();
            this.sketch.fill(255, 165, 0); // Orange color for the mission indicator
            this.sketch.textSize(16);
            this.sketch.textAlign(this.sketch.LEFT, this.sketch.TOP);
            
            // Position the exclamation point to the right of the mission button
            const buttonX = this.missionButton.x;
            const buttonY = this.missionButton.y;
            this.sketch.text('!', buttonX + this.missionButton.width + 5, buttonY - 5);
        }
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

        // Initialize graphics buffer if needed
        const contentWidth = width - 40; // Account for margins
        const contentHeight = height - this.contentStartY - 20; // Leave some bottom padding
        this.addBuffer.initialize(contentWidth, contentHeight);
        
        // Set up the graphics context
        const buffer = this.addBuffer.getBuffer();
        buffer.fill(255);
        buffer.textAlign(this.sketch.LEFT, this.sketch.TOP);
        buffer.textSize(14);

        // Calculate total content height
        const totalContentHeight = 
            this.labelHeight + // Objective label
            this.textFieldHeight + // Objective field
            this.textFieldMargin + // Margin
            this.labelHeight + // Crew Member label
            this.textFieldHeight + // Crew Member field
            this.textFieldMargin + // Margin
            20 + // Padding before button
            this.createButtonHeight + // Button height
            20; // Padding after button

        // Set max scroll offset based on total content height
        this.addBuffer.setMaxScrollOffset(totalContentHeight);

        // Draw content with scroll offset
        let contentY = this.addBuffer.scrollOffset;

        // Draw Mission Objective field
        buffer.text('Mission Objective:', 0, contentY);
        contentY += this.labelHeight;
        
        // Draw objective text box
        buffer.push();
        buffer.translate(0, contentY);
        this.objectiveTextBox.render(0, 0, buffer);
        buffer.pop();

        contentY += this.textFieldHeight + this.textFieldMargin;

        // Draw Crew Assignment dropdown
        buffer.fill(255);
        buffer.noStroke();
        buffer.textAlign(this.sketch.LEFT, this.sketch.TOP);
        buffer.text('Assign To:', 0, contentY);
        contentY += this.labelHeight;

        // Draw crew dropdown base (without options)

        let dropdownY = contentY;
        buffer.push();
        buffer.translate(0, dropdownY);
        this.crewDropdown.renderBase(0, 0, buffer);
        buffer.pop();

        contentY += this.textFieldHeight + this.textFieldMargin;

        // Create and render Create Mission button
        const buttonX = (contentWidth - this.createButtonWidth) / 2;
        const buttonY = contentY + 20;
        
        this.createMissionButton = new TextButton(
            buffer,
            buttonX,
            buttonY,
            this.createButtonWidth,
            this.createButtonHeight,
            this.isGeneratingMission ? 'Generating...' : 'Create Mission',
            () => this.handleCreateMission()
        );

        // Render the Create Mission button
        this.createMissionButton.render();


        // Render dropdown options on top if open
        if (this.crewDropdown.isOpen) {
            buffer.push();
            buffer.translate(0, dropdownY);
            this.crewDropdown.renderOptions(0, 0, buffer);
            buffer.pop();
        }

        // Render the graphics buffer
        this.addBuffer.render(x + 20, y + this.contentStartY);

    }

    handleMouseReleased(camera, mouseX, mouseY) {
        // Don't handle clicks if we're not in a system scene
        if (!this.isInSystemScene || !this.orbitingBody || !this.orbitingBody.isPlanet) return false;

        // Check mission button first (always visible)
        if (this.missionButton.handleClick(mouseX, mouseY)) {
            return true;
        }

        // If window is visible, check window interactions
        if (super.handleMouseReleased(camera, mouseX, mouseY)) {
            const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
            let x = (this.sketch.width - windowWidth) / 2;
            let y = (this.sketch.height - windowHeight) / 2;

            // Check close button
            if (this.isCloseButtonClicked(mouseX, mouseY)) {
                this.closeWindow();
                return true;
            }

            // Handle page-specific button clicks
            if (this.currentPage === 'list') {
                if (this.isAddButtonClicked(mouseX, mouseY)) {
                    if (this.hasMissionInProgress()) {
                        this.showTemporaryTooltip("A mission is already in progress on this planet");
                        return true;
                    }
                    this.currentPage = 'add';
                    this.addBuffer.resetScroll();
                    return true;
                }

                // Check if click is within the content area for mission list
                const contentX = x + 20;
                const contentY = y + this.contentStartY;
                const contentWidth = windowWidth - 40;
                const contentHeight = windowHeight - this.contentStartY - 20;

                if (mouseX >= contentX && mouseX <= contentX + contentWidth &&
                    mouseY >= contentY && mouseY <= contentY + contentHeight) {
                    
                    // Calculate mission positions including scroll offset
                    const missionHeight = 90; // Height of each mission box
                    const mouseYRelativeToContent = mouseY - contentY;
                    const mouseYWithScroll = mouseYRelativeToContent + this.listBuffer.scrollOffset;
                    
                    // Skip the title area
                    if (mouseYWithScroll < 30) return true;
                    
                    // Calculate which mission was clicked
                    const missionIndex = Math.floor((mouseYWithScroll - 30) / missionHeight);
                    
                    // Check if a valid mission was clicked
                    if (missionIndex >= 0 && missionIndex < this.missions.length) {
                        // Get the mission in reverse order (newest first)
                        const clickedMission = this.missions[this.missions.length - 1 - missionIndex];
                        
                        // Open the mission info UI
                        this.closeWindow();
                        this.eventBus.emit('missionInfoUIOpened', clickedMission);
                        return true;
                    }
                }
            } else {
                if (this.isBackButtonClicked(mouseX, mouseY)) {
                    this.currentPage = 'list';
                    this.listBuffer.resetScroll();
                    this.objectiveTextBox.setActive(false);
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
                    const objectiveFieldY = contentY + this.addBuffer.scrollOffset + this.labelHeight;
                    const dropdownY = objectiveFieldY + this.textFieldHeight + this.textFieldMargin + this.labelHeight;

                    // Check if click is on objective text box
                    if (mouseY >= objectiveFieldY && mouseY <= objectiveFieldY + this.textFieldHeight) {
                        this.objectiveTextBox.handleClick(mouseX - contentX, mouseY - objectiveFieldY);
                        return true;
                    }

                    // Check if click is on crew dropdown
                    if (mouseY >= dropdownY && mouseY <= dropdownY + this.textFieldHeight + 
                        (this.crewDropdown.isOpen ? this.crewMembers.length * this.textFieldHeight : 0)) {
                        this.crewDropdown.handleClick(mouseX - contentX, mouseY - dropdownY);
                        return true;
                    }

                    // Check if click is on Create Mission button
                    if (this.createMissionButton && this.createMissionButton.handleClick(mouseX - contentX, mouseY - contentY)) {
                        return true;
                    }
                    
                    return true;
                }
            }

            return true;
        }

        return false;
    }

    handleMousePressed(camera, mouseX, mouseY) {
        if (!this.isInSystemScene) return false;
        return super.handleMousePressed(camera, mouseX, mouseY);
    }

    handleMouseWheel(event) {
        if (!this.isInSystemScene) return false;
        if (super.handleMouseWheel(event)) {
            // Handle scrolling based on current page
            if (this.currentPage === 'list') {
                return this.listBuffer.handleMouseWheel(event);
            } else {
                return this.addBuffer.handleMouseWheel(event);
            }
        }
        return false;
    }

    handleTouchStart(camera, touchX, touchY) {
        if (!this.isInSystemScene) return false;

        // Check mission button first (always visible)
        if (this.missionButton.handleClick(touchX, touchY)) {
            return true;
        }

        // If window is visible, check window interactions
        if (super.handleTouchStart(camera, touchX, touchY)) {
            const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
            let x = (this.sketch.width - windowWidth) / 2;
            let y = (this.sketch.height - windowHeight) / 2;

            // Check close button
            if (this.isCloseButtonClicked(touchX, touchY)) {
                this.closeWindow();
                return true;
            }

            // Handle page-specific button clicks
            if (this.currentPage === 'list') {
                if (this.isAddButtonClicked(touchX, touchY)) {
                    if (this.hasMissionInProgress()) {
                        this.showTemporaryTooltip("A mission is already in progress on this planet");
                        return true;
                    }
                    this.currentPage = 'add';
                    this.addBuffer.resetScroll();
                    return true;
                }
            } else {
                if (this.isBackButtonClicked(touchX, touchY)) {
                    this.currentPage = 'list';
                    this.listBuffer.resetScroll();
                    this.objectiveTextBox.setActive(false);
                    return true;
                }

                // Check if touch is within the content area
                const contentX = x + 20;
                const contentY = y + this.contentStartY;
                const contentWidth = windowWidth - 40;
                const contentHeight = windowHeight - this.contentStartY - 20;

                if (touchX >= contentX && touchX <= contentX + contentWidth &&
                    touchY >= contentY && touchY <= contentY + contentHeight) {
                    
                    // Calculate field positions including scroll offset
                    const objectiveFieldY = contentY + this.addBuffer.scrollOffset + this.labelHeight;
                    const dropdownY = objectiveFieldY + this.textFieldHeight + this.textFieldMargin + this.labelHeight;

                    // Check if touch is on objective text box
                    if (touchY >= objectiveFieldY && touchY <= objectiveFieldY + this.textFieldHeight) {
                        this.objectiveTextBox.handleClick(touchX - contentX, touchY - objectiveFieldY);
                        return true;
                    }

                    // Check if touch is on crew dropdown
                    if (touchY >= dropdownY && touchY <= dropdownY + this.textFieldHeight + 
                        (this.crewDropdown.isOpen ? this.crewMembers.length * this.textFieldHeight : 0)) {
                        // Don't toggle dropdown here, wait for touch end
                        return true;
                    }

                    // Check if touch is on Create Mission button
                    if (this.createMissionButton && this.createMissionButton.handleClick(touchX - contentX, touchY - contentY)) {
                        return true;
                    }
                }
            }

            // Handle scrolling if touch is in content area
            if (this.currentPage === 'list') {
                return this.listBuffer.handleTouchStart(touchX, touchY);
            } else {
                return this.addBuffer.handleTouchStart(touchX, touchY);
            }
        }

        return false;
    }

    handleTouchMove(camera, touchX, touchY) {
        if (!this.isInSystemScene) return false;
        if (super.handleTouchMove(camera, touchX, touchY)) {
            // Handle scrolling based on current page
            if (this.currentPage === 'list') {
                return this.listBuffer.handleTouchMove(touchX, touchY);
            } else {
                return this.addBuffer.handleTouchMove(touchX, touchY);
            }
        }
        return false;
    }

    handleTouchEnd(camera, touchX, touchY) {
        if (!this.isInSystemScene) return false;

        // Check mission button first (always visible)
        if (this.missionButton.handleClick(touchX, touchY)) {
            return true;
        }

        // If window is visible, check window interactions
        if (super.handleTouchEnd(camera, touchX, touchY)) {
            const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
            let x = (this.sketch.width - windowWidth) / 2;
            let y = (this.sketch.height - windowHeight) / 2;

            // Check if touch ended within the content area
            const contentX = x + 20;
            const contentY = y + this.contentStartY;
            const contentWidth = windowWidth - 40;
            const contentHeight = windowHeight - this.contentStartY - 20;

            if (touchX >= contentX && touchX <= contentX + contentWidth &&
                touchY >= contentY && touchY <= contentY + contentHeight) {
                
                // Calculate field positions including scroll offset
                const objectiveFieldY = contentY + this.addBuffer.scrollOffset + this.labelHeight;
                const dropdownY = objectiveFieldY + this.textFieldHeight + this.textFieldMargin + this.labelHeight;

                // Check if touch ended on objective text box
                if (touchY >= objectiveFieldY && touchY <= objectiveFieldY + this.textFieldHeight) {
                    this.objectiveTextBox.handleTouchEnd(touchX - contentX, touchY - objectiveFieldY);
                    return true;
                }
                else {
                    this.objectiveTextBox.setActive(false);
                    this.objectiveTextBox.hideMobileInput();
                }

                // Check if touch ended on crew dropdown
                if (touchY >= dropdownY && touchY <= dropdownY + this.textFieldHeight + 
                    (this.crewDropdown.isOpen ? this.crewMembers.length * this.textFieldHeight : 0)) {
                    this.crewDropdown.handleTouchEnd(touchX - contentX, touchY - dropdownY);
                    return true;
                }

                // Check if touch ended on Create Mission button
                if (this.createMissionButton && this.createMissionButton.handleClick(touchX - contentX, touchY - contentY)) {
                    return true;
                }
            }

            // Handle scrolling based on current page
            if (this.currentPage === 'list') {
                return this.listBuffer.handleTouchEnd();
            } else {
                return this.addBuffer.handleTouchEnd();
            }
        }

        return false;
    }

    handleKeyDown(event) {
        if (!this.isWindowVisible || this.currentPage !== 'add') {
            return false;
        }

        return this.objectiveTextBox.handleKeyDown(event);
    }

    handleKeyPress(event) {
        if (!this.isWindowVisible || this.currentPage !== 'add') {
            return false;
        }

        return this.objectiveTextBox.handleKeyPress(event);
    }

    async handleCreateMission() {
        const objective = this.objectiveTextBox.getText().trim();
        
        if (objective === '' || this.crewDropdown.selectedIndex < 0) {
            return;
        }

        // Create new mission
        const mission = new Mission(
            objective,
            this.crewDropdown.selectedIndex >= 0 ? this.crewMembers[this.crewDropdown.selectedIndex] : null
        );
        
        // Store the orbiting body and event bus
        mission.orbitingBody = this.orbitingBody;
        mission.eventBus = this.eventBus;
        
        // Add mission to list immediately
        this.missions.push(mission);

        // Emit mission created event
        this.eventBus.emit('missionCreated', mission);

        // Clear input fields and return to list
        this.objectiveTextBox.setText('');
        this.crewDropdown.setSelectedIndex(-1);
        this.currentPage = 'list';
        this.objectiveTextBox.setActive(false);

        // Generate steps in the background if text generator is available
        if (this.textGenerator) {
            try {
                await mission.preapprovalGeneration(this.textGenerator, this.currentScene, this.orbitingBody);
            } catch (error) {
                console.error('Failed to generate mission preapproval:', error);
            }
        }
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

        // Render temporary tooltip if active
        this.renderTemporaryTooltip();
    }

    renderMissionListPage(x, y, width, height) {
        // Draw add button in top left
        let addX = x + this.addButtonMargin;
        let addY = y + this.addButtonMargin;
        this.sketch.stroke(150);
        this.sketch.line(addX, addY + this.addButtonSize/2, addX + this.addButtonSize, addY + this.addButtonSize/2);
        this.sketch.line(addX + this.addButtonSize/2, addY, addX + this.addButtonSize/2, addY + this.addButtonSize);

        // Initialize graphics buffer if needed
        const contentWidth = width - 40; // Account for margins
        const contentHeight = height - this.contentStartY - 20; // Leave some bottom padding
        this.listBuffer.initialize(contentWidth, contentHeight);
        
        // Set up the graphics context
        const buffer = this.listBuffer.getBuffer();
        buffer.fill(255);
        buffer.textAlign(this.sketch.LEFT, this.sketch.TOP);
        buffer.textSize(14);

        // Calculate total content height
        const missionHeight = 90; // Height of each mission box
        const totalContentHeight = (this.missions.length * missionHeight) + 30; // Add some padding

        // Set max scroll offset based on total content height
        this.listBuffer.setMaxScrollOffset(totalContentHeight);

        // Draw mission list title
        buffer.text('Mission List:', 0, this.listBuffer.scrollOffset);
        
        // Draw each mission with scroll offset
        let contentY = this.listBuffer.scrollOffset + 30;

        // Create a reversed copy of missions array to show newest first
        const reversedMissions = [...this.missions].reverse();

        // Check for hover state
        const mouseX = this.sketch.mouseX - (x + 20); // Adjust for window position and margin
        const mouseY = this.sketch.mouseY - (y + this.contentStartY); // Adjust for window position and content start

        reversedMissions.forEach((mission, index) => {
            // Check if mouse is hovering over this mission box
            const isHovered = mouseX >= 0 && mouseX <= contentWidth &&
                            mouseY >= contentY && mouseY <= contentY + 80;

            // Draw mission box with hover effect
            buffer.fill(isHovered ? 70 : 60); // Slightly lighter when hovered
            buffer.stroke(isHovered ? 120 : 100); // Brighter border when hovered
            buffer.strokeWeight(1);
            buffer.rect(0, contentY, contentWidth, 80, 3);

            // Draw mission content
            buffer.fill(255);
            buffer.noStroke();
            buffer.textAlign(this.sketch.LEFT, this.sketch.TOP);
            
            // Draw objective with wrapping
            buffer.textSize(16);
            const maxObjectiveWidth = contentWidth - 120; // Leave space for status
            const wrappedObjective = wrapText(buffer, mission.objective, maxObjectiveWidth);
            buffer.text(wrappedObjective, 10, contentY + 10);

            // Draw completion status
            buffer.textAlign(this.sketch.RIGHT, this.sketch.TOP);
            buffer.fill(mission.completed ? 
                       (mission.cancelled ? '#808080' : // Grey for cancelled
                        mission.outcome ? '#4CAF50' : '#FFA500') : // Green for success, Orange for failure
                       (mission.requirements && Object.keys(mission.requirements).length > 0 && !mission.approved ? '#2196F3' : // Blue for pending approval
                        '#FFA500')); // Orange for in progress
            buffer.text(mission.completed ? 
                       (mission.cancelled ? 'Cancelled' :
                        mission.outcome ? `Completed (Reputation: +${mission.quality})` : 'Failure') : 
                       (mission.requirements && Object.keys(mission.requirements).length > 0 && !mission.approved ? 'Pending Approval' :
                        mission.steps.length === 0 ? 'Preparing...' : `Step ${mission.currentStep + 1}/${mission.steps.length}`), 
                       contentWidth - 10, contentY + 10);

            // Draw assigned crew member
            if (mission.assignedCrew) {
                buffer.textAlign(this.sketch.RIGHT, this.sketch.TOP);
                buffer.fill(150);
                buffer.text(`Assigned to: ${mission.assignedCrew.name}`, contentWidth - 10, contentY + 30);
            }

            // Draw location
            if (mission.orbitingBody) {
                buffer.textAlign(this.sketch.RIGHT, this.sketch.TOP);
                buffer.fill(150);
                buffer.text(`Location: ${mission.orbitingBody.name}`, contentWidth - 10, contentY + 45);
            }

            // Draw step graph
            if (mission.steps && mission.steps.length > 0) {
                const graphStartX = 10;
                const graphY = contentY + 60;
                const nodeSpacing = Math.min(30, (contentWidth - 20) / mission.steps.length);
                const baseNodeRadius = 4;

                // Calculate visible steps (completed and current)
                const visibleSteps = mission.steps.filter((_, index) => index <= mission.currentStep);
                const nodeSpacingVisible = Math.min(30, (contentWidth - 20) / visibleSteps.length);

                visibleSteps.forEach((step, stepIndex) => {
                    const nodeX = graphStartX + (stepIndex * nodeSpacingVisible);
                    const nodeRadius = baseNodeRadius * mission.getStepScale(stepIndex);

                    // Draw connecting line to next node
                    if (stepIndex < visibleSteps.length - 1) {
                        buffer.stroke(100);
                        buffer.strokeWeight(1);
                        buffer.line(nodeX + nodeRadius, graphY, 
                                   nodeX + nodeSpacingVisible - nodeRadius, graphY);
                    }

                    // Draw node
                    buffer.noStroke();
                    buffer.fill(mission.getStepColor(stepIndex));
                    buffer.circle(nodeX, graphY, nodeRadius * 2);

                    // Store node position for tooltip handling
                    const absoluteX = x + 20 + nodeX;
                    const absoluteY = y + this.contentStartY + graphY;
                    this.checkStepNodeHover(absoluteX, absoluteY, nodeRadius, step);
                });
            }

            contentY += missionHeight;
        });

        // Render the graphics buffer
        this.listBuffer.render(x + 20, y + this.contentStartY);

        // Draw step tooltip if hovering
        this.renderStepTooltip();
    }

    checkStepNodeHover(nodeX, nodeY, nodeRadius, stepText) {
        const mouseX = this.sketch.mouseX;
        const mouseY = this.sketch.mouseY;
        const dist = this.sketch.dist(mouseX, mouseY, nodeX, nodeY);
        
        // Only show tooltip for completed or current steps
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
        const wrappedText = wrapText(pg, this.hoveredStep.text, maxTooltipWidth - (padding * 2));
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

    hasMissionInProgress() {
        if (this.missions.length === 0) return false;
        const lastMission = this.missions[this.missions.length - 1];
        return !lastMission.completed;
    }

    showTemporaryTooltip(text) {
        this.tooltipText = text;
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
        }
        this.tooltipTimeout = setTimeout(() => {
            this.tooltipText = null;
        }, this.tooltipDuration);
    }

    renderTemporaryTooltip() {
        if (!this.tooltipText) return;

        this.sketch.push();
        
        // Draw tooltip background
        this.sketch.fill(0, 0, 0, 200);
        this.sketch.noStroke();
        
        // Calculate text dimensions
        this.sketch.textSize(14);
        const padding = 10;
        const tooltipWidth = this.sketch.textWidth(this.tooltipText) + (padding * 2);
        const tooltipHeight = 30;
        
        // Position tooltip near the add button
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;
        let addX = x + this.addButtonMargin;
        let addY = y + this.addButtonMargin;
        
        const tooltipX = addX + this.addButtonSize + 10;
        const tooltipY = addY - 5;
        
        // Draw tooltip background with rounded corners
        this.sketch.rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5);
        
        // Draw tooltip text
        this.sketch.fill(255);
        this.sketch.textAlign(this.sketch.LEFT, this.sketch.CENTER);
        this.sketch.text(this.tooltipText, tooltipX + padding, tooltipY + tooltipHeight/2);
        
        this.sketch.pop();
    }

} 