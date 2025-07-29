import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
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
        //console.log(data)
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
            //remove redis cache of teams
            await fastify.redis.del(`session:${session_id}:teams`);
            // publish message to request
            await fastify.redis.publish(`session:${session_id}:updates`, JSON.stringify({
                type: "team_update",
                session_id,
                //timestamp: Date.now(),
            }));

            return res.send({
                message: "new team created successfully",
                data
            })
        }catch (error){
            console.error('Error creating team:', error);
            return res.status(400).send({ error: error })
        }
    })

    fastify.get('/:session_id/team-of', async (req, res) =>{
        try{
            //console.log(req.headers.authorization)
            const user_id = verifySupabaseToken(req.headers.authorization).sub;
            const { session_id } = req.params as { session_id: string };

            const {data, error} = await supabase
                .from('player')
                .select('team_id, team(session_id)')
                .eq('id', user_id)
                .eq('team.session_id', session_id)
                .maybeSingle();

            if (error){
                console.log("error fetching user's team")
                return res.status(400).send({ error: error.message });
            }
            if (data == null){
                res.send(null)
            }
            return res.send({
                data
            })
        }catch (error){
            console.error('Error finding user in session:', error);
            return res.status(400).send({ error: error })
        }
    })

    fastify.get('/:session_id/teams', async (req, res) =>{
        try{
            const { session_id } = req.params as { session_id: string };

            //check redis cache
            const redisKey = `session:${session_id}:teams`;
            const cached = await fastify.redis.get(redisKey);
            if (cached) {
                console.log('redis hit:', redisKey)
                return res.send(JSON.parse(cached));
            }

            const {data, error} = await supabase
                .from('team')
                .select('*, profiles!team_captain_id_fkey(full_name)')
                .eq('session_id', session_id)

            if (error){
                console.log("error:", error)
                return res.status(400).send({error: error})
            }
            //if no cache store into cache
            console.log('redis set:',redisKey)
            await fastify.redis.set(redisKey, JSON.stringify(data));
            res.send(data)
        }catch (error){
            console.error('server error', error);
            return res.status(500).send({ error: error })
        }
        
    })

    fastify.post('/:session_id/team/:team_id/join', async (req, res) =>{
        try{
            console.log(req.headers.authorization)
            const id = verifySupabaseToken(req.headers.authorization).sub;
            const { session_id, team_id } = req.params as { session_id: string, team_id: string };

            const redisKey = `session:${session_id}:teams`;

            const {data, error} = await supabase
                .from('player')
                .insert({id, team_id, session_id})
            if (error){
                console.log("error in updating db:", error)
                return res.status(400).send({error: error})
            }
            await fastify.redis.del(`session:${session_id}:teams`);
            return res.send({message: `user: ${id} join team `})
            
        }catch (error){
            console.error('server error', error);
            return res.status(500).send({ error: error })
        }
    })

    fastify.get('/:session_id/current-games', async (req, res) =>{

        const { session_id } = req.params as { session_id: string };

        const {data, error} = await supabase
            .from('game')
            .select('*')
            .eq('session_id', session_id)
            
        if(error){
            console.log("error in fetching db:", error)
            return res.status(400).send({error: error})
        }

        return res.send({data, message:'successfull'})
    })

    fastify.patch('/:session_id/add_team_to_game', async (req, res) =>{
        const { session_id } = req.params as {session_id: string}
        const { team_id, court } = req.body as {team_id: string, court:number}
        
        const { data, error } = await supabase.rpc('add_team_to_game', {
            p_session_id: session_id,
            p_team_id: team_id,
            p_court: court,
        });

        if (error) {
            console.error(error);
            return res.status(500).send({ error: 'Failed to add team to game' });
        }

        res.send({ status: data });
    })

    
}