import { BaseWindowUI } from '../base-window-ui.js';
import { ShipButton } from './ship-button.js';
import { ShipPage } from './ship-page.js';
import { CrewPage } from './crew-page.js';

export class ShipUI extends BaseWindowUI {
    constructor(sketch, eventBus, initialScene, crewMembers) {
        super(sketch, eventBus, initialScene);
        this.crewMembers = crewMembers;
        
        // Main UI window properties
        this.isWindowVisible = false;
        this.windowMargin = 50;
        
        // Tab properties
        this.currentTab = 'Ship';
        this.tabs = ['Ship', 'Crew'];
        this.tabHeight = 40;

        // Initialize components
        this.shipButton = new ShipButton(sketch, eventBus);
        this.shipPage = new ShipPage(sketch, eventBus);
        this.crewPage = new CrewPage(sketch, eventBus, crewMembers);

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
    }

    updateButtonPosition() {
        if (!this.shipButton) return;
        this.shipButton.updatePosition();
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
        if (this.currentTab === 'Ship') {
            this.shipPage.render(x, y + this.tabHeight, windowWidth, windowHeight - this.tabHeight);
        } else if (this.currentTab === 'Crew') {
            this.crewPage.render(x, y + this.tabHeight, windowWidth, windowHeight - this.tabHeight);
        }
    }

    handleMouseReleased(camera, mouseX, mouseY) {
        // Check ship button first (always visible)
        if (this.shipButton.handleClick(mouseX, mouseY)) {
            return true;
        }

        // If window is visible, check window interactions
        if (super.handleMouseReleased(camera, mouseX, mouseY)) {
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
                    if (this.currentTab === 'Ship') {
                        this.shipPage.scrollOffset = 0;
                    } else if (this.currentTab === 'Crew') {
                        this.crewPage.scrollOffset = 0;
                    }
                }
            });

            return true;
        }

        return false;
    }

    handleMousePressed(camera, mouseX, mouseY) {
        return super.handleMousePressed(camera, mouseX, mouseY);
    }

    handleMouseWheel(event) {
        if (super.handleMouseWheel(event)) {
            if (this.currentTab === 'Ship') {
                return this.shipPage.handleMouseWheel(event);
            } else if (this.currentTab === 'Crew') {
                return this.crewPage.handleMouseWheel(event);
            }
        }
        return false;
    }

    handleTouchStart(camera, touchX, touchY) {
        if (super.handleTouchStart(camera, touchX, touchY)) {
            if (this.currentTab === 'Ship') {
                this.shipPage.handleTouchStart(touchX, touchY);
            } else if (this.currentTab === 'Crew') {
                this.crewPage.handleTouchStart(touchX, touchY);
            }
        }
        return false;
    }

    handleTouchMove(camera, touchX, touchY) {
        if (super.handleTouchMove(camera, touchX, touchY)) {
            if (this.currentTab === 'Ship') {
                this.shipPage.handleTouchMove(touchX, touchY);
            } else if (this.currentTab === 'Crew') {
                this.crewPage.handleTouchMove(touchX, touchY);
            }
            return true;
        }
        return false;
    }

    handleTouchEnd(camera, touchX, touchY) {
        if (super.handleTouchEnd(camera, touchX, touchY)) {
            if (this.currentTab === 'Ship') {
                this.shipPage.handleTouchEnd();
            } else if (this.currentTab === 'Crew') {
                this.crewPage.handleTouchEnd();
            }
        }
        return false;
    }
} 