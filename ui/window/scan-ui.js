import { BaseWindowUI } from './base-window-ui.js';
import { TextButton } from './text-button.js';

export class ScanUI extends BaseWindowUI {
    constructor(sketch, eventBus, initialScene) {
        super(sketch, eventBus, initialScene);
        this.currentScene = initialScene;
        this.isInGalaxyMap = true; // Track if we're in galaxy map
        
        // Scan button properties
        this.buttonWidth = 80;
        this.buttonHeight = 40;
        this.buttonMargin = 20;
        
        // Main UI window properties
        this.isWindowVisible = false;
        this.windowMargin = 50;

        // Frequency Slider properties
        this.sliderX = 0;
        this.sliderY = 0;
        this.sliderWidth = 20;
        this.sliderHeight = 20;
        this.velocity = 0;
        this.gravity = 0.5;
        this.thrust = 1.0;
        this.isPressed = false;

        // Signal visualization properties
        this.signalHeight = 60; // Height of the signal area
        this.signalY = 0; // Will be set in render
        this.time = 0; // For animation
        this.signalWaves = []; // Will be populated when window opens
        
        // Subscribe to UI visibility events
        this.eventBus.on('scanUIOpened', () => {
            this.isWindowVisible = true;
            this.generateRandomWaves();
        });
        this.eventBus.on('scanUIClosed', () => {
            this.isWindowVisible = false;
        });
        this.eventBus.on('shipUIOpened', () => {
            this.isWindowVisible = false;
        });
        this.eventBus.on('missionUIOpened', () => {
            this.isWindowVisible = false;
        });
        this.eventBus.on('settingsUIOpened', () => {
            this.isWindowVisible = false;
        });

        // Subscribe to scene changes
        this.eventBus.on('sceneChanged', (scene) => {
            this.currentScene = scene;
            // Close the window when changing scenes
            this.isWindowVisible = false;
        });

        // Subscribe to system enter/exit events
        this.eventBus.on('enterSystem', () => {
            this.isInGalaxyMap = false;
            // Close the window when entering system
            this.isWindowVisible = false;
        });

        this.eventBus.on('returnToGalaxy', () => {
            this.isInGalaxyMap = true;
        });

        // Set up buttons
        this.setupButton();
    }

    setupButton() {
        // Create scan button
        this.scanButton = new TextButton(
            this.sketch,
            this.buttonMargin + this.buttonWidth + this.buttonMargin, // Position after Ship button
            this.sketch.height - this.buttonHeight - this.buttonMargin,
            this.buttonWidth,
            this.buttonHeight,
            'Scan',
            () => {
                this.eventBus.emit('closeAllInfoUIs');
                if (!this.isWindowVisible) {
                    this.eventBus.emit('scanUIOpened');
                } else {
                    this.eventBus.emit('scanUIClosed');
                }
            }
        );

        // Initial button position update
        this.updateButtonPosition();
    }

    updateButtonPosition() {
        if (!this.scanButton) return;
        
        const y = this.sketch.height - this.buttonHeight - this.buttonMargin;
        this.scanButton.updatePosition(
            this.buttonMargin + this.buttonWidth + this.buttonMargin,
            y
        );
    }

    render(camera) {
        // Only render the scan button if we're in galaxy map
        if (this.isInGalaxyMap) {
            this.renderScanButton();
        }

        // Render the main window if visible
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    renderButton(camera) {
        if (this.isInGalaxyMap) {
            this.renderScanButton();
        }
    }

    renderWindow(camera) {
        if (this.isWindowVisible) {
            this.renderMainWindow();
        }
    }

    renderScanButton() {
        this.scanButton.render();
    }

    handleMousePressed(camera, mouseX, mouseY) {
        if (!this.isWindowVisible) return false;

        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;

        // Check if click is within the window bounds
        if (mouseX >= x && mouseX <= x + windowWidth &&
            mouseY >= y && mouseY <= y + windowHeight) {
            this.isPressed = true;
            return true;
        }

        return false;
    }

    handleTouchStart(camera, touchX, touchY) {
        if (!this.isWindowVisible) return false;

        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;

        // Check if touch is within the window bounds
        if (touchX >= x && touchX <= x + windowWidth &&
            touchY >= y && touchY <= y + windowHeight) {
            this.isPressed = true;
            return true;
        }

        return false;
    }

    handleMouseReleased(camera, mouseX, mouseY) {
        // Don't handle clicks if we're not in galaxy map
        if (!this.isInGalaxyMap) return false;

        // Check scan button first (always visible)
        if (this.scanButton.handleClick(mouseX, mouseY)) {
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
                this.eventBus.emit('scanUIClosed');
                return true;
            }

            // Check if click is within the window bounds
            if (mouseX >= x && mouseX <= x + windowWidth &&
                mouseY >= y && mouseY <= y + windowHeight) {
                this.isPressed = false;
                return true;
            }
        }

        return false;
    }

    handleTouchEnd(camera, touchX, touchY) {
        // Don't handle touches if we're not in galaxy map
        if (!this.isInGalaxyMap) return false;

        // Check scan button first (always visible)
        if (this.scanButton.handleClick(touchX, touchY)) {
            return true;
        }

        // If window is visible, check window interactions
        if (this.isWindowVisible) {
            const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
            let x = (this.sketch.width - windowWidth) / 2;
            let y = (this.sketch.height - windowHeight) / 2;

            // Check close button
            if (this.isCloseButtonClicked(touchX, touchY)) {
                this.isWindowVisible = false;
                this.eventBus.emit('scanUIClosed');
                return true;
            }

            // Check if touch is within the window bounds
            if (touchX >= x && touchX <= x + windowWidth &&
                touchY >= y && touchY <= y + windowHeight) {
                this.isPressed = false;
                return true;
            }
        }

        return false;
    }

    updatePhysics() {
        // Apply gravity
        this.velocity -= this.gravity;
        
        // Apply thrust if pressed
        if (this.isPressed) {
            this.velocity += this.thrust;
        }
        
        // Update position
        this.sliderX += this.velocity;
        
        // Handle collisions with slider boundaries
        if (this.sliderX <= 0) {
            this.sliderX = 0;
            this.velocity = 0;
        } else if (this.sliderX >= this.barWidth - this.sliderWidth) {
            this.sliderX = this.barWidth - this.sliderWidth;
            this.velocity = 0;
        }
    }

    renderMainWindow() {
        super.renderMainWindow();
        
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;

        // Draw the Frequency Slider
        this.barWidth = windowWidth - 100; // Leave some margin
        const barY = y + windowHeight - 100; // Position near bottom of window
        
        // Draw the bar
        this.sketch.fill(60);
        this.sketch.stroke(100);
        this.sketch.strokeWeight(1);
        this.sketch.rect(x + 50, barY, this.barWidth, 10);
        
        // Update and draw the slider
        this.updatePhysics();
        this.sliderY = barY - 5; // Center vertically in the bar
        this.sketch.fill(255);
        this.sketch.noStroke();
        this.sketch.rect(x + 50 + this.sliderX, this.sliderY, this.sliderWidth, this.sliderHeight);

        // Draw the signal visualization
        this.signalY = barY - 80; // Position above the slider
        this.drawSignal(x + 50, this.signalY, this.barWidth);
        
        // Update time for animation
        this.time += 0.02;
    }

    drawSignal(x, y, width) {
        // Draw background for signal area
        this.sketch.fill(20);
        this.sketch.noStroke();
        this.sketch.rect(x, y, width, this.signalHeight);

        // Draw the signal line
        this.sketch.stroke(0, 255, 0); // Green color
        this.sketch.strokeWeight(2);
        this.sketch.noFill();
        this.sketch.beginShape();
        
        // Calculate points for the signal
        for (let i = 0; i <= width; i++) {
            let sum = 0;
            // Sum all the sine waves
            for (const wave of this.signalWaves) {
                sum += Math.sin(i * wave.freq + this.time + wave.phase) * wave.amp;
            }
            // Add a baseline offset
            sum += this.signalHeight / 2;
            this.sketch.vertex(x + i, y + sum);
        }
        
        this.sketch.endShape();
    }

    generateRandomWaves() {
        this.signalWaves = [];
        const numWaves = 5 + Math.floor(Math.random() * 3); // 5-7 waves
        
        // Generate one wave with higher amplitude for the main signal
        this.signalWaves.push({
            freq: 0.05 + Math.random() * 0.01, // 0.1-0.15
            amp: 20 + Math.random() * 10, // 20-30
            phase: Math.random() * Math.PI * 2
        });
        
        // Generate the rest of the waves
        for (let i = 0; i < numWaves - 1; i++) {
            this.signalWaves.push({
                freq: 0.02 + Math.random() * 0.08, // 0.02-0.1
                amp: 5 + Math.random() * 15, // 5-20
                phase: Math.random() * Math.PI * 2
            });
        }
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