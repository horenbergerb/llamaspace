import { KDTree } from './k-d-tree.js';
import { StarInfoUI } from './star-info.js';
import { MapStar } from './map-star.js';

export class MapScene {
    constructor() {
        this.mapScene = []; // Array for larger, glowing stars
        this.pressStartTime = null;
        this.starInfoUI = null;
    }

    initializeMapScene(sketch) {
        for (let i = 0; i < 120; i++) {
            this.mapScene.push(new MapStar(sketch));
        }
        this.starTree = new KDTree(this.mapScene);
        this.starInfoUI = new StarInfoUI(sketch);
    }
    
    drawTooltip(sketch, mapStar){
        sketch.push();
        sketch.fill(0, 0, 0, 150); // Semi-transparent black background
        sketch.rectMode(sketch.CENTER);
        let textWidth = sketch.textWidth(mapStar.name || "Unnamed Star") + 10;
        sketch.rect(mapStar.baseX, mapStar.baseY - 15, textWidth, 20, 5); // Draw box above the star
        
        sketch.fill(255); // White text
        sketch.textAlign(sketch.CENTER, sketch.CENTER);
        sketch.text(mapStar.name || "Unnamed Star", mapStar.baseX, mapStar.baseY - 15); // Star name
        sketch.pop();
    }

    drawMapScene(sketch, camera) {
        for (let star of this.mapScene) {
            star.update();
            star.drawMapStar();
        }
    
        // TODO: Cache this and update only when the mouse moves?
        let mouseXTransformed = (sketch.mouseX - camera.panX) / camera.scaleFactor;
        let mouseYTransformed = (sketch.mouseY - camera.panY) / camera.scaleFactor;
    
        let nearest = this.starTree.nearestNeighbor([mouseXTransformed, mouseYTransformed]);
        let dist = sketch.dist(mouseXTransformed, mouseYTransformed, nearest.baseX, nearest.baseY);
    
        if (dist < 20) {
            this.drawTooltip(sketch, nearest);
        }

        this.starInfoUI.drawUI();
    }    
    
    getRandomStar() {
        return this.mapScene[Math.floor(Math.random() * this.mapScene.length)];
    }

    openStarInfo(star) {
        this.starInfoUI.open(star);
    }

    handleMousePressedMapScene(sketch){
        this.pressStartTime = sketch.millis();
    }

    handleMouseReleasedMapScene(sketch, camera, spaceship){
        let mouseXTransformed = (sketch.mouseX - camera.panX) / camera.scaleFactor;
        let mouseYTransformed = (sketch.mouseY - camera.panY) / camera.scaleFactor;

        if (camera.startMouseX != sketch.mouseX || camera.startMouseY != sketch.mouseY)
            return;

        let nearest = this.starTree.nearestNeighbor([mouseXTransformed, mouseYTransformed]);
        let dist = sketch.dist(mouseXTransformed, mouseYTransformed, nearest.baseX, nearest.baseY);

        let pressDuration = sketch.millis() - this.pressStartTime;

        if (dist < 20) {
            if (sketch.mouseButton === sketch.RIGHT) {
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