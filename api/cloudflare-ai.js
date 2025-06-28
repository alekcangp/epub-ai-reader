import { Buffer } from 'buffer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, imagePrompt, style } = req.body || {};

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiKey = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiKey) {
    return res.status(500).json({ error: 'Cloudflare credentials not set in environment variables' });
  }

  try {
    if (text) {
      // Summarization with fallback
      const io = process.env.IO_API_KEY;
      const apiUrlPrimary = `https://api.intelligence.io.solutions/api/v1/workflows/run`;
      let summaryData = null;
      let status = 200;
      let errorOccurred = false;
      try {
        const cfRes = await fetch(apiUrlPrimary, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${io}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: text,
            agent_names: ["summary_agent"],
            args: { "type": "summarize_text" }
          })
        });
        status = cfRes.status;
        if (cfRes.status === 200) {
          const data = await cfRes.json();
          summaryData = data;
        } else {
          errorOccurred = true;
        }
      } catch (e) {
        errorOccurred = true;
      }
      if (errorOccurred) {
        // Fallback to Cloudflare BART
        const apiUrlFallback = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/facebook/bart-large-cnn`;
        const cfRes = await fetch(apiUrlFallback, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input_text: text,
            min_length: 150
          })
        });
        status = cfRes.status;
        const data = await cfRes.json();
        // Normalize to { result: { summary: ... } }
        summaryData = { result: { summary: data.result ? data.result[0]?.summary_text || data.result.summary || '' : '' } };
      } else {
        // Normalize to { result: { summary: ... } } for primary
        summaryData = { result: { summary: summaryData.result?.summary || summaryData.result || '' } };
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(status).json(summaryData);
    } else if (imagePrompt) {
      // Image generation
      //const trimmedPrompt = String(imagePrompt).slice(0, 256).trim();
      //if (!imagePrompt) {
      //  return res.status(400).json({ error: 'Image prompt must not be empty.' });
      //}

      //translate to en


      
      const artStyle = style || 'Futuristic';
      const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`;
      const cfRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `${artStyle} artwork of: ${imagePrompt}, highly detailed, digital art, vibrant colors, professional quality`,
          num_steps: 20,
          guidance: 7.5,
          //width: 512,
          //height: 512
        })
      });
      const arrayBuffer = await cfRes.arrayBuffer();
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'image/png');
      return res.status(cfRes.status).send(Buffer.from(arrayBuffer));
    } else {
      return res.status(400).json({ error: 'Missing text or imagePrompt in request body' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
} 