// Minimal server-side proxy for OpenAI requests.
// Usage: set OPENAI_KEY in the environment (do NOT check this into git) and run:
//   node server/index.js
// The server listens on port 5174 and exposes POST /api/ai

const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT || 5174;
// Load Cloudflare AI configuration from environment variables with local placeholders.
// For local testing you can set these in your shell or a local .env file.
// WARNING: Do NOT commit real secret tokens to source control.
const CF_ACCOUNT_ID = "568525424c1d0ac88c8baa71f52d3e45";
const CF_MODEL = "@cf/meta/llama-3-8b-instruct";
const CF_API_TOKEN = "debXIsihVBoDISc5zz_PAN6bCpMTABDApyfpsoyU";

if (!CF_ACCOUNT_ID || !CF_MODEL || !CF_API_TOKEN || CF_ACCOUNT_ID.startsWith('REPLACE')) {
  console.warn('Warning: Cloudflare AI env vars (CF_ACCOUNT_ID, CF_MODEL, CF_API_TOKEN) are not set or contain placeholders. Requests will fail.');
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

async function proxyCloudflare(bodyPayload) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CF_API_TOKEN}`,
    },
    body: JSON.stringify(bodyPayload),
  });

  const json = await resp.json();
  return { status: resp.status, json };
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);

  // Basic CORS for local dev; tighten for production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (u.pathname === '/api/ai' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);

      // Accept a simple shape from the client and create a Cloudflare AI request.
      const prompt = body.prompt || 'Write a short story about a llama that goes on a journey to find an orange cloud';

      const payload = {
        messages: [
          { role: 'system', content: 'You are a friendly assistant that helps write stories' },
          { role: 'user', content: prompt },
        ],
      };

      const cfResp = await proxyCloudflare(payload);

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(cfResp.status);
      res.end(JSON.stringify(cfResp.json));
    } catch (err) {
      console.error('Error in /api/ai:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: String(err) }));
    }

    return;
  }

  // Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`AI proxy server listening on http://localhost:${PORT}`);
});
