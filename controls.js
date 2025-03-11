import { handleMouseDraggedCamera, handleMousePressedCamera, handleMouseReleasedCamera, handleMouseWheelCamera } from "./camera.js";

export function mousePressed(sketch, camera, autoCamera) {
    handleMousePressedCamera(sketch, camera, autoCamera);
}

export function mouseReleased(sketch, camera, autoCamera, mapStars, spaceship) {
    handleMouseReleasedCamera(sketch, camera, autoCamera);
    mapStars.handleMouseReleasedMapStars(sketch, camera, spaceship);
}

export function mouseDragged(sketch, camera) {
    handleMouseDraggedCamera(sketch,  camera);
}

export function mouseWheel(sketch, event, camera, autoCamera) {
    return handleMouseWheelCamera(sketch, event, camera, autoCamera);
}