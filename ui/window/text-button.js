export class TextButton {
    constructor(sketch, x, y, width, height, text, onClick, graphicsBuffer = null) {
        this.sketch = sketch;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.onClick = onClick;
        this.graphicsBuffer = graphicsBuffer;
    }

    updatePosition(x, y) {
        this.x = x;
        this.y = y;
    }

    render() {
        const target = this.graphicsBuffer || this.sketch;
        target.push();
        
        // Draw button background
        target.fill(40);
        target.stroke(100);
        target.strokeWeight(2);
        target.rect(this.x, this.y, this.width, this.height, 5);

        // Draw button text
        target.fill(255);
        target.noStroke();
        target.textAlign(target.CENTER, target.CENTER);
        target.textSize(16);
        target.text(this.text, this.x + this.width/2, this.y + this.height/2);

        target.pop();
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