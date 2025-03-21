export class TextBox {
    constructor(sketch, eventBus, options = {}) {
        this.sketch = sketch;
        this.eventBus = eventBus;
        
        // Default options
        this.options = {
            width: options.width || 200,
            height: options.height || 30,
            multiline: options.multiline || false,
            placeholder: options.placeholder || '',
            maxLines: options.maxLines || 1,
            ...options
        };

        // Text input state
        this.text = '';
        this.active = false;
        this.cursorBlinkTimer = 0;
        this.showCursor = true;
        this.cursorPosition = 0;

        // Mobile input support
        this.mobileInput = null;
        this.createMobileInput();
    }

    createMobileInput() {
        if (this.options.multiline) {
            this.mobileInput = document.createElement('textarea');
            this.mobileInput.style.resize = 'none';
        } else {
            this.mobileInput = document.createElement('input');
            this.mobileInput.type = 'text';
        }

        this.mobileInput.style.position = 'absolute';
        this.mobileInput.style.display = 'none';
        this.mobileInput.style.border = '1px solid #666';
        this.mobileInput.style.background = '#333';
        this.mobileInput.style.color = '#fff';
        this.mobileInput.style.padding = '5px';
        this.mobileInput.style.fontSize = '14px';
        document.body.appendChild(this.mobileInput);

        // Add input event listener
        this.mobileInput.addEventListener('input', () => {
            this.text = this.mobileInput.value;
        });

        // Add blur event listener
        this.mobileInput.addEventListener('blur', () => {
            setTimeout(() => this.hideMobileInput(), 100);
        });
    }

    showMobileInput(x, y, width, height) {
        this.mobileInput.style.left = x + 'px';
        this.mobileInput.style.top = y + 'px';
        this.mobileInput.style.width = width + 'px';
        this.mobileInput.style.height = height + 'px';
        this.mobileInput.style.display = 'block';
        this.mobileInput.value = this.text;
        this.mobileInput.focus();
    }

    hideMobileInput() {
        if (this.mobileInput) {
            this.mobileInput.style.display = 'none';
        }
        this.active = false;
    }

    render(x, y, pg) {
        // Draw text field background
        pg.fill(this.active ? 80 : 60);
        pg.stroke(100);
        pg.strokeWeight(1);
        pg.rect(0, 0, this.options.width, this.options.height, 3);

        // Draw text and cursor
        pg.fill(255);
        pg.noStroke();
        pg.textAlign(this.sketch.LEFT, this.sketch.TOP);
        
        // Calculate text width and wrap if needed
        const padding = 5;
        const maxWidth = this.options.width - (padding * 2);
        const textToDisplay = this.text || this.options.placeholder;
        
        if (this.options.multiline) {
            // For multiline text boxes, wrap text and draw line by line
            const lines = this.wrapText(pg, textToDisplay, maxWidth);
            const lineHeight = 16; // Approximate line height for 14pt text
            lines.forEach((line, index) => {
                pg.text(line, padding, padding + (index * lineHeight));
            });
            
            // Draw cursor if active
            if (this.active && this.showCursor) {
                const cursorX = padding + pg.textWidth(textToDisplay.slice(0, this.cursorPosition));
                const cursorY = padding + (Math.floor(this.cursorPosition / (maxWidth / 8)) * lineHeight);
                pg.stroke(255);
                pg.line(cursorX, cursorY, cursorX, cursorY + lineHeight);
            }
        } else {
            // For single-line text boxes, truncate with ellipsis if needed
            let displayText = textToDisplay;
            if (pg.textWidth(displayText) > maxWidth) {
                while (displayText.length > 0 && pg.textWidth(displayText + '...') > maxWidth) {
                    displayText = displayText.slice(0, -1);
                }
                displayText += '...';
            }
            
            // Center text vertically for single-line boxes
            const textY = (this.options.height - pg.textSize()) / 2;
            pg.text(displayText, padding, textY);
            
            // Draw cursor if active
            if (this.active && this.showCursor) {
                const cursorX = padding + pg.textWidth(displayText.slice(0, this.cursorPosition));
                pg.stroke(255);
                pg.line(cursorX, padding, cursorX, this.options.height - padding);
            }
        }

        // Update cursor blink state
        this.updateCursorBlink();
    }

    wrapText(pg, text, maxWidth) {
        if (!text) return [''];
        
        const words = text.split(' ');
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = pg.textWidth(currentLine + ' ' + word);
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);

        return lines;
    }

    updateCursorBlink() {
        this.cursorBlinkTimer++;
        if (this.cursorBlinkTimer >= 30) { // Blink every 30 frames
            this.cursorBlinkTimer = 0;
            this.showCursor = !this.showCursor;
        }
    }

    handleClick(x, y) {
        const isClicked = x >= 0 && x <= this.options.width &&
                         y >= 0 && y <= this.options.height;
        
        if (isClicked) {
            this.active = true;
            // Calculate cursor position based on click x position
            const padding = 5;
            const maxWidth = this.options.width - (padding * 2);
            const textToDisplay = this.text || this.options.placeholder;
            
            if (this.options.multiline) {
                // For multiline, find the closest character position
                const lines = this.wrapText(this.sketch, textToDisplay, maxWidth);
                const lineHeight = 16;
                const clickedLine = Math.floor(y / lineHeight);
                const lineStart = lines.slice(0, clickedLine).join(' ').length;
                const lineText = lines[clickedLine] || '';
                
                // Find closest character position in the clicked line
                let closestPos = 0;
                let minDist = Infinity;
                for (let i = 0; i <= lineText.length; i++) {
                    const dist = Math.abs(this.sketch.textWidth(lineText.slice(0, i)) - x);
                    if (dist < minDist) {
                        minDist = dist;
                        closestPos = i;
                    }
                }
                
                this.cursorPosition = lineStart + closestPos;
            } else {
                // For single-line, find the closest character position
                let closestPos = 0;
                let minDist = Infinity;
                for (let i = 0; i <= textToDisplay.length; i++) {
                    const dist = Math.abs(this.sketch.textWidth(textToDisplay.slice(0, i)) - x);
                    if (dist < minDist) {
                        minDist = dist;
                        closestPos = i;
                    }
                }
                this.cursorPosition = closestPos;
            }
        } else {
            this.active = false;
        }
        
        return isClicked;
    }

    handleTouchEnd(x, y) {
        const isTouched = x >= 0 && x <= this.options.width &&
                         y >= 0 && y <= this.options.height;
        
        if (isTouched) {
            this.active = true;
            this.showMobileInput(x, y, this.options.width, this.options.height);
        } else {
            this.active = false;
            this.hideMobileInput();
        }
        
        return isTouched;
    }

    handleKeyDown(event) {
        if (!this.active) return false;

        switch (event.key) {
            case 'Backspace':
                if (this.cursorPosition > 0) {
                    this.text = this.text.slice(0, this.cursorPosition - 1) + this.text.slice(this.cursorPosition);
                    this.cursorPosition--;
                }
                return true;

            case 'Enter':
                if (this.options.multiline) {
                    this.text = this.text.slice(0, this.cursorPosition) + '\n' + this.text.slice(this.cursorPosition);
                    this.cursorPosition++;
                }
                return true;

            case 'ArrowLeft':
                if (this.cursorPosition > 0) {
                    this.cursorPosition--;
                }
                return true;

            case 'ArrowRight':
                if (this.cursorPosition < this.text.length) {
                    this.cursorPosition++;
                }
                return true;

            case 'v':
                // Handle paste (Ctrl+V)
                if (event.ctrlKey || event.metaKey) {
                    navigator.clipboard.readText().then(text => {
                        this.text = this.text.slice(0, this.cursorPosition) + text + this.text.slice(this.cursorPosition);
                        this.cursorPosition += text.length;
                    });
                    return true;
                }
                return false;
        }

        return false;
    }

    handleKeyPress(event) {
        if (!this.active) return false;

        // Ignore special keys
        if (event.key === 'Enter' || event.key === 'Tab') {
            return false;
        }

        // Add the typed character at cursor position
        this.text = this.text.slice(0, this.cursorPosition) + event.key + this.text.slice(this.cursorPosition);
        this.cursorPosition++;
        return true;
    }

    setText(text) {
        this.text = text;
    }

    getText() {
        return this.text;
    }

    isActive() {
        return this.active;
    }

    setActive(active) {
        this.active = active;
    }
} 