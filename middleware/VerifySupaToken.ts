import 'dotenv/config';
import jwt from 'jsonwebtoken';

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;
console.log

export function verifySupabaseToken(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, SUPABASE_JWT_SECRET);
    return payload as { sub: string }; // `sub` is the user_id
  } catch (err) {
    throw err;
  }
}