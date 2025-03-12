export function isMouseInsideCanvas(sketch) {
    return (
        sketch.mouseX >= 0 &&
        sketch.mouseX <= sketch.width &&
        sketch.mouseY >= 0 &&
        sketch.mouseY <= sketch.height
    );
}

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

    handleMouseReleasedCamera() {
        if (this.startMouseX === this.sketch.mouseX && this.startMouseY === this.sketch.mouseY){
            let mouseXRel = (this.sketch.mouseX - this.panX) / this.scaleFactor;
            let mouseYRel = (this.sketch.mouseY - this.panY) / this.scaleFactor;
            this.setAutoCamera( mouseXRel, mouseYRel, 1.0);
        }

        this.isDragging = false;
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
        }
    }

    handleMouseWheelCamera(event) {
        if (!isMouseInsideCanvas(this.sketch)) {
            return;
        }

        this.isAutoPanning = false;

        let zoomAmount = 0.1; // Adjust the sensitivity of zoom
        let newZoom = this.scaleFactor + (event.delta > 0 ? -zoomAmount : zoomAmount);

        // Constrain zoom to avoid flipping or excessive zooming
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