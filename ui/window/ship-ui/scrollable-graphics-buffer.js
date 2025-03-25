export class ScrollableGraphicsBuffer {
    constructor(sketch) {
        this.sketch = sketch;
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.touchStartY = null;
        this.scrollStartOffset = 0;
        this.contentWidth = 0;
        this.contentHeight = 0;
        this.visibleWidth = 0;
        this.visibleHeight = 0;
        this.buffer = null;
        this.totalContentHeight = 0;
    }

    initialize(width, height) {
        this.contentWidth = width;
        this.contentHeight = height;
        this.visibleWidth = width;
        this.visibleHeight = height;
        this.buffer = this.sketch.createGraphics(width, height);
        this.buffer.background(0, 0, 0, 0);
    }

    beginDraw() {
        if (!this.buffer) return;
        this.buffer.clear();
        this.buffer.push();
    }

    endDraw() {
        if (!this.buffer) return;
        this.buffer.pop();
    }

    render(x, y) {
        if (!this.buffer) return;

        // Draw the graphics buffer in the clipped region
        this.sketch.image(this.buffer, x, y);

        // Draw scroll indicator if needed
        this.renderScrollIndicator(x, y);
    }

    renderScrollIndicator(x, y) {
        if (this.maxScrollOffset > 0) {
            // Calculate the visible portion ratio
            const visibleRatio = this.visibleHeight / this.totalContentHeight;
            // Calculate scroll bar height based on the ratio of visible content
            const scrollBarHeight = Math.max(30, this.visibleHeight * visibleRatio);
            
            // Calculate scroll position as a percentage (0 to 1)
            const scrollPercent = Math.abs(this.scrollOffset) / this.maxScrollOffset;
            // Calculate available scroll distance
            const availableScrollDistance = this.visibleHeight - scrollBarHeight;
            // Calculate final scroll bar position
            const scrollBarY = y + (availableScrollDistance * scrollPercent);
            
            this.sketch.fill(150, 150, 150, 100);
            this.sketch.noStroke();
            this.sketch.rect(x + this.contentWidth - 8, scrollBarY, 4, scrollBarHeight, 2);
        }
    }

    handleMouseWheel(event) {
        // Update scroll offset with a multiplier to make scrolling smoother
        const scrollMultiplier = 1.5;
        this.scrollOffset = Math.max(-this.maxScrollOffset, 
            Math.min(0, this.scrollOffset - (event.deltaY * scrollMultiplier)));
        return true;
    }

    handleTouchStart(touchX, touchY) {
        this.touchStartY = touchY;
        this.scrollStartOffset = this.scrollOffset;
        return true;
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
        return true;
    }

    handleTouchEnd() {
        this.touchStartY = null;
        return true;
    }

    setMaxScrollOffset(totalHeight) {
        this.totalContentHeight = totalHeight;
        this.maxScrollOffset = Math.max(0, totalHeight - this.visibleHeight);
    }

    resetScroll() {
        this.scrollOffset = 0;
    }

    getBuffer() {
        return this.buffer;
    }

    remove() {
        if (this.buffer) {
            this.buffer.remove();
            this.buffer = null;
        }
    }
} 