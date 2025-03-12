
export function mousePressed(sketch, camera) {
    camera.handleMousePressedCamera(sketch);
}

export function mouseReleased(sketch, camera, mapStars, spaceship) {
    camera.handleMouseReleasedCamera(sketch);
    mapStars.handleMouseReleasedMapStars(sketch, camera, spaceship);
}

export function mouseDragged(sketch, camera) {
    camera.handleMouseDraggedCamera(sketch);
}

export function mouseWheel(sketch, event, camera) {
    return camera.handleMouseWheelCamera(sketch, event);
}