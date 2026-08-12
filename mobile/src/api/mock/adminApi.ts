import { format, startOfMonth, subDays, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { MOCK_PRODUCTS } from '@/services/mockData';
import { StorageKeys, storageService } from '@/services/storageService';
import type { Order, OrderStatus } from '@/types/order';
import type { Category, Product } from '@/types/product';
import type { MockUser } from '@/services/mockData';
import type { User } from '@/types/user';

export type DashboardPeriod = '7d' | '30d' | 'month' | 'all';

export interface DashboardData {
  period: DashboardPeriod;
  totalRevenue: number;
  monthRevenue: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  canceledOrders: number;
  averageTicket: number;
  activeProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  totalUnitsSold: number;
  bestSellingProduct: { id: string; name: string; sold: number } | null;
  revenueByMonth: { month: string; value: number }[];
  topProducts: { name: string; sold: number }[];
  ordersByStatus: { status: OrderStatus; count: number }[];
  revenueByCategory: { category: string; value: number }[];
  lowStockList: { id: string; name: string; qty: number }[];
}

const LOW_STOCK_THRESHOLD = 5;
const COUNTABLE_STATUSES: OrderStatus[] = [
  'PAID',
  'SHIPPED',
  'DELIVERED',
];

function periodStart(period: DashboardPeriod): Date | null {
  const now = new Date();
  switch (period) {
    case '7d':
      return subDays(now, 7);
    case '30d':
      return subDays(now, 30);
    case 'month':
      return startOfMonth(now);
    case 'all':
      return null;
  }
}

async function readOrders(): Promise<Order[]> {
  return (await storageService.get<Order[]>(StorageKeys.ORDERS)) ?? [];
}

async function readProducts(): Promise<Product[]> {
  const stored = await storageService.get<Product[]>(StorageKeys.PRODUCTS);
  return stored ?? MOCK_PRODUCTS;
}

async function readCategories(): Promise<Category[]> {
  return (await storageService.get<Category[]>(StorageKeys.CATEGORIES)) ?? [];
}

async function readCustomers(): Promise<MockUser[]> {
  const users = (await storageService.get<MockUser[]>(StorageKeys.USERS)) ?? [];
  return users.filter((u) => u.role === 'CLIENT');
}

export interface CustomerSummary {
  user: User;
  totalOrders: number;
  totalSpent: number;
  averageTicket: number;
  lastOrderAt: string | null;
}

export interface CustomerDetail extends CustomerSummary {
  orders: Order[];
}

export interface ReportsData {
  topCustomers: { user: User; total: number; orderCount: number }[];
  revenueByDayOfWeek: { label: string; value: number }[];
  monthlyComparison: {
    current: number;
    previous: number;
    deltaPercent: number;
  };
  categoryRevenue: { category: string; value: number }[];
}

function stripPassword(user: MockUser): User {
  const { password: _password, ...rest } = user;
  return rest;
}

export const adminApi = {
  async getDashboard(period: DashboardPeriod = '30d'): Promise<DashboardData> {
    const [orders, products, categories, customers] = await Promise.all([
      readOrders(),
      readProducts(),
      readCategories(),
      readCustomers(),
    ]);

    const start = periodStart(period);
    const inPeriod = (o: Order) =>
      start ? new Date(o.createdAt) >= start : true;

    const filtered = orders.filter(inPeriod);
    const revenueOrders = filtered.filter((o) =>
      COUNTABLE_STATUSES.includes(o.status),
    );

    const totalRevenue = revenueOrders.reduce((acc, o) => acc + o.total, 0);

    const monthStart = startOfMonth(new Date());
    const monthOrders = orders.filter(
      (o) =>
        new Date(o.createdAt) >= monthStart &&
        COUNTABLE_STATUSES.includes(o.status),
    );
    const monthRevenue = monthOrders.reduce((acc, o) => acc + o.total, 0);

    const paidOrders = filtered.filter((o) => o.status === 'PAID').length;
    const pendingOrders = filtered.filter(
      (o) => o.status === 'PENDING_PAYMENT',
    ).length;
    const canceledOrders = filtered.filter((o) => o.status === 'CANCELED')
      .length;

    const averageTicket =
      revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

    const activeProducts = products.filter((p) => p.active).length;
    const lowStockListAll = products
      .filter(
        (p) => p.active && p.availableQuantity <= LOW_STOCK_THRESHOLD,
      )
      .sort((a, b) => a.availableQuantity - b.availableQuantity)
      .map((p) => ({ id: p.id, name: p.name, qty: p.availableQuantity }));

    const productSales = new Map<string, number>();
    for (const order of revenueOrders) {
      for (const item of order.items) {
        productSales.set(
          item.productId,
          (productSales.get(item.productId) ?? 0) + item.quantity,
        );
      }
    }

    const totalUnitsSold = Array.from(productSales.values()).reduce(
      (acc, n) => acc + n,
      0,
    );

    let bestSellingProduct: DashboardData['bestSellingProduct'] = null;
    let bestSold = 0;
    for (const [productId, qty] of productSales) {
      if (qty > bestSold) {
        bestSold = qty;
        const product = products.find((p) => p.id === productId);
        bestSellingProduct = {
          id: productId,
          name: product?.name ?? productId,
          sold: qty,
        };
      }
    }

    const topProducts = Array.from(productSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, sold]) => ({
        name: products.find((p) => p.id === id)?.name ?? id,
        sold,
      }));

    const monthsSeries: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const cursor = subMonths(new Date(), i);
      const cursorStart = startOfMonth(cursor);
      const cursorEnd = startOfMonth(subMonths(cursor, -1));
      const value = orders
        .filter(
          (o) =>
            COUNTABLE_STATUSES.includes(o.status) &&
            new Date(o.createdAt) >= cursorStart &&
            new Date(o.createdAt) < cursorEnd,
        )
        .reduce((acc, o) => acc + o.total, 0);
      monthsSeries.push({
        month: format(cursor, 'MMM', { locale: ptBR }),
        value,
      });
    }

    const ordersByStatus = (
      [
        'PENDING_PAYMENT',
        'PAID',
        'SHIPPED',
        'DELIVERED',
        'CANCELED',
      ] as OrderStatus[]
    ).map((status) => ({
      status,
      count: filtered.filter((o) => o.status === status).length,
    }));

    const revenueByCategory = categories.map((cat) => {
      const value = revenueOrders.reduce((acc, order) => {
        return (
          acc +
          order.items.reduce((sum, item) => {
            const product = products.find((p) => p.id === item.productId);
            if (product?.categoryId === cat.id) {
              return sum + item.price * item.quantity;
            }
            return sum;
          }, 0)
        );
      }, 0);
      return { category: cat.name, value };
    });

    return {
      period,
      totalRevenue,
      monthRevenue,
      totalOrders: filtered.length,
      paidOrders,
      pendingOrders,
      canceledOrders,
      averageTicket,
      activeProducts,
      lowStockCount: lowStockListAll.length,
      totalCustomers: customers.length,
      totalUnitsSold,
      bestSellingProduct,
      revenueByMonth: monthsSeries,
      topProducts,
      ordersByStatus,
      revenueByCategory,
      lowStockList: lowStockListAll.slice(0, 5),
    };
  },

  async listCustomers(search?: string): Promise<CustomerSummary[]> {
    const [customers, orders] = await Promise.all([
      readCustomers(),
      readOrders(),
    ]);
    const term = search?.trim().toLowerCase();
    const filtered = term
      ? customers.filter(
          (u) =>
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term),
        )
      : customers;
    return filtered
      .map((c) => {
        const userOrders = orders.filter(
          (o) =>
            o.customerId === c.id &&
            (['PAID', 'SHIPPED', 'DELIVERED'] as OrderStatus[]).includes(
              o.status,
            ),
        );
        const totalSpent = userOrders.reduce((acc, o) => acc + o.total, 0);
        const lastOrder = userOrders[0]?.createdAt ?? null;
        return {
          user: stripPassword(c),
          totalOrders: userOrders.length,
          totalSpent,
          averageTicket:
            userOrders.length > 0 ? totalSpent / userOrders.length : 0,
          lastOrderAt: lastOrder,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  },

  async getCustomer(id: string): Promise<CustomerDetail | null> {
    const [customers, orders] = await Promise.all([
      readCustomers(),
      readOrders(),
    ]);
    const customer = customers.find((c) => c.id === id);
    if (!customer) return null;
    const userOrders = orders
      .filter((o) => o.customerId === id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const completedOrders = userOrders.filter((o) =>
      (['PAID', 'SHIPPED', 'DELIVERED'] as OrderStatus[]).includes(o.status),
    );
    const totalSpent = completedOrders.reduce((acc, o) => acc + o.total, 0);
    return {
      user: stripPassword(customer),
      totalOrders: completedOrders.length,
      totalSpent,
      averageTicket:
        completedOrders.length > 0 ? totalSpent / completedOrders.length : 0,
      lastOrderAt: userOrders[0]?.createdAt ?? null,
      orders: userOrders,
    };
  },

  async getReports(): Promise<ReportsData> {
    const [orders, customers, products, categories] = await Promise.all([
      readOrders(),
      readCustomers(),
      readProducts(),
      readCategories(),
    ]);

    const completed = orders.filter((o) =>
      (['PAID', 'SHIPPED', 'DELIVERED'] as OrderStatus[]).includes(o.status),
    );

    const customerStats = new Map<
      string,
      { total: number; orderCount: number }
    >();
    for (const order of completed) {
      const curr = customerStats.get(order.customerId) ?? {
        total: 0,
        orderCount: 0,
      };
      curr.total += order.total;
      curr.orderCount += 1;
      customerStats.set(order.customerId, curr);
    }
    const topCustomers = Array.from(customerStats.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([userId, stats]) => {
        const user = customers.find((u) => u.id === userId);
        return {
          user: user
            ? stripPassword(user)
            : ({
                id: userId,
                name: 'Cliente removido',
                email: '',
                role: 'CLIENT' as const,
                createdAt: '',
              } as User),
          total: stats.total,
          orderCount: stats.orderCount,
        };
      });

    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const revenueByDay = days.map((label) => ({ label, value: 0 }));
    for (const order of completed) {
      const day = new Date(order.createdAt).getDay();
      revenueByDay[day].value += order.total;
    }

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const current = completed
      .filter((o) => new Date(o.createdAt) >= currentMonthStart)
      .reduce((acc, o) => acc + o.total, 0);
    const previous = completed
      .filter(
        (o) =>
          new Date(o.createdAt) >= previousMonthStart &&
          new Date(o.createdAt) < currentMonthStart,
      )
      .reduce((acc, o) => acc + o.total, 0);
    const deltaPercent =
      previous > 0
        ? ((current - previous) / previous) * 100
        : current > 0
          ? 100
          : 0;

    const categoryRevenue = categories.map((cat) => {
      const value = completed.reduce((acc, order) => {
        return (
          acc +
          order.items.reduce((sum, item) => {
            const product = products.find((p) => p.id === item.productId);
            return product?.categoryId === cat.id
              ? sum + item.price * item.quantity
              : sum;
          }, 0)
        );
      }, 0);
      return { category: cat.name, value };
    });

    return {
      topCustomers,
      revenueByDayOfWeek: revenueByDay,
      monthlyComparison: { current, previous, deltaPercent },
      categoryRevenue,
    };
  },
};
