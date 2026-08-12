import { apiClient } from '@/api/apiClient';
import { StorageKeys, storageService } from '@/services/storageService';
import type { Address } from '@/types/address';
import type { CartItem } from '@/types/cart';
import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
} from '@/types/order';
import type { AuthResponse } from '@/types/user';

type BackendOrderStatus =
  | 'CREATED'
  | 'RESERVED'
  | 'WAITING_PAYMENT'
  | 'PAID'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELED';

interface BackendOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number | string;
  subtotal: number | string;
}

interface BackendShipping {
  customerAddressIdOrigin: number;
  recipientName: string;
  postalCode: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  reference?: string;
}

interface BackendOrder {
  id: number;
  customerId: number;
  status: BackendOrderStatus;
  totalAmount: number | string;
  items: BackendOrderItem[];
  shippingAddress: BackendShipping;
  createdAt: string;
}

function num(v: number | string): number {
  return typeof v === 'string' ? Number.parseFloat(v) : v;
}

function statusToApp(s: BackendOrderStatus): OrderStatus {
  switch (s) {
    case 'CREATED':
    case 'RESERVED':
    case 'WAITING_PAYMENT':
      return 'PENDING_PAYMENT';
    case 'PAID':
      return 'PAID';
    case 'PREPARING':
    case 'SHIPPED':
      return 'SHIPPED';
    case 'DELIVERED':
      return 'DELIVERED';
    case 'CANCELED':
      return 'CANCELED';
  }
}

function statusToBackend(s: OrderStatus): BackendOrderStatus {
  switch (s) {
    case 'PENDING_PAYMENT':
      return 'WAITING_PAYMENT';
    case 'PAID':
      return 'PAID';
    case 'SHIPPED':
      return 'SHIPPED';
    case 'DELIVERED':
      return 'DELIVERED';
    case 'CANCELED':
      return 'CANCELED';
  }
}

function toOrderItem(it: BackendOrderItem): OrderItem {
  return {
    productId: String(it.productId),
    name: it.productName,
    imageUrl: '',
    price: num(it.unitPrice),
    quantity: it.quantity,
  };
}

function toAddress(s: BackendShipping): Address {
  return {
    id: String(s.customerAddressIdOrigin),
    customerId: '',
    label: 'Endereço de entrega',
    zipCode: s.postalCode,
    street: s.street,
    number: s.number,
    complement: s.complement,
    neighborhood: s.district,
    city: s.city,
    state: s.state,
    isFavorite: false,
  };
}

function toOrder(b: BackendOrder, paymentMethod: PaymentMethod = 'ABACATEPAY'): Order {
  const items = b.items.map(toOrderItem);
  const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const total = num(b.totalAmount);
  return {
    id: String(b.id),
    customerId: String(b.customerId),
    items,
    shippingAddress: toAddress(b.shippingAddress),
    subtotal,
    shipping: Math.max(0, total - subtotal),
    total,
    status: statusToApp(b.status),
    paymentMethod,
    createdAt: b.createdAt,
    updatedAt: b.createdAt,
  };
}

interface CreateOrderInput {
  customerId: string;
  items: CartItem[];
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  shipping?: number;
}

interface AdminOrderFilters {
  status?: OrderStatus;
  search?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

async function getCurrentCustomerId(): Promise<number | null> {
  const auth = await storageService.get<AuthResponse>(StorageKeys.AUTH);
  if (!auth?.user?.id) return null;
  const parsed = Number.parseInt(auth.user.id, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export const orderApiHttp = {
  async create(input: CreateOrderInput): Promise<Order> {
    const { data } = await apiClient.post<BackendOrder>('/api/orders', {
      customerId: Number.parseInt(input.customerId, 10),
      customerAddressId: Number.parseInt(input.shippingAddress.id, 10),
      items: input.items.map((it) => ({
        productId: Number.parseInt(it.productId, 10),
        quantity: it.quantity,
      })),
    });
    return toOrder(data, input.paymentMethod);
  },

  async getMyOrders(_customerId: string): Promise<Order[]> {
    const { data } = await apiClient.get<BackendOrder[]>(
      '/api/orders/my-orders',
    );
    return data
      .map((o) => toOrder(o))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getById(id: string): Promise<Order | null> {
    try {
      const { data } = await apiClient.get<BackendOrder>(`/api/orders/${id}`);
      return toOrder(data);
    } catch {
      return null;
    }
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const { data } = await apiClient.patch<BackendOrder>(
      `/api/orders/${id}/status`,
      { status: statusToBackend(status) },
    );
    return toOrder(data);
  },

  async transitionStatus(id: string, to: OrderStatus): Promise<Order> {
    const { data } = await apiClient.patch<BackendOrder>(
      `/api/orders/${id}/status`,
      { status: statusToBackend(to) },
    );
    return toOrder(data);
  },

  async attachPayment(id: string, _paymentId: string): Promise<Order | null> {
    return this.getById(id);
  },

  async cancel(id: string): Promise<Order | null> {
    const { data } = await apiClient.patch<BackendOrder>(
      `/api/orders/${id}/cancel`,
    );
    return toOrder(data);
  },

  async listAll(filters: AdminOrderFilters = {}): Promise<Order[]> {
    const customerId = filters.customerId
      ? Number.parseInt(filters.customerId, 10)
      : await getCurrentCustomerId();
    if (!customerId) return [];
    const { data } = await apiClient.get<BackendOrder[]>(
      `/api/orders/customer/${customerId}`,
    );
    let result = data.map((o) => toOrder(o));
    if (filters.status) {
      result = result.filter((o) => o.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      if (q.length > 0) {
        result = result.filter(
          (o) =>
            o.id.toLowerCase().includes(q) ||
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
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
