import { ScrollableGraphicsBuffer } from '../components/scrollable-graphics-buffer.js';

export class ShipPage {
    constructor(sketch, eventBus) {
        this.sketch = sketch;
        this.eventBus = eventBus;
        this.reputation = 0;
        this.inventory = {};
        this.shuttlecraft = [];
        this.graphicsBuffer = new ScrollableGraphicsBuffer(sketch);

        // Subscribe to updates
        this.eventBus.on('reputationUpdated', (newReputation) => {
            this.reputation = newReputation;
        });

        this.eventBus.on('inventoryChanged', (newInventory) => {
            this.inventory = {...newInventory};
        });

        this.eventBus.on('shuttlecraftChanged', (newShuttlecraft) => {
            this.shuttlecraft = [...newShuttlecraft];
        });
    }

    render(x, y, width, height) {
        // Initialize graphics buffer if needed
        const contentWidth = width - 40; // Account for margins
        const contentHeight = height - 40; // Account for margins
        this.graphicsBuffer.initialize(contentWidth, contentHeight);
        
        // Set up the graphics context
        const buffer = this.graphicsBuffer.getBuffer();
        buffer.fill(255);
        buffer.textAlign(this.sketch.LEFT, this.sketch.TOP);
        buffer.textSize(14);
        
        const lineHeight = 20; // Fixed line height
        let infoY = this.graphicsBuffer.scrollOffset;
        let totalHeight = 0;

        // Draw reputation
        buffer.text(`Reputation: ${this.reputation}`, 0, infoY);
        infoY += lineHeight * 2; // Add extra space after reputation
        totalHeight += lineHeight * 2;

        // Draw shuttlecraft section
        buffer.textSize(16);
        buffer.text('Shuttlecraft:', 0, infoY);
        infoY += lineHeight * 1.5;
        totalHeight += lineHeight * 1.5;

        // Draw shuttlecraft status
        buffer.textSize(14);
        this.shuttlecraft.forEach(shuttle => {
            // Choose color based on health
            if (shuttle.health <= 0) {
                buffer.fill(255, 0, 0); // Red for destroyed
            } else if (shuttle.health < 30) {
                buffer.fill(255, 100, 0); // Orange for critical
            } else if (shuttle.health < 70) {
                buffer.fill(255, 255, 0); // Yellow for damaged
            } else {
                buffer.fill(0, 255, 0); // Green for good condition
            }
            buffer.text(`${shuttle.name}: ${shuttle.health}% health`, 10, infoY);
            buffer.fill(255); // Reset to white
            infoY += lineHeight;
            totalHeight += lineHeight;
        });
        infoY += lineHeight; // Extra space after shuttlecraft
        totalHeight += lineHeight;

        // Draw inventory header
        buffer.textSize(16);
        buffer.fill(255);
        buffer.text('Ship Inventory:', 0, infoY);
        infoY += lineHeight * 1.5;
        totalHeight += lineHeight * 1.5;

        // Draw inventory items
        buffer.textSize(14);
        Object.entries(this.inventory).forEach(([item, quantity]) => {
            buffer.text(`${item}: ${quantity}`, 10, infoY);
            infoY += lineHeight;
            totalHeight += lineHeight;
        });

        // Set max scroll offset based on total content height
        this.graphicsBuffer.setMaxScrollOffset(totalHeight);

        // Render the graphics buffer
        this.graphicsBuffer.render(x + 20, y + 20);
    }

    handleMouseWheel(event) {
        return this.graphicsBuffer.handleMouseWheel(event);
    }

    handleTouchStart(touchX, touchY) {
        return this.graphicsBuffer.handleTouchStart(touchX, touchY);
    }

    handleTouchMove(touchX, touchY) {
        return this.graphicsBuffer.handleTouchMove(touchX, touchY);
    }

    handleTouchEnd() {
        return this.graphicsBuffer.handleTouchEnd();
    }

    resetScroll() {
        this.graphicsBuffer.resetScroll();
    }
} 