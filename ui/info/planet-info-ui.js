import { BodyInfoUI } from './body-info-ui.js';

export class PlanetInfoUI extends BodyInfoUI {
    getProperties() {
        if (!this.body) return [];
        
        const planet = this.body;
        return [
            { label: 'Type', value: planet.bodyProperties.type },
            { label: 'Mass', value: `${planet.bodyProperties.mass.toFixed(2)} Earth masses` },
            { label: 'Radius', value: `${planet.bodyProperties.radius.toFixed(2)} Earth radii` },
            { label: 'Temperature', value: `${Math.round(planet.bodyProperties.temperature)}K` },
            { label: 'Atmosphere', value: planet.bodyProperties.atmosphere },
            { label: 'Moons', value: planet.bodyProperties.hasMoons ? planet.bodyProperties.numberOfMoons : 'None' },
            { label: 'Rings', value: planet.bodyProperties.hasRings ? 'Yes' : 'No' },
            { label: 'Habitability', value: planet.bodyProperties.habitability },
            ...(planet.bodyProperties.resources.length > 0 ? [{ label: 'Resources', value: planet.bodyProperties.resources.join(", ") }] : [])
        ];
    }
} 