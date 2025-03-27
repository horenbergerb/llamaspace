import { MapBody } from './map-body.js';
import { Anomaly } from './anomaly.js';

export class MapPlanet extends MapBody {
    constructor(sketch, parentStar, orbitIndex, eventBus) {
        super(sketch);
        this.parentStar = parentStar;
        this.orbitIndex = orbitIndex; // Used to determine orbit radius
        this.isPlanet = true;
        
        // Orbital properties
        this.orbitRadius = this.calculateOrbitRadius();
        this.orbitSpeed = 0.003 / Math.pow(this.orbitIndex + 1, 0.5); // Adjusted for deltaTime
        this.orbitAngle = sketch.random(0, 2 * Math.PI);
        
        // Visual properties - increased sizes for system view
        this.baseSize = sketch.random(8, 20); // Increased from (3, 8)
        this.size = this.baseSize;
        this.pulseSpeed = sketch.random(0.02, 0.04);
        
        this.generatePlanetProperties(sketch);
        this.updatePosition(); // Initial position

        // Add anomaly with 1/3 chance
        this.anomaly = sketch.random() < 0.33 ? new Anomaly(eventBus) : null;
    }

    generatePlanetProperties(sketch) {
        // Basic planetary properties
        this.bodyProperties = {
            type: this.generatePlanetType(),
            mass: sketch.random(0.1, 10), // Earth masses
            radius: sketch.random(0.3, 2.5), // Earth radii
            temperature: this.calculateSurfaceTemperature(),
            atmosphere: this.generateAtmosphere(),
            hasRings: sketch.random() < 0.2,
            hasMoons: sketch.random() < 0.7,
            numberOfMoons: 0,
            habitability: "Uninhabitable",
            resources: this.generateResources()
        };

        // Adjust size based on planet type
        if (this.bodyProperties.type === 'Gas Giant') {
            this.baseSize *= 2;
            this.size = this.baseSize;
        } else if (this.bodyProperties.type === 'Ice Giant') {
            this.baseSize *= 1.5;
            this.size = this.baseSize;
        }

        // Generate number of moons if the planet has them
        if (this.bodyProperties.hasMoons) {
            this.bodyProperties.numberOfMoons = Math.floor(sketch.random(1, 5));
        }

        // Set color based on type
        this.color = this.getPlanetColor();
        
        // Generate name
        this.name = `${this.parentStar.name}-${String.fromCharCode(97 + this.orbitIndex)}`; // a, b, c, etc.
        
        // Calculate habitability
        this.calculateHabitability();
    }

    getPlanetColor() {
        const colors = {
            'Rocky': this.sketch.color(180, 120, 80),
            'Ocean': this.sketch.color(70, 130, 180),
            'Gas Giant': this.sketch.color(230, 180, 70),
            'Ice Giant': this.sketch.color(170, 210, 230),
            'Desert': this.sketch.color(210, 180, 140)
        };
        return colors[this.bodyProperties.type] || this.sketch.color(200);
    }

    generatePlanetType() {
        const types = ['Rocky', 'Ocean', 'Gas Giant', 'Ice Giant', 'Desert'];
        const weights = [0.4, 0.1, 0.2, 0.2, 0.1];
        let rand = Math.random();
        let sum = 0;
        for (let i = 0; i < types.length; i++) {
            sum += weights[i];
            if (rand < sum) return types[i];
        }
        return types[0];
    }

    generateAtmosphere() {
        const atmosphereTypes = ['None', 'Thin', 'Moderate', 'Thick', 'Dense'];
        return atmosphereTypes[Math.floor(Math.random() * atmosphereTypes.length)];
    }

    generateResources() {
        const possibleResources = ['Water', 'Metals', 'Rare Elements', 'Gases', 'Crystals'];
        let resources = [];
        let numResources = Math.floor(Math.random() * 3) + 1;
        while (resources.length < numResources) {
            let resource = possibleResources[Math.floor(Math.random() * possibleResources.length)];
            if (!resources.includes(resource)) resources.push(resource);
        }
        return resources;
    }

    calculateOrbitRadius() {
        // Use exponential scaling for orbit distances
        const baseRadius = 100; // Base distance in pixels
        return baseRadius * Math.pow(1.5, this.orbitIndex);
    }

    calculateSurfaceTemperature() {
        // Simplified temperature calculation based on orbit distance and star temperature
        const baseTemp = this.parentStar.bodyProperties.temperature;
        const distanceFactor = 1 / Math.sqrt(this.orbitRadius);
        return baseTemp * distanceFactor * 0.1; // Simplified calculation
    }

    calculateHabitability() {
        // Check conditions for habitability
        const temp = this.bodyProperties.temperature;
        const hasAtmosphere = this.bodyProperties.atmosphere !== 'None' && this.bodyProperties.atmosphere !== 'Thin';
        const isRightSize = this.bodyProperties.radius > 0.5 && this.bodyProperties.radius < 2;
        const isHabitable = temp > 220 && temp < 320 && hasAtmosphere && isRightSize;
        
        this.bodyProperties.habitability = isHabitable ? "Potentially Habitable" : "Uninhabitable";
    }

    updatePosition() {
        // Update orbital position using deltaTime
        const deltaTimeSeconds = this.sketch.deltaTime / 1000;
        const timeScale = deltaTimeSeconds * 60; // Scale to 60fps equivalent
        this.orbitAngle += this.orbitSpeed * timeScale;
        this.baseX = (this.sketch.width / 2) + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.baseY = (this.sketch.height / 2) + Math.sin(this.orbitAngle) * this.orbitRadius;
    }

    draw() {
        this.sketch.push();
        
        // Draw orbit line with improved visibility
        this.sketch.stroke(150, 150, 255, 100); // Brighter blue-ish color
        this.sketch.strokeWeight(1.5); // Slightly thicker line
        this.sketch.noFill();
        
        // Draw dashed orbit line
        const segments = 60;
        const dashLength = (2 * Math.PI) / segments;
        for (let i = 0; i < segments; i++) {
            if (i % 2 === 0) {
                let startAngle = i * dashLength;
                let endAngle = startAngle + dashLength;
                this.sketch.arc(
                    this.sketch.width / 2,
                    this.sketch.height / 2,
                    this.orbitRadius * 2,
                    this.orbitRadius * 2,
                    startAngle,
                    endAngle
                );
            }
        }
        
        // Draw planet
        this.sketch.noStroke();
        this.sketch.fill(this.color);
        this.sketch.ellipse(this.baseX, this.baseY, this.size);
        
        // Draw rings if planet has them
        if (this.bodyProperties.hasRings) {
            this.sketch.stroke(200, 200, 200, 150); // More visible rings
            this.sketch.strokeWeight(1.5);
            this.sketch.noFill();
            this.sketch.ellipse(this.baseX, this.baseY, this.size * 2.5, this.size * 0.6); // Adjusted ring proportions
        }
        
        if (this.isSelected) {
            this.drawSelector();
            
            // Generate first report if body has an anomaly and report hasn't been generated yet
            if (this.anomaly && this.anomaly.firstReport === null) {
                this.anomaly.generateFirstReport(
                this
                );
            }
        }
        
        this.sketch.pop();
    }

    update() {
        super.update(); // Handle size pulsing
        this.updatePosition(); // Update orbital position
    }

    getDescription() {
        return `Planet Name: ${this.name}\n` +
               `Type: ${this.bodyProperties.type}\n` +
               `Mass: ${this.bodyProperties.mass.toFixed(2)} Earth masses\n` +
               `Radius: ${this.bodyProperties.radius.toFixed(2)} Earth radii\n` +
               `Temperature: ${Math.round(this.bodyProperties.temperature)}K\n` +
               `Atmosphere: ${this.bodyProperties.atmosphere}\n` +
               `Moons: ${this.bodyProperties.hasMoons ? this.bodyProperties.numberOfMoons : "None"}\n` +
               `Rings: ${this.bodyProperties.hasRings ? "Yes" : "No"}\n` +
               `Habitability: ${this.bodyProperties.habitability}\n` +
               `Resources: ${this.bodyProperties.resources.join(", ")}\n`;
    }
} 