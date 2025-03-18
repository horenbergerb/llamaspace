import { MapBackgroundRenderer } from './renderers/map-background-renderer.js'
import { Camera } from './camera.js';
import { ControlHandler } from './controls.js';
import { MapScene } from './map-scene.js'
import { Spaceship } from './spaceship.js';
import { MapStar } from './map-star.js';
import { MapPlanet } from './map-planet.js';
import { UIRenderer } from './renderers/info-ui-renderer.js';

let backgroundRenderer = null;
let galaxyMapScene = null;
let systemMapScene = null; // New scene for when we enter a star system
let currentScene = null; // Track which scene is active
let camera = null;
let controlHandler = null;
let uiRenderer = null;

var mapSketch = function(sketch) {
    sketch.preload = function() {
        backgroundRenderer = new MapBackgroundRenderer(sketch);
        galaxyMapScene = new MapScene(sketch);
        Spaceship.preload(sketch);
        camera = new Camera(sketch);
        controlHandler = new ControlHandler();
        uiRenderer = new UIRenderer(sketch);
    };

    sketch.setup = async function() {
        let sketchHolder = document.getElementById('simple-example-holder'); // Get the container
        let w = sketchHolder.clientWidth;
        sketch.createCanvas(w, sketch.windowHeight*0.7);

        controlHandler.attachEventListeners(sketch, camera, galaxyMapScene);

        camera.applyCameraTransform();

        backgroundRenderer.initialize(camera);

        generateGalaxy();
        galaxyMapScene.initializeMapScene(sketch);
        currentScene = galaxyMapScene; // Set initial scene

        camera.endCameraTransform();

        // Start at a random star and configure the camera to autopan to it
        galaxyMapScene.spaceship.setOrbitBody(galaxyMapScene.getRandomBody(), false);
        camera.setAutoCamera(galaxyMapScene.spaceship.orbitBody.baseX, galaxyMapScene.spaceship.orbitBody.baseY, 1.0);
    }

    sketch.draw = function() {
        // Update game state
        camera.handleAutoCamera();
        currentScene.spaceship.update();

        // Render everything
        // Background is drawn without camera transform since it needs weird logic to preserve parallax
        backgroundRenderer.render(camera);

        camera.applyCameraTransform();

        // Render the game world
        currentScene.sceneRenderer.render(currentScene, camera);

        // Draw UI elements on top
        uiRenderer.render(currentScene, camera);

        camera.endCameraTransform();

        // Update state change events after rendering
        currentScene.eventBus.emit('spaceshipStateChanged', {
            inTransit: currentScene.spaceship.inTransit
        });
    }

    function generateGalaxy() {
        for (let i = 0; i < 120; i++) {
            galaxyMapScene.mapBodies.push(new MapStar(sketch));
        }
    }

    // Function to enter a star's system
    function enterStarSystem(star) {
        systemMapScene = new MapScene(sketch);
        
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
        
        systemMapScene.initializeMapScene(sketch);
        systemMapScene.spaceship.setOrbitBody(centralStar, false);
        systemMapScene.setInSystemView(true);

        // Switch to system scene
        currentScene = systemMapScene;
        controlHandler.attachEventListeners(sketch, camera, systemMapScene);
        
        // Reset camera and zoom in
        camera.panX = 0;
        camera.panY = 0;
        camera.scaleFactor = 1.0;
        camera.setAutoCamera(centralStar.baseX, centralStar.baseY, 2.0);
    }

    // Attach the enterStarSystem function to the window object
    window.enterStarSystem = enterStarSystem;

    // Function to return to galaxy map
    window.returnToGalaxyMap = function() {
        currentScene = galaxyMapScene;
        controlHandler.attachEventListeners(sketch, camera, galaxyMapScene);
    }
};

// Attach the sketch to a specific DOM element
let myMapSketch = new p5(mapSketch, 'simple-example-holder');
