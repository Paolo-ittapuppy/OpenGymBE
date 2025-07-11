import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../Supabase/SupabaseServices';
import {verifySupabaseToken} from '../middleware/VerifySupaToken';

export default async function profileRoutes(fastify: FastifyInstance) {
    fastify.post('/update', async (req, res) => {
        try {
        const payload = verifySupabaseToken(req.headers.authorization);

        const userId = payload.sub; // Supabase user ID
        console.log('Updating profile for user ID:', userId);
        // Validate that the userId is a string
        if (typeof userId !== 'string') {   
            return res.status(400).send({ error: 'Invalid user ID' });
        }
        const { username, full_name, avatar_url } = req.body as {
            username?: string;  // Optional field   
            full_name?: string; // Optional field
            avatar_url?: string; // Optional field
        };

        // Now safely use `userId` from verified token
        const { data, error } = await supabase
            .from('profiles')
            .update({
                username,
                full_name,
                avatar_url,
                has_completed_profile: true
            })
            .eq('id', userId);

        const { error: updateAuthError } = await supabase.auth.updateUser({
            data: {
                full_name,
            },
            });
        if (error|| updateAuthError) {
            const message =
            error?.message || updateAuthError?.message || 'Unknown error';
            return res.status(400).send({ error: message });
        }
        return res.send({ message: 'Profile updated successfully', data });
        } catch (err: any) {
            console.log('Error updating profile:', err);
            res.status(401).send({ error: err.message });
        }
    });
}
    