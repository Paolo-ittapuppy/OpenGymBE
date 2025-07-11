import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../Supabase/SupabaseServices';

export default async function authRoutes(fastify: FastifyInstance) {

  fastify.post('/send-magic-link', async (req: FastifyRequest, res: FastifyReply) => {
    console.log('sending magic link to email:', req.body);
    const { email } = req.body as { email: string };

    if (!email || !email.includes('@')) {
      return res.status(400).send({ error: 'Invalid email' });
    }

    // Rate limiting logic (per IP or email can go here)

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) return res.status(400).send({ error: error.message });
    return res.send({ message: 'Magic link sent!' });
  });
}