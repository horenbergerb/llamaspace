import { SpaceshipRenderer } from './spaceship-renderer.js';

export class MapSceneRenderer {
    constructor(sketch) {
        this.sketch = sketch;
        this.spaceshipRenderer = new SpaceshipRenderer(sketch);
    }

    render(scene, camera) {
        // Update and render all bodies
        for (let body of scene.mapBodies) {
            body.update();
            body.draw();
        }
    
        // Render spaceship
        this.spaceshipRenderer.render(scene.spaceship);
    }
} 