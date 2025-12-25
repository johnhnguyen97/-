import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, supabaseAdmin } from './lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (auth.error) {
    return res.status(401).json({ error: auth.error });
  }

  try {
    // Check if user has an API key stored
    const { data, error } = await supabaseAdmin
      .from('user_api_keys')
      .select('id')
      .eq('user_id', auth.userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json({ hasApiKey: !!data });
  } catch (error) {
    console.error('Error checking API key:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
