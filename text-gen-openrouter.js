export class TextGeneratorOpenRouter {
    //mistralai/mistral-large-2411 Mistral
    constructor(apiKey, model = "deepseek/deepseek-r1") {
        this.stopGeneration = false;
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = "https://openrouter.ai/api/v1/chat/completions";
    }

    setStopGeneration() {
        this.stopGeneration = true;
    }

    async generateText(prompt, streamHandler, temperature = 1.0, maxTokens = 300) {
        this.stopGeneration = false; // Reset the stop flag
        console.log('Starting text generation with prompt:', prompt);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'LlamaSpace'
            },
            body: JSON.stringify({
                model: this.model,
                "provider": {"order": ["DeepSeek"],
                    "allow_fallbacks": false},
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: temperature,
                max_tokens: maxTokens,
                stream: true,
            }),
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => {
            controller.abort();
            console.log('Request timed out after 30 seconds');
        }, 30000);

        try {
            console.log('Sending request to OpenRouter API...');
            const response = await fetch(this.baseUrl, { ...options, signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! Status: ${response.status}. Response: ${errorText}`);
            }
            console.log('Got response from API, starting to read stream...');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let streamedText = '';
            let buffer = '';

            while (!this.stopGeneration) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log('Stream complete');
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep the last incomplete line in buffer

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6); // Remove 'data: ' prefix
                        if (data === '[DONE]') {
                            continue;
                        }
                        try {
                            const jsonData = JSON.parse(data);
                            
                            // Check if we have a delta with content property (even if empty)
                            if (jsonData.choices && 
                                jsonData.choices[0].delta && 
                                'content' in jsonData.choices[0].delta) {
                                const newContent = jsonData.choices[0].delta.content;
                                // Only process and update if there's actual content
                                if (newContent) {
                                    streamedText += newContent;
                                    streamHandler(streamedText);
                                } else {
                                    console.log('Received empty content chunk - this is normal for start/end of stream');
                                }
                            } else if (jsonData.choices && jsonData.choices[0].finish_reason) {
                                console.log('Received finish reason:', jsonData.choices[0].finish_reason);
                            }
                        } catch (parseError) {
                            console.error('Error parsing JSON:', parseError, 'Raw data:', data);
                        }
                    }
                }
            }

            if (this.stopGeneration) {
                console.log('Generation stopped by user');
            }
            reader.cancel(); // Ensure the reader is cancelled when stopped
        } catch (error) {
            console.error('Error during text generation:', error);
            throw error; // Re-throw the error so it can be handled by the caller
        }
    }
} 