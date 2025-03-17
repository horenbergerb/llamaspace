import { BodyInfoUI } from './body-info-ui.js';

export class StarInfoUI extends BodyInfoUI {
    getProperties() {
        if (!this.body) return [];
        
        const star = this.body;
        return [
            { label: 'Spectral Class', value: star.bodyProperties.type },
            { label: 'Temperature', value: `${Math.round(star.bodyProperties.temperature)} K` },
            { label: 'Mass', value: `${star.bodyProperties.mass.toFixed(2)} M☉` },
            { label: 'Lifespan', value: `${star.bodyProperties.lifespan.toFixed(0)} million years` },
            { label: 'Radiation Level', value: star.bodyProperties.radiationLevel },
            { label: 'Flare Activity', value: star.bodyProperties.flareActivity },
            ...(star.bodyProperties.isBinary ? [{ label: 'Binary System', value: 'Yes' }] : []),
            ...(star.bodyProperties.hasPlanets ? [{ label: 'Number of Planets', value: star.bodyProperties.numPlanets }] : []),
            ...(star.bodyProperties.hasHabitableZone ? [
                { label: 'Has Habitable Zone', value: 'Yes' },
                ...(star.bodyProperties.hasEarthLikePlanet ? [{ label: 'Contains Earth-like Planet', value: 'Yes' }] : [])
            ] : []),
            ...(star.bodyProperties.remnantType !== "None" ? [{ label: 'Future', value: star.bodyProperties.remnantType }] : [])
        ];
    }

    drawProperties(startY, pg) {
        let infoY = startY + this.scrollOffset;
        const star = this.body;

        // Measure the total height first
        this.setMaxScrollOffset();

        // Draw star-specific properties
        pg.text(`Spectral Class: ${star.bodyProperties.type}`, 15, infoY);
        infoY += 20;
        pg.text(`Temperature: ${Math.round(star.bodyProperties.temperature)} K`, 15, infoY);
        infoY += 20;
        pg.text(`Mass: ${star.bodyProperties.mass.toFixed(2)} M☉`, 15, infoY);
        infoY += 20;
        pg.text(`Lifespan: ${star.bodyProperties.lifespan.toFixed(0)} million years`, 15, infoY);
        infoY += 20;
        pg.text(`Radiation Level: ${star.bodyProperties.radiationLevel}`, 15, infoY);
        infoY += 20;
        pg.text(`Flare Activity: ${star.bodyProperties.flareActivity}`, 15, infoY);
        infoY += 20;

        if (star.bodyProperties.isBinary) {
            pg.text(`Binary System: Yes`, 15, infoY);
            infoY += 20;
        }

        if (star.bodyProperties.hasPlanets) {
            pg.text(`Number of Planets: ${star.bodyProperties.numPlanets}`, 15, infoY);
            infoY += 20;
        }

        if (star.bodyProperties.hasHabitableZone) {
            pg.text(`Has Habitable Zone: Yes`, 15, infoY);
            infoY += 20;
            if (star.bodyProperties.hasEarthLikePlanet) {
                pg.text(`Contains Earth-like Planet`, 15, infoY);
                infoY += 20;
            }
        }

        if (star.bodyProperties.remnantType !== "None") {
            pg.text(`Future: ${star.bodyProperties.remnantType}`, 15, infoY);
            infoY += 20;
        }
    }

    drawUI() {
        super.drawUI();

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

    handleMouseReleased(camera, mouseX, mouseY) {
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
                this.eventBus.emit('returnToGalaxy');
                this.close();
                return true;
            }
        }

        return super.handleMouseReleased(camera, mouseX, mouseY);
    }
} 