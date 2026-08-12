import { orderApi } from '@/api/orderApi';
import { productApi } from '@/api/productApi';
import { StorageKeys, storageService } from '@/services/storageService';
import type { Payment, PaymentMethod } from '@/types/order';

function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function readAll(): Promise<Payment[]> {
  return (await storageService.get<Payment[]>(StorageKeys.PAYMENTS)) ?? [];
}

async function writeAll(payments: Payment[]): Promise<void> {
  await storageService.set(StorageKeys.PAYMENTS, payments);
}

export const paymentApi = {
  async createCheckout(
    orderId: string,
    method: PaymentMethod,
  ): Promise<Payment> {
    const order = await orderApi.getById(orderId);
    if (!order) throw new Error('Pedido não encontrado');
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      orderId,
      method,
      status: 'PENDING',
      amount: order.total,
      qrCode:
        method === 'PIX'
          ? `00020126360014BR.GOV.BCB.PIX0114${orderId}5204000053039865404${order.total.toFixed(
              2,
            )}5802BR5913ShopBank Mock6009Sao Paulo62070503***6304ABCD`
          : undefined,
      redirectUrl:
        method === 'ABACATEPAY'
          ? `https://mock-abacatepay.shopbank/${orderId}`
          : undefined,
      createdAt: new Date().toISOString(),
    };
    const all = await readAll();
    await writeAll([payment, ...all]);
    await orderApi.attachPayment(orderId, payment.id);
    return delay(payment);
  },

  async getById(id: string): Promise<Payment | null> {
    const all = await readAll();
    return delay(all.find((p) => p.id === id) ?? null);
  },

  async getByOrderId(orderId: string): Promise<Payment | null> {
    const all = await readAll();
    return delay(all.find((p) => p.orderId === orderId) ?? null);
  },

  async simulateApproval(paymentId: string): Promise<Payment> {
    const all = await readAll();
    const idx = all.findIndex((p) => p.id === paymentId);
    if (idx === -1) throw new Error('Pagamento não encontrado');
    const payment = all[idx];
    if (payment.status === 'APPROVED') {
      return delay(payment);
    }

    const order = await orderApi.getById(payment.orderId);
    if (!order) throw new Error('Pedido não encontrado');

    for (const item of order.items) {
      const product = await productApi.getById(item.productId);
      if (!product || product.availableQuantity < item.quantity) {
        throw new Error(`Estoque insuficiente para ${item.name}`);
      }
    }

    await Promise.all(
      order.items.map((it) =>
        productApi.updateStock(it.productId, -it.quantity),
      ),
    );

    const approved: Payment = {
      ...payment,
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
    };
    const next = [...all];
    next[idx] = approved;
    await writeAll(next);

    await orderApi.updateStatus(payment.orderId, 'PAID');

    return delay(approved);
  },

  async reject(paymentId: string): Promise<Payment> {
    const all = await readAll();
    const idx = all.findIndex((p) => p.id === paymentId);
    if (idx === -1) throw new Error('Pagamento não encontrado');
    const next = [...all];
    next[idx] = { ...next[idx], status: 'REJECTED' };
    await writeAll(next);
    return delay(next[idx]);
  },
};
