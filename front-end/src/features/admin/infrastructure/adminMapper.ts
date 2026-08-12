import type { User } from "@/features/auth/domain/auth";
import type { BackendOrder } from "@/features/orders/infrastructure/orderDtos";
import { mapOrderResponse, mapOrderStatus } from "@/features/orders/infrastructure/orderMapper";
import type { Order, OrderStatus } from "@/features/orders/domain/order";
import { toId, toNumber } from "@/shared/lib/number";
import type {
  AdminInventoryItem,
  AuditLog,
  CustomerDetail,
  CustomerSummary,
  DashboardData,
  DashboardPeriod,
  ReportsData,
} from "../domain/admin";
import type { BackendAdminInventoryItem, BackendAuditLog, BackendCustomer, BackendDashboard, BackendReport } from "./adminDtos";

function emptyStatusBuckets(): Record<OrderStatus, number> {
  return {
    PENDING_PAYMENT: 0,
    PAID: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELED: 0,
  };
}

export function mapStatusBuckets(raw: Record<string, number>): Record<OrderStatus, number> {
  const buckets = emptyStatusBuckets();
  for (const [status, count] of Object.entries(raw)) {
    buckets[mapOrderStatus(status as Parameters<typeof mapOrderStatus>[0])] += count;
  }
  return buckets;
}

export function mapCustomerUser(dto: BackendCustomer): User {
  return {
    id: toId(dto.id),
    customerId: toId(dto.id),
    name: dto.fullName,
    email: "",
    cpf: dto.cpf,
    role: "CLIENT",
    active: dto.active,
  };
}

export function mapDashboardResponse(dto: BackendDashboard, period: DashboardPeriod = "30d"): DashboardData {
  const ordersByStatus = mapStatusBuckets(dto.ordersByStatus ?? {});
  return {
    period,
    totalRevenue: toNumber(dto.totalRevenue),
    monthRevenue: toNumber(dto.monthRevenue),
    totalOrders: dto.totalOrders,
    paidOrders: dto.approvedPayments,
    pendingOrders: dto.pendingPayments,
    canceledOrders: dto.canceledOrders,
    averageTicket: toNumber(dto.averageTicket),
    activeProducts: dto.totalProducts,
    lowStockCount: dto.lowStockItems,
    totalCustomers: dto.totalCustomers,
    totalUnitsSold: dto.totalUnitsSold,
    bestSellingProduct: dto.bestSellingProduct
      ? { id: toId(dto.bestSellingProduct.id), name: dto.bestSellingProduct.name, sold: dto.bestSellingProduct.sold }
      : null,
    revenueByMonth: (dto.revenueByMonth ?? []).map((item) => ({ month: item.month, value: toNumber(item.value) })),
    topProducts: (dto.topProducts ?? []).map((item) => ({
      id: toId(item.productId),
      name: item.name,
      sold: item.sold,
    })),
    ordersByStatus: Object.entries(ordersByStatus).map(([status, count]) => ({
      status: status as OrderStatus,
      count,
    })),
    revenueByCategory: (dto.revenueByCategory ?? []).map((item) => ({
      categoryId: toId(item.categoryId),
      category: item.category,
      value: toNumber(item.value),
    })),
    lowStockList: (dto.lowStockList ?? []).map((item) => ({
      id: toId(item.productId),
      name: item.name,
      qty: item.quantity,
    })),
  };
}

export function mapReportResponse(dto: BackendReport): ReportsData {
  return {
    ordersByStatus: mapStatusBuckets(dto.ordersByStatus ?? {}),
    paymentsByStatus: dto.paymentsByStatus ?? {},
    totalRevenue: toNumber(dto.totalRevenue),
  };
}

export function mapCustomerSummary(customer: BackendCustomer, orders: Order[] = []): CustomerSummary {
  const completed = orders.filter((order) => ["PAID", "SHIPPED", "DELIVERED"].includes(order.status));
  const totalSpent = completed.reduce((sum, order) => sum + order.total, 0);

  return {
    user: mapCustomerUser(customer),
    totalOrders: orders.length,
    totalSpent,
    averageTicket: completed.length > 0 ? totalSpent / completed.length : 0,
    lastOrderAt: orders.length > 0 ? [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0].createdAt : null,
  };
}

export function mapCustomerDetail(customer: BackendCustomer, rawOrders: BackendOrder[] = []): CustomerDetail {
  const orders = rawOrders.map(mapOrderResponse).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    ...mapCustomerSummary(customer, orders),
    orders,
  };
}

export function mapAdminInventoryResponse(dto: BackendAdminInventoryItem): AdminInventoryItem {
  return {
    inventoryId: dto.inventoryId === undefined ? undefined : toId(dto.inventoryId),
    productId: toId(dto.productId),
    name: dto.productName ?? dto.name ?? "",
    quantity: dto.availableQuantity ?? dto.quantity ?? 0,
    reservedQuantity: dto.reservedQuantity ?? 0,
    active: dto.productActive ?? true,
  };
}

export function mapAuditLogResponse(dto: BackendAuditLog): AuditLog {
  return {
    id: toId(dto.id),
    entityName: dto.entityName,
    entityId: dto.entityId == null ? undefined : toId(dto.entityId),
    action: dto.action,
    oldValue: dto.oldValue ?? undefined,
    newValue: dto.newValue ?? undefined,
    userId: dto.userId == null ? undefined : toId(dto.userId),
    description: dto.description ?? undefined,
    createdAt: dto.createdAt,
  };
}
