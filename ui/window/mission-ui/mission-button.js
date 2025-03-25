import { TextButton } from '../components/text-button.js';

export class MissionButton extends TextButton {
    constructor(sketch, eventBus) {
        const buttonWidth = 80;
        const buttonHeight = 40;
        const buttonMargin = 20;
        
        super(
            sketch,
            buttonMargin + buttonWidth + buttonMargin,
            sketch.height - buttonHeight - buttonMargin,
            buttonWidth,
            buttonHeight,
            'Missions',
            () => {
                // The click handler will be handled in handleClick
            }
        );

        this.eventBus = eventBus;
        this.buttonWidth = buttonWidth;
        this.buttonHeight = buttonHeight;
        this.buttonMargin = buttonMargin;
    }

    updatePosition() {
        const y = this.sketch.height - this.height - this.buttonMargin;
        this.updatePosition(this.buttonMargin + this.buttonWidth + this.buttonMargin, y);
    }

    handleClick(mouseX, mouseY) {
        if (super.handleClick(mouseX, mouseY)) {
            this.eventBus.emit('closeAllInfoUIs');
            // Toggle the window state
            this.eventBus.emit('missionUIOpened');
            return true;
        }
        return false;
    }
} 