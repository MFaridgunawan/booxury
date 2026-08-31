import { FastifyInstance } from '../types.js';
import * as bcrypt from 'bcrypt';

export async function authPlugin(fastify: FastifyInstance) {
  fastify.post('/api/auth/login', async (req, reply) => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return reply.status(400).send({ error: { code: 'VALIDATION_FAILED', message: 'Email and password required' } });
    }

    const user = await fastify.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }

    const token = fastify.jwt.sign(
      { id: user.id, email: user.email, role: user.role.toLowerCase() },
      { expiresIn: '7d' }
    );

    return { user: { id: user.id, email: user.email, name: user.name, role: user.role.toLowerCase() }, token };
  });
}
