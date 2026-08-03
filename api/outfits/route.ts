import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enforce secure CORS (restrict to actual domain in production)
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    process.env.VITE_APP_URL || 'http://localhost:8081',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
  ].filter(Boolean);

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Default to app url or localhost if no origin matches
    res.setHeader('Access-Control-Allow-Origin', process.env.VITE_APP_URL || 'http://localhost:8081');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ message: 'OK' });
    }

    // Require authentication via Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized: Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    if (req.method === 'GET') {
      const { data: outfits, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(outfits);
    }

    if (req.method === 'POST') {
      const { outfit_data } = req.body;
      
      const { data, error } = await supabase
        .from('outfits')
        .insert([{ outfit_data, user_id: user.id }])
        .select();
      
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Outfits API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}