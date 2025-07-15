import 'dotenv/config';
import Fastify from 'fastify';
import authRoutes from './Auth/AuthRoute';
import profileRoutes from './Profile/ProfileRoute';
import cors from '@fastify/cors';
import sessionRoute from './Session/SessionRoute';

const fastify = Fastify({ logger: false });
fastify.register(cors, {
  origin: ['http://localhost:3000'], // Adjust as needed
  credentials: true,
});
fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(profileRoutes, { prefix: '/api/profile' });
fastify.register(sessionRoute, { prefix: '/api/session' });

const start = async () => {
  try {
    await fastify.listen({ port: 8080 });
    console.log('Server is running on http://localhost:8080');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();