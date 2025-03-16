import { BodyInfoUI } from './body-info-ui.js';

export class PlanetInfoUI extends BodyInfoUI {
    drawProperties(startY) {
        let infoY = startY;
        const planet = this.body;

        // Draw planet-specific properties
        this.sketch.text(`Type: ${planet.bodyProperties.type}`, this.uiX + 15, infoY);
        infoY += 20;
        this.sketch.text(`Mass: ${planet.bodyProperties.mass.toFixed(2)} Earth masses`, this.uiX + 15, infoY);
        infoY += 20;
        this.sketch.text(`Radius: ${planet.bodyProperties.radius.toFixed(2)} Earth radii`, this.uiX + 15, infoY);
        infoY += 20;
        this.sketch.text(`Temperature: ${Math.round(planet.bodyProperties.temperature)}K`, this.uiX + 15, infoY);
        infoY += 20;
        this.sketch.text(`Atmosphere: ${planet.bodyProperties.atmosphere}`, this.uiX + 15, infoY);
        infoY += 20;

        if (planet.bodyProperties.hasMoons) {
            this.sketch.text(`Moons: ${planet.bodyProperties.numberOfMoons}`, this.uiX + 15, infoY);
            infoY += 20;
        } else {
            this.sketch.text(`Moons: None`, this.uiX + 15, infoY);
            infoY += 20;
        }

        this.sketch.text(`Rings: ${planet.bodyProperties.hasRings ? "Yes" : "No"}`, this.uiX + 15, infoY);
        infoY += 20;
        this.sketch.text(`Habitability: ${planet.bodyProperties.habitability}`, this.uiX + 15, infoY);
        infoY += 20;

        if (planet.bodyProperties.resources.length > 0) {
            this.sketch.text(`Resources: ${planet.bodyProperties.resources.join(", ")}`, this.uiX + 15, infoY);
        }
    }
} 