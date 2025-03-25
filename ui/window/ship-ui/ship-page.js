export class ShipPage {
    constructor(sketch, eventBus) {
        this.sketch = sketch;
        this.eventBus = eventBus;
        this.reputation = 0;
        this.inventory = {};
        this.shuttlecraft = [];
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;

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
        // Create a graphics buffer for the ship tab content
        const contentWidth = width - 40; // Account for margins
        const contentHeight = height - 40; // Account for margins
        const pg = this.sketch.createGraphics(contentWidth, contentHeight);
        pg.background(0, 0, 0, 0);
        
        // Set up the graphics context
        pg.fill(255);
        pg.textAlign(this.sketch.LEFT, this.sketch.TOP);
        pg.textSize(14);
        
        const lineHeight = 20; // Fixed line height
        let infoY = this.scrollOffset;
        let totalHeight = 0;

        // Draw reputation
        pg.text(`Reputation: ${this.reputation}`, 0, infoY);
        infoY += lineHeight * 2; // Add extra space after reputation
        totalHeight += lineHeight * 2;

        // Draw shuttlecraft section
        pg.textSize(16);
        pg.text('Shuttlecraft:', 0, infoY);
        infoY += lineHeight * 1.5;
        totalHeight += lineHeight * 1.5;

        // Draw shuttlecraft status
        pg.textSize(14);
        this.shuttlecraft.forEach(shuttle => {
            // Choose color based on health
            if (shuttle.health <= 0) {
                pg.fill(255, 0, 0); // Red for destroyed
            } else if (shuttle.health < 30) {
                pg.fill(255, 100, 0); // Orange for critical
            } else if (shuttle.health < 70) {
                pg.fill(255, 255, 0); // Yellow for damaged
            } else {
                pg.fill(0, 255, 0); // Green for good condition
            }
            pg.text(`${shuttle.name}: ${shuttle.health}% health`, 10, infoY);
            pg.fill(255); // Reset to white
            infoY += lineHeight;
            totalHeight += lineHeight;
        });
        infoY += lineHeight; // Extra space after shuttlecraft
        totalHeight += lineHeight;

        // Draw inventory header
        pg.textSize(16);
        pg.fill(255);
        pg.text('Ship Inventory:', 0, infoY);
        infoY += lineHeight * 1.5;
        totalHeight += lineHeight * 1.5;

        // Draw inventory items
        pg.textSize(14);
        Object.entries(this.inventory).forEach(([item, quantity]) => {
            pg.text(`${item}: ${quantity}`, 10, infoY);
            infoY += lineHeight;
            totalHeight += lineHeight;
        });

        // Draw the graphics buffer
        this.sketch.image(pg, x + 20, y + 20);
        pg.remove();

        // Calculate max scroll offset based on total content height
        this.maxScrollOffset = Math.max(0, totalHeight - contentHeight);

        // Draw scroll indicator
        this.renderScrollIndicator(x, y, width, height, totalHeight, contentHeight);
    }

    renderScrollIndicator(x, y, width, height, contentHeight, visibleHeight) {
        if (this.maxScrollOffset > 0) {
            // Calculate the visible portion ratio
            const visibleRatio = visibleHeight / contentHeight;
            // Calculate scroll bar height based on the ratio of visible content
            const scrollBarHeight = Math.max(30, visibleHeight * visibleRatio);
            
            // Calculate scroll position as a percentage (0 to 1)
            const scrollPercent = Math.abs(this.scrollOffset) / this.maxScrollOffset;
            // Calculate available scroll distance
            const availableScrollDistance = visibleHeight - scrollBarHeight;
            // Calculate final scroll bar position
            const scrollBarY = y + (availableScrollDistance * scrollPercent);
            
            this.sketch.fill(150, 150, 150, 100);
            this.sketch.noStroke();
            this.sketch.rect(x + width - 8, scrollBarY, 4, scrollBarHeight, 2);
        }
    }

    handleMouseWheel(event) {
        // Update scroll offset with a multiplier to make scrolling smoother
        const scrollMultiplier = 1.5;
        this.scrollOffset = Math.max(-this.maxScrollOffset, 
            Math.min(0, this.scrollOffset - (event.deltaY * scrollMultiplier)));
        return true; // Return true to indicate we handled the event
    }

    handleTouchStart(touchX, touchY) {
        this.touchStartY = touchY;
        this.scrollStartOffset = this.scrollOffset;
    }

    handleTouchMove(touchX, touchY) {
        if (this.touchStartY !== null) {
            // Calculate touch movement
            const touchDelta = touchY - this.touchStartY;
            
            // Update scroll offset based on touch movement
            this.scrollOffset = Math.max(
                -this.maxScrollOffset,
                Math.min(0, this.scrollStartOffset + touchDelta)
            );
        }
    }

    handleTouchEnd() {
        this.touchStartY = null;
    }
} 