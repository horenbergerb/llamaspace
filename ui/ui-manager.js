export class UIManager {
    constructor() {
        this.uiComponents = new Map();
    }

    addUI(name, component) {
        this.uiComponents.set(name, component);
    }

    getUI(name) {
        return this.uiComponents.get(name);
    }

    renderButtons(camera) {
        for (const ui of this.uiComponents.values()) {
            ui.renderButton(camera);
        }
    }

    renderWindows(camera) {
        for (const ui of this.uiComponents.values()) {
            ui.renderWindow(camera);
        }
    }

    handleMousePressed(camera, mouseX, mouseY) {
        for (const ui of this.uiComponents.values()) {
            if (ui.handleMousePressed && ui.handleMousePressed(camera, mouseX, mouseY)) {
                return true;
            }
        }
        return false;
    }

    handleMouseReleased(camera, mouseX, mouseY) {
        for (const ui of this.uiComponents.values()) {
            if (ui.handleMouseReleased(camera, mouseX, mouseY)) {
                return true;
            }
        }
        return false;
    }

    handleMouseWheel(event) {
        for (const ui of this.uiComponents.values()) {
            if (ui.handleMouseWheel(event)) {
                return true;
            }
        }
        return false;
    }

    handleTouchStart(camera, touchX, touchY) {
        for (const ui of this.uiComponents.values()) {
            if (ui.handleTouchStart(camera, touchX, touchY)) {
                return true;
            }
        }
        return false;
    }

    handleTouchMove(camera, touchX, touchY) {
        for (const ui of this.uiComponents.values()) {
            if (ui.handleTouchMove(camera, touchX, touchY)) {
                return true;
            }
        }
        return false;
    }

    handleTouchEnd(camera, touchX, touchY) {
        for (const ui of this.uiComponents.values()) {
            if (ui.handleTouchEnd(camera, touchX, touchY)) {
                return true;
            }
        }
        return false;
    }

    handleKeyDown(event) {
        for (const ui of this.uiComponents.values()) {
            if (ui.handleKeyDown && ui.handleKeyDown(event)) {
                return true;
            }
        }
        return false;
    }

    handleKeyUp(event) {
        for (const ui of this.uiComponents.values()) {
            if (ui.handleKeyUp && ui.handleKeyUp(event)) {
                return true;
            }
        }
        return false;
    }
} 