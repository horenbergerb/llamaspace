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

        // Anomaly properties
        this.anomaly = null;
        this.anomalyChance = 0.001; // Chance per frame to spawn an anomaly
        this.anomalyLifetime = 0;
        this.anomalyMaxLifetime = 30; // Seconds
        this.anomalyWidth = 5;
        this.anomalyHeight = 16;
        this.anomalyBaseVelocity = 100; // Base velocity for anomaly
        this.anomalyMaxVelocity = 300; // Maximum velocity
        this.anomalyAcceleration = 400; // Acceleration rate
        this.anomalyPauseChance = 0.3; // Chance to pause per frame
        this.anomalyDirectionChangeChance = 0.5; // Chance to change direction per frame
        this.anomalyPauseDuration = 0; // Current pause duration

        // Time tracking for frame-rate independence
        this.lastFrameTime = 0;
        
        // Scan button in window properties
        this.scanButtonInWindow = new TextButton(
            this.sketch,
            0, // x will be set in render
            0, // y will be set in render
            120, // wider button
            40,
            'Hold to Scan',
            null, // no click handler needed
            true // isHoldable = true
        );

        // Subscribe to system enter/exit events
        this.eventBus.on('enterSystem', () => {
            this.isInGalaxyMap = false;
            this.isWindowVisible = false;
        });

        this.eventBus.on('returnToGalaxy', () => {
            this.isInGalaxyMap = true;
        });

        // Set up buttons
        this.setupButton();
    }

    // Override base class methods
    handleUIOpened() {
        this.generateRandomWaves();
        this.anomaly = null; // Reset anomaly when opening UI
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
            
            // Check if click is on the scan button
            if (this.scanButtonInWindow.handlePress(mouseX, mouseY)) {
                return true;
            }
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
            
            // Check if touch is on the scan button
            if (this.scanButtonInWindow.handlePress(touchX, touchY)) {
                return true;
            }
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

            // Handle scan button release
            this.scanButtonInWindow.handleRelease(mouseX, mouseY);

            // Check if click is within the window bounds
            if (mouseX >= x && mouseX <= x + windowWidth &&
                mouseY >= y && mouseY <= y + windowHeight) {
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
                    // Handle scan button release
                    this.scanButtonInWindow.handleRelease(touchX, touchY);
                    return true;
            }
        }

        return false;
    }

    handleTouchMove(camera, touchX, touchY) {
        // If window is visible, check if touch is within window bounds
        if (this.isWindowVisible) {
            const { width: windowWidth, height: windowHeight } = this.getWindowDimensions();
            let x = (this.sketch.width - windowWidth) / 2;
            let y = (this.sketch.height - windowHeight) / 2;

            // Return true if touch is within window bounds to prevent map interactions
            if (touchX >= x && touchX <= x + windowWidth &&
                touchY >= y && touchY <= y + windowHeight) {
                return true;
            }
        }
        return false;
    }

    updatePhysics(deltaTime) {
        // Update anomaly if it exists
        this.updateAnomaly(deltaTime);

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

    updateAnomaly(deltaTime) {
        // Randomly spawn anomaly if none exists
        if (!this.anomaly && Math.random() < this.anomalyChance) {
            this.anomaly = {
                x: Math.random() * this.barWidth,
                lifetime: 0,
                velocity: 0,
                direction: Math.random() > 0.5 ? 1 : -1,
                isPaused: false,
                pauseTime: 0,
                nextDirectionChange: 0.5 + Math.random() * 2 // Random time until first direction change
            };
        }

        // Update existing anomaly
        if (this.anomaly) {
            // Update lifetime
            this.anomaly.lifetime += deltaTime;
            
            // Handle pausing
            if (this.anomaly.isPaused) {
                this.anomaly.pauseTime -= deltaTime;
                if (this.anomaly.pauseTime <= 0) {
                    this.anomaly.isPaused = false;
                    this.anomaly.direction *= Math.random() > 0.5 ? 1 : -1; // 50% chance to keep or change direction
                    this.anomaly.velocity = 0; // Reset velocity
                }
            } else {
                // Random chance to pause
                if (Math.random() < this.anomalyPauseChance * deltaTime) {
                    this.anomaly.isPaused = true;
                    this.anomaly.pauseTime = 0.2 + Math.random() * 0.8; // Pause for 0.2-1.0 seconds
                } else {
                    // Random chance to change direction while moving
                    if (Math.random() < this.anomalyDirectionChangeChance * deltaTime) {
                        this.anomaly.direction *= -1;
                        // Sometimes drastically reduce velocity on direction change
                        if (Math.random() < 0.3) {
                            this.anomaly.velocity *= 0.2;
                        }
                    }

                    // Update velocity with random acceleration
                    const targetVel = this.anomalyMaxVelocity * (0.3 + Math.random() * 0.7); // More variable target velocity
                    const accelRate = this.anomalyAcceleration * (0.3 + Math.random() * 0.7); // More variable acceleration
                    
                    // Randomly decide to accelerate or decelerate
                    if (Math.random() < 0.1) { // 10% chance to start decelerating
                        this.anomaly.velocity *= 0.95; // Gradual deceleration
                    } else if (Math.abs(this.anomaly.velocity) < targetVel) {
                        this.anomaly.velocity += accelRate * deltaTime * this.anomaly.direction;
                    }
                    
                    // Update position
                    this.anomaly.x += this.anomaly.velocity * deltaTime;
                    
                    // Bounce off edges
                    if (this.anomaly.x <= 0) {
                        this.anomaly.x = 0;
                        this.anomaly.direction = 1;
                        this.anomaly.velocity *= 0.5; // Reduce velocity on bounce
                    } else if (this.anomaly.x >= this.barWidth) {
                        this.anomaly.x = this.barWidth;
                        this.anomaly.direction = -1;
                        this.anomaly.velocity *= 0.5; // Reduce velocity on bounce
                    }
                }
            }
            
            // Remove if lifetime exceeded
            if (this.anomaly.lifetime > this.anomalyMaxLifetime) {
                this.anomaly = null;
            }
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

        // Position and render the scan button
        const scanButtonX = x + windowWidth/2 - 60; // center horizontally
        const scanButtonY = y + 20; // position at top of window
        this.scanButtonInWindow.updatePosition(scanButtonX, scanButtonY);
        this.scanButtonInWindow.render();
        
        // Update isPressed based on button state
        this.isPressed = this.scanButtonInWindow.isPressed;

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

        this.sketch.pop();
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
                sum += Math.sin(i * wave.freq * (800 / width) + this.time + wave.phase) * wave.amp;
            }
            
            // Add Perlin noise
            const noiseScale = 0.4;
            const noiseAmp = 10;
            const noiseVal = this.sketch.noise(i * noiseScale, this.time * 0.5) * 2 - 1;
            sum += noiseVal * noiseAmp;

            // Add anomaly spike if present
            if (this.anomaly) {
                const distFromAnomaly = Math.abs(i - this.anomaly.x);
                if (distFromAnomaly < this.anomalyWidth) {
                    // Create a spike shape using cosine
                    const spikeIntensity = -1.0*Math.cos((distFromAnomaly / this.anomalyWidth) * Math.PI * 0.5);
                    
                    // Calculate spike height
                    let spikeHeight = this.anomalyHeight;
                    
                    // If not paused, scale with velocity
                    if (!this.anomaly.isPaused) {
                        const velocityScale = Math.min(1, Math.abs(this.anomaly.velocity) / this.anomalyMaxVelocity);
                        spikeHeight *= (0.7 + velocityScale * 0.3); // Minimum 70% height when moving
                    } else {
                        // When paused, make it pulse slightly
                        spikeHeight *= 0.8 + Math.sin(this.time * 4) * 0.2; // Pulse between 60% and 100%
                    }
                    
                    sum += spikeIntensity * spikeHeight;
                }
            }
            
            // Add a baseline offset
            sum += this.signalHeight / 2;
            this.sketch.vertex(x + i, y + sum);
        }
        
        this.sketch.endShape();
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

    handleKeyDown(camera, key) {
        // Only handle keys if window is visible
        if (!this.isWindowVisible) return false;
        return false; // Return false to allow other UI elements to handle the key
    }

    handleKeyUp(camera, key) {
        // Only handle keys if window is visible
        if (!this.isWindowVisible) return false;
        return false; // Return false to allow other UI elements to handle the key
    }
} 