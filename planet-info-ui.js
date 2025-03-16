import { BodyInfoUI } from './body-info-ui.js';

export class PlanetInfoUI extends BodyInfoUI {
    drawProperties(startY, pg) {
        let infoY = startY + this.scrollOffset;
        const planet = this.body;

        // Measure the total height first
        this.setMaxScrollOffset();

        // Draw planet-specific properties
        pg.text(`Type: ${planet.bodyProperties.type}`, 15, infoY);
        infoY += 20;
        pg.text(`Mass: ${planet.bodyProperties.mass.toFixed(2)} Earth masses`, 15, infoY);
        infoY += 20;
        pg.text(`Radius: ${planet.bodyProperties.radius.toFixed(2)} Earth radii`, 15, infoY);
        infoY += 20;
        pg.text(`Temperature: ${Math.round(planet.bodyProperties.temperature)}K`, 15, infoY);
        infoY += 20;
        pg.text(`Atmosphere: ${planet.bodyProperties.atmosphere}`, 15, infoY);
        infoY += 20;

        if (planet.bodyProperties.hasMoons) {
            pg.text(`Moons: ${planet.bodyProperties.numberOfMoons}`, 15, infoY);
            infoY += 20;
        } else {
            pg.text(`Moons: None`, 15, infoY);
            infoY += 20;
        }

        pg.text(`Rings: ${planet.bodyProperties.hasRings ? "Yes" : "No"}`, 15, infoY);
        infoY += 20;
        pg.text(`Habitability: ${planet.bodyProperties.habitability}`, 15, infoY);
        infoY += 20;

        if (planet.bodyProperties.resources.length > 0) {
            pg.text(`Resources: ${planet.bodyProperties.resources.join(", ")}`, 15, infoY);
            infoY += 20;
        }
    }
} 