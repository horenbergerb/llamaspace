import { TextButton } from '../text-button.js';

export class ShipButton extends TextButton {
    constructor(sketch, eventBus) {
        const buttonWidth = 80;
        const buttonHeight = 40;
        const buttonMargin = 20;
        
        super(
            sketch,
            buttonMargin,
            sketch.height - buttonHeight - buttonMargin,
            buttonWidth,
            buttonHeight,
            'Ship',
            () => {
                // The click handler will be handled in handleClick
            }
        );

        this.eventBus = eventBus;
        this.buttonMargin = buttonMargin;
    }

    updatePosition() {
        const y = this.sketch.height - this.height - this.buttonMargin;
        this.updatePosition(this.buttonMargin, y);
    }

    handleClick(mouseX, mouseY) {
        if (super.handleClick(mouseX, mouseY)) {
            this.eventBus.emit('closeAllInfoUIs');
            // Toggle the window state
            this.eventBus.emit('shipUIOpened');
            return true;
        }
        return false;
    }
} 