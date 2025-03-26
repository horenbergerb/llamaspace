export class Dropdown {
    constructor(sketch, eventBus, options = {}) {
        this.sketch = sketch;
        this.eventBus = eventBus;
        
        // Default options
        this.width = options.width || 200;
        this.height = options.height || 30;
        this.options = options.options || [];
        this.selectedIndex = options.selectedIndex || -1;
        this.placeholder = options.placeholder || 'Select...';
        this.isOpen = false;
        this.onSelect = options.onSelect || (() => {});
    }

    setOptions(options) {
        this.options = options;
        if (this.selectedIndex >= this.options.length) {
            this.selectedIndex = -1;
        }
    }

    setSelectedIndex(index) {
        if (index >= -1 && index < this.options.length) {
            this.selectedIndex = index;
            this.onSelect(index);
        }
    }

    handleClick(x, y) {
        // Check if click is on the dropdown button
        if (y >= 0 && y <= this.height) {
            this.isOpen = !this.isOpen;
            return true;
        }

        // Check if click is on an option
        if (this.isOpen) {
            const optionY = y - this.height;
            const optionIndex = Math.floor(optionY / this.height);
            
            if (optionIndex >= 0 && optionIndex < this.options.length) {
                this.setSelectedIndex(optionIndex);
                this.isOpen = false;
                return true;
            }
        }

        return false;
    }

    handleTouchStart(x, y) {
        // Don't handle touch start for dropdown
        return false;
    }

    handleTouchEnd(x, y) {
        return this.handleClick(x, y);
    }

    renderBase(x, y, graphicsBuffer) {
        // Draw dropdown button
        graphicsBuffer.fill(this.isOpen ? 80 : 60);
        graphicsBuffer.stroke(100);
        graphicsBuffer.strokeWeight(1);
        graphicsBuffer.rect(x, y, this.width, this.height, 3);

        // Draw selected option or placeholder
        graphicsBuffer.fill(255);
        graphicsBuffer.noStroke();
        graphicsBuffer.textAlign(this.sketch.LEFT, this.sketch.CENTER);
        const selectedText = this.selectedIndex >= 0 
            ? this.options[this.selectedIndex].name 
            : this.placeholder;
        graphicsBuffer.text(selectedText, x + 5, y + this.height/2);

        // Draw dropdown arrow
        graphicsBuffer.stroke(255);
        graphicsBuffer.strokeWeight(2);
        const arrowX = x + this.width - 20;
        const arrowY = y + this.height/2;
        graphicsBuffer.line(arrowX, arrowY - 3, arrowX + 5, arrowY + 3);
        graphicsBuffer.line(arrowX + 10, arrowY - 3, arrowX + 5, arrowY + 3);
    }

    renderOptions(x, y, graphicsBuffer) {
        if (!this.isOpen || this.options.length === 0) return;
        const optionsHeight = this.options.length * this.height;
        graphicsBuffer.fill(80);
        graphicsBuffer.stroke(100);
        graphicsBuffer.rect(x, y + this.height, this.width, optionsHeight, 3);

        this.options.forEach((option, index) => {
            const optionY = y + this.height + (index * this.height);
            if (index === this.selectedIndex) {
                graphicsBuffer.fill(100);
                graphicsBuffer.noStroke();
                graphicsBuffer.rect(x, optionY, this.width, this.height);
            }
            graphicsBuffer.fill(255);
            graphicsBuffer.noStroke();
            graphicsBuffer.textAlign(this.sketch.LEFT, this.sketch.CENTER);
            graphicsBuffer.text(option.name, x + 5, optionY + this.height/2);
        });
    }

    render(x, y, graphicsBuffer) {
        this.renderBase(x, y, graphicsBuffer);
        this.renderOptions(x, y, graphicsBuffer);
    }
} 