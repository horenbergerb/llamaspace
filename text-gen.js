export class TextGenerator {
    constructor(responseEndpoint) {
        this.stopGeneration = false;
        this.responseEndpoint = responseEndpoint;
    }

    setStopGeneration() {
        this.stopGeneration = true;
    }

    async generateText(prompt, streamHandler, temperature=1.0, n_predict=300, min_p=0.0, repeat_penalty=1.0){
        this.stopGeneration = false; // Reset the stop flag

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                stream: true,
                n_predict: n_predict, // Example, adjust as needed
                temperature: temperature,
                min_p: min_p,
                top_p: 1.0,
                repeat_penalty: repeat_penalty,
                logit_bias: [[" **", false]]
            }),
        };

        try {
            const response = await fetch(this.responseEndpoint, options);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let streamedText = '';
            let buffer = '';

            while (!this.stopGeneration) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n'); // Split lines on newline
                buffer = lines.pop(); // Keep the last incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        const jsonData = JSON.parse(line.slice(5)); // Remove 'data: ' prefix
                        if (jsonData.content) {
                            streamedText += jsonData.content;
                            streamHandler(streamedText); // Send the streamed text off to whatever is handling it
                        }
                    }
                }
            }

            reader.cancel(); // Ensure the reader is cancelled when stopped
        } catch (error) {
            console.error('Error during text generation:', error);
        } finally {
        }
}

}