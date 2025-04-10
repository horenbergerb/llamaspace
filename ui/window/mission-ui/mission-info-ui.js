import { BaseWindowUI } from '../base-window-ui.js';
import { Mission } from '../../../game-state/mission.js';
import { ScrollableGraphicsBuffer } from '../components/scrollable-graphics-buffer.js';
import { wrapText } from '../../../utils/text-utils.js';

export class MissionInfoUI extends BaseWindowUI {
    constructor(sketch, eventBus, initialScene, mission) {
        super(sketch, eventBus, initialScene);
        this.mission = mission;
        
        // Main UI window properties
        this.isWindowVisible = false;
        this.windowMargin = 50;

        // Back arrow properties
        this.backArrowSize = 24;
        this.backArrowMargin = 10;

        // Content start Y position
        this.contentStartY = 60; // Start below top buttons

        // Create graphics buffer for content
        this.contentBuffer = new ScrollableGraphicsBuffer(sketch);

        // Constants for layout
        this.lineHeight = 18;
        this.sectionSpacing = 20;

        // Tooltip properties
        this.tooltipText = null;
        this.tooltipTimeout = null;
        this.tooltipDuration = 2000; // Duration in milliseconds

        // Subscribe to UI visibility events
        this.eventBus.on('missionInfoUIOpened', (mission) => {
            this.mission = mission;
            this.isWindowVisible = true;
            this.contentBuffer.resetScroll();
        });
        
        this.eventBus.on('shipUIOpened', () => {
            this.closeWindow();
        });
        
        this.eventBus.on('settingsUIOpened', () => {
            this.closeWindow();
        });

        // Subscribe to scene changes
        this.eventBus.on('sceneChanged', (scene) => {
            this.closeWindow();
        });
    }

    closeWindow() {
        this.isWindowVisible = false;
    }

    handleMouseReleased(camera, mouseX, mouseY) {
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

            // Check back button
            if (this.isBackButtonClicked(mouseX, mouseY)) {
                this.closeWindow();
                this.eventBus.emit('missionUIOpened');
                return true;
            }

            // Check if click is within the content area
            const contentX = x + 20;
            const contentY = y + this.contentStartY;
            const contentWidth = windowWidth - 40;
            const contentHeight = windowHeight - this.contentStartY - 20;

            if (mouseX >= contentX && mouseX <= contentX + contentWidth &&
                mouseY >= contentY && mouseY <= contentY + contentHeight) {
                
                // Check approve/deny buttons if mission is not approved and not cancelled
                if (!this.mission.approved && this.mission.requirements && !this.mission.cancelled) {
                    const buttonWidth = 80;
                    const buttonHeight = 30;
                    const buttonSpacing = 10;
                    
                    // Calculate button positions relative to window
                    const requirementsHeight = this.lineHeight + // Title
                        (Object.entries(this.mission.requirements).length * this.lineHeight); // Requirements
                    const buttonY = contentY + requirementsHeight - this.contentBuffer.scrollOffset;
                    
                    // Approve button
                    if (mouseX >= contentX + 10 && mouseX <= contentX + 10 + buttonWidth &&
                        mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
                        this.mission.approve().then(approved => {
                            if (!approved) {
                                this.showTemporaryTooltip("You do not have the required resources");
                            }
                        }).catch(error => {
                            console.error('Error approving mission:', error);
                        });
                        return true;
                    }
                    
                    // Deny button
                    if (mouseX >= contentX + 10 + buttonWidth + buttonSpacing && 
                        mouseX <= contentX + 10 + buttonWidth + buttonSpacing + buttonWidth &&
                        mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
                        this.mission.cancel();
                        return true;
                    }
                }
                
                // Handle scrolling
                return this.contentBuffer.handleMouseWheel({
                    deltaY: 0,
                    preventDefault: () => {}
                });
            }

            return true;
        }

        return false;
    }

    handleMouseWheel(event) {
        if (!this.isWindowVisible) return false;
        
        if (super.handleMouseWheel(event)) {
            return this.contentBuffer.handleMouseWheel(event);
        }
        
        return false;
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

    render(camera) {
        // Render the main window if visible
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    renderButton(camera) {
        // MissionInfoUI doesn't have a button to render
        // This method is required by UIManager.renderButtons
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
        this.sketch.text('Mission Details:', x + 20, y + 20);

        // Initialize graphics buffer if needed
        const contentWidth = windowWidth - 40; // Account for margins
        const contentHeight = windowHeight - this.contentStartY - 20; // Leave some bottom padding
        this.contentBuffer.initialize(contentWidth, contentHeight);
        
        // Set up the graphics context
        const buffer = this.contentBuffer.getBuffer();
        buffer.fill(255);
        buffer.textAlign(this.sketch.LEFT, this.sketch.TOP);
        buffer.textSize(14);

        // Calculate total content height
        let totalContentHeight = 0;
        
        // Add height for requirements section if needed
        if (this.mission.requirements) {
            totalContentHeight += this.lineHeight; // Title
            totalContentHeight += Object.entries(this.mission.requirements).length * this.lineHeight; // Each requirement
            if (!this.mission.approved && !this.mission.cancelled) {
                totalContentHeight += this.lineHeight * 2; // Buttons
            }
            totalContentHeight += this.sectionSpacing;
        }
        
        // Mission objective section
        totalContentHeight += this.lineHeight; // Title
        totalContentHeight += this.calculateWrappedTextHeight(buffer, this.mission.objective, contentWidth - 20);
        totalContentHeight += this.sectionSpacing;
        
        // Mission status section
        totalContentHeight += this.lineHeight; // Title
        totalContentHeight += this.lineHeight; // Status
        if (this.mission.assignedCrew) totalContentHeight += this.lineHeight; // Crew
        if (this.mission.orbitingBody) totalContentHeight += this.lineHeight; // Location
        totalContentHeight += this.sectionSpacing;
        
        // Mission steps section
        totalContentHeight += this.lineHeight; // Title
        
        // Calculate height for each step
        const visibleSteps = this.mission.steps.filter((_, index) => index <= this.mission.currentStep);
        visibleSteps.forEach(step => {
            totalContentHeight += this.lineHeight; // Step number and status
            totalContentHeight += this.calculateWrappedTextHeight(buffer, step, contentWidth - 40);
            totalContentHeight += 5; // Small spacing between steps
        });
        
        // Add some padding at the bottom
        totalContentHeight += 10;

        // Set max scroll offset based on total content height
        this.contentBuffer.setMaxScrollOffset(totalContentHeight);

        // Draw content with scroll offset
        let contentY = this.contentBuffer.scrollOffset;

        // Draw requirements section if needed
        if (this.mission.requirements) {
            buffer.textSize(16);
            buffer.text('Requirements:', 0, contentY);
            contentY += this.lineHeight;
            
            buffer.textSize(14);
            Object.entries(this.mission.requirements).forEach(([item, amount]) => {
                buffer.text(`- ${item}: ${amount}`, 10, contentY);
                contentY += this.lineHeight;
            });
            
            // Draw approve/deny buttons only if mission is not approved and not cancelled
            if (!this.mission.approved && !this.mission.cancelled) {
                const buttonWidth = 80;
                const buttonHeight = 30;
                const buttonSpacing = 10;
                
                // Calculate button positions relative to window
                const requirementsHeight = this.lineHeight + // Title
                    (Object.entries(this.mission.requirements).length * this.lineHeight); // Requirements
                const buttonY = contentY + requirementsHeight - this.contentBuffer.scrollOffset;
                
                // Approve button
                buffer.fill(0, 150, 0);
                buffer.rect(10, contentY, buttonWidth, buttonHeight);
                buffer.fill(255);
                buffer.textAlign(this.sketch.CENTER, this.sketch.CENTER);
                buffer.text('Approve', 10 + buttonWidth/2, contentY + buttonHeight/2);
                
                // Deny button
                buffer.fill(150, 0, 0);
                buffer.rect(10 + buttonWidth + buttonSpacing, contentY, buttonWidth, buttonHeight);
                buffer.fill(255);
                buffer.text('Deny', 10 + buttonWidth + buttonSpacing + buttonWidth/2, contentY + buttonHeight/2);
                
                buffer.textAlign(this.sketch.LEFT, this.sketch.TOP);
                contentY += buttonHeight + this.sectionSpacing;
            } else {
                contentY += this.sectionSpacing;
            }
        }

        // Draw Mission Objective section
        buffer.fill(255);
        buffer.noStroke();
        buffer.textAlign(this.sketch.LEFT, this.sketch.TOP);
        buffer.textSize(16);
        buffer.text('Objective:', 0, contentY);
        contentY += this.lineHeight;
        
        buffer.textSize(14);
        const wrappedObjective = wrapText(buffer, this.mission.objective, contentWidth - 20);
        buffer.text(wrappedObjective, 10, contentY);
        contentY += this.calculateWrappedTextHeight(buffer, this.mission.objective, contentWidth - 20);
        contentY += this.sectionSpacing;

        // Draw Mission Status section
        buffer.textSize(16);
        buffer.text('Status:', 0, contentY);
        contentY += this.lineHeight;
        
        buffer.textSize(14);
        // Status
        buffer.fill(255);
        buffer.text(`Status: ${this.mission.completed ? 
                    (this.mission.cancelled ? 'Cancelled' : 
                     this.mission.outcome ? 'Completed Successfully' : 'Failed') : 
                    'In Progress'}`, 10, contentY);
        contentY += this.lineHeight;
        
        // Crew
        if (this.mission.assignedCrew) {
            buffer.text(`Assigned to: ${this.mission.assignedCrew.name}`, 10, contentY);
            contentY += this.lineHeight;
        }
        
        // Location
        if (this.mission.orbitingBody) {
            buffer.text(`Location: ${this.mission.orbitingBody.name}`, 10, contentY);
            contentY += this.lineHeight;
        }
        
        contentY += this.sectionSpacing;

        // Draw Mission Steps section
        buffer.textSize(16);
        buffer.text('Steps:', 0, contentY);
        contentY += this.lineHeight;
        
        buffer.textSize(14);
        
        // Draw each step
        visibleSteps.forEach((step, index) => {
            // Step number and status
            const stepStatus = index < this.mission.currentStep ? 'Completed' : 
                             index === this.mission.currentStep ? 'In Progress' : 'Pending';
            
            buffer.fill(255);
            buffer.text(`Step ${index + 1}: ${stepStatus}`, 10, contentY);
            contentY += this.lineHeight;
            
            // Step description
            const wrappedStep = wrapText(buffer, step, contentWidth - 40);
            buffer.text(wrappedStep, 20, contentY);
            contentY += this.calculateWrappedTextHeight(buffer, step, contentWidth - 40);
            contentY += 5; // Small spacing between steps
        });

        // Render the graphics buffer
        this.contentBuffer.render(x + 20, y + this.contentStartY);

        // Render temporary tooltip if active
        this.renderTemporaryTooltip();
    }
    
    calculateWrappedTextHeight(buffer, text, maxWidth) {
        const wrappedText = wrapText(buffer, text, maxWidth);
        const lines = wrappedText.split('\n');
        return lines.length * this.lineHeight; // 18 pixels per line
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
        if (!this.tooltipText) {
            return;
        }

        this.sketch.push();
        
        // Draw tooltip background
        this.sketch.fill(0, 0, 0, 200);
        this.sketch.noStroke();
        
        // Calculate text dimensions
        this.sketch.textSize(14);
        const padding = 10;
        const tooltipWidth = this.sketch.textWidth(this.tooltipText) + (padding * 2);
        const tooltipHeight = 30;
        
        // Position tooltip near the approve button
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;
        
        // Calculate approve button position
        const buttonWidth = 80;
        const buttonHeight = 30;
        const buttonSpacing = 10;
        
        // Calculate requirements section height
        const requirementsHeight = this.lineHeight + // Title
            (Object.entries(this.mission.requirements).length * this.lineHeight); // Requirements
        
        // Calculate button Y position relative to window, accounting for scroll
        const buttonY = y + this.contentStartY + requirementsHeight - this.contentBuffer.scrollOffset;
        
        // Position tooltip to the right of the approve button
        const tooltipX = x + 20 + 10 + buttonWidth + 10; // x + margin + button left margin + button width + spacing
        const tooltipY = buttonY - 5;
        
        // Draw tooltip background with rounded corners
        this.sketch.rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5);
        
        // Draw tooltip text
        this.sketch.fill(255);
        this.sketch.textAlign(this.sketch.LEFT, this.sketch.CENTER);
        this.sketch.text(this.tooltipText, tooltipX + padding, tooltipY + tooltipHeight/2);
        
        this.sketch.pop();
    }
} 