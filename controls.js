export class ControlHandler {

    constructor(sketch) {

    }

    touchStarted(camera) {
        return camera.handleTouchStartCamera();
    }

    touchMoved(camera) {
        return camera.handleTouchMovedCamera();
    }

    mousePressed(camera) {
        camera.handleMousePressedCamera();
    }

    mouseReleased(sketch, camera, mapStars, spaceship) {
        camera.handleMouseReleasedCamera();
        mapStars.handleMouseReleasedMapStars(sketch, camera, spaceship);
    }

    mouseDragged(camera) {
        return camera.handleMouseDraggedCamera();
    }

    mouseWheel(event, camera) {
        return camera.handleMouseWheelCamera(event);
    }

    attachEventListeners(sketch, camera, mapStars, spaceship){
        // Attach event listeners
        sketch.mousePressed = () => this.mousePressed(camera);
        sketch.mouseReleased = () => this.mouseReleased(sketch, camera, mapStars, spaceship);
        sketch.mouseDragged = () => this.mouseDragged(camera);
        sketch.mouseWheel = (event) => this.mouseWheel(event, camera);
        sketch.touchStarted = () => this.touchStarted(camera);
        sketch.touchMoved = () => this.touchMoved(camera);
}

}