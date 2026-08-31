/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyInstance } from '../../types.js';
import { Prisma } from '@prisma/client';

async function authGuard(fastify: FastifyInstance, request: Parameters<typeof fastify.authenticate>[0]) {
  try {
    await request.jwtVerify();
  } catch {
    throw { code: 'UNAUTHORIZED', statusCode: 401 };
  }
}

export async function cartRoutes(fastify: FastifyInstance) {
  // Get cart
  fastify.get('/cart', {
    preHandler: [async (req) => authGuard(fastify, req)],
  }, async (req, reply) => {
    const userId = (req.user as { id: string }).id;
    let cart = await (fastify.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { design: { select: { id: true, name: true, thumbnailUrl: true, pages: true, layout: true } } } } },
    } as any)) as any;
    if (!cart) {
      cart = await (fastify.prisma.cart.create({
        data: { userId },
        include: { items: true },
      } as any)) as any;
    }
    const total = cart.items.reduce((sum: number, item: any) => sum + Number(item.unitPrice) * item.quantity, 0);
    return { id: cart.id, items: cart.items, total };
  });

  // Add to cart
  fastify.post('/cart/items', {
    preHandler: [async (req) => authGuard(fastify, req)],
  }, async (req, reply) => {
    const userId = (req.user as { id: string }).id;
    const { design_id, quantity = 1 } = req.body as { design_id: string; quantity?: number };

    const design = await fastify.prisma.design.findFirst({ where: { id: design_id, userId } });
    if (!design) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Design not found' } });

    let cart = await fastify.prisma.cart.findUnique({ where: { userId } });
    if (!cart) cart = await fastify.prisma.cart.create({ data: { userId } });

    const existing = await fastify.prisma.cartItem.findFirst({ where: { cartId: cart.id, designId: design_id } });
    if (existing) {
      return reply.status(422).send({ error: { code: 'VALIDATION_FAILED', message: 'Design already in cart' } });
    }

    await fastify.prisma.cartItem.create({
      data: { cartId: cart.id, designId: design_id, quantity, unitPrice: design.totalPrice },
    });

    return { cart_id: cart.id, added: true };
  });

  // Remove from cart
  fastify.delete('/cart/items/:id', {
    preHandler: [async (req) => authGuard(fastify, req)],
  }, async (req, reply) => {
    const userId = (req.user as { id: string }).id;
    const { id } = req.params as { id: string };

    const item = await fastify.prisma.cartItem.findFirst({
      where: { id, cart: { userId } },
    });
    if (!item) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Cart item not found' } });

    await fastify.prisma.cartItem.delete({ where: { id } });
    return { deleted: true };
  });

  // Checkout
  fastify.post('/checkout', {
    preHandler: [async (req) => authGuard(fastify, req)],
  }, async (req, reply) => {
    const userId = (req.user as { id: string }).id;
    const { cart_id } = req.body as { cart_id: string };

    const cart = await (fastify.prisma.cart.findUnique({
      where: { id: cart_id },
      include: { items: { include: { design: true } } },
    } as any)) as any;

    if (!cart || cart.userId !== userId) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Cart not found' } });
    if (!cart.items.length) return reply.status(422).send({ error: { code: 'VALIDATION_FAILED', message: 'Cart is empty' } });

    // Create order
    const orderNumber = `BX-${Date.now().toString(36).toUpperCase()}`;
    const order = await fastify.prisma.order.create({
      data: {
        userId,
        orderNumber,
        productionStatus: 'AWAITING_PAYMENT',
        items: {
          create: cart.items.map((item: any) => ({
            designId: item.designId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            baseSnapshot: { pages: item.design.pages, layout: item.design.layout },
            designSnapshot: item.design.designPayload,
            finishSnapshot: item.design.finishConfig ?? Prisma.JsonNull,
            finishZonesSnapshot: item.design.finishZones ?? Prisma.JsonNull,
            spineWidthMm: item.design.spineWidthMm,
          })),
        },
      },
    });

    // Create job queue entry
    await fastify.prisma.jobQueue.create({
      data: { orderId: order.id, status: 'PENDING' },
    });

    // Clear cart
    await fastify.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    const total = cart.items.reduce((s: number, i: any) => s + Number(i.unitPrice) * i.quantity, 0);
    return { order_id: order.id, order_number: orderNumber, total };
  });

  // Mock payment confirm
  fastify.post('/orders/:id/confirm-payment', {
    preHandler: [async (req) => authGuard(fastify, req)],
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const order = await fastify.prisma.order.update({
      where: { id },
      data: { productionStatus: 'QUEUED' },
    });
    return { status: order.productionStatus };
  });

  // Get order
  fastify.get('/orders/:id', {
    preHandler: [async (req) => authGuard(fastify, req)],
  }, async (req, reply) => {
    const userId = (req.user as { id: string }).id;
    const { id } = req.params as { id: string };
    const order = await fastify.prisma.order.findFirst({ where: { id, userId } });
    if (!order) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
    return { order };
  });
}
