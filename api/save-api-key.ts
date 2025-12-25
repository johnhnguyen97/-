import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, supabaseAdmin } from './lib/auth';
import { encrypt } from './lib/crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (auth.error) {
    return res.status(401).json({ error: auth.error });
  }

  try {
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-ant-')) {
      return res.status(400).json({ error: 'Invalid API key format' });
    }

    // Validate API key by making a test request to Anthropic
    const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    if (testResponse.status === 401) {
      return res.status(400).json({ error: 'Invalid API key' });
    }

    // Encrypt the API key
    const encryptedData = encrypt(apiKey);

    // Store in database (upsert - insert or update)
    const { error: dbError } = await supabaseAdmin
      .from('user_api_keys')
      .upsert({
        user_id: auth.userId,
        encrypted_key: encryptedData.encrypted,
        iv: encryptedData.iv,
        auth_tag: encryptedData.authTag,
        salt: encryptedData.salt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to save API key' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving API key:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
