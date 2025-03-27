export class UIRenderer {
    constructor(sketch) {
        this.sketch = sketch;
    }

    render(scene, camera) {
        if (!scene) return;

        // Draw star info UI if visible
        if (scene.starInfoUI) {
            this.renderStarInfoUI(scene.starInfoUI);
        }

        // Draw planet info UI if visible
        if (scene.planetInfoUI) {
            this.renderPlanetInfoUI(scene.planetInfoUI);
        }

        // Draw tooltips last as they should be on top
        this.renderTooltips(scene, camera);
    }

    renderStarInfoUI(starUI) {
        if (!starUI.isVisible || !starUI.body) return;

        this.sketch.push();

        // Draw background panel
        this.sketch.fill(0, 0, 0, 180);
        this.sketch.stroke(255);
        this.sketch.rect(starUI.uiX, starUI.uiY, starUI.uiWidth, starUI.uiHeight, 10);

        // Draw name
        this.sketch.fill(255);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.TOP);
        this.sketch.text(starUI.body.name, starUI.uiX + starUI.uiWidth / 2, starUI.uiY + 10);

        // Create a graphics buffer for the properties section
        const pg = this.sketch.createGraphics(starUI.uiWidth, starUI.propertiesHeight);
        pg.background(0, 0, 0, 0); // Transparent background
        
        // Set up the graphics context
        pg.fill(255);
        pg.textAlign(this.sketch.LEFT, this.sketch.TOP);
        pg.textSize(12);

        // Draw properties into the graphics buffer
        this.renderProperties(starUI, pg);

        // Draw the graphics buffer in the clipped region
        this.sketch.image(pg, starUI.uiX, starUI.uiY + starUI.propertiesStartY);
        pg.remove(); // Clean up the buffer

        // Draw common buttons
        this.renderCommonButtons(starUI);
        
        // Draw close button
        this.renderCloseButton(starUI);

        // Draw scroll indicator if needed
        this.renderScrollIndicator(starUI);

        this.sketch.pop();
    }

    renderPlanetInfoUI(planetUI) {
        if (!planetUI.isVisible || !planetUI.body) return;

        this.sketch.push();

        // Draw background panel
        this.sketch.fill(0, 0, 0, 180);
        this.sketch.stroke(255);
        this.sketch.rect(planetUI.uiX, planetUI.uiY, planetUI.uiWidth, planetUI.uiHeight, 10);

        // Draw name
        this.sketch.fill(255);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.TOP);
        this.sketch.text(planetUI.body.name, planetUI.uiX + planetUI.uiWidth / 2, planetUI.uiY + 10);

        // Create a graphics buffer for the properties section
        const pg = this.sketch.createGraphics(planetUI.uiWidth, planetUI.propertiesHeight);
        pg.background(0, 0, 0, 0);
        
        pg.fill(255);
        pg.textAlign(this.sketch.LEFT, this.sketch.TOP);
        pg.textSize(12);

        this.renderProperties(planetUI, pg);

        this.sketch.image(pg, planetUI.uiX, planetUI.uiY + planetUI.propertiesStartY);
        pg.remove();

        // Draw common buttons
        this.renderCommonButtons(planetUI);
        
        // Draw close button
        this.renderCloseButton(planetUI);

        // Draw scroll indicator if needed
        this.renderScrollIndicator(planetUI);

        this.sketch.pop();
    }

    renderProperties(ui, pg) {
        // Get properties from the UI
        const properties = ui.getProperties();
        
        // Calculate total height and update scroll offset
        ui.setMaxScrollOffset();
        
        // Render each property
        let infoY = ui.scrollOffset;
        for (const prop of properties) {
            pg.text(`${prop.label}: ${prop.value}`, 15, infoY);
            infoY += 20;
        }

        // Add anomaly information if present
        if (ui.body && ui.body.anomaly) {
            // Add some spacing
            infoY += 10;
            
            if (ui.body.anomaly.firstReport === null) {
                // Show scanning message
                pg.fill(255, 255, 0); // Yellow color for scanning message
                pg.text("Scanning anomaly...", 15, infoY);
            } else {
                // Show the anomaly report
                pg.fill(255, 0, 0); // Red color for anomaly report
                pg.text("Anomaly report:", 15, infoY);
                infoY += 20;
                
                // Split the report into multiple lines if needed
                const words = ui.body.anomaly.firstReport.split(' ');
                let currentLine = '';
                pg.fill(255, 255, 255); // White color for report text
                
                for (const word of words) {
                    const testLine = currentLine + (currentLine ? ' ' : '') + word;
                    if (pg.textWidth(testLine) < ui.uiWidth - 30) { // 30 pixels for margins
                        currentLine = testLine;
                    } else {
                        pg.text(currentLine, 15, infoY);
                        infoY += 20;
                        currentLine = word;
                    }
                }
                if (currentLine) {
                    pg.text(currentLine, 15, infoY);
                }
            }
        }
    }

    renderCommonButtons(ui) {
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.textSize(12);
        
        // Set Destination button
        this.sketch.fill(ui.canSetDestination ? 50 : 30, 255, ui.canSetDestination ? 100 : 60);
        this.sketch.rect(ui.uiX + ui.uiWidth - 120, ui.uiY + ui.uiHeight - 35, 100, 25, 5);
        this.sketch.fill(255);
        this.sketch.stroke(100);
        const destButtonY = ui.uiY + ui.uiHeight - 35 + 25/2;
        this.sketch.text("Set Destination", ui.uiX + ui.uiWidth - 70, destButtonY);

        if (!ui.inSystemMap) {
            // Enter System button - grey out if spaceship isn't at this body
            const canEnterSystem = ui.currentSpaceshipBody === ui.body;
            this.sketch.fill(canEnterSystem ? 50 : 30, canEnterSystem ? 150 : 50, 255);
            this.sketch.rect(ui.uiX + 20, ui.uiY + ui.uiHeight - 35, 100, 25, 5);
            this.sketch.fill(canEnterSystem ? 255 : 150);
            const enterButtonY = ui.uiY + ui.uiHeight - 35 + 25/2;
            this.sketch.text("Enter System", ui.uiX + 70, enterButtonY);
        } else {
            // Research button - grey out if spaceship isn't at this body
            const canResearch = ui.currentSpaceshipBody === ui.body;
            this.sketch.fill(canResearch ? 255 : 100, canResearch ? 150 : 50, canResearch ? 50 : 25);
            this.sketch.rect(ui.uiX + 20, ui.uiY + ui.uiHeight - 35, 100, 25, 5);
            this.sketch.fill(canResearch ? 255 : 150);
            const researchButtonY = ui.uiY + ui.uiHeight - 35 + 25/2;
            this.sketch.text("Research", ui.uiX + 70, researchButtonY);

            // Add Return to Galaxy button if this is the central star in system view
            if (ui.body && ui.body.baseX === this.sketch.width / 2 && ui.body.baseY === this.sketch.height / 2) {
                this.sketch.fill(50, 150, 255);
                this.sketch.rect(ui.uiX + ui.uiWidth / 2 - 60, ui.uiY + ui.uiHeight - 70, 120, 25, 5);
                this.sketch.fill(255);
                const returnButtonY = ui.uiY + ui.uiHeight - 70 + 25/2;
                this.sketch.text("Return to Galaxy", ui.uiX + ui.uiWidth / 2, returnButtonY);
            }
        }
    }

    renderCloseButton(ui) {
        this.sketch.fill(255, 0, 0);
        this.sketch.rect(ui.uiX + ui.uiWidth - ui.closeButtonSize - 5, ui.uiY + 5, 
                    ui.closeButtonSize, ui.closeButtonSize, 5);
        this.sketch.fill(255);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.text("X", ui.uiX + ui.uiWidth - ui.closeButtonSize / 2 - 5, 
                    ui.uiY + ui.closeButtonSize / 2 + 5);
    }

    renderScrollIndicator(ui) {
        if (ui.maxScrollOffset > 0) {
            const scrollPercent = -ui.scrollOffset / ui.maxScrollOffset;
            const scrollBarHeight = Math.max(30, (ui.propertiesHeight / (ui.propertiesHeight + ui.maxScrollOffset)) * ui.propertiesHeight);
            const scrollBarY = ui.uiY + ui.propertiesStartY + (ui.propertiesHeight - scrollBarHeight) * scrollPercent;
            
            this.sketch.fill(150, 150, 150, 100);
            this.sketch.noStroke();
            this.sketch.rect(ui.uiX + ui.uiWidth - 8, scrollBarY, 4, scrollBarHeight, 2);
        }
    }

    renderTooltips(scene, camera) {
        let mouseXTransformed = (this.sketch.mouseX - camera.panX) / camera.scaleFactor;
        let mouseYTransformed = (this.sketch.mouseY - camera.panY) / camera.scaleFactor;
    
        // Find nearest body
        let nearest = null;
        let minDist = Infinity;
        
        for (let body of scene.mapBodies) {
            let dist = this.sketch.dist(mouseXTransformed, mouseYTransformed, body.baseX, body.baseY);
            if (dist < minDist) {
                minDist = dist;
                nearest = body;
            }
        }
    
        if (!nearest || minDist >= 20) return;

        this.sketch.push();
        this.sketch.fill(0, 0, 0, 150);
        this.sketch.rectMode(this.sketch.CENTER);
        let textWidth = this.sketch.textWidth(nearest.name || "Unnamed Body") + 10;
        this.sketch.rect(nearest.baseX, nearest.baseY - 15, textWidth, 20, 5);
        
        this.sketch.fill(255);
        this.sketch.textAlign(this.sketch.CENTER, this.sketch.CENTER);
        this.sketch.text(nearest.name || "Unnamed Body", nearest.baseX, nearest.baseY - 15);
        this.sketch.pop();
    }
} 