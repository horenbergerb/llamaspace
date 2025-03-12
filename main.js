import {MapBackground} from './background.js'
import { Camera } from './camera.js';
import { mouseDragged, mousePressed, mouseReleased, mouseWheel } from './controls.js';
import { MapStars } from './map-stars.js'
import { Spaceship } from './spaceship.js';

let mapBackground = new MapBackground();
let mapStars = new MapStars();

let spaceship = new Spaceship();

let camera = new Camera();

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
        camera.setAutoCamera(spaceship.orbitStar.baseX, spaceship.orbitStar.baseY, 1.0);
    }

    sketch.draw = function() {

        sketch.push();
        sketch.translate(camera.panX, camera.panY);
        camera.handleAutoCamera(sketch);
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
    sketch.mousePressed = function() { mousePressed(sketch, camera); };
    sketch.mouseReleased = function() { mouseReleased(sketch, camera, mapStars, spaceship); };
    sketch.mouseDragged = function() { mouseDragged(sketch, camera); };
    sketch.mouseWheel = function(event) { return mouseWheel(sketch, event, camera); };

};

// Attach the sketch to a specific DOM element
let myMapSketch = new p5(mapSketch, 'simple-example-holder');
