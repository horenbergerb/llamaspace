import { MapBody } from './map-body.js';
import { Anomaly } from './anomaly.js';
import { TextGeneratorOpenRouter } from '../text-gen-openrouter.js';

export class MapPlanet extends MapBody {
    constructor(sketch, parentStar, orbitIndex, eventBus) {
        super(sketch);
        this.parentStar = parentStar;
        this.orbitIndex = orbitIndex; // Used to determine orbit radius
        this.isPlanet = true;
        this.missions = [];
        this.eventBus = eventBus;
        this.textGenerator = null;
        this.description = null;
        this.adjectives = null;
        
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

        this.sketch.registerMethod('pre', () => {
            this.missions.forEach(mission => mission.update());
        });

        // Subscribe to API key updates
        this.eventBus.on('apiKeyUpdated', (apiKey) => {
            this.textGenerator = new TextGeneratorOpenRouter(apiKey);
        });
    }

    scanForAnomalies(){
        if (this.anomaly !== null && this.anomaly.firstReport === null){
            this.parentStar.anomaliesDetected = true;
            this.anomaly.generateFirstReport(this);
        }
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

        const planetAdjectives = {
            "Rocky": [
              "cracked", "basaltic", "scarred", "igneous", "shattered", "uplifted", "pockmarked", "granular", "faulted", "brittle",
              "quarried", "fractured", "cratered", "tumbled", "ridged", "lithified", "angular", "eroded", "porous", "barricaded",
              "tectonically-stressed", "acid-etched", "veined", "cobbled", "volcanic", "collapsed", "resurfaced", "rubble-strewn",
              "pulverized", "oxidized", "sulfur-stained", "gravity-twisted", "tidally-heaved", "basin-heavy", "geode-ridden",
              "layered", "silicate-rich", "weatherblasted", "mined-out", "tremor-prone", "magnetically-chaotic", "ridge-locked",
              "granitic", "ferrous", "scarlet-hued", "shard-covered", "dust-choked", "tectonic-plateaus", "rind-like", "mineral-laced"
            ],
            "Ocean": [
              "storm-wracked", "tidally-locked", "wave-tossed", "depthless", "hydrothermal", "mineral-rich", "pressure-crushed",
              "glacier-fed", "plankton-hazed", "algae-choked", "ever-dark", "bioluminescent", "maelstrom-prone", "ice-fringed",
              "monsoon-drenched", "sediment-swirled", "brine-heavy", "polar-swirled", "kelp-entangled", "subducted", "current-ripped",
              "eel-infested", "cloud-reflective", "super-saturated", "foam-banded", "vortex-riddled", "underlit", "oxygen-rich",
              "tsunami-scoured", "salinity-spiked", "whirlpool-ridden", "shallow-shelved", "aquaplaned", "thermal-pool-covered",
              "abyssal", "crater-lakes-dotted", "blue-shifted", "photic-layered", "tidal-resonant", "cyclonic", "wave-beaten",
              "oceanic-trench-scarred", "humid", "pressure-bubbled", "mirror-skinned", "undersea-mountainous", "ion-sprayed",
              "warmwater-veined", "floating-crusts"
            ],
            "Gas Giant": [
              "striped", "swirled", "turbulent", "storm-belted", "radiation-heavy", "ion-rich", "hydrogen-thick", "ammonia-drenched",
              "magneto-dominant", "aurora-wreathed", "metallic-hydrogen-core", "pressure-stacked", "perpetually-dark", "cloud-mottled",
              "ring-shadowed", "cyclonic", "red-spotted", "glowing", "jet-stream-layered", "sunless-bright", "storm-eye-pocked",
              "banded", "plasma-pierced", "helium-crowned", "convection-dominant", "field-raked", "super-rotating", "layer-shifting",
              "fusion-core-theorized", "ballooned", "gravity-heavy", "phase-transitioned", "inner-core-unknown", "opaque",
              "storm-walled", "ionized", "hazy", "anti-cyclonic", "methane-colored", "gas-torn", "thunder-laced", "static-storm-prone",
              "windswept", "belt-encircled", "unstably-zoned", "convection-churned", "deep-atmosphere-dense", "horizonless", "seamless",
              "vortex-flecked"
            ],
            "Ice Giant": [
              "slate-blue", "methane-rich", "diamond-raining", "frost-veiled", "deep-cooled", "glacial-cored", "cloud-smooth",
              "methane-hazy", "ice-shelled", "haloed", "rayless", "subzero-windswept", "polar-jetted", "dimly-reflective",
              "silence-encased", "slow-rotating", "mirror-frosted", "internal-heating", "gaseous-icebound", "ammonia-tinted",
              "weatherless", "internal-stormed", "exosphere-heavy", "quiet-ringed", "subsurface-churning", "polar-vortex-trapped",
              "aurora-burned", "sun-far", "diamond-patched", "glowless", "mildly-tilted", "mantle-frozen", "isothermal",
              "refracted-light-skinned", "icy-gaseous", "moatless", "light-scattering", "deep-shadowed", "stratospheric", "blue-hued",
              "ammonia-laced", "ice-pelleted", "heat-trapped", "frictionless", "cooled-core", "mantle-opaque", "storm-shrouded",
              "ice-banded", "neon-ghosted", "plasma-silent"
            ],
            "Desert": [
              "dust-drenched", "heat-blasted", "parched", "horizonless", "mirage-prone", "sand-swept", "iron-rich", "scarred-dunes",
              "wind-carved", "salt-flaked", "solar-baked", "arid", "sun-cracked", "dry-cored", "dune-migrated", "cinder-flecked",
              "plateau-laced", "ash-covered", "glassified", "solar-flared", "scorch-shaded", "dry-seabed", "boulder-strewn",
              "desiccated", "semi-molten", "badland-textured", "slag-stained", "thermal-vented", "flare-blasted", "crust-buckled",
              "light-scorched", "carbon-scarred", "brimstone-colored", "canyon-choked", "superheated", "mirage-patched", "oxygen-void",
              "withered", "hyperarid", "alkali-crusted", "obsidian-laced", "crag-ridden", "silica-blasted", "magnesium-pocked",
              "stonewaved", "subducted-surface", "heat-pulsed", "flash-fried", "sodium-riddled", "light-sheared"
            ]
          };
          


        
        // Select two random adjectives and join them
        const firstAdjective = this.randomChoice(planetAdjectives[this.bodyProperties.type]);
        const secondAdjective = this.randomChoice(planetAdjectives[this.bodyProperties.type]);
        this.adjectives = `${firstAdjective}, ${secondAdjective}`;

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

        // Draw anomaly indicator if planet has an anomaly and it has been reported
        if (this.anomaly !== null && this.anomaly.firstReport !== null) {
            this.sketch.noStroke();
            this.sketch.fill(255, 0, 0); // Red color for the indicator
            this.sketch.textSize(12);
            this.sketch.textAlign(this.sketch.LEFT, this.sketch.TOP);
            this.sketch.text('A', this.baseX - this.size - 5, this.baseY - this.size - 5);
        }

        // Draw exclamation point indicator for unviewed missions
        if (this.missions.some(mission => !mission.viewed)) {
            this.sketch.noStroke();
            this.sketch.fill(255, 165, 0); // Orange color for the mission indicator
            this.sketch.textSize(12);
            this.sketch.textAlign(this.sketch.LEFT, this.sketch.TOP);
            // Position the exclamation point to the right of the anomaly indicator if it exists
            const xOffset = this.anomaly !== null && this.anomaly.firstReport !== null ? 15 : 0;
            this.sketch.text('!', this.baseX - this.size - 5 + xOffset, this.baseY - this.size - 5);
        }
        
        if (this.isSelected) {
            this.drawSelector();
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

    randomChoice(options) {
        return options[Math.floor(Math.random() * options.length)];
    }

    generateWeirdnessLevel() {
        const rand = Math.random() * 100; // Random number between 0 and 100
        let level;
        if (rand < 60) level = 1;      // 60% chance
        else if (rand < 85) level = 2; // 25% chance
        else if (rand < 96) level = 3; // 11% chance
        else if (rand < 99) level = 4; // 3% chance
        else level = 5;                // 1% chance

        const descriptors = {
            1: "boring",
            2: "slightly unusual",
            3: "notable",
            4: "strange",
            5: "bizarre"
        };

        return `${level}/5 (${descriptors[level]})`;
    }

    async getCommonScenarioPrompt() {
        return `This is for a roleplaying game focused on space exploration. The game is serious with hints of humor in the vein of Douglas Adams's "The Hitchhiker's Guide to the Galaxy."

The player is Donald, captain of a small starship known as the Galileo. The Galileo is on a research mission in a remote part of the galaxy. The starship is similar in capabilities to the Federation starship Enterprise from Star Trek, albeit smaller and lower quality (it's one of the oldest ships in the fleet). It was designed for a crew of 15.

The Galileo is equipped with standard research equipment and meagre weaponry. It has a small replicator and two shuttlecraft. It has most of the resources needed to sustain a crew of 15 for a year.

Donald, his ship, and his crew are all nobodies. Donald's promotion to captain was something of a nepotism scandal. His crew is composed of misfits and those with complicated pasts in the service. The ship itself is old and worn out, but everyone on board is used to getting the short end of the stick. This research mission to the D-124 star system is an exile, but it's also a chance for the entire crew to redeem themselves.

The ship is orbiting a planet named ${this.name} in the ${this.parentStar.name} system.

Here is some information about the planet:

${this.getDescription()}`;
    }

    async generateDescription() {
        if (this.description) return this.description;
        
        this.description = "Scanning planet...";
        const commonPrompt = await this.getCommonScenarioPrompt();

        const prompt = `${commonPrompt}

The ship has completed its initial scan of the planet. These are some descriptors of the planet:

Descriptors: ${this.adjectives}

This planet has a weirdness level of ${this.generateWeirdnessLevel()}

The science officer is preparing their first report about this planet. Write three or four sentences from the science officer to Captain Donald describing what they've found. The report should focus on the most striking visual features and notable characteristics of the planet, making it feel unique and interesting. Use creative license to make the planet feel alive and mysterious, but keep it grounded in the scientific data available, and don't make it sound too fantastical.

Format your response as a single paragraph with no additional text or formatting. It's a verbal report only moments after the initial scan was completed.`;

        try {
            await this.textGenerator.generateText(
                prompt,
                (text) => { this.description = text; },
                1.3,
                2000  // Max tokens
            );
            this.description = this.description.trim();
            console.log('Planet description generated:', this.description);
        } catch (error) {
            this.description = null;
            console.error('Error generating planet description:', error);
        }
    }
} 