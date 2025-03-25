import { isMouseInsideCanvas } from "./utils/utils.js";

export class ControlHandler {

    constructor(sketch) {
        this.isTouchEvent = false;
        this.sketch = null;
        this.uiManager = null;
    }

    touchStarted(sketch, camera, mapScene) {
        if (!sketch.touches || sketch.touches.length === 0) return false;
        
        // Store sketch reference
        this.sketch = sketch;

        // Check if touch is in UI first
        if (this.uiManager && this.uiManager.handleTouchStart(camera, sketch.touches[0].x, sketch.touches[0].y)) {
            return false;
        }

        // Check if touch is in UI
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
        if (this.uiManager && this.uiManager.handleTouchMove(camera, sketch.touches[0].x, sketch.touches[0].y)) {
            return false;
        }

        // Check if touch is in UI
        if (sketch.touches.length === 1 && mapScene.handleTouchMoveMapScene(camera, sketch.touches[0].x, sketch.touches[0].y)) {
            return false;
        }

        return camera.handleTouchMovedCamera();
    }

    touchEnded(sketch, camera, mapScene) {
        // Get the last touch position before it's removed
        let lastTouchX = sketch.touches.length > 0 ? sketch.touches[0].x : sketch.mouseX;
        let lastTouchY = sketch.touches.length > 0 ? sketch.touches[0].y : sketch.mouseY;
        
        // Handle UI touch events first and return if they handle the touch
        if (this.uiManager && this.uiManager.handleTouchEnd(camera, lastTouchX, lastTouchY)) {
            return false;
        }
        if (mapScene.handleTouchEndMapScene(camera, lastTouchX, lastTouchY)) {
            return false;
        }
        
        // Only trigger mouse release if we had a single touch
        if (!sketch.touches || sketch.touches.length === 0) {
            this.mouseReleased(sketch, camera, mapScene);
        }
        return false;
    }

    mousePressed(sketch, camera, mapScene) {
        // Check UI first
        if (this.uiManager && this.uiManager.handleMousePressed(camera, sketch.mouseX, sketch.mouseY)) {
            return;
        }
        
        camera.handleMousePressedCamera();
        mapScene.handleMousePressedMapScene();
    }

    mouseReleased(sketch, camera, mapScene) {
        // Check UI first
        if (this.uiManager && this.uiManager.handleMouseReleased(camera, sketch.mouseX, sketch.mouseY)) {
            return;
        }
        
        // Then check map scene UI
        if (!mapScene.handleMouseReleasedMapScene(camera)) {
            camera.handleMouseReleasedCamera();
        }
    }

    mouseDragged(camera) {
        return camera.handleMouseDraggedCamera();
    }

    mouseWheel(event, camera, mapScene) {
        // Check if we should handle UI scrolling first
        if (this.uiManager && this.uiManager.handleMouseWheel(event)) {
            return false;
        }
        // Then check map scene UI
        if (mapScene.handleMouseWheelMapScene(event)) {
            return false;
        }
        // If not handled by UI, let camera handle it
        return camera.handleMouseWheelCamera(event);
    }

    attachEventListeners(sketch, camera, mapScene, uiManager) {
        this.sketch = sketch;
        this.uiManager = uiManager;
        
        // Attach event listeners
        sketch.mousePressed = () => this.mousePressed(sketch, camera, mapScene);
        sketch.mouseReleased = () => this.mouseReleased(sketch, camera, mapScene);
        sketch.mouseDragged = () => this.mouseDragged(camera);
        sketch.mouseWheel = (event) => this.mouseWheel(event, camera, mapScene);
        sketch.touchStarted = () => this.touchStarted(sketch, camera, mapScene);
        sketch.touchMoved = () => this.touchMoved(sketch, camera, mapScene);
        sketch.touchEnded = () => this.touchEnded(sketch, camera, mapScene);
        
        // Add keyboard event listeners
        window.addEventListener('keydown', (e) => {
            if (this.uiManager && this.uiManager.handleKeyDown(e)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (this.uiManager && this.uiManager.handleKeyUp(e)) {
                e.preventDefault();
            }
        });
        
        // Disable right-click menu on the canvas
        sketch.canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
    }
}