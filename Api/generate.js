export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, model = 'realistic' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.HF_TOKEN;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const MODELS = {
    realistic: 'stabilityai/stable-diffusion-2-1',
    portrait:  'runwayml/stable-diffusion-v1-5',
    artistic:  'stabilityai/stable-diffusion-xl-base-1.0',
    anime:     'hakurei/waifu-diffusion',
  };

  const modelId = MODELS[model] || MODELS.realistic;

  let enhancedPrompt = prompt;
  if (model === 'realistic' || model === 'portrait') {
    enhancedPrompt = `${prompt}, photorealistic, hyperrealistic, 8k uhd, dslr, sharp focus, high quality, professional photography`;
  }

  const negativePrompt = 'blurry, bad anatomy, bad hands, cropped, worst quality, low quality, watermark, text, deformed';

  try {
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${modelId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: enhancedPrompt,
          parameters: {
            num_inference_steps: 30,
            guidance_scale: 7.5,
            negative_prompt: negativePrompt
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return res.status(response.status).json({ error: errText || `Error ${response.status}` });
    }

    const buffer = await response.arrayBuffer();
    const b64 = Buffer.from(buffer).toString('base64');
    return res.status(200).json({ image: `data:image/jpeg;base64,${b64}` });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
