import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { PrismaClient } from '@booxury/database';
import { catalogRoutes } from './modules/catalog/routes';
import { pricingRoutes } from './modules/pricing/routes';
import { designRoutes } from './modules/configurator/routes';
import { cartRoutes } from './modules/commerce/routes';

export const prisma = new PrismaClient();

const server = Fastify({ logger: true });

// Plugins
await server.register(cors, { origin: true, credentials: true });
await server.register(jwt, { secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret' });
await server.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } });

// Decorate with prisma
server.decorate('prisma', prisma);

// Routes
await server.register(catalogRoutes, { prefix: '/store' });
await server.register(pricingRoutes, { prefix: '/api' });
await server.register(designRoutes, { prefix: '/api' });
await server.register(cartRoutes, { prefix: '/api' });

// Health
server.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

// Global error handler
server.setErrorHandler((err, req, reply) => {
  server.log.error(err);
  const code = (err as { code?: string }).code ?? 'INTERNAL_ERROR';
  reply.status(500).send({ error: { code, message: err.message } });
});

// Start
const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('API server listening on http://localhost:3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
