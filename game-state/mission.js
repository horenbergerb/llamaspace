export class Mission {
    constructor(objective, assignedCrew = null) {
        this.objective = objective;
        this.steps = [];
        this.approved = false;
        this.completed = false;
        this.cancelled = false;
        this.requirements = null;
        this.difficulty = null;
        this.danger = null;
        this.assignedCrew = assignedCrew;
        this.currentStep = 0;
        this.lastStepTime = Date.now();
        this.pulseScale = 1;
        this.pulseDirection = 1;
        this.stepInterval = 5000; // 5 seconds in milliseconds
        this.pulseSpeed = 1; // Speed in cycles per second
        this.lastUpdateTime = Date.now();
        this.quality = null;
        this.orbitingBody = null; // Store the body where the mission was performed
        this.outcome = null;
        this.eventBus = null; // Will be set by MissionUI
        this.failureConsequences = null; // Store parsed failure consequences
        this.currentInventory = {}; // Store current inventory state
        this.shuttleStatus = []; // Store current shuttle status
        this.viewed = false;
    }

    complete() {
        this.viewed = false;
        this.completed = true;
        if (this.eventBus) {
            this.eventBus.emit('missionCompleted', this);
            
            // If mission failed and wasn't cancelled, apply the consequences
            if (!this.outcome && !this.cancelled && this.failureConsequences) {
                // Apply inventory losses
                if (this.failureConsequences.inventoryLosses) {
                    Object.entries(this.failureConsequences.inventoryLosses).forEach(([item, amount]) => {
                        console.log(`Mission::complete: Using ${amount} ${item}`);
                        this.eventBus.emit('useInventoryItem', item, amount);
                    });
                }
                
                // Apply shuttle damage
                if (this.failureConsequences.shuttleDamage) {
                    Object.entries(this.failureConsequences.shuttleDamage).forEach(([shuttleId, damage]) => {
                        console.log(`Mission::complete: Damaging shuttle ${shuttleId} with ${damage} damage`);
                        this.eventBus.emit('damageShuttlecraft', shuttleId, damage);
                    });
                }
            }
        }
        console.log(`Mission "${this.objective}" ${this.cancelled ? 'cancelled' : 'completed'}!`);
    }

    cancel() {
        this.cancelled = true;
        this.complete();
    }

    assignTo(crewMember) {
        this.assignedCrew = crewMember;
    }

    async updateInventoryAndShuttleStatus() {
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
    }

    async approve() {
        // Update inventory and shuttle status before checking requirements
        await this.updateInventoryAndShuttleStatus();

        // Check if we have all required items
        if (this.requirements) {
            for (const [item, quantity] of Object.entries(this.requirements)) {
                // Special handling for shuttlecraft
                if (item.toLowerCase() === 'shuttlecraft') {
                    // Check if we have an operational shuttle
                    const hasOperationalShuttle = this.shuttleStatus.some(shuttle => shuttle.isOperational());
                    if (!hasOperationalShuttle) {
                        console.log(`Cannot approve mission: No operational shuttlecraft available`);
                        return false;
                    }
                } else {
                    // Check regular inventory items
                    if (!this.currentInventory[item] || this.currentInventory[item] < quantity) {
                        console.log(`Cannot approve mission: Not enough ${item} (need ${quantity}, have ${this.currentInventory[item] || 0})`);
                        return false;
                    }
                }
            }
        }

        this.generateSteps(this.textGenerator, this.currentScene, this.orbitingBody);
        this.approved = true;
        this.currentStep = 0;
        this.lastStepTime = Date.now();
        return true;
    }

    update() {
        if (this.completed || !this.approved) return;

        // Calculate delta time in seconds
        const now = Date.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = now;

        // Update pulse animation using delta time
        const pulseSpeed = this.pulseSpeed * deltaTime;
        this.pulseScale += pulseSpeed * this.pulseDirection;
        if (this.pulseScale >= 1.2) {
            this.pulseScale = 1.2;
            this.pulseDirection = -1;
        } else if (this.pulseScale <= 0.8) {
            this.pulseScale = 0.8;
            this.pulseDirection = 1;
        }

        // Check if we should increment the step
        const timeSinceLastStep = now - this.lastStepTime;
        
        if (timeSinceLastStep >= this.stepInterval) {
            this.lastStepTime = now;
            if (this.currentStep < this.steps.length) {
                this.currentStep++;
                console.log(`Mission "${this.objective}" progressed to step ${this.currentStep}/${this.steps.length}`);
                
                if (this.currentStep >= this.steps.length) {
                    this.complete();
                }
            }
        }
    }

    getStepColor(stepIndex) {
        if (this.completed) {
            return '#4CAF50'; // All steps green when completed
        }
        
        if (stepIndex < this.currentStep) {
            return '#4CAF50'; // Green for completed steps
        } else if (stepIndex === this.currentStep) {
            return '#FFA500'; // Orange for current step
        } else {
            return '#FFA500'; // Orange for future steps
        }
    }

    getStepScale(stepIndex) {
        if (this.completed) return 1;
        
        if (stepIndex === this.currentStep) {
            return this.pulseScale;
        }
        return 1;
    }

    async getCommonScenarioPrompt(orbitingBody) {
        let bodyContext = '';

        // Only planets have a parent star
        if (!orbitingBody.parentStar) {
            bodyContext = `The ship is orbiting a star named ${orbitingBody.name}. `;
        } else {
            bodyContext = `The ship is orbiting a planet named ${orbitingBody.name} in the ${orbitingBody.parentStar.name} system. `;
        }

        // Get current inventory and shuttle status
        await this.updateInventoryAndShuttleStatus();

        // Check for anomaly report
        let anomalyReport = '';
        if (orbitingBody.anomaly && orbitingBody.anomaly.firstReport) {
            anomalyReport = `\nThe science officer has reported an anomaly on or near this body:\n${orbitingBody.anomaly.firstReport}\n`;
        }

        // Get recent mission history
        let recentMissionsSection = '';
        if (orbitingBody.missions && orbitingBody.missions.length > 0) {
            const recentMissions = orbitingBody.missions
                .slice(-10) // Get last 10 missions
                .map(mission => {
                    const outcome = mission.completed ? 
                        (mission.cancelled ? 'cancelled' : 
                         (mission.outcome ? 'successful' : 'failed')) : 
                        'in progress';
                    const steps = mission.steps.map((step, i) => 
                        `${i + 1}. ${step}${i === mission.currentStep ? ' (current)' : ''}`
                    ).join('\n');
                    return `Mission: ${mission.objective}\nOutcome: ${outcome}\nSteps:\n${steps}\n`;
                })
                .join('\n');
            
            recentMissionsSection = `\nRecent mission history on this body (Oldest to newest):\n${recentMissions}`;
        }

        return `This is for a roleplaying game focused on space exploration. The game is serious with hints of humor in the vein of Douglas Adams's "The Hitchhiker's Guide to the Galaxy."

The player is Donald, captain of a small starship known as the Galileo. The Galileo is on a research mission in a remote part of the galaxy. The starship is similar in capabilities to the Federation starship Enterprise from Star Trek, albeit smaller and lower quality (it's one of the oldest ships in the fleet). It was designed for a crew of 15.

The Galileo is equipped with standard research equipment and meagre weaponry. It has a small replicator and two shuttlecraft. It has most of the resources needed to sustain a crew of 15 for a year.

Current Ship Status:
Inventory:
${Object.entries(this.currentInventory).map(([item, amount]) => `- ${item}`).join('\n')}

Shuttlecraft:
${this.shuttleStatus.map(shuttle => `- ${shuttle.name}`).join('\n')}

Donald, his ship, and his crew are all nobodies. Donald's promotion to captain was something of a nepotism scandal. His crew is composed of misfits and those with complicated pasts in the service. The ship itself is old and worn out, but everyone on board is used to getting the short end of the stick. This research mission to the D-124 star system is an exile, but it's also a chance for the entire crew to redeem themselves.

${bodyContext}

Here is some information about the body the ship is orbiting:

${orbitingBody.getDescription()}${anomalyReport}${recentMissionsSection}`;
    }

    async generateMissionRequirements(textGenerator, currentScene, orbitingBody) {
        if (this.difficulty === null) {
            await this.generateDifficultyQualityDanger(textGenerator, currentScene, orbitingBody);
        }
        const commonPrompt = await this.getCommonScenarioPrompt(orbitingBody);
        const prompt = `${commonPrompt}
Donald has just assigned a research mission to a bridge crew member named ${this.assignedCrew.name}. ${this.assignedCrew.name} is a ${this.assignedCrew.race}. ${this.assignedCrew.races[this.assignedCrew.race].description}

${this.assignedCrew.name} is often described as ${this.assignedCrew.demeanor.join(", ")}.

Objective: ${this.objective}
Difficulty: ${this.difficulty}

Given the inventory of the ship, the objective, and the difficulty, list the mission requirements. Respond in exactly the following format, using the item names as they were provided. For shuttlecraft, just write "shuttlecraft". If no items are necessary, only include the reasoning and do not list any items.

Considerations: *Reason about the needs of the mission*
Item 1: Quantity 1
Item 2: Quantity 2
etc.`;

        let requirementsText = '';
        try {
            await textGenerator.generateText(
                prompt,
                (text) => { requirementsText = text; },
                0.6, // Lower temperature for more focused output
                1000  // Max tokens
            );
            console.log(requirementsText);
            
            // Parse requirements into a dictionary
            this.requirements = {};
            const lines = requirementsText.split('\n');
            
            // Skip the considerations section and look for item lines
            let foundItems = false;
            for (const line of lines) {
                // Skip empty lines
                if (!line.trim()) continue;
                
                // Look for lines that contain item names and quantities
                const match = line.match(/^([^:]+):\s*(\d+)$/);
                if (match) {
                    const itemName = match[1].trim();
                    const amount = parseInt(match[2]);
                    this.requirements[itemName] = amount;
                    foundItems = true;
                } else if (foundItems) {
                    // If we've found items before and this line doesn't match the format,
                    // we've reached the end of the items section
                    break;
                }
            }
            if (Object.keys(this.requirements).length === 0)
                this.approve();

        } catch (error) {
            console.error('Error parsing requirements:', error);
            // Set a default step if generation fails
            this.requirements = {};
        }
    }

    async generateDifficultyQualityDanger(textGenerator, currentScene, orbitingBody) {
        const commonPrompt = await this.getCommonScenarioPrompt(orbitingBody);
        const prompt = `${commonPrompt}
Donald has just assigned a research mission to a bridge crew member named ${this.assignedCrew.name}. ${this.assignedCrew.name} is a ${this.assignedCrew.race}. ${this.assignedCrew.races[this.assignedCrew.race].description}

${this.assignedCrew.name} is often described as ${this.assignedCrew.demeanor.join(", ")}.

Objective: ${this.objective}

Rate the difficulty from 1 to 10. This represents the likelihood of failure. 10 indicates an impossible task, 5 is harder than average, 1 is a trivial task.

Additionally, rate the quality of the mission from 1 to 10. High-quality missions ask interesting questions regarding the body that the Galileo is orbiting. Low-quality missions are irrelevant to the body, trivial, or uninteresting.

Finally, rate the danger of the mission from 1 to 10. This is the likelihood of consequences such as loss of equipment, injury, or death. 1 indicates no danger, 10 indicates catastrophic losses, and 5 is a moderate level of danger.

Format your response exactly like this:

Considerations: *Reason about the difficulty of the mission*
Difficulty: X

Considerations: *Reason about the quality of the mission*
Quality: Y

Considerations: *Reason about the danger of the mission*
Danger: Z

Be realistic about what is possible for the Galileo and its crew.`;

        let difficultyText = '';
        try {
            await textGenerator.generateText(
                prompt,
                (text) => { difficultyText = text; },
                0.6, // Lower temperature for more focused output
                1000  // Max tokens
            );
            console.log(difficultyText);
            // Extract difficulty rating from response
            const difficultyMatch = difficultyText.match(/Difficulty:\s*\**(\d+)\**/);
            if (difficultyMatch) {
                this.difficulty = parseInt(difficultyMatch[1]);
            } else {
                // Default to medium difficulty if parsing fails
                this.difficulty = 5;
                console.warn('Could not parse difficulty from response, defaulting to 5');
            }
            const qualityMatch = difficultyText.match(/Quality:\s*\**(\d+)\**/);
            if (qualityMatch) {
                this.quality = parseInt(qualityMatch[1]);
            } else {
                // Default to medium quality if parsing fails
                this.quality = 5;
                console.warn('Could not parse quality from response, defaulting to 5');
            }
            const dangerMatch = difficultyText.match(/Danger:\s*\**(\d+)\**/);
            if (dangerMatch) {
                this.danger = parseInt(dangerMatch[1]);
            } else {
                // Default to medium danger if parsing fails
                this.danger = 5;
                console.warn('Could not parse danger from response, defaulting to 5');
            }
        } catch (error) {
            console.error('Error parsing difficulty, quality, and danger:', error);
            // Set a default step if generation fails
            this.difficulty = 5;
            this.quality = 5;
            this.danger = 5;
        }
    }

    async preapprovalGeneration(textGenerator, currentScene, orbitingBody) {
        this.textGenerator = textGenerator;
        this.currentScene = currentScene;
        this.orbitingBody = orbitingBody;
        if (this.difficulty === null) {
            await this.generateDifficultyQualityDanger(textGenerator, currentScene, orbitingBody);
        }
        if (this.requirements === null) {
            await this.generateMissionRequirements(textGenerator, currentScene, orbitingBody);
            this.viewed = false;
        }
    }

    async generateSteps(textGenerator, currentScene, orbitingBody) {
        await this.preapprovalGeneration(textGenerator, currentScene, orbitingBody);

        let successProbability = 100 - this.difficulty * 10;
        this.outcome = Math.random() < successProbability / 100;

        if (!this.outcome) {
            this.generateFailureConsequences(textGenerator);
        }

        // Check shuttle health and determine if any were destroyed
        const destroyedShuttles = [];
        if (this.failureConsequences?.shuttleDamage) {
            Object.entries(this.failureConsequences.shuttleDamage).forEach(([shuttleId, damage]) => {
                const shuttle = this.shuttleStatus.find(s => s.id === parseInt(shuttleId));
                if (shuttle && damage >= shuttle.health) {
                    destroyedShuttles.push(shuttleId);
                }
            });
        }

        // Generate difficulty description
        let difficultyDescription;
        if (this.difficulty <= 3) {
            difficultyDescription = "This was a trivially easy mission.";
        } else if (this.difficulty <= 6) {
            difficultyDescription = "This was a mission of standard difficulty.";
        } else if (this.difficulty <= 8) {
            difficultyDescription = "This was an abnormally difficult mission.";
        } else {
            difficultyDescription = "This was a practically impossible mission.";
        }

        const commonPrompt = await this.getCommonScenarioPrompt(orbitingBody);
        const prompt = `${commonPrompt}
Donald assigned a research mission to a bridge crew member named ${this.assignedCrew.name}. ${this.assignedCrew.name} is a ${this.assignedCrew.race}. ${this.assignedCrew.races[this.assignedCrew.race].description}

${this.assignedCrew.name} is often described as ${this.assignedCrew.demeanor.join(", ")}.

${difficultyDescription} The research mission was a ${this.outcome ? 'success' : 'failure'}.

Approved resource allocations for the mission:
${Object.entries(this.requirements).map(([item, quantity]) => `- ${quantity} ${item}`).join('\n')}

${!this.outcome ? `During the mission, the following losses were incurred:
${Object.entries(this.failureConsequences.inventoryLosses).map(([item, amount]) => `- Lost ${amount} ${item}`).join('\n')}
${Object.entries(this.failureConsequences.shuttleDamage).map(([shuttleId, damage]) => {
    const isDestroyed = destroyedShuttles.includes(shuttleId);
    return `- Shuttle ${shuttleId} sustained ${damage} damage${isDestroyed ? ' and was destroyed' : ''}`;
}).join('\n')}
` : ''}
Here was the mission objective:

Objective: ${this.objective}

The research mission was documented in ${this.difficulty} phases.

Each phase should be phrased as a progress report from ${this.assignedCrew.name} written in their log. It should be a single sentence or two.
Format your response exactly like this, with one step per line starting with a number and period:

1. First report
2. Second report here
etc.

Keep steps clear and actionable. Write them in plaintext with no titles or other formatting. The number of steps should reflect task complexity relative to standard operations. Routine tasks like planetary surveys are simpler and have fewer steps. Be realistic about what is possible for the Galileo. The steps of this mission should be creatively and stylistically distinct from the steps of recent missions on this body.`;

        let stepsText = '';
        try {
            await textGenerator.generateText(
                prompt,
                (text) => { stepsText = text; },
                1.0, // Lower temperature for more focused output
                1000  // Max tokens
            );
            console.log(stepsText);
            // Parse the steps from the response
            const stepLines = stepsText.split('\n');
            this.steps = stepLines
                .map(line => {
                    // Match lines that start with a number followed by a period
                    const match = line.match(/^\d+\.\s*(.+)$/);
                    return match ? match[1].trim() : null;
                })
                .filter(step => step !== null); // Remove any non-matching lines

        } catch (error) {
            console.error('Error generating steps:', error);
            // Set a default step if generation fails
            this.steps = ['Complete the mission'];
        }
    }

    generateFailureConsequences() {
            // Initialize consequences object
            this.failureConsequences = {
                inventoryLosses: {},
                shuttleDamage: {}
            };

        // If no requirements, nothing to lose
        if (!this.requirements || Object.keys(this.requirements).length === 0) {
            return;
        }

        // Base chance of losing an item is danger/10
        const baseLossChance = this.danger / 10;
        
        // For each required item, determine if it's lost and how much
        Object.entries(this.requirements).forEach(([item, quantity]) => {
            // Skip if no quantity
            if (quantity <= 0) return;

            // Special handling for shuttlecraft
            if (item.toLowerCase() === 'shuttlecraft') {
                // Higher chance of damage for more dangerous missions
                const damageChance = baseLossChance * 0.8; // 80% of base chance
                if (Math.random() < damageChance) {
                    // Damage amount is random between 1 and danger level * 3
                    const damage = Math.floor(Math.random() * this.danger * 3) + 1;
                    this.failureConsequences.shuttleDamage[1] = damage; // Assuming shuttle ID 1 for now
                }
                return;
            }

            // For regular items, determine if they're lost
            if (Math.random() < baseLossChance) {
                // Amount lost is random between 1 and min(quantity, danger)
                const maxLoss = Math.min(quantity, this.danger);
                const amountLost = Math.floor(Math.random() * maxLoss) + 1;
                this.failureConsequences.inventoryLosses[item] = amountLost;
            }
        });

        // If no losses occurred, ensure the structure is still valid
        if (Object.keys(this.failureConsequences.inventoryLosses).length === 0) {
            this.failureConsequences.inventoryLosses = {};
        }
        if (Object.keys(this.failureConsequences.shuttleDamage).length === 0) {
            this.failureConsequences.shuttleDamage = {};
        }

        console.log(this.failureConsequences);
    }
} 