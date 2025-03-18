import { isMouseInsideCanvas } from "./utils/utils.js";

export class ControlHandler {

    constructor(sketch) {
        this.isTouchEvent = false;
        this.sketch = null;
    }

    touchStarted(sketch, camera, mapScene) {
        if (!sketch.touches || sketch.touches.length === 0) return false;
        
        // Store sketch reference
        this.sketch = sketch;

        // Check if touch is in UI first
        if (mapScene.handleTouchStartMapScene(camera, sketch.touches[0].x, sketch.touches[0].y)) {
            return false;
        }

        // Handle pinch-to-zoom with two fingers
        if (sketch.touches.length === 2) {
            camera.handleTouchStartCamera();
            return false;
        }
        
        // Single touch - handle as regular press
        let out = true;
        out &= camera.handleTouchStartCamera();
        out &= mapScene.handleMousePressedMapScene();
        return out;
    }

    touchMoved(sketch, camera, mapScene) {
        if (!sketch.touches || sketch.touches.length === 0) return false;

        // Check if touch is in UI first
        if (sketch.touches.length === 1 && mapScene.handleTouchMoveMapScene(camera, sketch.touches[0].x, sketch.touches[0].y)) {
            return false;
        }

        return camera.handleTouchMovedCamera();
    }

    touchEnded(sketch, camera, mapScene) {
        // Get the last touch position before it's removed
        let lastTouchX = sketch.touches.length > 0 ? sketch.touches[0].x : sketch.mouseX;
        let lastTouchY = sketch.touches.length > 0 ? sketch.touches[0].y : sketch.mouseY;
        
        mapScene.handleTouchEndMapScene(camera, lastTouchX, lastTouchY);
        
        // Only trigger mouse release if we had a single touch
        if (!sketch.touches || sketch.touches.length === 0) {
            this.mouseReleased(sketch, camera, mapScene);
        }
        return false;
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

    mouseWheel(event, camera, mapScene) {
        // Check if we should handle UI scrolling first
        if (mapScene.handleMouseWheelMapScene(event)) {
            return false;
        }
        // If not handled by UI, let camera handle it
        return camera.handleMouseWheelCamera(event);
    }

    attachEventListeners(sketch, camera, mapScene) {
        this.sketch = sketch;
        
        // Attach event listeners
        sketch.mousePressed = () => this.mousePressed(sketch, camera, mapScene);
        sketch.mouseReleased = () => this.mouseReleased(sketch, camera, mapScene);
        sketch.mouseDragged = () => this.mouseDragged(camera);
        sketch.mouseWheel = (event) => this.mouseWheel(event, camera, mapScene);
        sketch.touchStarted = () => this.touchStarted(sketch, camera, mapScene);
        sketch.touchMoved = () => this.touchMoved(sketch, camera, mapScene);
        sketch.touchEnded = () => this.touchEnded(sketch, camera, mapScene);
        
        // Disable right-click menu on the canvas
        sketch.canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
    }

}