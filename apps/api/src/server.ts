import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { PrismaClient } from '@booxury/database';
import { catalogRoutes } from './modules/catalog/routes.js';
import { pricingRoutes } from './modules/pricing/routes.js';
import { designRoutes } from './modules/configurator/routes.js';
import { cartRoutes } from './modules/commerce/routes.js';
import { authPlugin } from './plugins/auth.js';
import { adminRoutes } from './modules/admin/routes.js';
import { productionRoutes, anonymousBlueprintRoutes } from './modules/production/routes.js';

export const prisma = new PrismaClient();

const server = Fastify({ logger: true });

// Plugins
await server.register(cors, { origin: true, credentials: true });
await server.register(jwt, { secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret-change-in-prod' });
await server.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } });

// Decorate with prisma
server.decorate('prisma', prisma);

// Decorate with authenticate helper
server.decorate('authenticate', async (request: Parameters<typeof server.authenticate>[0]) => {
  try {
    await request.jwtVerify();
  } catch {
    throw { code: 'UNAUTHORIZED', statusCode: 401 };
  }
});

// Auth plugin (login endpoint for NextAuth)
await server.register(authPlugin);

// Routes
await server.register(catalogRoutes, { prefix: '/store' });
await server.register(pricingRoutes, { prefix: '/api' });
await server.register(designRoutes, { prefix: '/api' });
await server.register(cartRoutes, { prefix: '/api' });
await server.register(productionRoutes, { prefix: '/api' });
await server.register(anonymousBlueprintRoutes, { prefix: '/api' });
await server.register(adminRoutes, { prefix: '/' });

// Health
server.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

// Global error handler
server.setErrorHandler((err: unknown, req, reply) => {
  server.log.error(err);
  const error = err as { code?: string; message?: string };
  const code = error.code ?? 'INTERNAL_ERROR';
  reply.status(500).send({ error: { code, message: error.message ?? 'Internal server error' } });
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
