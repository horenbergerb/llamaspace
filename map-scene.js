import { KDTree } from './k-d-tree.js';
import { StarInfoUI } from './star-info-ui.js';
import { PlanetInfoUI } from './planet-info-ui.js';
import { MapStar } from './map-star.js';
import { MapPlanet } from './map-planet.js';
import { Spaceship } from './spaceship.js';

export class MapScene {
    constructor(sketch) {
        this.sketch = sketch;
        this.mapBodies = []; // Array for navigable bodies
        this.pressStartTime = null;
        this.starInfoUI = new StarInfoUI(sketch);
        this.planetInfoUI = new PlanetInfoUI(sketch);
        this.spaceship = null;
        this.selectedBody = null;
    }

    initializeMapScene() {
        this.starTree = new KDTree(this.mapBodies);
        this.spaceship = new Spaceship(this.sketch);
    }
    
    drawTooltip(camera) {
        let mouseXTransformed = (this.sketch.mouseX - camera.panX) / camera.scaleFactor;
        let mouseYTransformed = (this.sketch.mouseY - camera.panY) / camera.scaleFactor;
    
        // Find nearest body
        let nearest = null;
        let minDist = Infinity;
        
        for (let body of this.mapBodies) {
            let dist = this.sketch.dist(mouseXTransformed, mouseYTransformed, body.baseX, body.baseY);
            if (dist < minDist) {
                minDist = dist;
                nearest = body;
            }
        }
    
        if (!nearest || minDist >= 20) return;

        this.sketch.push();
        this.sketch.fill(0, 0, 0, 150); // Semi-transparent black background
        this.sketch.rectMode(this.sketch.CENTER);
        let textWidth = this.sketch.textWidth(nearest.name || "Unnamed Body") + 10;
        this.sketch.rect(nearest.baseX, nearest.baseY - 15, textWidth, 20, 5); // Draw box above the body
        
        this.sketch.fill(255); // White text
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.text(nearest.name || "Unnamed Body", nearest.baseX, nearest.baseY - 15); // Body name
        this.sketch.pop();
    }

    drawMapScene(camera) {
        for (let body of this.mapBodies) {
            body.update();
            body.draw();
        }
    
        this.spaceship.drawSpaceship();
        this.drawTooltip(camera);

        // Draw appropriate UI
        this.starInfoUI.drawUI(this.spaceship);
        this.planetInfoUI.drawUI(this.spaceship);
    }    
    
    getRandomBody() {
        return this.mapBodies[Math.floor(Math.random() * this.mapBodies.length)];
    }

    openBodyInfo(body) {
        // Close any open UI first
        this.starInfoUI.close();
        this.planetInfoUI.close();

        // Open the appropriate UI
        if (body instanceof MapStar) {
            this.starInfoUI.open(body);
        } else if (body instanceof MapPlanet) {
            this.planetInfoUI.open(body);
        }
    }

    setInSystemView(isInSystem) {
        this.starInfoUI.inSystemMap = isInSystem;
        this.planetInfoUI.inSystemMap = isInSystem;
        this.spaceship.setInSystemMap(isInSystem);
    }

    handleMousePressedMapScene() {
        this.pressStartTime = this.sketch.millis();
    }

    handleTouchStartMapScene(camera, touchX, touchY) {
        // Check UI interactions first
        if (this.starInfoUI.handleTouchStart(camera, touchX, touchY) ||
            this.planetInfoUI.handleTouchStart(camera, touchX, touchY)) {
            return true;
        }
        return false;
    }

    handleTouchMoveMapScene(camera, touchX, touchY) {
        // Check UI interactions first
        if (this.starInfoUI.handleTouchMove(camera, touchX, touchY) ||
            this.planetInfoUI.handleTouchMove(camera, touchX, touchY)) {
            return true;
        }
        return false;
    }

    handleTouchEndMapScene(camera, touchX, touchY) {
        this.starInfoUI.handleTouchEnd(camera, touchX, touchY);
        this.planetInfoUI.handleTouchEnd(camera, touchX, touchY);
    }

    handleMouseWheelMapScene(event) {
        // Check if either UI is visible and handle scrolling
        if (this.starInfoUI.isVisible) {
            this.starInfoUI.handleScroll(event.delta);
            return true;
        } else if (this.planetInfoUI.isVisible) {
            this.planetInfoUI.handleScroll(event.delta);
            return true;
        }
        return false;
    }

    handleMouseReleasedMapScene(camera) {
        let mouseXTransformed = (this.sketch.mouseX - camera.panX) / camera.scaleFactor;
        let mouseYTransformed = (this.sketch.mouseY - camera.panY) / camera.scaleFactor;

        if (this.sketch.dist(camera.startMouseX, camera.startMouseY, this.sketch.mouseX, this.sketch.mouseY) > 10)
            return false;

        // Check UI interactions first
        if (this.starInfoUI.handleMouseReleased(camera, this.sketch.mouseX, this.sketch.mouseY, this.spaceship) ||
            this.planetInfoUI.handleMouseReleased(camera, this.sketch.mouseX, this.sketch.mouseY, this.spaceship)) {
            return true;
        }

        // Find nearest body
        let nearest = null;
        let minDist = Infinity;
        
        for (let body of this.mapBodies) {
            let dist = this.sketch.dist(mouseXTransformed, mouseYTransformed, body.baseX, body.baseY);
            if (dist < minDist) {
                minDist = dist;
                nearest = body;
            }
        }

        let pressDuration = this.sketch.millis() - this.pressStartTime;

        if (nearest && minDist < 20) {
            if (this.sketch.mouseButton === this.sketch.RIGHT) {
                this.openBodyInfo(nearest);
            }
            else if (pressDuration < 300) {
                if (!this.spaceship.inTransit)
                    this.spaceship.setOrbitBody(nearest);
            } else {
                // Long press to open body info
                this.openBodyInfo(nearest);
            }

            if (this.selectedBody) {
                this.selectedBody.isSelected = false;
            }
    
            this.selectedBody = nearest;
            nearest.isSelected = true;
            console.log(`Selected Body: ${nearest.name}`);
            console.log(nearest.getDescription());
        } else {
            if (this.selectedBody) {
                this.selectedBody.isSelected = false;
                this.selectedBody = null;
            }
        }
        
        return false;
    }
}