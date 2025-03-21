import { MapBackgroundRenderer } from './renderers/map-background-renderer.js'
import { Camera } from './camera.js';
import { ControlHandler } from './controls.js';
import { MapScene } from './map-objects/map-scene.js'
import { Spaceship } from './map-objects/map-spaceship.js';
import { MapStar } from './map-objects/map-star.js';
import { MapPlanet } from './map-objects/map-planet.js';
import { UIRenderer } from './renderers/info-ui-renderer.js';
import { ShipUI } from './ui/window/ship-ui.js';
import { MissionUI } from './ui/window/mission-ui.js';
import { SettingsUI } from './ui/window/settings-ui.js';
import { CrewMember } from './game-state/crew-member.js';
import { Mission } from './game-state/mission.js';
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
let shipUI = null;
let missionUI = null;
let settingsUI = null;
let crewMembers = []; // Array to store crew members
let missions = []; // Array to store missions
let textGenerator = null; // Instance of TextGeneratorOpenRouter

var mapSketch = function(sketch) {
    sketch.preload = function() {
        backgroundRenderer = new MapBackgroundRenderer(sketch);
        Spaceship.preload(sketch);
        spaceship = new Spaceship(sketch, globalEventBus);
        galaxyMapScene = new MapScene(sketch, globalEventBus);
        camera = new Camera(sketch);
        controlHandler = new ControlHandler();
        uiRenderer = new UIRenderer(sketch);
        
        // Generate 3 crew members
        for (let i = 0; i < 3; i++) {
            crewMembers.push(new CrewMember());
        }

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

        // Emit initial crew update
        globalEventBus.emit('crewUpdated', crewMembers);
    };

    sketch.setup = async function() {
        let sketchHolder = document.getElementById('simple-example-holder'); // Get the container
        let w = sketchHolder.clientWidth;
        sketch.createCanvas(w, sketch.windowHeight*0.7);

        shipUI = new ShipUI(sketch, globalEventBus, galaxyMapScene, crewMembers);
        missionUI = new MissionUI(sketch, globalEventBus, galaxyMapScene, missions);
        settingsUI = new SettingsUI(sketch, globalEventBus);


        controlHandler.attachEventListeners(sketch, camera, galaxyMapScene, shipUI, missionUI, settingsUI);

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
        shipUI.renderButton(camera);
        missionUI.renderButton(camera);
        settingsUI.renderButton(camera);

        // Then render UI windows (so they appear on top)
        shipUI.renderWindow(camera);
        missionUI.renderWindow(camera);
        settingsUI.renderWindow(camera);
    }

    function generateGalaxy() {
        for (let i = 0; i < 120; i++) {
            galaxyMapScene.mapBodies.push(new MapStar(sketch));
        }
    }

    // Function to enter a star's system
    function enterStarSystem(star) {
        systemMapScene = new MapScene(sketch, globalEventBus);
        
        // Create a centered version of the star for the system view
        let centralStar = new MapStar(sketch);
        Object.assign(centralStar, star); // Copy properties from the galaxy star
        centralStar.baseX = sketch.width / 2;
        centralStar.baseY = sketch.height / 2;
        // Make the star much larger in system view
        centralStar.baseSize *= 4;
        centralStar.size = centralStar.baseSize;
        centralStar.isSelected = false;
        systemMapScene.mapBodies.push(centralStar);
        
        // Generate planets if the star has them
        if (star.bodyProperties.hasPlanets) {
            for (let i = 0; i < star.bodyProperties.numPlanets; i++) {
                let planet = new MapPlanet(sketch, centralStar, i);
                systemMapScene.mapBodies.push(planet);
            }
        }

        spaceship.setOrbitBody(centralStar, true);

        systemMapScene.initializeMapScene(sketch, spaceship);
        systemMapScene.setInSystemView(true);

        // Switch to system scene
        currentScene = systemMapScene;
        controlHandler.attachEventListeners(sketch, camera, systemMapScene, shipUI, missionUI);

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
        controlHandler.attachEventListeners(sketch, camera, galaxyMapScene, shipUI, missionUI);

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
};

// Attach the sketch to a specific DOM element
let myMapSketch = new p5(mapSketch, 'simple-example-holder');
