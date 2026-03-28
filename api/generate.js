const MODELS = {
  realistic: 'SG161222/Realistic_Vision_V6.0_B1_noVAE',
  artistic:  'stabilityai/stable-diffusion-xl-base-1.0',
  anime:     'Linaqruf/anything-v3.0',
  portrait:  'runwayml/stable-diffusion-v1-5',
};

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

  const modelId = MODELS[model] || MODELS.realistic;

  // Build enhanced prompt based on model type
  let enhancedPrompt = prompt;
  if (model === 'realistic') {
    enhancedPrompt = `${prompt}, photorealistic, 8k, professional photography, sharp focus, highly detailed, natural lighting`;
  } else if (model === 'portrait') {
    enhancedPrompt = `${prompt}, portrait photography, 8k uhd, dslr, professional photo, highly detailed face, studio lighting`;
  } else if (model === 'anime') {
    enhancedPrompt = `${prompt}, anime style, highly detailed, beautiful, masterpiece`;
  }

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
            num_inference_steps: 35,
            guidance_scale: 7.5,
            negative_prompt: 'blurry, bad quality, distorted, ugly, low resolution, watermark, text'
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
