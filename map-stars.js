

export class MapStar {
    constructor(sketch) {
        this.sketch = sketch;
        this.baseX = sketch.random(-0.5*sketch.width, sketch.width*1.5);
        this.baseY = sketch.random(-0.5*sketch.height, sketch.height*1.5);
        this.baseSize = sketch.random(6, 12);
        this.size = this.baseSize;
        this.pulseSpeed = sketch.random(0.01, 0.05);

        // Realistic star colors based on temperature
        let starColors = [
            sketch.color(180, 220, 255), // Blue-White (B-type)
            sketch.color(230, 230, 255), // White (A-type)
            sketch.color(255, 240, 200), // Yellow-White (F-type)
            sketch.color(255, 220, 150), // Yellow (G-type, Sun-like)
            sketch.color(255, 180, 100), // Orange (K-type)
            sketch.color(255, 100, 80)   // Red (M-type, coolest)
        ];
        this.color = sketch.random(starColors);
    }

    update() {
        this.size = this.baseSize + 1 * this.sketch.sin(this.sketch.frameCount * this.pulseSpeed);
    }

    show() {
        this.sketch.noStroke();

        // Outer glow aura (adds a soft halo effect)
        for (let i = 5; i > 0; i--) {
            let alpha = 40 - i * 8; // Gradual fade outward
            this.sketch.fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], alpha);
            this.sketch.ellipse(this.baseX, this.baseY, this.size + i * 5);
        }

        // Main glowing star
        this.sketch.fill(this.color);
        this.sketch.ellipse(this.baseX, this.baseY, this.size);
    }
}

export class MapStars {
    constructor(sketch) {
        this.mapStars = []; // Array for larger, glowing stars
    }

    initializeMapStars(sketch) {
        for (let i = 0; i < 120; i++) {
            this.mapStars.push(new MapStar(sketch));
        }
    }
    
    drawMapStars() {
        for (let star of this.mapStars) {
            star.update();
            star.show();
        }
    }
    
    getRandomStar() {
        return this.mapStars[Math.floor(Math.random() * this.mapStars.length)];
    }

    handleMouseReleasedMapStars(sketch, camera, spaceship){
        let mouseXTransformed = (sketch.mouseX - camera.panX) / camera.scaleFactor;
        let mouseYTransformed = (sketch.mouseY - camera.panY) / camera.scaleFactor;
        let nearest = null;
        let nearest_dist = null
        for (let mapStar of this.mapStars) {
            let dist = sketch.dist(mouseXTransformed, mouseYTransformed, mapStar.baseX, mapStar.baseY);
            if (dist < 20) {
                if (nearest_dist == null || dist < nearest_dist){
                    nearest = mapStar;
                    nearest_dist = dist;
                }
            }
        }
        if (nearest != null)
            spaceship.setOrbitStar(nearest);
    }

}