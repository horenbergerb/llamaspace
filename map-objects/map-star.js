import { MapBody } from './map-body.js';
import { MapPlanet } from './map-planet.js';

export class MapStar extends MapBody {
    static usedNames = new Set(); // Stores already assigned names

    constructor(sketch) {
        super(sketch);
        this.baseX = sketch.random(-0.5 * sketch.width, sketch.width * 1.5);
        this.baseY = sketch.random(-0.5 * sketch.height, sketch.height * 1.5);
        this.baseSize = sketch.random(12, 18);
        this.size = this.baseSize;
        this.pulseSpeed = sketch.random(0.01, 0.05);
        this.isSelected = false;
        this.isStar = true; // Add flag to identify stars
        this.planets = []; // Array to store planetary bodies

        this.generateStarProperties(sketch);

        // Naming
        this.name = this.generateStarName();

        // Generate planets if the star has them
        if (this.bodyProperties.hasPlanets) {
            for (let i = 0; i < this.bodyProperties.numPlanets; i++) {
                const planet = new MapPlanet(sketch, this, i);
                this.planets.push(planet);
            }
        }
    }

    generateStarProperties(sketch){
        /* Generates the "flavor" of the star */

        // Star colors/types based on temperature classifications
        let starTypes = [
            { type: "O", color: sketch.color(155, 176, 255), temp: sketch.random(30000, 50000), rarity: 0.0001, mass: sketch.random(16, 100), lifespan: sketch.random(1, 10), sizeFactor: 5 },
            { type: "B", color: sketch.color(180, 220, 255), temp: sketch.random(10000, 30000), rarity: 0.13, mass: sketch.random(2.1, 16), lifespan: sketch.random(10, 100), sizeFactor: 3 },
            { type: "A", color: sketch.color(230, 230, 255), temp: sketch.random(7500, 10000), rarity: 0.6, mass: sketch.random(1.4, 2.1), lifespan: sketch.random(100, 2000), sizeFactor: 2 },
            { type: "F", color: sketch.color(255, 240, 200), temp: sketch.random(6000, 7500), rarity: 3, mass: sketch.random(1.04, 1.4), lifespan: sketch.random(2000, 4000), sizeFactor: 1.5 },
            { type: "G", color: sketch.color(255, 220, 150), temp: sketch.random(5200, 6000), rarity: 7.6, mass: sketch.random(0.8, 1.04), lifespan: sketch.random(4000, 10000), sizeFactor: 1 },
            { type: "K", color: sketch.color(255, 180, 100), temp: sketch.random(3700, 5200), rarity: 12.1, mass: sketch.random(0.45, 0.8), lifespan: sketch.random(10000, 30000), sizeFactor: 0.8 },
            { type: "M", color: sketch.color(255, 100, 80), temp: sketch.random(2400, 3700), rarity: 76, mass: sketch.random(0.08, 0.45), lifespan: sketch.random(30000, 100000), sizeFactor: 0.5 }
        ];

        // Assign a spectral type based on real-world rarity
        const spectralClass = this.weightedRandom(starTypes);
        this.color = spectralClass.color;
        this.size *= spectralClass.sizeFactor;
        this.baseSize *= spectralClass.sizeFactor;

        // Store all star properties in the bodyProperties dictionary
        this.bodyProperties = {
            type: spectralClass.type,
            temperature: spectralClass.temp,
            mass: spectralClass.mass,
            lifespan: spectralClass.lifespan,
            isBinary: sketch.random() < 0.3,
            numPlanets: 0,
            hasHabitableZone: false,
            hasEarthLikePlanet: false,
            radiationLevel: "Low",
            flareActivity: "Rare",
            remnantType: "None"
        };

        // Calculate planetary system properties
        let planetProbability = Math.min(1, this.bodyProperties.mass * 0.2);
        this.bodyProperties.hasPlanets = sketch.random() < planetProbability;
        if (this.bodyProperties.hasPlanets) {
            this.bodyProperties.numPlanets = Math.floor(sketch.random(1, 10));
        }

        // Calculate habitable zone and Earth-like planet
        this.bodyProperties.hasHabitableZone = ["F", "G", "K", "M"].includes(this.bodyProperties.type) && this.bodyProperties.hasPlanets;
        this.bodyProperties.hasEarthLikePlanet = this.bodyProperties.hasHabitableZone && sketch.random() < 0.3;

        // Calculate radiation level
        this.bodyProperties.radiationLevel = this.bodyProperties.type === "O" || this.bodyProperties.type === "B" ? "Extreme" :
                                           this.bodyProperties.type === "A" || this.bodyProperties.type === "F" ? "Moderate" : "Low";

        // Calculate flare activity
        this.bodyProperties.flareActivity = (this.bodyProperties.type === "M" && sketch.random() < 0.7) ||
                                          (this.bodyProperties.type === "K" && sketch.random() < 0.3) ? "Frequent" :
                                          (this.bodyProperties.type === "G" && sketch.random() < 0.2) ? "Occasional" : "Rare";

        // Calculate remnant type
        if (this.bodyProperties.mass > 20) {
            this.bodyProperties.remnantType = sketch.random() < 0.7 ? "Black Hole" : "Neutron Star";
        } else if (this.bodyProperties.mass > 8) {
            this.bodyProperties.remnantType = "Neutron Star";
        } else if (this.bodyProperties.mass < 1.4 && this.bodyProperties.type !== "M") {
            this.bodyProperties.remnantType = "White Dwarf";
        }
    }

    // Utility function for picking a star type based on real-world rarity
    weightedRandom(starTypes) {
        let totalWeight = starTypes.reduce((sum, star) => sum + star.rarity, 0);
        let pick = this.sketch.random(totalWeight);
        let cumulative = 0;
        for (let star of starTypes) {
            cumulative += star.rarity;
            if (pick < cumulative) {
                return star;
            }
        }
        return starTypes[starTypes.length - 1]; // Default fallback
    }

    generateStarName() {
        let name;
        let attempts = 0;

        do {
            let nameType = this.sketch.random(); 

            if (nameType < 0.4) { 
                // **Catalog-Based Name**
                let catalogs = ["HD", "Gliese", "HIP", "Kepler", "HR", "TYC", "PSR", "LHS", "WISE", "2MASS"];
                let catalog = this.sketch.random(catalogs);
                let number = Math.floor(this.sketch.random(1000, 99999));
                name = `${catalog} ${number}`;

            } else if (nameType < 0.65) { 
                // **Constellation-Based Name**
                let greekLetters = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Theta", "Lambda", "Sigma", "Omicron", "Rho", "Xi", "Bofa", "Sugma", "Ligma"];
                let constellations = [
                    "Centauri", "Draconis", "Lyrae", "Pegasi", "Andromedae", "Orionis", "Tauri", "Ursae", "Cygni", 
                    "Piscium", "Sagittarii", "Cancri", "Serpentis", "Herculis", "Boötis", "Arietis", "Carinae", "Cassiopeiae"
                ];
                let letter = this.sketch.random(greekLetters);
                let constellation = this.sketch.random(constellations);
                let number = Math.floor(this.sketch.random(1, 99)); // Add a number for uniqueness
                name = `${letter} ${constellation} ${number}`;

            } else if (nameType < 0.85) { 
                // **Classical/Mythological Name**
                let classicalNames = [
                    "Vega", "Altair", "Rigel", "Antares", "Bellatrix", "Castor", "Pollux", "Deneb", "Arcturus", "Sirius",
                    "Alpheratz", "Fomalhaut", "Achernar", "Spica", "Adhara", "Hamal", "Mirach", "Markab", "Aldebaran",
                    "Alnitak", "Saiph", "Mintaka", "Procyon", "Betelgeuse", "Nunki", "Thuban", "Eltanin", "Rasalhague"
                ];
                let modifier = ["Prime", "Major", "Minor", "Nova", "X", "VII", "IV", "Eclipse"];
                name = `${this.sketch.random(classicalNames)} ${this.sketch.random(modifier)}`;

            } else { 
                // **Sci-Fi Procedural Name**
                let prefixes = [
                    "Zeta", "XQ", "TY", "RX", "Omicron", "Delta", "Beta-Prime", "Kappa", "Epsilon", "Theta",
                    "Hyperion", "Solus", "Nyx", "Nova", "Orion", "Yggdrasil", "Neptune", "Helios", "Osiris"
                ];
                let suffix = Math.floor(this.sketch.random(100, 999));
                let regions = ["Alpha", "Beta", "Gamma", "Epsilon", "Prime", "IV", "VII", "X", "XII"];
                name = `${this.sketch.random(prefixes)}-${suffix} ${this.sketch.random(regions)}`;
            }

            attempts++;
        } while (MapStar.usedNames.has(name) && attempts < 1000); // Ensure uniqueness

        MapStar.usedNames.add(name); // Store name in the global set
        return name;
    }
    

    // Generate a description for the star when scanned
    getDescription() {
        let desc = `Star Name: ${this.name}\n` +
                   `Spectral Class: ${this.bodyProperties.type}\n` +
                   `Temperature: ${Math.round(this.bodyProperties.temperature)} K\n` +
                   `Mass: ${this.bodyProperties.mass.toFixed(2)} M☉\n` +
                   `Lifespan: ${this.bodyProperties.lifespan.toFixed(0)} million years\n` +
                   `Radiation Level: ${this.bodyProperties.radiationLevel}\n` +
                   `Flare Activity: ${this.bodyProperties.flareActivity}\n`;

        if (this.bodyProperties.isBinary) {
            desc += `This star is part of a binary system.\n`;
        }
        if (this.bodyProperties.hasPlanets) {
            desc += `Number of Planets: ${this.bodyProperties.numPlanets}\n`;
        }
        if (this.bodyProperties.hasHabitableZone) {
            desc += `This star has a habitable zone.\n`;
            if (this.bodyProperties.hasEarthLikePlanet) {
                desc += `There is an Earth-like planet in the habitable zone.\n`;
            }
        }
        if (this.bodyProperties.remnantType !== "None") {
            desc += `This star will eventually become a ${this.bodyProperties.remnantType}.\n`;
        }

        return desc;
    }

    getCoords(){
        return [this.baseX, this.baseY];
    }

    update() {
        this.size = this.baseSize + 1 * this.sketch.sin(this.sketch.frameCount * this.pulseSpeed);
    }

    drawSelector(){
        this.sketch.push();
        this.sketch.stroke(this.color.levels[0], this.color.levels[1], this.color.levels[2]);
        this.sketch.strokeWeight(2);
        this.sketch.noFill();
        this.sketch.ellipse(this.baseX, this.baseY, this.size + 10); // Outer ring
        this.sketch.pop();
    }

    draw() {
        this.sketch.push();
        this.sketch.noStroke();

        // Outer glow aura (adds a soft halo effect)
        for (let i = 5; i > 0; i--) {
            let alpha = 40 - i * 8; // Gradual fade outward
            this.sketch.fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], alpha);
            this.sketch.ellipse(this.baseX, this.baseY, this.size + i * 5);
        }

        // Main glowing star
        this.sketch.fill(this.color);
        this.sketch.ellipse(this.baseX, this.baseY, this.size);

        this.sketch.pop();

        if (this.isSelected) {
            this.drawSelector();
        }
    }
}