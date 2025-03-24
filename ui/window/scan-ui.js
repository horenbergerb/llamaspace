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
        this.baseGravity = 2000; // Base gravity value
        this.baseThrust = 4000; // Base thrust value
        this.isPressed = false;

        // Signal visualization properties
        this.signalHeight = 0; // Will be calculated based on window height
        this.signalY = 0; // Will be set in render
        this.time = 0; // For animation
        this.signalWaves = []; // Will be populated when window opens

        // Time tracking for frame-rate independence
        this.lastFrameTime = 0;
        
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

    updatePhysics(deltaTime) {
        // Calculate scaled physics values based on bar width
        // Reference width is 800px, so we scale relative to that
        const widthScale = this.barWidth / 800;
        const gravity = this.baseGravity * widthScale;
        const thrust = this.baseThrust * widthScale;
        
        // Apply gravity (scaled by deltaTime and width)
        this.velocity -= gravity * deltaTime;
        
        // Apply thrust if pressed (scaled by deltaTime and width)
        if (this.isPressed) {
            this.velocity += thrust * deltaTime;
        }
        
        // Update position (scaled by deltaTime)
        this.sliderX += this.velocity * deltaTime;
        
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

        this.sketch.push();
        
        const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
        let x = (this.sketch.width - windowWidth) / 2;
        let y = (this.sketch.height - windowHeight) / 2;

        // Calculate delta time
        const currentTime = this.sketch.millis() / 1000; // Convert to seconds
        const deltaTime = this.lastFrameTime === 0 ? 0 : currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Draw the Frequency Slider
        this.barWidth = windowWidth - 100; // Leave some margin
        const barY = y + windowHeight - 100; // Position near bottom of window
        
        // Draw the label
        this.sketch.fill(255);
        this.sketch.noStroke();
        this.sketch.textAlign(this.sketch.LEFT, this.sketch.CENTER);
        this.sketch.textSize(16);
        this.sketch.text('Frequency Slider:', x + 50, barY - 25);
        
        // Draw the bar
        this.sketch.fill(60);
        this.sketch.stroke(100);
        this.sketch.strokeWeight(1);
        this.sketch.rect(x + 50, barY, this.barWidth, 10);
        
        // Update and draw the slider with delta time
        this.updatePhysics(deltaTime);
        this.sliderY = barY - 5; // Center vertically in the bar
        this.sketch.fill(255);
        this.sketch.noStroke();
        this.sketch.rect(x + 50 + this.sliderX, this.sliderY, this.sliderWidth, this.sliderHeight);

        // Calculate signal height based on window height
        this.signalHeight = Math.min(60, windowHeight * 0.15); // 15% of window height, max 60px
        this.signalY = barY - this.signalHeight - 50; // Position above the slider with some padding

        // Draw the signal visualization
        this.drawSignal(x + 50, this.signalY, this.barWidth);
        
        // Update time for animation (scaled by deltaTime)
        this.time += 2 * deltaTime; // Increased speed to account for deltaTime
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
                // Scale the frequency by the width to maintain consistent number of peaks
                sum += Math.sin(i * wave.freq * (800 / width) + this.time + wave.phase) * wave.amp;
            }
            
            // Add Perlin noise
            // Use both x and time coordinates for the noise to make it move
            const noiseScale = 0.4; // Controls how "rough" the noise is
            const noiseAmp = 10; // Controls how much the noise affects the signal
            const noiseVal = this.sketch.noise(i * noiseScale, this.time * 0.5) * 2 - 1; // Convert from 0-1 to -1 to 1
            sum += noiseVal * noiseAmp;
            
            // Add a baseline offset
            sum += this.signalHeight / 2;
            this.sketch.vertex(x + i, y + sum);
        }
        
        this.sketch.endShape();

        this.sketch.pop();
    }

    generateRandomWaves() {
        this.signalWaves = [];
        const numWaves = 12 + Math.floor(Math.random() * 3); // 5-7 waves
        
        // Calculate base frequency to ensure consistent number of peaks
        // We want about 2-3 peaks visible at once, so we'll use a fixed frequency
        // that's independent of screen width
        const baseFreq = 0.02; // Fixed base frequency
        
        // Generate the waves
        for (let i = 0; i < numWaves - 1; i++) {
            this.signalWaves.push({
                freq: baseFreq * 2 + Math.random() * baseFreq * 10, // 0.5-2x base frequency
                amp: 1 + Math.random() * 1, // 5-20
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