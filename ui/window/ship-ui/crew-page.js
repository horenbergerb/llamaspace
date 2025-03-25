export class CrewPage {
    constructor(sketch, eventBus, crewMembers) {
        this.sketch = sketch;
        this.eventBus = eventBus;
        this.crewMembers = crewMembers;
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.touchStartY = null;
        this.scrollStartOffset = 0;
    }

    render(x, y, width, height) {
        // Create a graphics buffer for the crew properties section
        const contentWidth = width - 40; // Account for margins
        const contentHeight = height - 40; // Account for margins
        const pg = this.sketch.createGraphics(contentWidth, contentHeight);
        pg.background(0, 0, 0, 0);
        
        // Set up the graphics context
        pg.fill(255);
        pg.textAlign(this.sketch.LEFT, this.sketch.TOP);
        pg.textSize(12);
        
        const lineHeight = 16; // Fixed line height for 12pt text

        // First pass: calculate total height needed
        let totalHeight = 0;
        for (const crew of this.crewMembers) {
            totalHeight += lineHeight; // Name and race
            totalHeight += lineHeight; // "Skills:" label
            totalHeight += Object.keys(crew.skillLevels).length * lineHeight; // Skills
            totalHeight += lineHeight; // "Demeanor:" label
            totalHeight += lineHeight; // Demeanor traits
            totalHeight += lineHeight * 1.5; // Extra space between crew members
        }

        // Draw crew members into the graphics buffer
        let infoY = this.scrollOffset;

        for (const crew of this.crewMembers) {
            // Draw crew member name and race
            pg.text(`${crew.name} (${crew.race})`, 0, infoY);
            infoY += lineHeight;

            // Draw skills
            pg.text('Skills:', 10, infoY);
            infoY += lineHeight;
            for (const [skill, level] of Object.entries(crew.skillLevels)) {
                pg.text(`  ${skill}: ${level}/5`, 20, infoY);
                infoY += lineHeight;
            }

            // Draw demeanor traits
            pg.text('Demeanor:', 10, infoY);
            infoY += lineHeight;
            pg.text(`  ${crew.demeanor.join(', ')}`, 20, infoY);
            infoY += lineHeight * 1.5; // Add extra space between crew members
        }

        // Draw the graphics buffer in the clipped region
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