import { KDTree } from '../utils/k-d-tree.js';
import { StarInfoUI } from '../ui/info/star-info-ui.js';
import { PlanetInfoUI } from '../ui/info/planet-info-ui.js';
import { MapStar } from './map-star.js';
import { MapPlanet } from './map-planet.js';
import { MapSceneRenderer } from '../renderers/map-scene-renderer.js';

export class MapScene {
    constructor(sketch, eventBus) {
        this.sketch = sketch;
        this.mapBodies = []; // Array for navigable bodies
        this.pressStartTime = null;
        this.eventBus = eventBus; // Use provided event bus
        
        // Create UI with event bus
        this.starInfoUI = new StarInfoUI(sketch, this.eventBus);
        this.planetInfoUI = new PlanetInfoUI(sketch, this.eventBus);
        this.sceneRenderer = new MapSceneRenderer(sketch);
        this.selectedBody = null;

        this.eventBus.on('research', (body) => {
            console.log(`Researching ${body.name}...`);
            // TODO: Implement research functionality
        });

        this.eventBus.on('selectBody', (body) => {
            if (this.selectedBody) {
                this.selectedBody.isSelected = false;
            }
            this.selectedBody = body;
            body.isSelected = true;
        });
    }

    initializeMapScene() {
        this.starTree = new KDTree(this.mapBodies);
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
        if (this.starInfoUI.handleMouseReleased(camera, this.sketch.mouseX, this.sketch.mouseY) ||
            this.planetInfoUI.handleMouseReleased(camera, this.sketch.mouseX, this.sketch.mouseY)) {
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
                this.eventBus.emit('trySetDestination', nearest);
            } else {
                // Long press to open body info
                this.openBodyInfo(nearest);
            }

            this.eventBus.emit('selectBody', nearest);
        } else {
            if (this.selectedBody) {
                this.selectedBody.isSelected = false;
                this.selectedBody = null;
            }
        }
        
        return false;
    }
}