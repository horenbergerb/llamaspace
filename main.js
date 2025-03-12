import {MapBackground} from './background.js'
import { handleAutoCamera, setAutoCamera } from './camera.js';
import { mouseDragged, mousePressed, mouseReleased, mouseWheel } from './controls.js';
import { MapStars } from './map-stars.js'
import { Spaceship } from './spaceship.js';

let mapBackground = new MapBackground();
let mapStars = new MapStars();

let spaceship = new Spaceship();

const camera = {
    scaleFactor: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    startMouseX: 0,
    startMouseY: 0,
}

const autoCamera = {
    isAutoPanning: true,
    rawTargetPanX: 0,
    rawTargetPanY: 0,
    targetZoom: 1.0
}

var mapSketch = function(sketch) {
    sketch.preload = function() {
        spaceship.preload(sketch);
    };

    sketch.setup = async function() {
        sketch.createCanvas(sketch.windowWidth, sketch.windowHeight);

        sketch.push();
        sketch.translate(camera.panX, camera.panY);
        sketch.scale(camera.scaleFactor);

        mapBackground.initializeBackground(sketch);
        mapStars.initializeMapStars(sketch);

        sketch.pop();

        spaceship.setOrbitStar(mapStars.getRandomStar(), false);
        setAutoCamera(autoCamera, spaceship.orbitStar.baseX, spaceship.orbitStar.baseY, 1.0);
    }

    sketch.draw = function() {

        sketch.push();
        sketch.translate(camera.panX, camera.panY);
        handleAutoCamera(sketch, camera, autoCamera);
        sketch.pop();

        mapBackground.drawBackground(sketch, camera);

        sketch.push();
        sketch.translate(camera.panX, camera.panY);
        sketch.scale(camera.scaleFactor);

        mapStars.drawMapStars(sketch, camera);
        spaceship.drawSpaceship(sketch);

        sketch.pop();
    }

    // Attach event listeners
    sketch.mousePressed = function() { mousePressed(sketch, camera, autoCamera); };
    sketch.mouseReleased = function() { mouseReleased(sketch, camera, autoCamera, mapStars, spaceship); };
    sketch.mouseDragged = function() { mouseDragged(sketch, camera); };
    sketch.mouseWheel = function(event) { return mouseWheel(sketch, event, camera, autoCamera); };

};

// Attach the sketch to a specific DOM element
let myMapSketch = new p5(mapSketch, 'simple-example-holder');
