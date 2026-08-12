import type { AdminOrderFilters, Order, OrderStatus } from "@/features/orders/domain/order";
import type { Payment, PaymentStatus } from "@/features/payments/domain/payment";
import type { User } from "@/features/auth/domain/auth";

export type DashboardPeriod = "7d" | "30d" | "90d" | "all";

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
  revenueByMonth: Array<{ month: string; value: number }>;
  topProducts: Array<{ id?: string; name: string; sold: number }>;
  ordersByStatus: Array<{ status: OrderStatus; count: number }>;
  revenueByCategory: Array<{ categoryId: string; category: string; value: number }>;
  lowStockList: Array<{ id: string; name: string; qty: number }>;
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
  ordersByStatus: Record<OrderStatus, number>;
  paymentsByStatus: Record<string, number>;
  totalRevenue: number;
}

export interface AdminInventoryItem {
  inventoryId?: string;
  productId: string;
  name: string;
  quantity: number;
  reservedQuantity?: number;
  active?: boolean;
}

export interface AdminOrderRecord {
  order: Order;
  customer: User;
}

export interface AdminPaymentRecord {
  payment: Payment;
  order: Order;
  customer: User;
}

export interface AdminPaymentFilters {
  status?: PaymentStatus;
  search?: string;
}

export interface AuditLog {
  id: string;
  entityName: string;
  entityId?: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  userId?: string;
  description?: string;
  createdAt: string;
}

export interface AdminRepository {
  getDashboard(period?: DashboardPeriod): Promise<DashboardData>;
  getReports(): Promise<ReportsData>;
  listCustomers(search?: string): Promise<CustomerSummary[]>;
  getCustomer(id: string): Promise<CustomerDetail | null>;
  getInventory(): Promise<AdminInventoryItem[]>;
  listOrders(filters?: AdminOrderFilters): Promise<AdminOrderRecord[]>;
  listPayments(filters?: AdminPaymentFilters): Promise<AdminPaymentRecord[]>;
  getPayment(id: string): Promise<Payment | null>;
  listAuditLogs(): Promise<AuditLog[]>;
}
