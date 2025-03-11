export class Star {
    constructor(sketch) {
        this.sketch = sketch;
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

    show(camera) {
        let x = this.baseX + camera.panX * this.depth; // Parallax effect
        let y = this.baseY + camera.panY * this.depth;

        let zoomedX = (x - this.sketch.width / 2) * camera.scaleFactor + this.sketch.width / 2;
        let zoomedY = (y - this.sketch.height / 2) * camera.scaleFactor + this.sketch.height / 2;

        this.sketch.noStroke();
        this.sketch.fill(this.brightness);
        this.sketch.ellipse(zoomedX, zoomedY, this.size);
    }
}

export class MapBackground {
    constructor() {
        this.stars = [];
    }

    initializeBackground(sketch) {
        for (let i = 0; i < 2000; i++) {
            this.stars.push(new Star(sketch));
        }
    }

    drawBackground(sketch, camera) {
        sketch.background(10);
    
        for (let star of this.stars) {
            star.update();
            star.show(camera);
        }
    }
}
