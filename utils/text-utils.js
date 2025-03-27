/**
 * Wraps text to fit within a maximum width
 * @param {p5.Graphics} buffer - The graphics buffer to measure text width
 * @param {string} text - The text to wrap
 * @param {number} maxWidth - The maximum width for the text
 * @returns {string} - The wrapped text with newlines
 */
export function wrapText(buffer, text, maxWidth) {
    if (!text) return '';
    
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = buffer.textWidth(currentLine + ' ' + word);
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);

    return lines.join('\n');
}

/**
 * Wraps text and returns an array of lines
 * @param {p5.Graphics} buffer - The graphics buffer to measure text width
 * @param {string} text - The text to wrap
 * @param {number} maxWidth - The maximum width for the text
 * @returns {string[]} - Array of wrapped text lines
 */
export function wrapTextToLines(buffer, text, maxWidth) {
    if (!text) return [];
    
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = buffer.textWidth(currentLine + ' ' + word);
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