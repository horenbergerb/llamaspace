export class Camera{
    constructor(sketch) {
        this.sketch = sketch

        this.scaleFactor = 1;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.startMouseX = 0;
        this.startMouseY = 0;

        this.lastTouchDist = null;

        // Autocamera parameters
        this.isAutoPanning = true;
        this.rawTargetPanX = 0;
        this.rawTargetPanY = 0;
        this.targetZoom = 1.0;
    }

    // Panning and Zooming Controls
    handleMousePressedCamera() {
        this.isAutoPanning = false;

        this.startMouseX = this.sketch.mouseX;
        this.startMouseY = this.sketch.mouseY;

        this.lastMouseX = this.sketch.mouseX;
        this.lastMouseY = this.sketch.mouseY;
        this.isDragging = true;
    }

    handleTouchStartCamera() {
        if (this.sketch.touches.length === 2) {
            const touch1 = this.sketch.touches[0];
            const touch2 = this.sketch.touches[1];
            this.lastTouchDist = this.sketch.dist(touch1.x, touch1.y, touch2.x, touch2.y);
            return false;
        }

        this.handleMousePressedCamera();
        return false;
    }

    handleTouchMovedCamera() {
        if (this.sketch.touches.length === 2) {
            // Pinch zoom
            const touch1 = this.sketch.touches[0];
            const touch2 = this.sketch.touches[1];
            const currentDist = this.sketch.dist(touch1.x, touch1.y, touch2.x, touch2.y);
    
            if (this.lastTouchDist){
                const zoomFactor = 0.01; // Sensitivity
                let newZoom = this.scaleFactor + (currentDist - this.lastTouchDist) * zoomFactor;
            
                newZoom = this.sketch.constrain(newZoom, 0.5, 5);
            
                // Calculate midpoint of two touch points in world coordinates
                let midX = (touch1.x + touch2.x) / 2;
                let midY = (touch1.y + touch2.y) / 2;
                let midXWorld = (midX - this.panX) / this.scaleFactor;
                let midYWorld = (midY - this.panY) / this.scaleFactor;
            
                let zoomChange = newZoom / this.scaleFactor;
                this.scaleFactor = newZoom;
            
                // Adjust pan to keep the zoom centered on the midpoint
                this.panX -= (midXWorld * zoomChange - midXWorld) * this.scaleFactor;
                this.panY -= (midYWorld * zoomChange - midYWorld) * this.scaleFactor;
            }

            this.lastTouchDist = currentDist;
            return false;
        } else {
            this.handleMouseDraggedCamera();
            return false;
        }
    }

    handleMouseReleasedCamera() {
        if (this.startMouseX === this.sketch.mouseX && this.startMouseY === this.sketch.mouseY){
            let mouseXRel = (this.sketch.mouseX - this.panX) / this.scaleFactor;
            let mouseYRel = (this.sketch.mouseY - this.panY) / this.scaleFactor;
            this.setAutoCamera( mouseXRel, mouseYRel, this.scaleFactor);
        }

        this.isDragging = false;
        return false;
    }

    handleMouseDraggedCamera() {
        if (this.isDragging) {
            this.panX += (this.sketch.mouseX - this.lastMouseX);
            this.panY += (this.sketch.mouseY - this.lastMouseY);
            this.lastMouseX = this.sketch.mouseX;
            this.lastMouseY = this.sketch.mouseY;

            let zoomedWidth = this.sketch.width * this.scaleFactor;
            let zoomedHeight = this.sketch.height * this.scaleFactor;
        
            let maxOffsetX = zoomedWidth * 1.0;
            let maxOffsetY = zoomedHeight * 1.0;

            this.panX = this.sketch.constrain(this.panX, -maxOffsetX, maxOffsetX);
            this.panY = this.sketch.constrain(this.panY, -maxOffsetY, maxOffsetY);

            return false;
        }
        return;
    }

    handleMouseWheelCamera(event) {
        this.isAutoPanning = false;

        let zoomAmount = 0.1; // Sensitivity
        let newZoom = this.scaleFactor + (event.delta > 0 ? -zoomAmount : zoomAmount);

        newZoom = this.sketch.constrain(newZoom, 0.7, 5);

        // Adjust zoom so it zooms towards the mouse position
        let mouseXRel = (this.sketch.mouseX - this.panX) / this.scaleFactor;
        let mouseYRel = (this.sketch.mouseY - this.panY) / this.scaleFactor;

        this.panX -= mouseXRel * (newZoom - this.scaleFactor);
        this.panY -= mouseYRel * (newZoom - this.scaleFactor);

        this.scaleFactor = newZoom;

        return false;

    }

    setAutoCamera(rawTargetPanX, rawTargetPanY, targetZoom) {
        this.rawTargetPanX = rawTargetPanX;
        this.rawTargetPanY = rawTargetPanY;
        this.targetZoom = targetZoom;
        this.isAutoPanning = true;
    }

    handleAutoCamera() {
        // Smoothly interpolate panX and panY towards targetPanX and targetPanY
        if (this.isAutoPanning) {
            let targetPanX = this.sketch.width / 2 - this.rawTargetPanX * this.scaleFactor;
            let targetPanY = this.sketch.height / 2 - this.rawTargetPanY * this.scaleFactor;

            let lerpFactor = 0.1; // Adjust for smoothness (0.1 = slow, 1 = immediate)
            this.panX = this.sketch.lerp(this.panX, targetPanX, lerpFactor);
            this.panY = this.sketch.lerp(this.panY, targetPanY, lerpFactor);
            this.scaleFactor = this.sketch.lerp(this.scaleFactor, this.targetZoom, lerpFactor);

            // Stop panning if close to the target
            if (Math.abs(this.panX - targetPanX) < 1 && Math.abs(this.panY - targetPanY) < 1) {
                this.isAutoPanning = false;
            }
        }
    }

    applyCameraTransform(){
        this.sketch.push();
        this.sketch.translate(this.panX, this.panY);
        this.sketch.scale(this.scaleFactor);
    }

    endCameraTransform(){
        this.sketch.pop();
    }

}