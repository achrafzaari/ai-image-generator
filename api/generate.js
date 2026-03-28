export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.HF_TOKEN;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3.5-large',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 30,
            guidance_scale: 7.5
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
