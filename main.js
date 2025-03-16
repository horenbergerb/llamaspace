import { MapBackground } from './background.js'
import { Camera } from './camera.js';
import { ControlHandler } from './controls.js';
import { MapScene } from './map-scene.js'
import { Spaceship } from './spaceship.js';
import { MapStar } from './map-star.js';
import { MapPlanet } from './map-planet.js';

let mapBackground = null;
let galaxyMapScene = null;
let systemMapScene = null; // New scene for when we enter a star system
let currentScene = null; // Track which scene is active
let camera = null;
let controlHandler = null;

var mapSketch = function(sketch) {
    sketch.preload = function() {
        mapBackground = new MapBackground(sketch);
        galaxyMapScene = new MapScene(sketch);
        Spaceship.preload(sketch);
        camera = new Camera(sketch);
        controlHandler = new ControlHandler();
    };

    sketch.setup = async function() {
        let sketchHolder = document.getElementById('simple-example-holder'); // Get the container
        let w = sketchHolder.clientWidth;
        sketch.createCanvas(w, sketch.windowHeight*0.7);

        controlHandler.attachEventListeners(sketch, camera, galaxyMapScene);

        camera.applyCameraTransform();

        mapBackground.initializeBackground(camera);

        generateGalaxy();
        galaxyMapScene.initializeMapScene(sketch);
        currentScene = galaxyMapScene; // Set initial scene

        camera.endCameraTransform();

        // Start at a random star and configure the camera to autopan to it
        galaxyMapScene.spaceship.setOrbitBody(galaxyMapScene.getRandomBody(), false);
        camera.setAutoCamera(galaxyMapScene.spaceship.orbitBody.baseX, galaxyMapScene.spaceship.orbitBody.baseY, 1.0);
    }

    sketch.draw = function() {
        camera.handleAutoCamera();

        // Background is drawn without camera transform
        // since it needs weird logic to preserve parallax
        mapBackground.drawBackground();

        camera.applyCameraTransform();

        currentScene.drawMapScene(camera);

        camera.endCameraTransform();
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

    // Function to return to galaxy map
    function returnToGalaxyMap() {
        currentScene = galaxyMapScene;
        controlHandler.attachEventListeners(sketch, camera, galaxyMapScene);
        systemMapScene = null;
        
        // Reset camera
        camera.panX = 0;
        camera.panY = 0;
        camera.scaleFactor = 1.0;
        
        // Auto-pan to the star we just exited
        let lastStar = galaxyMapScene.selectedStar;
        if (lastStar) {
            camera.setAutoCamera(lastStar.baseX, lastStar.baseY, 1.0);
        }
    }

    // Expose these functions to the window so they can be called from other modules
    window.enterStarSystem = enterStarSystem;
    window.returnToGalaxyMap = returnToGalaxyMap;
};

// Attach the sketch to a specific DOM element
let myMapSketch = new p5(mapSketch, 'simple-example-holder');
