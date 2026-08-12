import { apiClient } from '@/api/apiClient';
import type {
  CustomerDetail,
  CustomerSummary,
  DashboardData,
  DashboardPeriod,
  ReportsData,
} from '@/api/adminApi';
import type { Order, OrderStatus } from '@/types/order';
import type { User, UserRole } from '@/types/user';

interface BackendDashboard {
  totalCustomers: number;
  totalOrders: number;
  totalProducts: number;
  lowStockItems: number;
  approvedPayments: number;
  pendingPayments: number;
  canceledOrders: number;
  totalUnitsSold: number;
  totalRevenue: number | string;
  monthRevenue: number | string;
  averageTicket: number | string;
  bestSellingProduct: {
    id: number;
    name: string;
    sold: number;
  } | null;
  revenueByMonth: { month: string; value: number | string }[];
  topProducts: { productId: number; name: string; sold: number }[];
  ordersByStatus: Record<string, number>;
  revenueByCategory: {
    categoryId: number;
    category: string;
    value: number | string;
  }[];
  lowStockList: { productId: number; name: string; quantity: number }[];
}

interface BackendReport {
  ordersByStatus: Record<string, number>;
  paymentsByStatus: Record<string, number>;
  totalRevenue: number | string;
}

interface BackendCustomer {
  id: number;
  userId: number;
  fullName: string;
  cpf: string;
  phone?: string;
  birthDate?: string;
  marketingOptIn?: boolean;
  active: boolean;
}

interface BackendOrder {
  id: number;
  customerId: number;
  status: string;
  totalAmount: number | string;
  items: { productId: number; productName: string; quantity: number; unitPrice: number | string }[];
  createdAt: string;
}

function num(v: number | string): number {
  return typeof v === 'string' ? Number.parseFloat(v) : v;
}

function statusToApp(s: string): OrderStatus {
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
    default:
      return 'PENDING_PAYMENT';
  }
}

function mapStatusBuckets(raw: Record<string, number>): Record<OrderStatus, number> {
  const out: Record<OrderStatus, number> = {
    PENDING_PAYMENT: 0,
    PAID: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELED: 0,
  };
  for (const [key, value] of Object.entries(raw)) {
    const mapped = statusToApp(key);
    out[mapped] += value;
  }
  return out;
}

function customerToUser(c: BackendCustomer, role: UserRole = 'CLIENT'): User {
  return {
    id: String(c.id),
    name: c.fullName,
    email: '',
    cpf: c.cpf,
    role,
    createdAt: new Date().toISOString(),
  };
}

export const adminApiHttp = {
  async getDashboard(_period: DashboardPeriod = '30d'): Promise<DashboardData> {
    const { data } = await apiClient.get<BackendDashboard>(
      '/api/admin/dashboard',
      { params: { period: _period } },
    );

    const ordersByStatus = (
      [
        'PENDING_PAYMENT',
        'PAID',
        'SHIPPED',
        'DELIVERED',
        'CANCELED',
      ] as OrderStatus[]
    ).map((status) => {
      const backendBuckets = mapStatusBuckets(data.ordersByStatus ?? {});
      return { status, count: backendBuckets[status] ?? 0 };
    });

    return {
      period: _period,
      totalRevenue: num(data.totalRevenue),
      monthRevenue: num(data.monthRevenue ?? data.totalRevenue),
      totalOrders: data.totalOrders,
      paidOrders: data.approvedPayments,
      pendingOrders: data.pendingPayments ?? 0,
      canceledOrders: data.canceledOrders ?? 0,
      averageTicket: num(data.averageTicket ?? 0),
      activeProducts: data.totalProducts,
      lowStockCount: data.lowStockItems,
      totalCustomers: data.totalCustomers,
      totalUnitsSold: data.totalUnitsSold ?? 0,
      bestSellingProduct: data.bestSellingProduct
        ? {
            id: String(data.bestSellingProduct.id),
            name: data.bestSellingProduct.name,
            sold: data.bestSellingProduct.sold,
          }
        : null,
      revenueByMonth: (data.revenueByMonth ?? []).map((m) => ({
        month: m.month,
        value: num(m.value),
      })),
      topProducts: (data.topProducts ?? []).map((p) => ({
        name: p.name,
        sold: p.sold,
      })),
      ordersByStatus,
      revenueByCategory: (data.revenueByCategory ?? []).map((c) => ({
        category: c.category,
        value: num(c.value),
      })),
      lowStockList: (data.lowStockList ?? []).map((l) => ({
        id: String(l.productId),
        name: l.name,
        qty: l.quantity,
      })),
    };
  },

  async listCustomers(search?: string): Promise<CustomerSummary[]> {
    const { data } = await apiClient.get<BackendCustomer[]>(
      '/api/admin/customers',
    );
    const term = search?.trim().toLowerCase();
    const filtered = term
      ? data.filter(
          (c) =>
            c.fullName.toLowerCase().includes(term) ||
            c.cpf.includes(term),
        )
      : data;

    const activeCustomers = filtered.filter((c) => c.active);

    return Promise.all(
      activeCustomers.map(async (c) => {
        let ordersData: BackendOrder[] = [];
        try {
          const response = await apiClient.get<BackendOrder[]>(
            `/api/orders/customer/${c.id}`
          );
          ordersData = response.data;
        } catch (error) {
          console.error(`Failed to fetch orders for customer ${c.id}:`, error);
        }

        const validStatuses = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'];
        const completed = ordersData.filter((o) => validStatuses.includes(o.status));
        const totalSpent = completed.reduce((acc, o) => acc + num(o.totalAmount), 0);
        
        let lastOrderAt = null;
        if (ordersData.length > 0) {
          const sorted = [...ordersData].sort((a, b) => 
            b.createdAt.localeCompare(a.createdAt)
          );
          lastOrderAt = sorted[0].createdAt;
        }

        return {
          user: customerToUser(c),
          totalOrders: ordersData.length,
          totalSpent,
          averageTicket: completed.length > 0 ? totalSpent / completed.length : 0,
          lastOrderAt,
        };
      })
    );
  },

  async getCustomer(id: string): Promise<CustomerDetail | null> {
    try {
      const customerId = Number.parseInt(id, 10);
      const [{ data: customer }, ordersResult] = await Promise.all([
        apiClient.get<BackendCustomer>(`/api/customers/${customerId}`),
        apiClient
          .get<BackendOrder[]>(`/api/orders/customer/${customerId}`)
          .catch(() => ({ data: [] as BackendOrder[] })),
      ]);
      const orders: Order[] = ordersResult.data.map((o) => ({
        id: String(o.id),
        customerId: String(o.customerId),
        items: o.items.map((it) => ({
          productId: String(it.productId),
          name: it.productName,
          imageUrl: '',
          price: num(it.unitPrice),
          quantity: it.quantity,
        })),
        shippingAddress: {} as never,
        subtotal: num(o.totalAmount),
        shipping: 0,
        total: num(o.totalAmount),
        status: statusToApp(o.status),
        paymentMethod: 'PIX',
        createdAt: o.createdAt,
        updatedAt: o.createdAt,
      }));
      const completed = orders.filter((o) =>
        (['PAID', 'SHIPPED', 'DELIVERED'] as OrderStatus[]).includes(o.status),
      );
      const totalSpent = completed.reduce((acc, o) => acc + o.total, 0);

      const sortedOrders = [...orders].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );

      return {
        user: customerToUser(customer),
        totalOrders: orders.length,
        totalSpent,
        averageTicket:
          completed.length > 0 ? totalSpent / completed.length : 0,
        lastOrderAt: sortedOrders.length > 0 ? sortedOrders[0].createdAt : null,
        orders: sortedOrders,
      };
    } catch {
      return null;
    }
  },

  async getReports(): Promise<ReportsData> {
    try {
      const { data } = await apiClient.get<BackendReport>('/api/admin/reports');
      return {
        topCustomers: [],
        revenueByDayOfWeek: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(
          (label) => ({ label, value: 0 }),
        ),
        monthlyComparison: {
          current: num(data.totalRevenue),
          previous: 0,
          deltaPercent: 0,
        },
        categoryRevenue: [],
      };
    } catch {
      return {
        topCustomers: [],
        revenueByDayOfWeek: [],
        monthlyComparison: { current: 0, previous: 0, deltaPercent: 0 },
        categoryRevenue: [],
      };
    }
  },
};
