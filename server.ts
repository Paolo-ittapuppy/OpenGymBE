import 'dotenv/config';
import Fastify from 'fastify';
import fastifyRedis from '@fastify/redis';
import authRoutes from './Auth/AuthRoute';
import profileRoutes from './Profile/ProfileRoute';
import cors from '@fastify/cors';
import sessionRoute from './Session/SessionRoute';
import { websocketRoutes } from './WebSocket/WebSocket';
import fastifyPrintRoutes from 'fastify-print-routes'


const fastify = Fastify({ logger: false });
fastify.register(fastifyPrintRoutes)
fastify.register(cors, {
  origin: ['http://localhost:3000'], // Adjust as needed
  credentials: true,
});
fastify.register(fastifyRedis, {
  host: '127.0.0.1',
  //password: 'your strong password here',
  //port: 6379, // Redis port
  //family: 4   // 4 (IPv4) or 6 (IPv6)
})
fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(profileRoutes, { prefix: '/api/profile' });
fastify.register(sessionRoute, { prefix: '/api/session' });
//fastify.register(websocketRoutes, {prefix: '/api/ws'})

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