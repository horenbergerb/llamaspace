import { MapBackgroundRenderer } from './renderers/map-background-renderer.js'
import { Camera } from './camera.js';
import { ControlHandler } from './controls.js';
import { MapScene } from './map-objects/map-scene.js'
import { Spaceship } from './map-objects/map-spaceship.js';
import { MapStar } from './map-objects/map-star.js';
import { MapPlanet } from './map-objects/map-planet.js';
import { UIRenderer } from './renderers/info-ui-renderer.js';
import { ShipUI } from './ui/window/ship-ui/ship-ui.js';
import { MissionUI } from './ui/window/mission-ui/mission-ui.js';
import { SettingsUI } from './ui/window/settings-ui.js';
import { ScanUI } from './ui/window/scan-ui.js';
import { ConfirmTravelUI } from './ui/window/confirm-travel-ui.js';
import { UIManager } from './ui/ui-manager.js';
import { CrewMember } from './game-state/crew-member.js';
import { Mission } from './game-state/mission.js';
import { Shuttlecraft } from './game-state/shuttlecraft.js';
import { TextGeneratorOpenRouter } from './text-gen-openrouter.js';
import { GameEventBus } from './utils/game-events.js';

// Create global event bus
const globalEventBus = new GameEventBus();

let backgroundRenderer = null;
let spaceship = null;
let galaxyOrbitStar = null;
let galaxyMapScene = null;
let systemMapScene = null; // New scene for when we enter a star system
let currentScene = null; // Track which scene is active
let camera = null;
let controlHandler = null;
let uiRenderer = null;
let uiManager = null;
let crewMembers = []; // Array to store crew members
let missions = []; // Array to store missions
let textGenerator = null; // Instance of TextGeneratorOpenRouter
let reputation = 0; // Track total reputation

// Initialize shuttlecraft
let shuttlecraft = [
    new Shuttlecraft(1),
    new Shuttlecraft(2)
];

// Initialize ship's inventory
let shipInventory = {
    "Research Probes": 10,
    "Redshirts": 15,
    "EVA Suits": 8,
    "Repair Drones": 4
};

var mapSketch = function(sketch) {
    sketch.preload = function() {
        backgroundRenderer = new MapBackgroundRenderer(sketch);
        Spaceship.preload(sketch);
        spaceship = new Spaceship(sketch, globalEventBus);
        galaxyMapScene = new MapScene(sketch, globalEventBus);
        camera = new Camera(sketch);
        controlHandler = new ControlHandler();
        uiRenderer = new UIRenderer(sketch);
        uiManager = new UIManager();
        
        // Subscribe to API key updates
        globalEventBus.on('apiKeyUpdated', async (apiKey) => {
            // Create or update the text generator with the new API key
            textGenerator = new TextGeneratorOpenRouter(apiKey);
        });

        globalEventBus.on('enterSystem', (body) => {
            enterStarSystem(body);
        });

        globalEventBus.on('returnToGalaxy', () => {
            returnToGalaxyMap();
        });

        // Subscribe to missions request
        globalEventBus.on('requestMissions', () => {
            globalEventBus.emit('missionsUpdated', missions);
        });

        // Subscribe to setDestination to cancel in-progress missions
        globalEventBus.on('setDestination', (body) => {
            // Cancel any in-progress missions
            missions.forEach(mission => {
                if (!mission.completed) {
                    mission.cancel();
                }
            });
        });
    };

    sketch.setup = async function() {
        let sketchHolder = document.getElementById('simple-example-holder'); // Get the container
        let w = sketchHolder.clientWidth;
        sketch.createCanvas(w, sketch.windowHeight*0.7);

        // Initialize UI components
        uiManager.addUI('ship', new ShipUI(sketch, globalEventBus, galaxyMapScene, crewMembers));
        uiManager.addUI('mission', new MissionUI(sketch, globalEventBus, galaxyMapScene, missions));
        uiManager.addUI('settings', new SettingsUI(sketch, globalEventBus));
        uiManager.addUI('scan', new ScanUI(sketch, globalEventBus, galaxyMapScene));
        uiManager.addUI('confirmTravel', new ConfirmTravelUI(sketch, globalEventBus));

        // Generate 3 crew members
        for (let i = 0; i < 3; i++) {
            crewMembers.push(new CrewMember());
        }

        // Emit initial crew update
        globalEventBus.emit('crewUpdated', crewMembers);

        // Emit initial inventory and shuttlecraft state
        globalEventBus.emit('inventoryChanged', shipInventory);
        globalEventBus.emit('shuttlecraftChanged', shuttlecraft);

        controlHandler.attachUniversalEventListeners(sketch, uiManager);
        controlHandler.attachEventListeners(sketch, camera, galaxyMapScene, uiManager);

        camera.applyCameraTransform();

        backgroundRenderer.initialize(camera);

        generateGalaxy();
        galaxyMapScene.initializeMapScene(sketch);
        currentScene = galaxyMapScene; // Set initial scene
        // Emit initial scene change event
        globalEventBus.emit('sceneChanged', galaxyMapScene);

        camera.endCameraTransform();

        // Start at a random star and configure the camera to autopan to it
        galaxyOrbitStar = galaxyMapScene.getRandomBody();
        spaceship.setOrbitBody(galaxyOrbitStar, true);
        camera.setAutoCamera(spaceship.orbitBody.baseX, spaceship.orbitBody.baseY, 1.0);

        uiManager.getUI('settings').emitApiKeyUpdated();
    }

    sketch.draw = function() {
        // Update game state
        camera.handleAutoCamera();
        spaceship.update();

        // Render everything
        // Background is drawn without camera transform since it needs weird logic to preserve parallax
        backgroundRenderer.render(camera);

        camera.applyCameraTransform();

        // Render the game world
        currentScene.sceneRenderer.render(currentScene);
        spaceship.renderer.render(camera);

        // Draw UI elements on top
        uiRenderer.render(currentScene, camera);

        camera.endCameraTransform();

        // Render UI buttons first (so they appear behind windows)
        uiManager.renderButtons(camera);

        // Then render UI windows (so they appear on top)
        uiManager.renderWindows(camera);
    }

    function generateGalaxy() {
        for (let i = 0; i < 120; i++) {
            galaxyMapScene.mapBodies.push(new MapStar(sketch, globalEventBus));
        }
    }

    // Function to enter a star's system
    function enterStarSystem(star) {
        systemMapScene = new MapScene(sketch, globalEventBus);
        
        // Create a centered version of the star for the system view
        let centralStar = new MapStar(sketch, globalEventBus);
        Object.assign(centralStar, star); // Copy properties from the galaxy star
        centralStar.baseX = sketch.width / 2;
        centralStar.baseY = sketch.height / 2;
        // Make the star much larger in system view
        centralStar.baseSize *= 4;
        centralStar.size = centralStar.baseSize;
        centralStar.isSelected = false;
        centralStar.anomaly = star.anomaly;
        systemMapScene.mapBodies.push(centralStar);
        
        // Add all planets from the star's planet list
        if (star.planets) {
            star.planets.forEach(planet => {
                // Update the planet's orbit star reference to point to the centered star
                systemMapScene.mapBodies.push(planet);
            });
        }

        spaceship.setOrbitBody(centralStar, true);

        systemMapScene.initializeMapScene(sketch, spaceship);
        systemMapScene.setInSystemView(true);

        // Switch to system scene
        currentScene = systemMapScene;
        controlHandler.attachEventListeners(sketch, camera, systemMapScene, uiManager);

        galaxyOrbitStar = star;

        spaceship.setInSystemMap(true);

        // Emit scene change event
        globalEventBus.emit('sceneChanged', systemMapScene);
        
        // Reset camera and zoom in
        camera.panX = 0;
        camera.panY = 0;
        camera.scaleFactor = 0.5;
        camera.setAutoCamera(centralStar.baseX, centralStar.baseY, 2.0);
    }

    // Function to return to galaxy map
    window.returnToGalaxyMap = function() {
        currentScene = galaxyMapScene;
        controlHandler.attachEventListeners(sketch, camera, galaxyMapScene, uiManager);

        spaceship.setOrbitBody(galaxyOrbitStar, true);
        spaceship.setInSystemMap(false);

        // Emit scene change event
        globalEventBus.emit('sceneChanged', galaxyMapScene);

        // Reset camera and zoom in
        camera.panX = 0;
        camera.panY = 0;
        camera.scaleFactor = 0.5;
        camera.setAutoCamera(galaxyOrbitStar.baseX, galaxyOrbitStar.baseY, 1.0);
    }

    // Subscribe to mission completion events
    globalEventBus.on('missionCompleted', (mission) => {
        if (mission.completed && mission.outcome) {
            reputation += mission.quality;
            globalEventBus.emit('reputationUpdated', reputation);
        }
    });

    // Subscribe to inventory update events
    globalEventBus.on('inventoryUpdated', (itemName, quantity) => {
        if (itemName in shipInventory) {
            shipInventory[itemName] = quantity;
            // Emit event with full inventory for UI updates
            globalEventBus.emit('inventoryChanged', shipInventory);
        }
    });

    // Subscribe to inventory use events
    globalEventBus.on('useInventoryItem', (itemName, amount) => {
        console.log(`Using ${amount} ${itemName}`);
        if (itemName in shipInventory && shipInventory[itemName] >= amount) {
            shipInventory[itemName] -= amount;
            globalEventBus.emit('inventoryChanged', shipInventory);
            return true;
        }
        return false;
    });

    // Subscribe to inventory add events
    globalEventBus.on('addInventoryItem', (itemName, amount = 1) => {
        if (itemName in shipInventory) {
            shipInventory[itemName] += amount;
        } else {
            shipInventory[itemName] = amount;
        }
        globalEventBus.emit('inventoryChanged', shipInventory);
    });

    // Subscribe to inventory state requests
    globalEventBus.on('requestInventoryState', () => {
        globalEventBus.emit('inventoryChanged', shipInventory);
    });

    // Subscribe to shuttlecraft state requests
    globalEventBus.on('requestShuttlecraftState', () => {
        globalEventBus.emit('shuttlecraftChanged', shuttlecraft);
    });

    // Subscribe to shuttlecraft damage events
    globalEventBus.on('damageShuttlecraft', (shuttleId, amount) => {
        // Ensure both parameters are integers
        const validShuttleId = parseInt(shuttleId);
        const validAmount = parseInt(amount) || 0;
        console.log(`Looking for shuttle ${validShuttleId} to apply ${validAmount} damage`);
        const shuttle = shuttlecraft.find(s => s.id === validShuttleId);
        if (shuttle) {
            const oldHealth = shuttle.health;
            const survived = shuttle.damage(validAmount);
            console.log(`Shuttle ${validShuttleId} health: ${oldHealth} -> ${shuttle.health}`);
            if (!survived) {
                console.log(`Shuttle ${validShuttleId} has been lost!`);
            }
            globalEventBus.emit('shuttlecraftChanged', shuttlecraft);
        } else {
            console.log(`Could not find shuttle with id ${validShuttleId}`);
        }
    });

    // Subscribe to shuttlecraft repair events
    globalEventBus.on('repairShuttlecraft', (shuttleId, amount) => {
        const shuttle = shuttlecraft.find(s => s.id === shuttleId);
        if (shuttle) {
            const fullyRepaired = shuttle.repair(amount);
            if (fullyRepaired) {
                console.log(`Shuttle ${shuttleId} has been fully repaired!`);
            }
            globalEventBus.emit('shuttlecraftChanged', shuttlecraft);
        }
    });

    // Subscribe to shuttlecraft status check events
    globalEventBus.on('checkShuttlecraft', (shuttleId) => {
        const shuttle = shuttlecraft.find(s => s.id === shuttleId);
        return shuttle ? shuttle.isOperational() : false;
    });
};

// Attach the sketch to a specific DOM element
let myMapSketch = new p5(mapSketch, 'simple-example-holder');
