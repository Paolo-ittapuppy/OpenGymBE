import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../Supabase/SupabaseServices';
import { verifySupabaseToken } from '../middleware/VerifySupaToken';
import { CreateSessionBody, CreateTeamBody } from '../BodyFormats/BodyFormats';

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
        .from('session')
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
        //.select('id')
        //.single(); // Use .single() to get a single object instead of an array
        console.log('Supabase response:', { data, error });
        
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

    fastify.get('/:session_id', async (req, res) => {
        // Type‑safe destructuring
        const { session_id } = req.params as { session_id: string };
        console.log("getting session data for session: ", session_id)
        // Example response
        const {data, error} = await supabase
            .from("session")
            .select('*')
            .eq("id", session_id)
            .single()
        if (error){
            console.log("error fetching session data")
            return res.status(400).send({ error: error.message });
        }
        return res.send({
            data,
            ok: true
        })

    });

    fastify.post('/:session_id/create-team', async (req, res)=>{
        try{
            const user_id = verifySupabaseToken(req.headers.authorization).sub;
            const { session_id } = req.params as { session_id: string };
            const { team_name } = req.body as { team_name: string };

            const {data, error} = await supabase
            .rpc('add_team_to_session', {
                p_session_id: session_id,
                p_team_name: team_name,
                p_captain_id: user_id,
            })
            if (error){
                console.error('Error creating session:', error);
                return res.status(400).send({ error: error.message })
            }
            console.log("new team data: " + data)
            return res.send({
                message: "new team created successfully",
                data
            })
        }catch (error){
            console.error('Error creating team:', error);
            return res.status(400).send({ error: error })
        }
    })
}