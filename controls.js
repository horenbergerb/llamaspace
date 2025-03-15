import { isMouseInsideCanvas } from "./utils.js";

export class ControlHandler {

    constructor(sketch) {

    }

    touchStarted(camera) {
        return camera.handleTouchStartCamera();
    }

    touchMoved(camera) {
        return camera.handleTouchMovedCamera();
    }

    mousePressed(sketch, camera, mapScene) {
        camera.handleMousePressedCamera();
        mapScene.handleMousePressedMapScene(sketch);
    }

    mouseReleased(sketch, camera, mapScene, spaceship) {
        camera.handleMouseReleasedCamera();
        mapScene.handleMouseReleasedMapScene(sketch, camera, spaceship);
    }

    mouseDragged(camera) {
        return camera.handleMouseDraggedCamera();
    }

    mouseWheel(event, camera) {
        return camera.handleMouseWheelCamera(event);
    }

    attachEventListeners(sketch, camera, mapScene, spaceship){
        // Attach event listeners
        sketch.mousePressed = () => this.mousePressed(sketch, camera, mapScene);
        sketch.mouseReleased = () => this.mouseReleased(sketch, camera, mapScene, spaceship);
        sketch.mouseDragged = () => this.mouseDragged(camera);
        sketch.mouseWheel = (event) => this.mouseWheel(event, camera);
        sketch.touchStarted = () => this.touchStarted(camera);
        sketch.touchMoved = () => this.touchMoved(camera);

        // Disable right-click menu on the canvas
        sketch.canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
}

}