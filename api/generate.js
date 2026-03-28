export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, aspectRatio = '1:1' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio,
            safetyFilterLevel: 'block_some',
            personGeneration: 'allow_adult'
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || `Error ${response.status}`;
      return res.status(response.status).json({ error: msg });
    }

    const data = await response.json();
    const b64 = data?.predictions?.[0]?.bytesBase64Encoded;

    if (!b64) {
      return res.status(500).json({ error: 'No image data received' });
    }

    return res.status(200).json({ image: `data:image/png;base64,${b64}` });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
