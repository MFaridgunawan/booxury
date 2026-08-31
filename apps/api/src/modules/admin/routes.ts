import { FastifyInstance } from '../../types.js';

async function adminGuard(fastify: FastifyInstance, request: Parameters<typeof fastify.authenticate>[0]) {
  try {
    await request.jwtVerify();
    const role = (request.user as { role?: string }).role;
    if (role !== 'admin') throw { code: 'FORBIDDEN', statusCode: 403 };
  } catch (err) {
    const e = err as { code?: string; statusCode?: number };
    if (e.statusCode === 403) throw e;
    throw { code: 'UNAUTHORIZED', statusCode: 401 };
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  // ── Toggle material active status ────────────────────────────────────────
  fastify.patch('/admin/materials/:id', {
    preHandler: [async (req) => adminGuard(fastify, req)],
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { is_active } = req.body as { is_active?: boolean };
    const material = await fastify.prisma.material.update({
      where: { id },
      data: { isActive: is_active },
    });
    return { id: material.id, is_active: material.isActive };
  });

  // ── List orders ─────────────────────────────────────────────────────────────
  fastify.get('/admin/orders', {
    preHandler: [async (req) => adminGuard(fastify, req)],
  }, async (req, reply) => {
    const { status, page = '1' } = req.query as { status?: string; page?: string };
    const where: Record<string, unknown> = {};
    if (status) where.productionStatus = status.toUpperCase();

    const perPage = 20;
    const skip = (parseInt(page) - 1) * perPage;

    const [orders, total] = await Promise.all([
      fastify.prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true } },
          items: { select: { id: true, quantity: true, unitPrice: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: perPage,
        skip,
      }),
      fastify.prisma.order.count({ where }),
    ]);

    const enriched = orders.map(o => ({
      id: o.id,
      order_number: o.orderNumber,
      status: o.productionStatus,
      user: o.user,
      total: o.items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0),
      items_count: o.items.length,
      zip_url: o.productionZipUrl,
      created_at: o.createdAt,
    }));

    return { orders: enriched, total, page: parseInt(page), per_page: perPage };
  });

  // ── Update order status ────────────────────────────────────────────────────
  fastify.patch('/admin/orders/:id/status', {
    preHandler: [async (req) => adminGuard(fastify, req)],
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status?: string };
    const valid = ['AWAITING_PAYMENT', 'QUEUED', 'BINDING', 'SHIPPED', 'CANCELLED'];
    if (!status || !valid.includes(status.toUpperCase())) {
      return reply.status(422).send({ error: { code: 'VALIDATION_FAILED', message: 'Invalid status' } });
    }
    const order = await fastify.prisma.order.update({
      where: { id },
      data: { productionStatus: status.toUpperCase() as Parameters<typeof fastify.prisma.order.update>[0]['data']['productionStatus'] },
    });
    return { id: order.id, status: order.productionStatus };
  });

  // ── Get production ZIP URL ─────────────────────────────────────────────────
  fastify.get('/admin/orders/:id/zip', {
    preHandler: [async (req) => adminGuard(fastify, req)],
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const order = await fastify.prisma.order.findUnique({ where: { id } });
    if (!order) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
    if (!order.productionZipUrl) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'ZIP not ready yet' } });
    return { zip_url: order.productionZipUrl };
  });
}
