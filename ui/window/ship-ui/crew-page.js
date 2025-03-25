import { ScrollableGraphicsBuffer } from './scrollable-graphics-buffer.js';

export class CrewPage {
    constructor(sketch, eventBus, crewMembers) {
        this.sketch = sketch;
        this.eventBus = eventBus;
        this.crewMembers = crewMembers;
        this.graphicsBuffer = new ScrollableGraphicsBuffer(sketch);
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
        buffer.textSize(12);
        
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
        let infoY = this.graphicsBuffer.scrollOffset;

        for (const crew of this.crewMembers) {
            // Draw crew member name and race
            buffer.text(`${crew.name} (${crew.race})`, 0, infoY);
            infoY += lineHeight;

            // Draw skills
            buffer.text('Skills:', 10, infoY);
            infoY += lineHeight;
            for (const [skill, level] of Object.entries(crew.skillLevels)) {
                buffer.text(`  ${skill}: ${level}/5`, 20, infoY);
                infoY += lineHeight;
            }

            // Draw demeanor traits
            buffer.text('Demeanor:', 10, infoY);
            infoY += lineHeight;
            buffer.text(`  ${crew.demeanor.join(', ')}`, 20, infoY);
            infoY += lineHeight * 1.5; // Add extra space between crew members
        }

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