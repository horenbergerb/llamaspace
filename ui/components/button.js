import { UIComponent } from './ui-component.js';

export class Button extends UIComponent {
    constructor(x, y, width, height, text, onClick) {
        super(x, y, width, height);
        this.text = text;
        this.onClick = onClick;
        this.hovered = false;
        this.isIcon = false; // Flag to determine if this is an icon button
    }

    render(pg) {
        if (!this.visible) return;

        if (this.isIcon) {
            // For icon buttons (like add/close), just draw the icon
            pg.stroke(150);
            pg.strokeWeight(2);
            if (this.text === '+') {
                // Add button
                pg.line(this.x, this.y + this.height/2, this.x + this.width, this.y + this.height/2);
                pg.line(this.x + this.width/2, this.y, this.x + this.width/2, this.y + this.height);
            } else if (this.text === '×') {
                // Close button
                pg.line(this.x, this.y, this.x + this.width, this.y + this.height);
                pg.line(this.x + this.width, this.y, this.x, this.y + this.height);
            } else if (this.text === '<') {
                // Back button
                pg.line(this.x + this.width/2, this.y, this.x, this.y + this.height/2);
                pg.line(this.x, this.y + this.height/2, this.x + this.width/2, this.y + this.height);
            }
        } else {
            // Regular button
            pg.fill(this.hovered ? 80 : 60);
            pg.stroke(100);
            pg.strokeWeight(1);
            pg.rect(this.x, this.y, this.width, this.height, 3);

            // Draw text
            pg.fill(255);
            pg.noStroke();
            pg.textAlign(pg.CENTER, pg.CENTER);
            pg.text(this.text, this.x + this.width/2, this.y + this.height/2);
        }

        super.render(pg);
    }

    handleMousePressed(x, y) {
        if (super.handleMousePressed(x, y)) {
            this.hovered = true;
            return true;
        }
        return false;
    }

    handleMouseReleased(x, y) {
        this.hovered = false;
        if (super.handleMouseReleased(x, y)) {
            this.onClick?.();
            return true;
        }
        return false;
    }

    setAsIcon() {
        this.isIcon = true;
        return this;
    }
} 