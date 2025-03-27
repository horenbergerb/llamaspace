import { TextGeneratorOpenRouter } from '../text-gen-openrouter.js';

export class Anomaly {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.textGenerator = null;
        this.firstReport = null;
        this.properties = {
            originType: this.randomChoice(['organic', 'synthetic']),
            stability: this.randomChoice(['stable', 'volatile', 'decaying', 'fluctuating']),
            activityLevel: this.randomChoice(['dormant', 'active', 'reactive', 'unknown']),
            threatLevel: this.randomChoice(['none', 'low', 'moderate', 'high']),
            energySignature: this.randomChoice(['thermal', 'radioactive', 'psionic', 'gravitic', 'unknown']),
            temporalStatus: this.randomChoice(['present', 'phased', 'looping', 'out-of-sync']),
            composition: this.randomChoice(['biomatter', 'metallic', 'crystalline', 'liquid', 'plasma']),
            behavioralPattern: this.randomChoice(['stationary', 'mobile', 'orbiting', 'emergent']),
            signalType: this.randomChoice(['none', 'encoded', 'distress', 'broadcast', 'subliminal']),
            accessibility: this.randomChoice(['surface-level', 'buried', 'in orbit', 'interdimensional']),
            artifactAge: this.randomChoice(['ancient', 'recent', 'contemporary', 'indeterminate']),
            energyOutput: this.randomFloat(0, 1e6).toFixed(2), // in megawatts
            signalStrength: this.randomFloat(0, 100).toFixed(1), // arbitrary units
            radiationLevel: this.randomFloat(0, 500).toFixed(1), // mSv/h
            massEstimate: this.randomFloat(1, 1e9).toFixed(0), // in kg
            density: this.randomFloat(0.1, 50).toFixed(2), // g/cm^3
            ageEstimate: this.randomFloat(0, 1e6).toFixed(0), // in years
            anomalyIndex: this.randomFloat(0, 100).toFixed(1), // 0–100 scale
            temperature: this.randomFloat(-200, 10000).toFixed(1), // °C
            magneticFieldStrength: this.randomFloat(0, 1000).toFixed(2), // μT
            scanConfidence: this.randomFloat(50, 100).toFixed(1), // %
            spatialDistortion: this.randomFloat(0, 5).toFixed(2), // % deviation
            timeDisplacement: this.randomFloat(-300, 300).toFixed(1) // seconds
        };

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
        });
        
        // Request current state
        this.eventBus.emit('requestInventoryState');
        this.eventBus.emit('requestShuttlecraftState');
        
        // Wait for both responses
        await Promise.all([inventoryPromise, shuttlePromise]);

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

${orbitingBody.getDescription()}`;
    }

    async generateFirstReport(orbitingBody) {
        this.firstReport = "Scanning anomaly...";
        const commonPrompt = await this.getCommonScenarioPrompt(orbitingBody);

        const anomalyInfo = `
Anomaly Properties:
Origin Type: ${this.properties.originType}
Stability: ${this.properties.stability}
Activity Level: ${this.properties.activityLevel}
Threat Level: ${this.properties.threatLevel}
Energy Signature: ${this.properties.energySignature}
Temporal Status: ${this.properties.temporalStatus}
Composition: ${this.properties.composition}
Behavioral Pattern: ${this.properties.behavioralPattern}
Signal Type: ${this.properties.signalType}
Accessibility: ${this.properties.accessibility}
Artifact Age: ${this.properties.artifactAge}
Energy Output: ${this.properties.energyOutput} MW
Signal Strength: ${this.properties.signalStrength}
Radiation Level: ${this.properties.radiationLevel} mSv/h
Mass Estimate: ${this.properties.massEstimate} kg
Density: ${this.properties.density} g/cm³
Age Estimate: ${this.properties.ageEstimate} years
Anomaly Index: ${this.properties.anomalyIndex}
Temperature: ${this.properties.temperature}°C
Magnetic Field Strength: ${this.properties.magneticFieldStrength} μT
Scan Confidence: ${this.properties.scanConfidence}%
Spatial Distortion: ${this.properties.spatialDistortion}%
Time Displacement: ${this.properties.timeDisplacement} seconds`;

        const prompt = `${commonPrompt}

The ship has become aware of an anomaly on or near the body. These are some of the properties of the anomaly:

${anomalyInfo}

The crew of the Galileo does not necessarily know all of this. The bridge crew is completing preliminary scans of the anomaly. Write a single paragraph from the science officer to Captain Donald describing what they've found. The report should focus on what they can see paired with a few key measurements made by the science officer, focusing on the most significant and concerning aspects of the anomaly. Use creative license to make the anomaly interesting and mysterious.

Format your response as a single paragraph with no additional text or formatting. It's a verbal report only moments after the anomaly was detected.`;

        let reportText = '';
        try {
            await this.textGenerator.generateText(
                prompt,
                (text) => { reportText = text; },
                1.3, // Lower temperature for more focused output
                2000  // Max tokens
            );
            this.firstReport = reportText.trim();
            console.log('Anomaly report generated:', this.firstReport);
        } catch (error) {
            this.firstReport = null;
            console.error('Error generating anomaly report:', error);
        }
    }
}
  