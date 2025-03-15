import { MapBackground } from './background.js'
import { Camera } from './camera.js';
import { ControlHandler } from './controls.js';
import { MapScene } from './map-scene.js'
import { Spaceship } from './spaceship.js';
import { MapStar } from './map-star.js';

let mapBackground = null;
let galaxyMapScene = null;
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

        // Todo: make this take a function and create a draw function?
        // Same for initialize logic above
        camera.applyCameraTransform();

        galaxyMapScene.drawMapScene(camera);

        camera.endCameraTransform();
    }

    function generateGalaxy() {
        for (let i = 0; i < 120; i++) {
            galaxyMapScene.mapBodies.push(new MapStar(sketch));
        }
    }

};

// Attach the sketch to a specific DOM element
let myMapSketch = new p5(mapSketch, 'simple-example-holder');
