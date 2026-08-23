import { FastifyInstance } from 'fastify';
import { prisma } from '../server.js';

export async function catalogRoutes(fastify: FastifyInstance) {
  fastify.get('/materials', async (req, reply) => {
    const { type } = req.query as { type?: string };
    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type.toUpperCase();
    const materials = await fastify.prisma.material.findMany({ where });
    return { materials };
  });

  fastify.get('/sizes', async (req, reply) => {
    const sizes = await fastify.prisma.sizePreset.findMany();
    return { sizes };
  });

  fastify.get('/cover-finishes', async (req, reply) => {
    const finishes = await fastify.prisma.coverFinish.findMany();
    return { finishes };
  });

  fastify.get('/accessories', async (req, reply) => {
    const { type } = req.query as { type?: string };
    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type.toUpperCase();
    const accessories = await fastify.prisma.accessory.findMany({ where });
    return { accessories };
  });
}
