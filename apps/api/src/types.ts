import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
  interface FastifyRequest {
    prisma: PrismaClient;
  }
}

export type { FastifyInstance, FastifyRequest };
export { Fastify };
