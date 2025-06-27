class CloudflareAIService {
  // No config needed for proxy usage

  /**
   * Summarize text using Cloudflare AI. Supports cancellation via AbortSignal.
   */
  async summarizeText(text: string, signal?: AbortSignal): Promise<string> {
    try {
      const response = await fetch('/api/cloudflare-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text}),
        signal
      });

      if (!response.ok) {
        throw new Error(`Summarization failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result?.summary || 'Unable to generate summary';
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled
        return 'Summary generation cancelled';
      }
      console.error('Summarization error:', error);
      return 'Summary generation failed';
    }
  }

  /**
   * Generate an image using Cloudflare AI. Supports cancellation via AbortSignal.
   */
  async generateImage(prompt: string, style: string, signal?: AbortSignal): Promise<string> {
    // Mock mode: return a placeholder image if enabled
   // if (import.meta.env.VITE_MOCK_AI_IMAGE === 'true') {
   //   return 'data:image/jpeg;base64,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';
   // }
    try {
      const response = await fetch('/api/cloudflare-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePrompt: prompt, style }),
        signal
      });

      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      // Convert blob to data URL
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled
        throw error;
      }
      console.error('Image generation error:', error);
      throw error;
    }
  }

  async processPage(pageContent: string, style: string, signal?: AbortSignal): Promise<{ summary: string; imageUrl: string }> {
    try {
      // Directly generate image from the provided text (no summary)
      const imageUrl = await this.generateImage(pageContent, style, signal);
      return { summary: '', imageUrl };
    } catch (error) {
      console.error('Page processing error:', error);
      throw error;
    }
  }
}

export default CloudflareAIService;