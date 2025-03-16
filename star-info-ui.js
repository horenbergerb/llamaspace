import { BodyInfoUI } from './body-info-ui.js';

export class StarInfoUI extends BodyInfoUI {
    drawProperties(startY) {
        let infoY = startY;
        const star = this.body;

        // Draw star-specific properties
        this.sketch.text(`Spectral Class: ${star.bodyProperties.type}`, this.uiX + 15, infoY);
        infoY += 20;
        this.sketch.text(`Temperature: ${Math.round(star.bodyProperties.temperature)} K`, this.uiX + 15, infoY);
        infoY += 20;
        this.sketch.text(`Mass: ${star.bodyProperties.mass.toFixed(2)} M☉`, this.uiX + 15, infoY);
        infoY += 20;
        this.sketch.text(`Lifespan: ${star.bodyProperties.lifespan.toFixed(0)} million years`, this.uiX + 15, infoY);
        infoY += 20;
        this.sketch.text(`Radiation Level: ${star.bodyProperties.radiationLevel}`, this.uiX + 15, infoY);
        infoY += 20;
        this.sketch.text(`Flare Activity: ${star.bodyProperties.flareActivity}`, this.uiX + 15, infoY);
        infoY += 20;

        if (star.bodyProperties.isBinary) {
            this.sketch.text(`Binary System: Yes`, this.uiX + 15, infoY);
            infoY += 20;
        }

        if (star.bodyProperties.hasPlanets) {
            this.sketch.text(`Number of Planets: ${star.bodyProperties.numPlanets}`, this.uiX + 15, infoY);
            infoY += 20;
        }

        if (star.bodyProperties.hasHabitableZone) {
            this.sketch.text(`Has Habitable Zone: Yes`, this.uiX + 15, infoY);
            infoY += 20;
            if (star.bodyProperties.hasEarthLikePlanet) {
                this.sketch.text(`Contains Earth-like Planet`, this.uiX + 15, infoY);
                infoY += 20;
            }
        }

        if (star.bodyProperties.remnantType !== "None") {
            this.sketch.text(`Future: ${star.bodyProperties.remnantType}`, this.uiX + 15, infoY);
        }
    }

    drawUI(spaceship) {
        super.drawUI(spaceship);

        // Add Return to Galaxy button if in system view and this is the central star
        if (this.isVisible && this.body && this.inSystemMap && 
            this.body.baseX === this.sketch.width / 2 && 
            this.body.baseY === this.sketch.height / 2) {
            this.sketch.push();
            this.sketch.fill(50, 150, 255);
            this.sketch.rect(this.uiX + this.uiWidth / 2 - 60, this.uiY + this.uiHeight - 70, 120, 25, 5);
            this.sketch.fill(255);
            this.sketch.textSize(12);
            this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
            const returnButtonY = this.uiY + this.uiHeight - 70 + 25/2; // Center vertically in button
            this.sketch.text("Return to Galaxy", this.uiX + this.uiWidth / 2, returnButtonY);
            this.sketch.pop();
        }
    }

    handleMouseReleased(camera, mouseX, mouseY, spaceship) {
        if (!this.isVisible) return false;

        let mouseXTransformed = (mouseX - camera.panX) / camera.scaleFactor;
        let mouseYTransformed = (mouseY - camera.panY) / camera.scaleFactor;

        // Check if this is the central star in system view
        if (this.body && this.inSystemMap && 
            this.body.baseX === this.sketch.width / 2 && 
            this.body.baseY === this.sketch.height / 2) {
            
            // Check Return to Galaxy button
            let returnX = this.uiX + this.uiWidth / 2 - 60;
            let returnY = this.uiY + this.uiHeight - 70;
            if (mouseXTransformed >= returnX && 
                mouseXTransformed <= returnX + 120 && 
                mouseYTransformed >= returnY && 
                mouseYTransformed <= returnY + 25) {
                console.log(`Returning to galaxy map...`);
                window.returnToGalaxyMap();
                this.close();
                return true;
            }
        }

        return super.handleMouseReleased(camera, mouseX, mouseY, spaceship);
    }
} 