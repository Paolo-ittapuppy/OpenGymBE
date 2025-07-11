import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../Supabase/SupabaseServices';
import { verifySupabaseToken } from '../middleware/VerifySupaToken';
import { CreateSessionBody } from '../BodyFormats/BodyFormats';

export default async function sessionRoute(fastify: FastifyInstance) {
    fastify.post('/create', async (req: FastifyRequest, res: FastifyReply) => {
        const user_id = verifySupabaseToken(req.headers.authorization);

        const {
            session_name,
            description,
            sport,
            team_size,
            max_teams,
            starts_at,
            rotation_mode,
            winner_max_wins,
            number_of_courts
        } = req.body as CreateSessionBody
    
        const { data, error } = await supabase
        .from('sessions')
        .insert({
            session_name,
            description,
            host_id: user_id.sub, // Use the user ID from the token
            sport,
            team_size,
            max_teams,
            starts_at: new Date(starts_at).toISOString(), // Ensure it's in ISO format
            rotation_mode,
            winner_max_wins,
            number_of_courts: number_of_courts || 1 // Default to 1 if not provided
        })  
        .select('id')
        .single(); // Use .single() to get a single object instead of an array
        
        if (error) {
            console.error('Error creating session:', error);
            return res.status(400).send({ error: error.message });
        }
        console.log('Session created successfully:', data);
        return res.send({
            message: 'Session created successfully',
            session_id: data, // Return the created session ID
        })
    }); 
}