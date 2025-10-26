// Simple health & env check endpoint for debugging on Vercel
// Returns 200 and whether the expected Cloudflare env vars are present.

export default function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  const present = {
    CF_ACCOUNT_ID: !!process.env.CF_ACCOUNT_ID,
    CF_MODEL: !!process.env.CF_MODEL,
    CF_API_TOKEN: !!process.env.CF_API_TOKEN,
  };

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ok: true, present });
}
