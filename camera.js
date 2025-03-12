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
    handleMousePressedCamera(sketch) {
        this.isAutoPanning = false;

        this.startMouseX = sketch.mouseX;
        this.startMouseY = sketch.mouseY;

        this.lastMouseX = sketch.mouseX;
        this.lastMouseY = sketch.mouseY;
        this.isDragging = true;
    }

    handleMouseReleasedCamera(sketch) {
        if (this.startMouseX === sketch.mouseX && this.startMouseY === sketch.mouseY){
            let mouseXRel = (sketch.mouseX - this.panX) / this.scaleFactor;
            let mouseYRel = (sketch.mouseY - this.panY) / this.scaleFactor;
            this.setAutoCamera( mouseXRel, mouseYRel, 1.0);
        }

        this.isDragging = false;
    }

    handleMouseDraggedCamera(sketch) {
        if (this.isDragging) {
            this.panX += (sketch.mouseX - this.lastMouseX);
            this.panY += (sketch.mouseY - this.lastMouseY);
            this.lastMouseX = sketch.mouseX;
            this.lastMouseY = sketch.mouseY;

            let zoomedWidth = sketch.width * this.scaleFactor;
            let zoomedHeight = sketch.height * this.scaleFactor;
        
            let maxOffsetX = zoomedWidth * 1.0;
            let maxOffsetY = zoomedHeight * 1.0;

            this.panX = sketch.constrain(this.panX, -maxOffsetX, maxOffsetX);
            this.panY = sketch.constrain(this.panY, -maxOffsetY, maxOffsetY);
        }
    }

    handleMouseWheelCamera(sketch, event) {
        if (!isMouseInsideCanvas(sketch)) {
            return;
        }

        this.isAutoPanning = false;

        let zoomAmount = 0.1; // Adjust the sensitivity of zoom
        let newZoom = this.scaleFactor + (event.delta > 0 ? -zoomAmount : zoomAmount);

        // Constrain zoom to avoid flipping or excessive zooming
        newZoom = sketch.constrain(newZoom, 0.7, 5);

        // Adjust zoom so it zooms towards the mouse position
        let mouseXRel = (sketch.mouseX - this.panX) / this.scaleFactor;
        let mouseYRel = (sketch.mouseY - this.panY) / this.scaleFactor;

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

    handleAutoCamera(sketch) {
        // Smoothly interpolate panX and panY towards targetPanX and targetPanY
        if (this.isAutoPanning) {
            let targetPanX = sketch.width / 2 - this.rawTargetPanX * this.scaleFactor;
            let targetPanY = sketch.height / 2 - this.rawTargetPanY * this.scaleFactor;

            let lerpFactor = 0.1; // Adjust for smoothness (0.1 = slow, 1 = immediate)
            this.panX = sketch.lerp(this.panX, targetPanX, lerpFactor);
            this.panY = sketch.lerp(this.panY, targetPanY, lerpFactor);
            this.scaleFactor = sketch.lerp(this.scaleFactor, this.targetZoom, lerpFactor);

            // Stop panning if close to the target
            if (Math.abs(this.panX - targetPanX) < 1 && Math.abs(this.panY - targetPanY) < 1) {
                this.isAutoPanning = false;
            }
        }
    }
}