import { SpaceshipRenderer } from './spaceship-renderer.js';

export class MapSceneRenderer {
    constructor(sketch) {
        this.sketch = sketch;
    }

    render(scene) {
        // Update and render all bodies
        for (let body of scene.mapBodies) {
            body.update();
            body.draw();
        }
    }
} 