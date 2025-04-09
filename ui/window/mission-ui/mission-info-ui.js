import { BaseWindowUI } from '../base-window-ui.js';
import { Mission } from '../../../game-state/mission.js';

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

        // Subscribe to UI visibility events
        this.eventBus.on('missionInfoUIOpened', (mission) => {
            this.mission = mission;
            this.isWindowVisible = true;
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

            return true;
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
    }
} 