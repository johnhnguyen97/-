import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, supabaseAdmin } from './lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (auth.error) {
    return res.status(401).json({ error: auth.error });
  }

  try {
    const { error: dbError } = await supabaseAdmin
      .from('user_api_keys')
      .delete()
      .eq('user_id', auth.userId);

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to delete API key' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
