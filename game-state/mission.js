export class Mission {
    constructor(objective, assignedCrew = null) {
        this.objective = objective;
        this.steps = [];
        this.completed = false;
        this.createdAt = new Date();
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
    }

    complete() {
        this.completed = true;
        if (this.eventBus) {
            this.eventBus.emit('missionCompleted', this);
            
            // If mission failed, apply the consequences
            if (!this.outcome && this.failureConsequences) {
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
        console.log(`Mission "${this.objective}" completed!`);
    }

    assignTo(crewMember) {
        this.assignedCrew = crewMember;
    }

    update() {
        if (this.completed) return;

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

    async generateDifficultyAndQuality(textGenerator, currentScene, orbitingBody) {
        const commonPrompt = await this.getCommonScenarioPrompt(orbitingBody);
        const prompt = `${commonPrompt}
Donald has just assigned a research mission to a bridge crew member named ${this.assignedCrew.name}. ${this.assignedCrew.name} is a ${this.assignedCrew.race}. ${this.assignedCrew.races[this.assignedCrew.race].description}

${this.assignedCrew.name} is often described as ${this.assignedCrew.demeanor.join(", ")}.

Objective: ${this.objective}

Rate the difficulty from 1 to 10. 10 is impossible, 5 is harder than average, 1 is a trivial task.

Additionally, rate the quality of the mission from 1 to 10. High-quality missions ask interesting questions regarding the body that the Galileo is orbiting. Low-quality missions are irrelevant to the body, trivial, or uninteresting.

Format your response exactly like this:

Considerations: *Reason about the difficulty of the mission*
Difficulty: X

Considerations: *Reason about the quality of the mission*
Quality: Y

Be realistic about what is possible for the Galileo and its crew.`;

        let difficultyText = '';
        try {
            await textGenerator.generateText(
                prompt,
                (text) => { difficultyText = text; },
                1.0, // Lower temperature for more focused output
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
        } catch (error) {
            console.error('Error parsing difficulty and quality:', error);
            // Set a default step if generation fails
            this.difficulty = 5;
            this.quality = 5;
        }
    }

    async generateSteps(textGenerator, currentScene, orbitingBody) {
        await this.generateDifficultyAndQuality(textGenerator, currentScene, orbitingBody);

        let successProbability = 100 - this.difficulty * 10;
        this.outcome = Math.random() < successProbability / 100;

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

${difficultyDescription} The research mission was a ${this.outcome ? 'success' : 'failure'}. Here was the mission objective:

Objective: ${this.objective}

The research mission was documented in ${this.difficulty} phases.

Each phase should be phrased as a progress report from ${this.assignedCrew.name} written in their log. It should be a single sentence or two.
Format your response exactly like this, with one step per line starting with a number and period:

1. First report
2. Second report here
etc.

Keep steps clear and actionable. Write them in plaintext with no titles or other formatting. The number of steps should reflect task complexity relative to standard operations. Routine tasks like planetary surveys are simpler and have fewer steps. Be realistic about what is possible for the Galileo.`;

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
                
            this.lastStepTime = Date.now();
            this.currentStep = 0;

            // If mission will fail, generate failure consequences after steps are generated
            if (!this.outcome) {
                await this.generateFailureConsequences(textGenerator);
            }

        } catch (error) {
            console.error('Error generating steps:', error);
            // Set a default step if generation fails
            this.steps = ['Complete the mission'];
        }
    }

    async generateFailureConsequences(textGenerator) {
        const commonPrompt = await this.getCommonScenarioPrompt(this.orbitingBody);

        // Format the mission steps for display
        const formattedSteps = this.steps.map((step, index) => `${index + 1}. ${step}`).join('\n');

        const prompt = `${commonPrompt}

The mission "${this.objective}" has failed. The mission attempt proceeded as follows:

${formattedSteps}

What equipment was lost and what damage occurred to the shuttlecraft during this failed mission?

Consider the difficulty (${this.difficulty}/10) when determining losses. More difficult missions should have more severe consequences.
Consider the current inventory levels when determining losses - you cannot lose more items than are available.
Consider current shuttle health when determining damage - total health cannot go below 0.

Format your response EXACTLY like this with NO additional text or explanations:

Inventory Losses:
- Item Name: X
(where X is a plain number with no symbols, commas, or text)

Shuttle Damage Received:
- Shuttle N: X
(where N is the shuttle number and X is a plain number with no symbols, commas, or text)

Only include items that were actually lost or shuttles that were actually damaged. If nothing was lost or damaged, leave that section empty but keep the header.`;

        let consequencesText = '';
        try {
            await textGenerator.generateText(
                prompt,
                (text) => { consequencesText = text; },
                0.7, // Lower temperature for more consistent output
                1000  // Max tokens
            );
            console.log('Raw consequences text:', consequencesText);

            // Initialize consequences object
            this.failureConsequences = {
                inventoryLosses: {},
                shuttleDamage: {}
            };

            // Parse inventory losses and validate against current inventory
            const inventorySection = consequencesText.split('Inventory Losses:')[1]?.split('Shuttle Damage:')[0];
            console.log('Inventory section:', inventorySection);
            
            if (inventorySection) {
                const inventoryLines = inventorySection.split('\n').filter(line => line.trim().startsWith('-'));
                console.log('Inventory lines:', inventoryLines);
                
                inventoryLines.forEach(line => {
                    console.log('Processing inventory line:', line);
                    // More robust pattern matching - capture item name and number separately
                    const match = line.match(/^-\s*([^:]+):\s*(\d+)\s*$/);
                    console.log('Inventory match:', match);
                    
                    if (match) {
                        const itemName = match[1].trim();
                        const lossAmount = parseInt(match[2]);
                        console.log('Parsed item:', itemName, 'amount:', lossAmount);
                        console.log('Current inventory for item:', this.currentInventory[itemName]);
                        
                        // Only include loss if item exists and loss amount is valid
                        if (this.currentInventory[itemName] && lossAmount <= this.currentInventory[itemName] && lossAmount > 0) {
                            console.log('Adding inventory loss:', itemName, lossAmount);
                            this.failureConsequences.inventoryLosses[itemName] = lossAmount;
                        } else {
                            console.log('Skipping invalid inventory loss:', itemName, lossAmount);
                        }
                    }
                });
            }

            // Parse shuttle damage and validate against current health
            const shuttleSection = consequencesText.split('Shuttle Damage Received:')[1];
            console.log('Shuttle section:', shuttleSection);
            
            if (shuttleSection) {
                const shuttleLines = shuttleSection.split('\n').filter(line => line.trim().startsWith('-'));
                console.log('Shuttle lines:', shuttleLines);
                
                shuttleLines.forEach(line => {
                    console.log('Processing shuttle line:', line);
                    // More robust pattern matching - capture shuttle number and damage separately
                    const match = line.match(/^-\s*Shuttle\s+(\d+):\s*(\d+)\s*$/);
                    console.log('Shuttle match:', match);
                    
                    if (match) {
                        const shuttleId = parseInt(match[1]);
                        const damageAmount = parseInt(match[2]);
                        console.log('Parsed shuttle:', shuttleId, 'damage:', damageAmount);
                        
                        const shuttle = this.shuttleStatus.find(s => s.id === shuttleId);
                        console.log('Found shuttle:', shuttle);
                        
                        // Only include damage if shuttle exists, damage is valid, and wouldn't reduce health below 0
                        if (shuttle && damageAmount <= shuttle.health && damageAmount > 0) {
                            console.log('Adding shuttle damage:', shuttleId, damageAmount);
                            this.failureConsequences.shuttleDamage[shuttleId] = damageAmount;
                        } else {
                            console.log('Skipping invalid shuttle damage:', shuttleId, damageAmount);
                        }
                    }
                });
            }

            console.log('Final failure consequences:', this.failureConsequences);

        } catch (error) {
            console.error('Error generating failure consequences:', error);
            this.failureConsequences = null;
        }
    }
} 