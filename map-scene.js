import { KDTree } from './k-d-tree.js';
import { StarInfoUI } from './star-info.js';
import { MapStar } from './map-star.js';

export class MapScene {
    constructor(sketch) {
        this.sketch = sketch;
        this.mapStars = []; // Array for navigable stars
        this.pressStartTime = null;
        this.starInfoUI = null;
    }

    initializeMapScene() {
        for (let i = 0; i < 120; i++) {
            this.mapStars.push(new MapStar(this.sketch));
        }
        this.starTree = new KDTree(this.mapStars);
        this.starInfoUI = new StarInfoUI(this.sketch);
    }
    
    drawTooltip(mapStar){
        this.sketch.push();
        this.sketch.fill(0, 0, 0, 150); // Semi-transparent black background
        this.sketch.rectMode(this.sketch.CENTER);
        let textWidth = this.sketch.textWidth(mapStar.name || "Unnamed Star") + 10;
        this.sketch.rect(mapStar.baseX, mapStar.baseY - 15, textWidth, 20, 5); // Draw box above the star
        
        this.sketch.fill(255); // White text
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.text(mapStar.name || "Unnamed Star", mapStar.baseX, mapStar.baseY - 15); // Star name
        this.sketch.pop();
    }

    drawMapScene(camera) {
        for (let star of this.mapStars) {
            star.update();
            star.drawMapStar();
        }
    
        // TODO: Cache this and update only when the mouse moves?
        let mouseXTransformed = (this.sketch.mouseX - camera.panX) / camera.scaleFactor;
        let mouseYTransformed = (this.sketch.mouseY - camera.panY) / camera.scaleFactor;
    
        let nearest = this.starTree.nearestNeighbor([mouseXTransformed, mouseYTransformed]);
        let dist = this.sketch.dist(mouseXTransformed, mouseYTransformed, nearest.baseX, nearest.baseY);
    
        if (dist < 20) {
            this.drawTooltip(nearest);
        }

        this.starInfoUI.drawUI();
    }    
    
    getRandomStar() {
        return this.mapStars[Math.floor(Math.random() * this.mapStars.length)];
    }

    openStarInfo(star) {
        this.starInfoUI.open(star);
    }

    handleMousePressedMapScene(){
        this.pressStartTime = this.sketch.millis();
    }

    handleMouseReleasedMapScene(camera, spaceship){
        let mouseXTransformed = (this.sketch.mouseX - camera.panX) / camera.scaleFactor;
        let mouseYTransformed = (this.sketch.mouseY - camera.panY) / camera.scaleFactor;

        if (camera.startMouseX != this.sketch.mouseX || camera.startMouseY != this.sketch.mouseY)
            return;

        let nearest = this.starTree.nearestNeighbor([mouseXTransformed, mouseYTransformed]);
        let dist = this.sketch.dist(mouseXTransformed, mouseYTransformed, nearest.baseX, nearest.baseY);

        let pressDuration = this.sketch.millis() - this.pressStartTime;

        if (dist < 20) {
            if (this.sketch.mouseButton === this.sketch.RIGHT) {
                this.openStarInfo(nearest);
            }
            else if (pressDuration < 300) {
                if (!spaceship.inTransit)
                    spaceship.setOrbitStar(nearest);
            } else {
                // Long press to open star info window
                this.openStarInfo(nearest);
            }

            if (MapStar.selectedStar) {
                MapStar.selectedStar.isSelected = false;
            }
    
            MapStar.selectedStar = nearest;
            nearest.isSelected = true;
            console.log(`Selected Star: ${nearest.name}`);
            console.log(nearest.getDescription());
        } else {
            if (MapStar.selectedStar) {
                MapStar.selectedStar.isSelected = false;
                MapStar.selectedStar = null;
            }
        }
    }
}