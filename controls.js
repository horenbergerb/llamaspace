
export function touchStarted(camera) {
    return camera.handleTouchStartCamera();
}

export function touchMoved(camera) {
    return camera.handleTouchMovedCamera();
}

export function mousePressed(camera) {
    camera.handleMousePressedCamera();
}

export function mouseReleased(sketch, camera, mapStars, spaceship) {
    camera.handleMouseReleasedCamera();
    mapStars.handleMouseReleasedMapStars(sketch, camera, spaceship);
}

export function mouseDragged(camera) {
    return camera.handleMouseDraggedCamera();
}

export function mouseWheel(event, camera) {
    return camera.handleMouseWheelCamera(event);
}