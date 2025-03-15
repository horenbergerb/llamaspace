import { MapBackground } from './background.js'
import { Camera } from './camera.js';
import { ControlHandler } from './controls.js';
import { MapScene } from './map-stars.js'
import { Spaceship } from './spaceship.js';

let mapBackground = null;
let mapScene = null;
let spaceship = null;
let camera = null;
let controlHandler = null;

var mapSketch = function(sketch) {
    sketch.preload = function() {
        mapBackground = new MapBackground(sketch);
        mapScene = new MapScene();
        spaceship = new Spaceship(sketch);
        camera = new Camera(sketch);
        controlHandler = new ControlHandler();

        spaceship.preload();
    };

    sketch.setup = async function() {
        let sketchHolder = document.getElementById('simple-example-holder'); // Get the container
        let w = sketchHolder.clientWidth;
        sketch.createCanvas(w, sketch.windowHeight*0.7);

        controlHandler.attachEventListeners(sketch, camera, mapScene, spaceship);

        camera.applyCameraTransform();

        mapBackground.initializeBackground(camera);
        mapScene.initializeMapScene(sketch);

        camera.endCameraTransform();

        // Start at a random star and configure the camera to autopan to it
        spaceship.setOrbitStar(mapScene.getRandomStar(), false);
        camera.setAutoCamera(spaceship.orbitStar.baseX, spaceship.orbitStar.baseY, 1.0);
    }

    sketch.draw = function() {

        camera.handleAutoCamera();

        // Background is drawn without camera transform
        // since it needs weird logic to preserve parallax
        mapBackground.drawBackground();

        // Todo: make this take a function and create a draw function?
        // Same for initialize logic above
        camera.applyCameraTransform();

        mapScene.drawMapScene(sketch, camera);
        spaceship.drawSpaceship();

        camera.endCameraTransform();
    }

};

// Attach the sketch to a specific DOM element
let myMapSketch = new p5(mapSketch, 'simple-example-holder');
