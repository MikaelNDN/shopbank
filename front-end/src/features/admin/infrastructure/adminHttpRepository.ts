import { apiClient } from "@/shared/http/apiClient";
import type {
  AdminOrderRecord,
  AdminPaymentFilters,
  AdminPaymentRecord,
  AdminInventoryItem,
  AuditLog,
  AdminRepository,
  CustomerDetail,
  CustomerSummary,
  DashboardData,
  DashboardPeriod,
  ReportsData,
} from "../domain/admin";
import type { AdminOrderFilters } from "@/features/orders/domain/order";
import type { BackendOrder } from "@/features/orders/infrastructure/orderDtos";
import { mapOrderResponse } from "@/features/orders/infrastructure/orderMapper";
import type { Payment } from "@/features/payments/domain/payment";
import type { BackendPayment } from "@/features/payments/infrastructure/paymentDtos";
import { mapPaymentResponse } from "@/features/payments/infrastructure/paymentMapper";
import { PaymentHttpRepository } from "@/features/payments/infrastructure/paymentHttpRepository";
import { ApiError } from "@/shared/http/apiError";
import type {
  BackendAdminInventoryItem,
  BackendAuditLog,
  BackendCustomer,
  BackendDashboard,
  BackendReport,
} from "./adminDtos";
import {
  mapAdminInventoryResponse,
  mapAuditLogResponse,
  mapCustomerDetail,
  mapCustomerSummary,
  mapCustomerUser,
  mapDashboardResponse,
  mapReportResponse,
} from "./adminMapper";

async function fetchAdminCustomers(): Promise<BackendCustomer[]> {
  const { data } = await apiClient.get<BackendCustomer[]>("/api/admin/customers");
  return data;
}

async function fetchOrdersByCustomer(
  customers: BackendCustomer[],
): Promise<Array<{ customer: BackendCustomer; order: BackendOrder }>> {
  const results = await Promise.all(
    customers.map(async (customer) => {
      const { data } = await apiClient.get<BackendOrder[]>(`/api/orders/customer/${customer.id}`);
      return data.map((order) => ({ customer, order }));
    }),
  );

  return results.flat();
}

function mapAdminOrderRecord(customer: BackendCustomer, backendOrder: BackendOrder): AdminOrderRecord {
  return {
    order: mapOrderResponse(backendOrder),
    customer: mapCustomerUser(customer),
  };
}

async function fetchAdminOrderRecords(): Promise<AdminOrderRecord[]> {
  const customers = await fetchAdminCustomers();
  const orders = await fetchOrdersByCustomer(customers);
  return orders.map(({ customer, order }) => mapAdminOrderRecord(customer, order));
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function applyOrderFilters(records: AdminOrderRecord[], filters: AdminOrderFilters = {}): AdminOrderRecord[] {
  const term = filters.search?.trim().toLowerCase();
  return records
    .filter(({ order, customer }) => {
      if (filters.status && order.status !== filters.status) return false;
      if (filters.customerId && order.customerId !== filters.customerId) return false;
      if (filters.dateFrom && order.createdAt < new Date(filters.dateFrom).toISOString()) return false;
      if (filters.dateTo && order.createdAt > new Date(`${filters.dateTo}T23:59:59`).toISOString()) return false;
      if (!term) return true;
      return (
        order.id.toLowerCase().includes(term) ||
        customer.name.toLowerCase().includes(term) ||
        (customer.cpf ?? "").includes(term) ||
        order.items.some((item) => item.name.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => b.order.createdAt.localeCompare(a.order.createdAt));
}

function applyPaymentFilters(
  records: AdminPaymentRecord[],
  filters: AdminPaymentFilters = {},
): AdminPaymentRecord[] {
  const term = filters.search?.trim().toLowerCase();
  return records
    .filter(({ payment, order, customer }) => {
      if (filters.status && payment.status !== filters.status) return false;
      if (!term) return true;
      return (
        payment.id.toLowerCase().includes(term) ||
        payment.orderId.toLowerCase().includes(term) ||
        order.id.toLowerCase().includes(term) ||
        customer.name.toLowerCase().includes(term) ||
        (customer.cpf ?? "").includes(term) ||
        (payment.gatewayPaymentId ?? "").toLowerCase().includes(term)
      );
    })
    .sort((a, b) => b.payment.createdAt.localeCompare(a.payment.createdAt));
}

export const AdminHttpRepository: AdminRepository = {
  async getDashboard(period: DashboardPeriod = "30d"): Promise<DashboardData> {
    const { data } = await apiClient.get<BackendDashboard>("/api/admin/dashboard", { params: { period } });
    return mapDashboardResponse(data, period);
  },

  async getReports(): Promise<ReportsData> {
    const { data } = await apiClient.get<BackendReport>("/api/admin/reports");
    return mapReportResponse(data);
  },

  async listCustomers(search?: string): Promise<CustomerSummary[]> {
    const customers = await fetchAdminCustomers();
    const allOrders = await fetchOrdersByCustomer(customers);

    const ordersByCustomer = new Map<string, BackendOrder[]>();
    for (const { order } of allOrders) {
      const customerId = String(order.customerId);
      if (!ordersByCustomer.has(customerId)) ordersByCustomer.set(customerId, []);
      ordersByCustomer.get(customerId)!.push(order);
    }

    const term = search?.trim().toLowerCase();
    const filteredCustomers = customers.filter((customer) => {
      if (!customer.active) return false;
      if (!term) return true;
      return customer.fullName.toLowerCase().includes(term) || customer.cpf.includes(term);
    });

    return filteredCustomers.map((customer) => {
      const orders = ordersByCustomer.get(String(customer.id)) || [];
      return mapCustomerSummary(customer, orders.map(mapOrderResponse));
    });
  },

  async getCustomer(id: string): Promise<CustomerDetail | null> {
    try {
      const [{ data: customer }, { data: orders }] = await Promise.all([
        apiClient.get<BackendCustomer>(`/api/customers/${id}`),
        apiClient.get<BackendOrder[]>(`/api/orders/customer/${id}`).catch(() => ({ data: [] })),
      ]);
      return mapCustomerDetail(customer, orders);
    } catch {
      return null;
    }
  },

  async getInventory(): Promise<AdminInventoryItem[]> {
    const { data } = await apiClient.get<BackendAdminInventoryItem[]>("/api/admin/inventory");
    return data.map(mapAdminInventoryResponse);
  },

  async listOrders(filters: AdminOrderFilters = {}): Promise<AdminOrderRecord[]> {
    const records = await fetchAdminOrderRecords();
    return applyOrderFilters(records, filters);
  },

  async listPayments(filters: AdminPaymentFilters = {}): Promise<AdminPaymentRecord[]> {
    const orders = await fetchAdminOrderRecords();
    const records = await Promise.all(
      orders.map(async (orderRecord) => {
        try {
          const { data } = await apiClient.get<BackendPayment>(`/api/payments/order/${orderRecord.order.id}`);
          const payment = mapPaymentResponse(data);
          return { payment, order: orderRecord.order, customer: orderRecord.customer };
        } catch (error) {
          if (isNotFound(error)) return null;
          throw error;
        }
      }),
    );

    return applyPaymentFilters(records.filter((record): record is AdminPaymentRecord => record !== null), filters);
  },

  async getPayment(id: string): Promise<Payment | null> {
    return PaymentHttpRepository.getById(id);
  },

  async listAuditLogs(): Promise<AuditLog[]> {
    const { data } = await apiClient.get<BackendAuditLog[]>("/api/audit-logs");
    return data.map(mapAuditLogResponse).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
