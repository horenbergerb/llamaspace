export class MapStar {
    static usedNames = new Set(); // Stores already assigned names
    static selectedStar = null;

    constructor(sketch) {
        this.sketch = sketch;
        this.baseX = sketch.random(-0.5 * sketch.width, sketch.width * 1.5);
        this.baseY = sketch.random(-0.5 * sketch.height, sketch.height * 1.5);
        this.baseSize = sketch.random(6, 12);
        this.size = this.baseSize;
        this.pulseSpeed = sketch.random(0.01, 0.05);
        this.isSelected = false;

        this.generateStarProperties(sketch);

        // Naming
        this.name = this.generateStarName();
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
        this.spectralClass = this.weightedRandom(starTypes);
        this.color = this.spectralClass.color;
        this.temperature = this.spectralClass.temp;
        this.mass = this.spectralClass.mass;
        this.lifespan = this.spectralClass.lifespan; // in million years
        this.size *= this.spectralClass.sizeFactor; // Adjust size by class

        // Binary or single star system
        this.isBinary = sketch.random() < 0.3; // ~30% of stars are in binary/multiple systems

        // Planetary system probability: More massive and cooler stars are more likely to have planets
        let planetProbability = Math.min(1, this.mass * 0.2);
        this.hasPlanets = sketch.random() < planetProbability;

        this.numPlanets = this.hasPlanets ? Math.floor(sketch.random(1, 10)) : 0;

        this.hasHabitableZone = ["F", "G", "K", "M"].includes(this.spectralClass.type) && this.numPlanets > 0;
        
        this.hasEarthLikePlanet = this.hasHabitableZone && sketch.random() < 0.3;

        this.radiationLevel = this.spectralClass.type === "O" || this.spectralClass.type === "B" ? "Extreme" :
                              this.spectralClass.type === "A" || this.spectralClass.type === "F" ? "Moderate" : "Low";

        // Likelihood of flares (mostly M-type stars, but some others)
        this.flareActivity = (this.spectralClass.type === "M" && sketch.random() < 0.7) ||
                             (this.spectralClass.type === "K" && sketch.random() < 0.3) ? "Frequent" :
                             (this.spectralClass.type === "G" && sketch.random() < 0.2) ? "Occasional" : "Rare";

        // Neutron stars, white dwarfs, or black holes
        if (this.mass > 20) {
            this.remnantType = sketch.random() < 0.7 ? "Black Hole" : "Neutron Star";
        } else if (this.mass > 8) {
            this.remnantType = "Neutron Star";
        } else if (this.mass < 1.4 && this.spectralClass.type !== "M") {
            this.remnantType = "White Dwarf";
        } else {
            this.remnantType = "None";
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
        let desc = `Spectral Class: ${this.spectralClass.type}\n` +
                   `Temperature: ${Math.round(this.temperature)} K\n` +
                   `Mass: ${this.mass.toFixed(2)} M☉\n` +
                   `Lifespan: ${this.lifespan.toFixed(0)} million years\n` +
                   `Radiation Level: ${this.radiationLevel}\n` +
                   `Flare Activity: ${this.flareActivity}\n`;

        if (this.isBinary) {
            desc += `This star is part of a binary system.\n`;
        }
        if (this.hasPlanets) {
            desc += `Number of Planets: ${this.numPlanets}\n`;
        }
        if (this.hasHabitableZone) {
            desc += `This star has a habitable zone.\n`;
            if (this.hasEarthLikePlanet) {
                desc += `There is an Earth-like planet in the habitable zone.\n`;
            }
        }
        if (this.remnantType !== "None") {
            desc += `This star will eventually become a ${this.remnantType}.\n`;
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
        this.sketch.stroke(this.color.levels[0], this.color.levels[1], this.color.levels[2]);
        this.sketch.strokeWeight(2);
        this.sketch.noFill();
        this.sketch.ellipse(this.baseX, this.baseY, this.size + 10); // Outer ring
    }

    drawMapStar() {
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

        if (this.isSelected) {
            this.drawSelector();
        }
    }
}