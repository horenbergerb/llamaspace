export class TextButton {
    constructor(sketch, x, y, width, height, text, onClick) {
        this.sketch = sketch;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.onClick = onClick;
    }

    updatePosition(x, y) {
        this.x = x;
        this.y = y;
    }

    render() {
        this.sketch.push();
        
        // Draw button background
        this.sketch.fill(40);
        this.sketch.stroke(100);
        this.sketch.strokeWeight(2);
        this.sketch.rect(this.x, this.y, this.width, this.height, 5);

        // Draw button text
        this.sketch.fill(255);
        this.sketch.noStroke();
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.textSize(16);
        this.sketch.text(this.text, this.x + this.width/2, this.y + this.height/2);

        this.sketch.pop();
    }

    isClicked(mouseX, mouseY) {
        return mouseX >= this.x && mouseX <= this.x + this.width &&
               mouseY >= this.y && mouseY <= this.y + this.height;
    }

    handleClick(mouseX, mouseY) {
        if (this.isClicked(mouseX, mouseY)) {
            this.onClick();
            return true;
        }
        return false;
    }
} 