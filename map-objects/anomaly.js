import { TextGeneratorOpenRouter } from '../text-gen-openrouter.js';

export class Anomaly {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.textGenerator = null;
        this.firstReport = null;
        this.properties = {};

        // Define all possible properties with their options
        const propertyDefinitions = {
            originType: ['organic', 'synthetic'],
            stability: ['stable', 'volatile', 'decaying', 'fluctuating'],
            activityLevel: ['dormant', 'active', 'reactive', 'unknown'],
            threatLevel: ['none', 'low', 'moderate', 'high'],
            energySignature: ['thermal', 'radioactive', 'psionic', 'gravitic', 'unknown'],
            temporalStatus: ['present', 'phased', 'looping', 'out-of-sync'],
            composition: ['biomatter', 'metallic', 'crystalline', 'liquid', 'plasma'],
            behavioralPattern: ['stationary', 'mobile', 'orbiting', 'emergent'],
            signalType: ['none', 'encoded', 'distress', 'broadcast', 'subliminal'],
            accessibility: ['surface-level', 'buried', 'in orbit', 'interdimensional'],
            artifactAge: ['ancient', 'recent', 'contemporary', 'indeterminate']
        };

        // Add each property with 1/6 chance
        for (const [key, options] of Object.entries(propertyDefinitions)) {
            if (Math.random() < 0.167) { // 1/6 chance
                this.properties[key] = this.randomChoice(options);
            }
        }

        // Add numerical properties with 1/6 chance each
        const numericalProperties = {
            energyOutput: { min: 0, max: 1e6, unit: 'MW', decimals: 2 },
            signalStrength: { min: 0, max: 100, unit: '', decimals: 1 },
            radiationLevel: { min: 0, max: 500, unit: 'mSv/h', decimals: 1 },
            massEstimate: { min: 1, max: 1e9, unit: 'kg', decimals: 0 },
            density: { min: 0.1, max: 50, unit: 'g/cm³', decimals: 2 },
            ageEstimate: { min: 0, max: 1e6, unit: 'years', decimals: 0 },
            anomalyIndex: { min: 0, max: 100, unit: '', decimals: 1 },
            temperature: { min: -200, max: 10000, unit: '°C', decimals: 1 },
            magneticFieldStrength: { min: 0, max: 1000, unit: 'μT', decimals: 2 },
            scanConfidence: { min: 50, max: 100, unit: '%', decimals: 1 },
            spatialDistortion: { min: 0, max: 5, unit: '%', decimals: 2 },
            timeDisplacement: { min: -300, max: 300, unit: 'seconds', decimals: 1 }
        };

        for (const [key, config] of Object.entries(numericalProperties)) {
            if (Math.random() < 0.167) { // 1/6 chance
                this.properties[key] = this.randomFloat(config.min, config.max).toFixed(config.decimals);
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

        // Only include properties that were actually defined
        const anomalyInfo = Object.entries(this.properties)
            .map(([key, value]) => {
                // Format the key to be more readable
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                
                // Add units for numerical properties
                const units = {
                    energyOutput: ' MW',
                    signalStrength: '',
                    radiationLevel: ' mSv/h',
                    massEstimate: ' kg',
                    density: ' g/cm³',
                    ageEstimate: ' years',
                    anomalyIndex: '',
                    temperature: '°C',
                    magneticFieldStrength: ' μT',
                    scanConfidence: '%',
                    spatialDistortion: '%',
                    timeDisplacement: ' seconds'
                };

                return `${formattedKey}: ${value}${units[key] || ''}`;
            })
            .join('\n');

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
  