import { TextGeneratorOpenRouter } from '../text-gen-openrouter.js';

export class Anomaly {
    static recentReports = []; // Static array to store last 10 anomaly reports

    constructor(eventBus) {
        this.eventBus = eventBus;
        this.textGenerator = null;
        this.firstReport = null;
        this.severity = null;
        this.adjectives = null;
        this.reportStyle = {};

        const severities = ["minor (interesting but not substantial, research is optional)", "standard (quite unusual; clearly merits research)", "major (totally unprecedented; could have major implications. Research is required.)"];
        const severityWeights = [0.7, 0.2, 0.1]; // 70% minor, 20% standard, 10% major
        const randomValue = Math.random();
        let cumulativeWeight = 0;
        for (let i = 0; i < severityWeights.length; i++) {
            cumulativeWeight += severityWeights[i];
            if (randomValue <= cumulativeWeight) {
                this.severity = severities[i];
                break;
            }
        }

        const anomalyAdjectives = [
            "crystalline", "sentinel-like", "metallic", "dormant", "alien", "self-repairing", "sunken",
            "hollow", "photosynthetic", "pulsing", "fibrous", "microscopic", "population", "intelligent",
            "orbiting", "herd", "geometric", "disguised", "monolithic", "modular", "fractal", "repeating",
            "buried", "emergent", "signal-emitting", "shifting", "bioluminescent", "decaying",
            "semi-sentient", "entangled", "exoskeletal", "fronded", "spore-producing", "reactive",
            "camouflaged", "drifting", "burgeoning", "subterranean", "symbiotic", "networked", "encoded",
            "replicating", "anchored", "cyclical", "rhythmic", "invasive", "cracked", "latticed",
            "calcified", "irregular", "echoing", "dispersed", "stratified", "spindly", "orbital",
            "localized", "intermittent",
        
            "antigravitic", "ceremonial", "grafted", "recursive", "probabilistic", "petrified", "sibilant",
            "vascular", "lantern-like", "ossified", "fungal", "inflated", "etched", "iridescent",
            "asymmetrical", "sharded", "gravitic", "tethered", "vocal", "conical", "jittering", "oozing",
            "cratered", "brittle", "glyphic", "vined", "spiraled", "inverted", "forked", "luminous",
            "bubbling", "planar", "dusted", "barbed", "magnetized", "reflective", "spindled", "segmented",
            "pocketed", "transparent", "conjoined", "cruciform", "staggered", "distorted", "hive-like",
            "withered", "veined", "laminated", "seared", "tumescent", "helical", "hovering", "polyhedral",
            "refractive", "twitching", "radiant", "perforated", "knotted", "sprawling", "stenchful",
            "slithering",
        
            "glistening", "cavernous", "ringed", "migratory", "crackling", "sheathed", "hairlike",
            "pitted", "jagged", "mottled", "twinned", "blistered", "fragmentary", "vibratory",
            "collapsing", "amorphous", "recoiling", "encrusted", "resonant", "honeycombed", "webbed",
            "irregularly-pulsed", "evaporating", "gaseous", "pyramidal", "speckled", "dormitory-like",
            "mirror-surfaced", "eyed", "shell-like", "interlaced", "shingled", "emitting-hum", "baroque",
            "imprinted", "void-touched", "crystallizing", "magnetized-core", "repellent", "lichenous",
            "petrifying", "lamellar", "threaded", "feathered", "ciliated", "spindled", "braided",
            "brachiated", "embossed", "humming", "tessellated", "pancaked", "vaporous", "semi-molten",
            "engraved", "frozen-mid-action", "orb-webbed", "hypersaturated", "smeared", "liquescent",
            "eclipsed", "shell-fragmented", "knuckled", "cradled", "gutted", "fossilized",
            "compartmentalized", "harboring", "scaffolded", "dappled", "straining", "speared", "tenuous",
            "braided-root", "quilled", "nested", "tapered", "cocooned", "clotted", "scarred", "plated",
            "gilled", "percussive", "periscopic", "snarled", "reef-like", "seamed", "apertured", "venting",
            "droplet-like", "shingled", "severed", "grooved", "bifurcated", "writhing", "infested",
            "abandoned", "droning", "interwoven", "calciferous", "flaring", "crawling", "rippled",
            "engulfing", "blooming", "murmuring", "pulsatile", "wrinkled", "woven", "convex", "divergent",
            "clouded", "vined", "incised", "auroral"
        ];

        // Select one or two random adjectives and join them
        let numAdjectives = Math.floor((Math.random() * 2) + 1);
        for (let i = 0; i < numAdjectives; i++) {
            const adjective = this.randomChoice(anomalyAdjectives);
            this.adjectives += `${adjective}, `;
        }
        this.adjectives = this.adjectives.slice(0, -2); // Remove the last comma and space
        
        const locations = [
            "on the surface",
            "in the atmosphere",
            "in the subsurface",
            "deep within the planet",
            "in orbit"
        ];

        this.location = this.randomChoice(locations);

        const reportStyleHints = [
            // 🎭 Style / Voice
            "The science officer has a flair for metaphor and rarely speaks in plain terms.",
            "The officer prefers concise, emotionally neutral phrasing, but often slips in dry humor.",
            "Reports are often tinged with philosophical musing, especially when anomalies defy classification.",
            "The science officer tends to frame observations as open questions or thought experiments.",
            "The officer avoids stock phrases and strives to describe anomalies in new and evocative ways.",
            "The science officer is known for theatrical flair—sometimes to the annoyance of the crew.",
            "Reports typically begin with the most striking visual detail, even if it's not the most relevant.",
            "The officer prefers stream-of-consciousness observations, letting raw impressions guide the report.",
            "The science officer despises clichés and takes pride in crafting unique, vivid descriptions.",
            "When reporting anomalies, the officer often draws comparisons to myths, literature, or art.",
          
            // 🧠 Psychological / Emotional Angle
            "The officer's voice trembles slightly when faced with the unknown, but they keep speaking.",
            "This officer tries to mask awe with professionalism, but it leaks into the opening line.",
            "The science officer occasionally lets personal bias color their initial summary.",
            "The crew's unease often bleeds into the science officer's tone, especially when anomalies feel \"wrong.\"",
            "The science officer is calm and clinical, but sometimes a hint of reverence seeps through.",
            "Reports tend to mirror the officer's mood more than the anomaly's threat level.",
            "When anomalies disturb the officer deeply, they start with sensory impressions rather than data.",
          
            // 📡 Procedural / Contextual
            "The science officer was caught off-guard mid-scan and is improvising this first assessment.",
            "This anomaly was spotted during an unscheduled system check; the officer is still making sense of it.",
            "The officer begins this report based on only partial data, with confidence in their intuition.",
            "Anomaly scans are incomplete, but the officer is compelled to share what they've seen.",
            "The anomaly revealed itself suddenly, prompting an unusually instinctive reaction from the science officer.",
            "This is the officer's third anomaly report of the day—they're tired, but this one feels different.",
            "The officer has just returned from a shuttle survey and is still shaking off what they saw."
          ];

          
        this.reportStyleHint = this.randomChoice(reportStyleHints);

        // Add report style properties with 1/8 chance each
        const reportStyleProperties = {
            detectionMethod: ['routine scan', 'anomaly alert', 'crew observation', 'sensor malfunction', 'distress signal'],
            anomalyVisibility: ['immediate', 'phased in', 'gradual', 'masked'],
            reportTone: ['professional', 'concerned', 'excited', 'cautious', 'confused', 'alarmed'],
            crewReaction: ['curious', 'nervous', 'fascinated', 'apprehensive', 'confident', 'overwhelmed'],
            scienceOfficerStyle: ['by-the-book', 'sarcastic', 'overly poetic', 'paranoid', 'curt', 'excitable'],
            reportFormat: ['direct observation', 'theory summary', 'stream of consciousness', 'technical log', 'fragmented']
        };

        for (const [key, options] of Object.entries(reportStyleProperties)) {
            if (Math.random() < 0.2) { // 1/8 chance
                this.reportStyle[key] = this.randomChoice(options);
            }
        }

        // Add variables needed for getCommonScenarioPrompt
        this.currentInventory = {}; // Store current inventory state
        this.shuttleStatus = []; // Store current shuttle status

        // Subscribe to API key updates
        this.eventBus.on('apiKeyUpdated', (apiKey) => {
            this.textGenerator = new TextGeneratorOpenRouter(apiKey);
        });
    }
  
    randomChoice(options) {
        return options[Math.floor(Math.random() * options.length)];
    }
  
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    async getCommonScenarioPrompt(orbitingBody) {
        let bodyContext = '';

        // Only planets have a parent star
        if (!orbitingBody.parentStar) {
            bodyContext = `The ship is orbiting a star named ${orbitingBody.name}. `;
        } else {
            bodyContext = `The ship is orbiting a planet named ${orbitingBody.name} in the ${orbitingBody.parentStar.name} system. `;
        }

        // Get current inventory and shuttle status through event bus
        // Create promise to wait for inventory response
        const inventoryPromise = new Promise(resolve => {
            const inventoryHandler = (inventory) => {
                this.currentInventory = inventory;
                this.eventBus.off('inventoryChanged', inventoryHandler);
                resolve();
            };
            this.eventBus.on('inventoryChanged', inventoryHandler);
        });
        
        // Create promise to wait for shuttlecraft response
        const shuttlePromise = new Promise(resolve => {
            const shuttleHandler = (shuttles) => {
                this.shuttleStatus = shuttles;
                this.eventBus.off('shuttlecraftChanged', shuttleHandler);
                resolve();
            };
            this.eventBus.on('shuttlecraftChanged', shuttleHandler);
            resolve();
        });
        
        // Request current state
        this.eventBus.emit('requestInventoryState');
        this.eventBus.emit('requestShuttlecraftState');
        
        // Wait for both responses
        await Promise.all([inventoryPromise, shuttlePromise]);

        // Add recent anomaly reports section if any exist
        let recentReportsSection = '';
        if (Anomaly.recentReports.length > 0) {
            recentReportsSection = '\nRecent anomaly reports from other systems:\n' +
                Anomaly.recentReports.map(report => `- ${report}`).join('\n') + '\n';
        }

        return `This is for a roleplaying game focused on space exploration. The game is serious with hints of humor in the vein of Douglas Adams's "The Hitchhiker's Guide to the Galaxy."

The player is Donald, captain of a small starship known as the Galileo. The Galileo is on a research mission in a remote part of the galaxy. The starship is similar in capabilities to the Federation starship Enterprise from Star Trek, albeit smaller and lower quality (it's one of the oldest ships in the fleet). It was designed for a crew of 15.

The Galileo is equipped with standard research equipment and meagre weaponry. It has a small replicator and two shuttlecraft. It has most of the resources needed to sustain a crew of 15 for a year.

Current Ship Status:
Inventory:
${Object.entries(this.currentInventory).map(([item, amount]) => `- ${item}: ${amount} available`).join('\n')}

Shuttlecraft:
${this.shuttleStatus.map(shuttle => `- ${shuttle.name}: ${shuttle.health} health`).join('\n')}

Donald, his ship, and his crew are all nobodies. Donald's promotion to captain was something of a nepotism scandal. His crew is composed of misfits and those with complicated pasts in the service. The ship itself is old and worn out, but everyone on board is used to getting the short end of the stick. This research mission to the D-124 star system is an exile, but it's also a chance for the entire crew to redeem themselves.

${bodyContext}

Here is some information about the body the ship is orbiting:

${orbitingBody.getDescription()}

${orbitingBody.description ? `Planet Description:\n${orbitingBody.description}` : ''}${recentReportsSection}`;
    }

    async generateFirstReport(orbitingBody) {
        await orbitingBody.generateDescription();

        this.firstReport = "Scanning anomaly...";
        const commonPrompt = await this.getCommonScenarioPrompt(orbitingBody);

        // Only include properties that were actually defined
        const anomalyInfo = null;

        // Add report style context if any are defined
        const reportStyleContext = [];
        if (this.reportStyle.detectionMethod) {
            reportStyleContext.push(`The anomaly was detected through ${this.reportStyle.detectionMethod}.`);
        }
        if (this.reportStyle.anomalyVisibility) {
            reportStyleContext.push(`The anomaly's visibility status is ${this.reportStyle.anomalyVisibility}.`);
        }
        if (this.reportStyle.reportTone) {
            reportStyleContext.push(`The science officer's report should be ${this.reportStyle.reportTone} in tone.`);
        }
        if (this.reportStyle.crewReaction) {
            reportStyleContext.push(`The crew is feeling ${this.reportStyle.crewReaction} about the discovery.`);
        }
        if (this.reportStyle.scienceOfficerStyle) {
            reportStyleContext.push(`The science officer is known for their ${this.reportStyle.scienceOfficerStyle} approach.`);
        }
        if (this.reportStyle.reportFormat) {
            reportStyleContext.push(`The report should be ${this.reportStyle.reportFormat} in format.`);
        }

        const prompt = `${commonPrompt}
The ship has become aware of an anomaly on or near the body. These are some of the properties of the anomaly:

Severity: ${this.severity}
Descriptors: ${this.adjectives}
Location: ${this.location}
${reportStyleContext.length > 0 ? `Additional Context:\n${reportStyleContext.join('\n')}\n` : ''}
The crew of the Galileo does not necessarily know all of this. The bridge crew is completing preliminary scans of the anomaly. Write two or three sentences from the science officer to Captain Donald describing what they've found. The report should focus on what they can see and, optionally, a few key measurements made by the science officer, focusing on the most significant and concerning aspects of the anomaly. Use creative license to make the anomaly interesting and mysterious, but make it tangible and believable. This report should be totally distinct from the recent reports on other anomalies, and the delivery should be unique.

${this.reportStyleHint}

Format your response as two or thre sentences with no additional text or formatting. It's a verbal report only moments after the anomaly was detected.`;

        try {
            await this.textGenerator.generateText(
                prompt,
                (text) => { this.firstReport = text; },
                1.3, // Lower temperature for more focused output
                2000  // Max tokens
            );
            Anomaly.recentReports.unshift(this.firstReport);                    // Keep only the last 10 reports
            Anomaly.recentReports = Anomaly.recentReports.slice(0, 10);
            console.log('Anomaly report generated:', this.firstReport);
        } catch (error) {
            this.firstReport = null;
            console.error('Error generating anomaly report:', error);
        }
    }
}
  