import { MapBody } from './map-body.js';
import { Anomaly } from './anomaly.js';
import { TextGeneratorOpenRouter } from '../text-gen-openrouter.js';

export class MapPlanet extends MapBody {
    static recentDescriptions = []; // Static array to store last 5 descriptions

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
        if (this.anomaly !== null && !this.anomaly.detected){
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
                "granitic", "ferrous", "scarlet-hued", "shard-covered", "dust-choked", "tectonic-plateaus", "rind-like", "mineral-laced",
                "slag-lined", "fault-scored", "igneous-fused", "pebble-skinned", "shear-stressed", "rift-widened", "plate-boundary-marked",
                "folded-range", "impact-heated", "crust-sunken", "magmatic-choked", "ash-blanketed", "breccia-layered", "tilted-shelf",
                "collapsed-basin", "seismic-pitted", "obsidian-capped", "silica-crusted", "feldspar-rich", "lava-tunnel-riddled",
                "fissure-veined", "impact-glassed", "pyroclastic", "seared-flats", "gravel-choked", "boulder-ridden", "scar-torn",
                "irregular-terrained", "ridge-buckled", "iron-panned", "basin-collapsed", "mantle-upwelled", "stressed-ridgelines",
                "core-heavy", "fault-braided", "lava-seamed", "dome-scarred", "spine-crowned", "canyon-cut", "microfractured",
                "silicified", "geologically-active", "vein-stained", "metamorphic", "tectonically-folded", "sulfur-vented",
                "shale-layered", "batholithic"
            ],
            "Ocean": [
                "storm-wracked", "tidally-locked", "wave-tossed", "depthless", "hydrothermal", "mineral-rich", "pressure-crushed",
                "glacier-fed", "plankton-hazed", "algae-choked", "ever-dark", "bioluminescent", "maelstrom-prone", "ice-fringed",
                "monsoon-drenched", "sediment-swirled", "brine-heavy", "polar-swirled", "kelp-entangled", "subducted", "current-ripped",
                "eel-infested", "cloud-reflective", "super-saturated", "foam-banded", "vortex-riddled", "underlit", "oxygen-rich",
                "tsunami-scoured", "salinity-spiked", "whirlpool-ridden", "shallow-shelved", "aquaplaned", "thermal-pool-covered",
                "abyssal", "crater-lakes-dotted", "blue-shifted", "photic-layered", "tidal-resonant", "cyclonic", "wave-beaten",
                "oceanic-trench-scarred", "humid", "pressure-bubbled", "mirror-skinned", "undersea-mountainous", "ion-sprayed",
                "warmwater-veined", "floating-crusts",
                "kelp-forested", "cold-current-driven", "storm-drenched", "acidity-variable", "deoxygenated", "silt-heavy",
                "thermal-ridge-lined", "photosynthetically-active", "tidal-flooded", "gyre-spun", "vent-shrouded", "coral-reef-buried",
                "sonar-warping", "flood-basin-formed", "deep-eddy-trapped", "tidal-plume-veiled", "silicate-silted", "carbonate-enriched",
                "methane-cloaked", "chlorophyll-stained", "oxygenated-surface", "fathomless", "atoll-ringed", "mud-flushed",
                "algal-mirrored", "surface-churned", "trench-locked", "gyre-concentrated", "polar-basin-fed", "thermocline-defined",
                "glacier-bound", "eddy-fed", "supercritical", "warm-saline", "current-conflicted", "storm-ringed", "surface-dappled",
                "iceberg-littered", "permafrost-submerged", "ecologically-rich", "acoustically-deep", "turbidity-layered",
                "ion-sheared", "wave-trapped", "plate-margin-ringed", "thermal-layered", "floodplain-spread", "biological-jungle"
            ],
            "Gas Giant": [
                "striped", "swirled", "turbulent", "storm-belted", "radiation-heavy", "ion-rich", "hydrogen-thick", "ammonia-drenched",
                "magneto-dominant", "aurora-wreathed", "metallic-hydrogen-core", "pressure-stacked", "perpetually-dark", "cloud-mottled",
                "ring-shadowed", "cyclonic", "red-spotted", "glowing", "jet-stream-layered", "sunless-bright", "storm-eye-pocked",
                "banded", "plasma-pierced", "helium-crowned", "convection-dominant", "field-raked", "super-rotating", "layer-shifting",
                "fusion-core-theorized", "ballooned", "gravity-heavy", "phase-transitioned", "inner-core-unknown", "opaque",
                "storm-walled", "ionized", "hazy", "anti-cyclonic", "methane-colored", "gas-torn", "thunder-laced", "static-storm-prone",
                "windswept", "belt-encircled", "unstably-zoned", "convection-churned", "deep-atmosphere-dense", "horizonless", "seamless",
                "vortex-flecked",
                "equatorial-jetting", "chemically-segmented", "metallic-core-assumed", "infrared-bright", "sun-reflective",
                "light-bent", "thermal-band-hazed", "gravity-lensed", "storm-evolving", "shock-wave-pulsed", "ammonia-belted",
                "charged-layered", "roiling-clouded", "atmospheric-crashing", "gaseous-turbulence-wrapped", "resonance-laced",
                "giant-moon-orbited", "eclipse-darkened", "dense-clouded", "insolation-variable", "ultraviolet-lit", "rotationally-sped",
                "storm-shadowed", "multi-core-suspected", "convection-throttled", "gravitationally-skinned", "core-mystified",
                "corona-pulsing", "plasma-bursting", "photon-diffused", "gas-sculpted", "deuterium-rich", "hydrocarbon-swirled",
                "interior-melted", "storm-mirror-laced", "radiative-balanced", "zonal-flowing", "sun-haloed", "pulsing-bright",
                "deep-pressured", "vapor-layered", "nebula-shaded", "chemical-phase-shifted", "shock-belted", "infra-layered",
                "optically-thick", "unresolved-core"
            ],
            "Ice Giant": [
                "striped", "swirled", "turbulent", "storm-belted", "radiation-heavy", "ion-rich", "hydrogen-thick", "ammonia-drenched",
                "magneto-dominant", "aurora-wreathed", "metallic-hydrogen-core", "pressure-stacked", "perpetually-dark", "cloud-mottled",
                "ring-shadowed", "cyclonic", "red-spotted", "glowing", "jet-stream-layered", "sunless-bright", "storm-eye-pocked",
                "banded", "plasma-pierced", "helium-crowned", "convection-dominant", "field-raked", "super-rotating", "layer-shifting",
                "fusion-core-theorized", "ballooned", "gravity-heavy", "phase-transitioned", "inner-core-unknown", "opaque",
                "storm-walled", "ionized", "hazy", "anti-cyclonic", "methane-colored", "gas-torn", "thunder-laced", "static-storm-prone",
                "windswept", "belt-encircled", "unstably-zoned", "convection-churned", "deep-atmosphere-dense", "horizonless", "seamless",
                "vortex-flecked",
                "equatorial-jetting", "chemically-segmented", "metallic-core-assumed", "infrared-bright", "sun-reflective",
                "light-bent", "thermal-band-hazed", "gravity-lensed", "storm-evolving", "shock-wave-pulsed", "ammonia-belted",
                "charged-layered", "roiling-clouded", "atmospheric-crashing", "gaseous-turbulence-wrapped", "resonance-laced",
                "giant-moon-orbited", "eclipse-darkened", "dense-clouded", "insolation-variable", "ultraviolet-lit", "rotationally-sped",
                "storm-shadowed", "multi-core-suspected", "convection-throttled", "gravitationally-skinned", "core-mystified",
                "corona-pulsing", "plasma-bursting", "photon-diffused", "gas-sculpted", "deuterium-rich", "hydrocarbon-swirled",
                "interior-melted", "storm-mirror-laced", "radiative-balanced", "zonal-flowing", "sun-haloed", "pulsing-bright",
                "deep-pressured", "vapor-layered", "nebula-shaded", "chemical-phase-shifted", "shock-belted", "infra-layered",
                "optically-thick", "unresolved-core"
            ],
            "Desert": [
                "cracked", "basaltic", "scarred", "igneous", "shattered", "uplifted", "pockmarked", "granular", "faulted", "brittle",
                "quarried", "fractured", "cratered", "tumbled", "ridged", "lithified", "angular", "eroded", "porous", "barricaded",
                "tectonically-stressed", "acid-etched", "veined", "cobbled", "volcanic", "collapsed", "resurfaced", "rubble-strewn",
                "pulverized", "oxidized", "sulfur-stained", "gravity-twisted", "tidally-heaved", "basin-heavy", "geode-ridden",
                "layered", "silicate-rich", "weatherblasted", "mined-out", "tremor-prone", "magnetically-chaotic", "ridge-locked",
                "granitic", "ferrous", "scarlet-hued", "shard-covered", "dust-choked", "tectonic-plateaus", "rind-like", "mineral-laced",
                "slag-lined", "fault-scored", "igneous-fused", "pebble-skinned", "shear-stressed", "rift-widened", "plate-boundary-marked",
                "folded-range", "impact-heated", "crust-sunken", "magmatic-choked", "ash-blanketed", "breccia-layered", "tilted-shelf",
                "collapsed-basin", "seismic-pitted", "obsidian-capped", "silica-crusted", "feldspar-rich", "lava-tunnel-riddled",
                "fissure-veined", "impact-glassed", "pyroclastic", "seared-flats", "gravel-choked", "boulder-ridden", "scar-torn",
                "irregular-terrained", "ridge-buckled", "iron-panned", "basin-collapsed", "mantle-upwelled", "stressed-ridgelines",
                "core-heavy", "fault-braided", "lava-seamed", "dome-scarred", "spine-crowned", "canyon-cut", "microfractured",
                "silicified", "geologically-active", "vein-stained", "metamorphic", "tectonically-folded", "sulfur-vented",
                "shale-layered", "batholithic"
            ],
            "Weird": [
                "pockmarked", "ancient", "hollow", "patchworked", "outgassing", "recently-abandoned", "partially-collapsed",
                "tidally-scarred", "slowly-rotating", "atmospherically-leaking", "gravitationally-distorted", "orbital-debris-laced",
                "inverted", "crevasse-laced", "magnetically-polarized", "eclipsed", "impact-scarred", "deeply-eroded",
                "microfractured", "mantle-thin", "pressure-blistered", "surface-buckled", "mineral-rich", "geologically-dead",
                "overmined", "tectonically-deaf", "crust-warped", "sun-bleached", "core-unstable", "biofilm-coated", "sensor-resistant",
                "gravity-warped", "vacuum-venting", "outpost-remnant", "partially-terraformed", "xeno-inscribed", "deep-core-vented",
                "reactive", "permafrost-locked", "core-resonant", "spectrally-dense", "radiation-banded", "aurora-wrapped",
                "seismically-muted", "chemically-bleached", "slow-thawing", "geothermal-throbbing", "scar-tissued", "subsidence-prone",
                "mined-out", "monolith-dotted",
                "phase-locked", "rift-dominated", "core-venting", "isotope-laced", "thrumming", "surface-broken", "ice-veined",
                "sonar-disruptive", "ablation-worn", "volcanically-inert", "drainage-carved", "tectonic-remnant", "magma-pocketed",
                "silt-choked", "deep-sea-ridged", "tidal-locked", "fragment-orbiting", "catalytic", "slurry-covered",
                "plasma-etched", "desiccated", "borehole-pierced", "stellar-facing", "liminal", "spore-coated", "radio-noisy",
                "em-field-warped", "atmosphere-torn", "structurally-weakened", "overpressured", "cryogenically-fissured",
                "superconductive", "networked", "dust-mantled", "artifact-crusted", "data-scarred", "gravity-weighed",
                "thermal-bloomed", "helium-injected", "fusion-baked", "slush-layered", "impact-hollowed", "rotor-tilted",
                "pulse-echoed", "chem-reactive", "heavily-tilted", "debris-shadowed", "field-battered", "slow-cooling",
                "irradiated", "detritus-veined", "mineral-smeared", "crater-laced", "internally-shifting", "light-absorbing",
                "electromagnetically-warped", "ion-shrouded", "ultraviolet-blasted", "detonated", "hypersensitive",
                "siphoned", "crystalline-streaked", "sulfur-dusted", "tunneling-colony", "elevator-tethered", "planet-cut",
                "vortex-breached", "light-splitting", "drone-patrolled", "pulse-stabilized", "atmo-siphoned", "ice-dusted",
                "methane-seeped", "deep-mined", "lava-drained", "structurally-hollow", "thermal-scarred", "fossil-rich",
                "sand-choked", "decaying-orbit", "chem-layered", "spectrum-warped", "bacterial-slick", "terrain-scoured",
                "storm-etched", "stratified", "vibrationally-active", "wind-shaved", "ice-rafted", "magnetic-node-tied",
                "dead-core", "void-locked", "horizon-stretched", "spiral-fractured", "gravity-churned", "core-shedding",
                "cave-webbed", "telemetry-blinded", "luminous-flecked", "shard-infested", "collision-burdened", "em-field-jittered",
                "fractal-ridged", "sun-pulled", "thunder-blasted", "blackened", "sloped-fissured", "sonic-reflective",
                "tidally-dragged", "dark-core", "glow-bleached", "crust-collapsing", "rim-swept", "energy-buried", "signal-pierced",
                "heat-wrung", "fusion-vented", "repelling-core", "acid-bathed", "oxygen-purged", "carbon-choked", "flow-channeled",
                "crystal-perforated", "heavily-banded", "photon-absorbing", "aurora-splashed", "graviton-leaking",
                "collapsed-mantle", "magnetically-irradiated", "charged-core", "orbitally-chiseled", "shocked", "ring-shadowed",
                "planar-shifted", "tidal-node-laced", "slow-pulsing", "lava-blistered", "steam-burned", "geode-shelled",
                "mirror-ridged", "twisted-terrain", "regolith-piled", "lopsided", "cone-pocked", "low-albedo", "phase-wavering",
                "comet-scoured", "neutrino-stained", "isobar-spiked", "halo-crowned", "core-bloated", "airless-shadowed",
                "pulse-resonant", "slope-faulted", "glacier-cut", "snow-blasted", "flare-damaged", "phase-seamed", "axial-tilted",
                "particle-impacted", "cryovolcanic", "static-veined", "silica-drenched", "overvolted", "chasmic", "cradle-shaped",
                "wind-buried", "pit-latticed", "tidal-crushed", "emission-spiked", "plume-ejected", "refractive", "light-splashed",
                "hull-sliced", "entropic", "drone-sculpted", "gravimetric", "fracture-networked", "orbiting-husk", "settlement-scrubbed",
                "nocturnal-facing", "gas-leaking", "fire-veined", "coated-in-slag", "radiant-core", "oscillating", "cored-through",
                "surface-imploded", "dying-shell", "radially-scored", "gouged", "inward-crumbling", "tidal-constricted", "spin-ejected",
                "axial-precessing", "static-draped", "shattered-skinned", "rift-collared", "terminator-bound", "hydraulic-split",
                "oxygen-bleeding", "moon-battered", "sculpted-shell", "bright-albedo", "nested-rings", "rifted-cap", "dust-streaked",
                "canyon-crumpled", "expansion-cracked", "dimming", "oscillating-brightness", "terminally-cooling", "atmo-hammered",
                "sensor-ghosting", "artifact-sealed", "low-grav", "overpressured-mantle", "collapsing-subsurface", "ultra-magnetic",
                "tidally-entrained", "gravity-wrinkled", "brittle-horizon", "insulation-failed", "haze-bled", "sheared-equator",
                "ionized-stratosphere", "chiral-cracked", "subduction-buried", "impactor-plated", "ghost-ringed", "monochrome-lit"
            ]
        };        
        
        this.adjectives = '';
        // Select random adjectives with 90% chance of 1, 10% chance of 2
        let numAdjectives = Math.random() < 0.9 ? 1 : 2;
        if (numAdjectives == 0) {
            this.adjectives = 'N/A';
        } else if (this.bodyProperties.type in ['Rocky', 'Ocean', 'Gas Giant', 'Ice Giant', 'Desert']) {
            for (let i = 0; i < numAdjectives; i++) {
                const adjective = this.randomChoice(planetAdjectives[this.bodyProperties.type]);
                this.adjectives += `${adjective}, `;
            }
            this.adjectives = this.adjectives.slice(0, -2); // Remove the last comma and space
        } else {
            for (let i = 0; i < numAdjectives; i++) {
                const adjective = this.randomChoice(planetAdjectives['Weird']);
                this.adjectives += `${adjective}, `;
            }
            this.adjectives = this.adjectives.slice(0, -2); // Remove the last comma and space
        }

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
        const knownColors = {
            'Rocky': this.sketch.color(180, 120, 80),
            'Ocean': this.sketch.color(70, 130, 180),
            'Gas Giant': this.sketch.color(230, 180, 70),
            'Ice Giant': this.sketch.color(170, 210, 230),
            'Desert': this.sketch.color(210, 180, 140)
        };

        const type = this.bodyProperties.type;
    
        // If it's a known type, use the predefined color
        if (knownColors[type]) {
            return knownColors[type];
        }
    
        // Otherwise, generate a deterministic fallback color from the planet type string
        const hash = this.hashString(type);
        const hue = hash % 360;
        const saturation = 50 + (hash % 30); // 50–80%
        const brightness = 60 + (hash % 30); // 60–90%
    
        // Use HSB to RGB conversion for varied but pleasant colors
        this.sketch.colorMode(this.sketch.HSB);
        const fallbackColor = this.sketch.color(hue, saturation, brightness);
        this.sketch.colorMode(this.sketch.RGB); // reset to default
    
        return fallbackColor;
    }
    
    // Simple hash function for consistent color per type
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    generatePlanetType() {
        const types = ['Rocky', 'Ocean', 'Gas Giant', 'Ice Giant', 'Desert'];

        const weirdTypes = [
            "Lava", "Tundra", "Volcanic", "Canyon", "Mountainous",
            "Magma Seep", "Mud", "Crystal", "Shattered", "Plate", "Fissured", "Cratered", "Obsidian", "Seismic",
            "Storm", "Cloud", "Ash", "Mist", "Mirror", "Vapor", "Iridescent", "Radiant", "Twilight", "Aurora-drenched",
            "Hurricane", "Stratospheric", "Dense Atmosphere", "Lightless", "Reflective", "Hazy", "Windswept", "Superheated Air",
            "Glowing Sky", "Smog-covered",
            "Swamp", "Algal", "Water Ice", "Subglacial", "Rain", "Saline Ocean", "Tide-locked Ocean", "Shallow Sea",
            "Steam-covered", "Frozen Archipelago", "Hydrothermal", "Blue Giant", "Deep Ocean", "Brine Pool", "Flooded",
            "Floating Continent", "Bioluminescent Sea", "Geyser World", "Liquid Methane", "Subaqueous",
            "Jungle", "Fungal", "Lichenous", "Overgrown", "Xeno-bioforming", "Living Planet", "Coral World", "Bacterial Mat",
            "Mycelial", "Spore-drifting", "Pollen-dense", "Symbiotic", "Swarming", "Toxic Bloom", "Predatory Flora",
            "Sentient Ecosystem", "Terraforming-in-progress", "Rotting Jungle", "Carnivorous Forest", "Photosynthetic Plain",
            "Artificial", "Construct", "Computronium", "Machine", "Shellworld", "Orbital Ring", "Megastructure Core",
            "Dyson Husk", "Nanite Surface", "Clockwork", "Self-repairing", "Repurposed Moon", "City-Planet",
            "Sensor Array", "Satellite Swarm", "Decoy World", "Faked Surface", "Simulated Terrain", "Generator World",
            "Data Archive",
            "Tidally Locked", "Inverted", "Fractal", "Temporal Echo", "Haunted", "Echo World", "Dreamscape",
            "Phase-shifted", "Non-euclidean", "Event Horizon Edge", "Dimensionally Anchored", "Looped Time", "Soft Geometry",
            "Gravitation Lens", "Reverse Physics", "Whispering", "Cursed", "Isolated Pocket", "Paradoxical", "Hidden in Plain Sight",
            "Crystalline Shell", "Molten Mantle", "Floating Islands", "Crackled Surface", "Silicate Rain", "Obsidian Fields",
            "Permafrost Core", "Supercritical Oceans", "Glass Dunes", "Gemstone Plains", "Salt Flats", "Sulfur Plains",
            "Carbon Plateau", "Ionic Storm Region", "Magnetite Spires", "Frozen Core", "Compressed Core", "Mirror Dunes",
            "Fungal Forests", "Gas Ice Fields",
            "Forest Desert", "Ocean Crater", "Lava Jungle", "Ash Swamp", "Glacier Jungle", "Rain Crystal World",
            "Swarming Tundra", "Blooming Wastes", "Choked Wetlands", "Twilight Savanna", "Silent Ocean", "Hollow Jungle",
            "Night Vine Planet", "Whispering Rainforest", "Photosynthetic Desert", "Algae Mountains", "Cactus Basin",
            "Steam Caves", "Fossil Fields", "Buried Jungle",
            "Ruined World", "Godworld", "Worship Site Planet", "Sacrificial Moon", "Signal Shrine", "Ancient Lab World",
            "Cradle Planet", "Pilgrimage World", "Abandoned Dyson Node", "Buried Library", "Cursed Archive",
            "Ceremonial Ring World", "Planet of Statues", "Solar Monolith", "Colony Graveyard", "Memory Orbital",
            "Frozen Temple", "Timeworn Edifice", "Lost Relay", "Echoing Bridge World",
            "Causality-Broken", "Time-Stretched", "Gravitational Anomaly", "Space-Folded", "Stasis-Locked", "Echo Core Planet",
            "Phase-Mirrored", "Anomaly Attractor", "Dimensional Spillover", "Cosmic Ripple Planet", "Inertial-Suspended",
            "Event Layered", "Tachyon Fielded", "Chrono-Lagged", "Void-Bleed Surface", "Warp-Veined", "Slipstream-Cut Planet",
            "Entangled Matter World", "Quantum Shard", "Reality-Thinned",
            "Simulation Buffer", "AI Training Ground", "Substrate World", "Signal Processing Planet", "Power Bank Planet",
            "Terraforming Drone Hub", "Disguised Wreckage", "Orbital Cannon Shell", "Factory Core", "Blacksite Planet",
            "Decaying Network Node", "Autonomous Depot", "Drone Cloud World", "Data Farm Shell", "Failing Dyson Cap",
            "Thermal Battery Planet", "Listening Post Remnant", "Bio-Lab Core", "Archive Shard", "Lost Experiment Planet"
          ];

        let isWeird = Math.random() < 0.2;
        if (isWeird) {
            return this.randomChoice(weirdTypes);
        }
          
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

        // Draw planet with glow effect if there are unviewed missions
        if (this.missions.some(mission => !mission.viewed)) {
            this.sketch.noStroke();
            this.sketch.colorMode(this.sketch.RGB); // Ensure we're in RGB mode
            // Draw glow layers from largest to smallest
            for (let i = 5; i > 0; i--) {
                let alpha = 60 - i * 12; // Increased opacity for better visibility
                this.sketch.fill(255, 165, 0, alpha); // Orange glow color
                this.sketch.ellipse(this.baseX, this.baseY, this.size + i * 2);
            }
        }

        // Draw anomaly indicator if planet has an anomaly and it has been reported
        if (this.anomaly !== null && this.anomaly.detected) {
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
            const xOffset = this.anomaly !== null && this.anomaly.detected ? 15 : 0;
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

    getDescription(includeResources = true) {
        return `Planet Name: ${this.name}\n` +
               `Type: ${this.bodyProperties.type}\n` +
               `Mass: ${this.bodyProperties.mass.toFixed(2)} Earth masses\n` +
               `Radius: ${this.bodyProperties.radius.toFixed(2)} Earth radii\n` +
               `Temperature: ${Math.round(this.bodyProperties.temperature)}K\n` +
               `Atmosphere: ${this.bodyProperties.atmosphere}\n` +
               `Moons: ${this.bodyProperties.hasMoons ? this.bodyProperties.numberOfMoons : "None"}\n` +
               `Rings: ${this.bodyProperties.hasRings ? "Yes" : "No"}\n` +
               `Habitability: ${this.bodyProperties.habitability}\n` +
               `${includeResources ? `Resources: ${this.bodyProperties.resources.join(", ")}\n` : ""}`;
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

        if (!(this.bodyProperties.type in ['Rocky', 'Ocean', 'Gas Giant', 'Ice Giant', 'Desert']))
            level = Math.max(level, 3);

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
        let recentReportsSection = '';
        if (MapPlanet.recentDescriptions.length > 0) {
            recentReportsSection = '\nRecent planetary reports from other systems:\n' +
                MapPlanet.recentDescriptions.map(desc => `- ${desc}`).join('\n') + '\n';
        }

        return `This is for a roleplaying game focused on space exploration. The game is serious with hints of humor in the vein of Douglas Adams's "The Hitchhiker's Guide to the Galaxy."

The player is Donald, captain of a small starship known as the Galileo. The Galileo is on a research mission in a remote part of the galaxy. The starship is similar in capabilities to the Federation starship Enterprise from Star Trek, albeit smaller and lower quality (it's one of the oldest ships in the fleet). It was designed for a crew of 15.

The Galileo is equipped with standard research equipment and meagre weaponry. It has a small replicator and two shuttlecraft. It has most of the resources needed to sustain a crew of 15 for a year.

Donald, his ship, and his crew are all nobodies. Donald's promotion to captain was something of a nepotism scandal. His crew is composed of misfits and those with complicated pasts in the service. The ship itself is old and worn out, but everyone on board is used to getting the short end of the stick. This research mission to the D-124 star system is an exile, but it's also a chance for the entire crew to redeem themselves.

The science officer is responsible for writing reports on the planets they visit in the ship's log.
${recentReportsSection}

The ship is orbiting a planet named ${this.name} in the ${this.parentStar.name} system.

Here is some information about the planet:

${this.getDescription(false)}`;
    }

    async generateDescription() {
        if (this.description) return this.description;
        
        this.description = "Scanning planet...";
        const commonPrompt = await this.getCommonScenarioPrompt(false);

        const prompt = `${commonPrompt}

The ship has completed its initial scan of the planet. These are some descriptors of the planet:

Descriptors: ${this.adjectives}

This planet has a weirdness level of ${this.generateWeirdnessLevel()}

The science officer is preparing their first report about this planet. Write two or three sentences from the science officer describing what they've found. The report should focus on the visual features and notable characteristics of the planet, making it feel unique and interesting. Use creative license to make the planet feel alive and mysterious, but keep it grounded in the scientific data available, and don't make it sound too fantastical. This report should be totally distinct from the recent reports on other planets.

Format your response as two or three sentences with no additional text or formatting. It's a quick note in the ship's log only moments after the initial scan was completed.`;

        try {
            await this.textGenerator.generateText(
                prompt,
                (text) => { this.description = text; },
                1.3,
                2000  // Max tokens
            );
            // Update the static array of recent descriptions
            MapPlanet.recentDescriptions.unshift(this.description);
            // Keep only the last 5 descriptions
            MapPlanet.recentDescriptions = MapPlanet.recentDescriptions.slice(0, 10);

            console.log('Planet description generated:', this.description);
        } catch (error) {
            this.description = null;
            console.error('Error generating planet description:', error);
        }
    }
} 