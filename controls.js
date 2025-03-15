import { isMouseInsideCanvas } from "./utils.js";

export class ControlHandler {

    constructor(sketch) {

    }

    touchStarted(camera, mapScene) {
        let out = true;
        out &= camera.handleTouchStartCamera();
        out &= mapScene.handleMousePressedMapScene();
    }

    touchMoved(camera) {
        return camera.handleTouchMovedCamera();
    }

    mousePressed(sketch, camera, mapScene) {
        camera.handleMousePressedCamera();
        mapScene.handleMousePressedMapScene();
    }

    mouseReleased(sketch, camera, mapScene) {
        if (!mapScene.handleMouseReleasedMapScene(camera))
            camera.handleMouseReleasedCamera();

    }

    mouseDragged(camera) {
        return camera.handleMouseDraggedCamera();
    }

    mouseWheel(event, camera) {
        return camera.handleMouseWheelCamera(event);
    }

    attachEventListeners(sketch, camera, mapScene){
        // Attach event listeners
        sketch.mousePressed = () => this.mousePressed(sketch, camera, mapScene);
        sketch.mouseReleased = () => this.mouseReleased(sketch, camera, mapScene);
        sketch.mouseDragged = () => this.mouseDragged(camera);
        sketch.mouseWheel = (event) => this.mouseWheel(event, camera);
        sketch.touchStarted = () => this.touchStarted(camera, mapScene);
        sketch.touchMoved = () => this.touchMoved(camera);

        // Disable right-click menu on the canvas
        sketch.canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
}

}