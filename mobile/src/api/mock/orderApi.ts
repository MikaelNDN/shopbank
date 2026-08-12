import { productApi } from '@/api/productApi';
import { StorageKeys, storageService } from '@/services/storageService';
import type { Address } from '@/types/address';
import type { CartItem } from '@/types/cart';
import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
} from '@/types/order';
import { canTransition } from '@/utils/orderStatus';

interface AdminOrderFilters {
  status?: OrderStatus;
  search?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface CreateOrderInput {
  customerId: string;
  items: CartItem[];
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  shipping?: number;
}

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function readAll(): Promise<Order[]> {
  return (await storageService.get<Order[]>(StorageKeys.ORDERS)) ?? [];
}

async function writeAll(orders: Order[]): Promise<void> {
  await storageService.set(StorageKeys.ORDERS, orders);
}

function toOrderItems(items: CartItem[]): OrderItem[] {
  return items.map((it) => ({
    productId: it.productId,
    name: it.name,
    imageUrl: it.imageUrl,
    price: it.price,
    quantity: it.quantity,
  }));
}

export const orderApi = {
  async create(input: CreateOrderInput): Promise<Order> {
    const subtotal = input.items.reduce(
      (acc, it) => acc + it.price * it.quantity,
      0,
    );
    const shipping = input.shipping ?? 0;
    const order: Order = {
      id: `order-${Date.now()}`,
      customerId: input.customerId,
      items: toOrderItems(input.items),
      shippingAddress: { ...input.shippingAddress },
      subtotal,
      shipping,
      total: subtotal + shipping,
      status: 'PENDING_PAYMENT',
      paymentMethod: input.paymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const all = await readAll();
    await writeAll([order, ...all]);
    return delay(order);
  },

  async getMyOrders(customerId: string): Promise<Order[]> {
    const all = await readAll();
    const list = all
      .filter((o) => o.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return delay(list);
  },

  async getById(id: string): Promise<Order | null> {
    const all = await readAll();
    return delay(all.find((o) => o.id === id) ?? null);
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const all = await readAll();
    const idx = all.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    const next = [...all];
    next[idx] = {
      ...next[idx],
      status,
      updatedAt: new Date().toISOString(),
    };
    await writeAll(next);
    return delay(next[idx]);
  },

  async attachPayment(id: string, paymentId: string): Promise<Order | null> {
    const all = await readAll();
    const idx = all.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    const next = [...all];
    next[idx] = {
      ...next[idx],
      paymentId,
      updatedAt: new Date().toISOString(),
    };
    await writeAll(next);
    return delay(next[idx]);
  },

  async listAll(filters: AdminOrderFilters = {}): Promise<Order[]> {
    const all = await readAll();
    let result = [...all].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    if (filters.status) {
      result = result.filter((o) => o.status === filters.status);
    }
    if (filters.customerId) {
      result = result.filter((o) => o.customerId === filters.customerId);
    }
    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      if (q.length > 0) {
        result = result.filter(
          (o) =>
            o.id.toLowerCase().includes(q) ||
            o.shippingAddress.label.toLowerCase().includes(q) ||
            o.items.some((it) => it.name.toLowerCase().includes(q)),
        );
      }
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).toISOString();
      result = result.filter((o) => o.createdAt >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).toISOString();
      result = result.filter((o) => o.createdAt <= to);
    }
    return delay(result);
  },

  async transitionStatus(id: string, to: OrderStatus): Promise<Order> {
    const all = await readAll();
    const order = all.find((o) => o.id === id);
    if (!order) throw new Error('Pedido não encontrado');
    if (!canTransition(order.status, to)) {
      throw new Error(
        `Transição inválida de ${order.status} para ${to}`,
      );
    }
    const wasPaid = order.status === 'PAID';
    const next = all.map((o) =>
      o.id === id
        ? { ...o, status: to, updatedAt: new Date().toISOString() }
        : o,
    );
    await writeAll(next);
    if (to === 'CANCELED' && wasPaid) {
      await Promise.all(
        order.items.map((it) =>
          productApi.updateStock(it.productId, it.quantity),
        ),
      );
    }
    const updated = next.find((o) => o.id === id);
    if (!updated) throw new Error('Erro ao atualizar pedido');
    return delay(updated);
  },

  async cancel(id: string): Promise<Order | null> {
    const all = await readAll();
    const order = all.find((o) => o.id === id);
    if (!order) return null;
    if (order.status === 'CANCELED' || order.status === 'DELIVERED') {
      throw new Error('Pedido não pode ser cancelado');
    }
    const wasPaid = order.status === 'PAID';
    const next = all.map((o) =>
      o.id === id
        ? {
            ...o,
            status: 'CANCELED' as OrderStatus,
            updatedAt: new Date().toISOString(),
          }
        : o,
    );
    await writeAll(next);
    if (wasPaid) {
      await Promise.all(
        order.items.map((it) =>
          productApi.updateStock(it.productId, it.quantity),
        ),
      );
    }
    return delay(next.find((o) => o.id === id) ?? null);
  },
};
