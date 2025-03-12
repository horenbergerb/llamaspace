import {MapBackground} from './background.js'
import { Camera } from './camera.js';
import { mouseDragged, mousePressed, mouseReleased, mouseWheel } from './controls.js';
import { MapStars } from './map-stars.js'
import { Spaceship } from './spaceship.js';

let mapBackground = null;
let mapStars = null;

let spaceship = null;

let camera = null;

var mapSketch = function(sketch) {
    sketch.preload = function() {
        mapBackground = new MapBackground();
        mapStars = new MapStars();

        spaceship = new Spaceship();
        camera = new Camera(sketch);

        spaceship.preload(sketch);
    };

    sketch.setup = async function() {
        sketch.createCanvas(sketch.windowWidth, sketch.windowHeight);

        sketch.push();
        sketch.translate(camera.panX, camera.panY);
        sketch.scale(camera.scaleFactor);

        mapBackground.initializeBackground(sketch, camera);
        mapStars.initializeMapStars(sketch);

        sketch.pop();

        spaceship.setOrbitStar(mapStars.getRandomStar(), false);
        camera.setAutoCamera(spaceship.orbitStar.baseX, spaceship.orbitStar.baseY, 1.0);
    }

    sketch.draw = function() {

        sketch.push();
        sketch.translate(camera.panX, camera.panY);
        camera.handleAutoCamera();
        sketch.pop();

        mapBackground.drawBackground(sketch);

        camera.applyCameraTransform();

        mapStars.drawMapStars(sketch);
        spaceship.drawSpaceship(sketch);

        camera.endCameraTransform();
    }

    // Attach event listeners
    sketch.mousePressed = function() { mousePressed(camera); };
    sketch.mouseReleased = function() { mouseReleased(sketch, camera, mapStars, spaceship); };
    sketch.mouseDragged = function() { mouseDragged(camera); };
    sketch.mouseWheel = function(event) { return mouseWheel(event, camera); };

};

// Attach the sketch to a specific DOM element
let myMapSketch = new p5(mapSketch, 'simple-example-holder');
