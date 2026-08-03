import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enforce secure CORS
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    process.env.VITE_APP_URL || 'http://localhost:8081',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
  ].filter(Boolean);

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
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
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Ensure the requested operations act on the authenticated user's ID
    const targetUserId = req.query.user_id || req.body?.user_id || req.body?.id;
    if (targetUserId && targetUserId !== authUser.id) {
       return res.status(403).json({ error: 'Forbidden: Cannot access other users\' data' });
    }

    const userId = authUser.id;

    if (req.method === 'GET') {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(user);
    }

    if (req.method === 'POST') {
      const { email, full_name, preferred_style, favorite_colors, gender_preference } = req.body;

      const { data: user, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          email: email || authUser.email,
          full_name,
          preferred_style,
          favorite_colors,
          gender_preference,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(user);
    }

    if (req.method === 'PUT') {
      const { updates } = req.body;

      const { data: user, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(user);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}