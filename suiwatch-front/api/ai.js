// Vercel Serverless function: proxies AI requests to Cloudflare Workers AI using server-side env vars
// Set CF_ACCOUNT_ID, CF_MODEL, and CF_API_TOKEN in your Vercel project settings (Environment Variables).

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Load Cloudflare AI configuration from environment variables.
  // For local testing you can set these in a .env.local file or export them in your shell.
  // WARNING: Do NOT commit real secret tokens to source control. Use Vercel env vars for production.
const CF_ACCOUNT_ID = "568525424c1d0ac88c8baa71f52d3e45";
const CF_MODEL = "@cf/meta/llama-3-8b-instruct";
const CF_API_TOKEN = "debXIsihVBoDISc5zz_PAN6bCpMTABDApyfpsoyU";

  if (!CF_ACCOUNT_ID || !CF_MODEL || !CF_API_TOKEN || CF_ACCOUNT_ID.startsWith('REPLACE')) {
    return res.status(500).json({ error: 'Cloudflare AI env vars missing or placeholder values present (CF_ACCOUNT_ID, CF_MODEL, CF_API_TOKEN). Set them in Vercel or locally.' });
  }

  try {
  const { prompt } = req.body || {};
  // Default prompt is a concise portfolio advisor if client doesn't provide one.
  const finalPrompt = prompt || `You are a concise and practical crypto portfolio analyst. \n\nGiven a wallet's portfolio, produce a short summary (1-2 sentences) and 3 prioritized, actionable recommendations tailored to a retail crypto investor. \n\nReturn only plain text (no stories or fluff). Keep the total response under 600 characters unless the caller requests a different maximum. Use bullets for the actions.`;

    // Build request payload for Cloudflare AI
    const body = {
      messages: [
        { role: 'system', content: 'You are a friendly assistant that helps write stories' },
        { role: 'user', content: finalPrompt },
      ],
      // keep responses reasonably small by default to reduce latency
      max_tokens: 200,
      temperature: 0.6,
    };

    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`;

    // Use an AbortController so we don't wait forever (fail fast)
    const controller = new AbortController();
    const timeoutMs = 15000; // 15s
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let r;
    try {
      r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CF_API_TOKEN}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        console.error('Cloudflare AI request timed out');
        return res.status(504).json({ success: false, error: 'Cloudflare AI request timed out' });
      }
      console.error('Cloudflare fetch error', err);
      return res.status(502).json({ success: false, error: String(err) });
    }

    clearTimeout(timeout);

    const json = await r.json().catch(() => null);

    // If Cloudflare returns a non-2xx, surface a friendly error with details.
    if (!r.ok) {
      console.error('Cloudflare AI error:', r.status, json);
      const message = json?.errors || json?.message || json || `Status ${r.status}`;
      return res.status(502).json({ success: false, status: r.status, error: message, raw: json });
    }

    // Try to extract a useful text response from common Cloudflare shapes
    // Cloudflare sometimes returns { result: { response: "..." } }
    let text = null;
    text = text || json?.result?.response || json?.result?.response?.text;
    text = text || json?.result?.[0]?.content?.[0]?.text || json?.result?.[0]?.output?.[0]?.content?.[0]?.text;
    text = text || json?.text || json?.output?.[0]?.content?.[0]?.text || null;

    return res.status(200).json({ success: true, text, raw: json });
  } catch (err) {
    console.error('api/ai error:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
}
