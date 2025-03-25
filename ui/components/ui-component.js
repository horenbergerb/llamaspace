export class UIComponent {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.visible = true;
        this.children = [];
    }

    // Local coordinates to screen coordinates
    toScreenSpace(x, y) {
        return {
            x: this.x + x,
            y: this.y + y
        };
    }

    // Screen coordinates to local coordinates
    toLocalSpace(screenX, screenY) {
        return {
            x: screenX - this.x,
            y: screenY - this.y
        };
    }

    isPointInside(screenX, screenY) {
        return screenX >= this.x && screenX <= this.x + this.width &&
               screenY >= this.y && screenY <= this.y + this.height;
    }

    addChild(component) {
        this.children.push(component);
    }

    render(pg) {
        if (!this.visible) return;
        
        // Render children
        for (const child of this.children) {
            child.render(pg);
        }
    }

    handleMousePressed(x, y) {
        if (!this.visible) return false;
        
        // Check children first (in reverse order for proper layering)
        for (let i = this.children.length - 1; i >= 0; i--) {
            const child = this.children[i];
            if (child.handleMousePressed(x, y)) {
                return true;
            }
        }

        // Then check self
        return this.isPointInside(x, y);
    }

    handleMouseReleased(x, y) {
        if (!this.visible) return false;

        // Check children first (in reverse order)
        for (let i = this.children.length - 1; i >= 0; i--) {
            const child = this.children[i];
            if (child.handleMouseReleased(x, y)) {
                return true;
            }
        }

        return this.isPointInside(x, y);
    }

    handleTouchStart(x, y) {
        return this.handleMousePressed(x, y);
    }

    handleTouchEnd(x, y) {
        return this.handleMouseReleased(x, y);
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setVisible(visible) {
        this.visible = visible;
    }
} 