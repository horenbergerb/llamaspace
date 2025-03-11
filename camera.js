export function isMouseInsideCanvas(sketch) {
    return (
        sketch.mouseX >= 0 &&
        sketch.mouseX <= sketch.width &&
        sketch.mouseY >= 0 &&
        sketch.mouseY <= sketch.height
    );
}

// Panning and Zooming Controls
export function handleMousePressedCamera(sketch, camera, autoCamera) {
    autoCamera.isAutoPanning = false;

    camera.startMouseX = sketch.mouseX;
    camera.startMouseY = sketch.mouseY;

    camera.lastMouseX = sketch.mouseX;
    camera.lastMouseY = sketch.mouseY;
    camera.isDragging = true;
}

export function handleMouseReleasedCamera(sketch, camera, autoCamera) {
    if (camera.startMouseX === sketch.mouseX && camera.startMouseY === sketch.mouseY){
        let mouseXRel = (sketch.mouseX - camera.panX) / camera.scaleFactor;
        let mouseYRel = (sketch.mouseY - camera.panY) / camera.scaleFactor;
        setAutoCamera(autoCamera, mouseXRel, mouseYRel, 1.0);
    }

    camera.isDragging = false;
}

export function handleMouseDraggedCamera(sketch, camera) {
    if (camera.isDragging) {
        camera.panX += (sketch.mouseX - camera.lastMouseX);
        camera.panY += (sketch.mouseY - camera.lastMouseY);
        camera.lastMouseX = sketch.mouseX;
        camera.lastMouseY = sketch.mouseY;

        let zoomedWidth = sketch.width * camera.scaleFactor;
        let zoomedHeight = sketch.height * camera.scaleFactor;
    
        let maxOffsetX = zoomedWidth * 1.0;
        let maxOffsetY = zoomedHeight * 1.0;

        camera.panX = sketch.constrain(camera.panX, -maxOffsetX, maxOffsetX);
        camera.panY = sketch.constrain(camera.panY, -maxOffsetY, maxOffsetY);
    }
}

export function handleMouseWheelCamera(sketch, event, camera, autoCamera) {
    if (!isMouseInsideCanvas(sketch)) {
        return;
    }

    autoCamera.isAutoPanning = false;

    let zoomAmount = 0.1; // Adjust the sensitivity of zoom
    let newZoom = camera.scaleFactor + (event.delta > 0 ? -zoomAmount : zoomAmount);

    // Constrain zoom to avoid flipping or excessive zooming
    newZoom = sketch.constrain(newZoom, 0.7, 5);

    // Adjust zoom so it zooms towards the mouse position
    let mouseXRel = (sketch.mouseX - camera.panX) / camera.scaleFactor;
    let mouseYRel = (sketch.mouseY - camera.panY) / camera.scaleFactor;

    camera.panX -= mouseXRel * (newZoom - camera.scaleFactor);
    camera.panY -= mouseYRel * (newZoom - camera.scaleFactor);

    camera.scaleFactor = newZoom;

    return false;

}

export function setAutoCamera(autoCamera, rawTargetPanX, rawTargetPanY, targetZoom) {
    autoCamera.rawTargetPanX = rawTargetPanX;
    autoCamera.rawTargetPanY = rawTargetPanY;
    autoCamera.targetZoom = targetZoom;
    autoCamera.isAutoPanning = true;
}

export function handleAutoCamera(sketch, camera, autoCamera) {
    // Smoothly interpolate panX and panY towards targetPanX and targetPanY
    if (autoCamera.isAutoPanning) {
        let targetPanX = sketch.width / 2 - autoCamera.rawTargetPanX * camera.scaleFactor;
        let targetPanY = sketch.height / 2 - autoCamera.rawTargetPanY * camera.scaleFactor;

        let lerpFactor = 0.1; // Adjust for smoothness (0.1 = slow, 1 = immediate)
        camera.panX = sketch.lerp(camera.panX, targetPanX, lerpFactor);
        camera.panY = sketch.lerp(camera.panY, targetPanY, lerpFactor);
        camera.scaleFactor = sketch.lerp(camera.scaleFactor, autoCamera.targetZoom, lerpFactor);

        // Stop panning if close to the target
        if (Math.abs(camera.panX - targetPanX) < 1 && Math.abs(camera.panY - targetPanY) < 1) {
            autoCamera.isAutoPanning = false;
        }
    }
}