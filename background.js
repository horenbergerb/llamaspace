export class Star {
    constructor(sketch, camera) {
        this.sketch = sketch;
        this.camera = camera;
        this.baseX = sketch.random(-sketch.width, sketch.width*2);
        this.baseY = sketch.random(-sketch.height, sketch.height*2);
        this.size = sketch.random(1, 3);
        this.brightness = sketch.random(150, 255);
        this.twinkleSpeed = sketch.random(0.01, 0.05);
        this.depth = sketch.random(0.0, 0.2); // Parallax depth (closer to 0 = farther away)
    }

    update() {
        this.brightness = 200 + 55 * this.sketch.sin(this.sketch.frameCount * this.twinkleSpeed);
    }

    drawStar() {
        // Drawing these is awkward because we need to (attempt) to preserve the same parallax effect at different zooms
        // That is why we need camera
        // This solution doesn't really work, but it's close enough

        let x = this.baseX + this.camera.panX * this.depth;
        let y = this.baseY + this.camera.panY * this.depth;

        let zoomedX = (x - this.sketch.width / 2) * this.camera.scaleFactor + this.sketch.width / 2;
        let zoomedY = (y - this.sketch.height / 2) * this.camera.scaleFactor + this.sketch.height / 2;

        this.sketch.push();
        this.sketch.noStroke();
        this.sketch.fill(this.brightness);
        this.sketch.ellipse(zoomedX, zoomedY, this.size);
        this.sketch.pop();
    }
}

export class MapBackground {
    constructor(sketch) {
        this.sketch = sketch;
        this.stars = [];
    }

    initializeBackground(camera) {
        for (let i = 0; i < 2000; i++) {
            this.stars.push(new Star(this.sketch, camera));
        }
    }

    drawBackground() {
        this.sketch.background(10);
    
        for (let star of this.stars) {
            star.update();
            star.drawStar();
        }
    }
}
