import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/queryKeys";
import type { AdminOrderFilters, OrderStatus } from "@/features/orders/domain/order";
import type { PaymentStatus } from "@/features/payments/domain/payment";
import { OrderHttpRepository } from "@/features/orders/infrastructure/orderHttpRepository";
import { AdminHttpRepository } from "../infrastructure/adminHttpRepository";

function invalidateAdminOperations(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.account.all });
}

export function useAdminCustomers(search?: string) {
  return useQuery({
    queryKey: queryKeys.admin.list({ scope: "customers", search }),
    queryFn: () => AdminHttpRepository.listCustomers(search),
  });
}

export function useAdminCustomer(customerId?: string) {
  return useQuery({
    queryKey: queryKeys.admin.detail(`customer-${customerId ?? "missing"}`),
    queryFn: () => (customerId ? AdminHttpRepository.getCustomer(customerId) : Promise.resolve(null)),
    enabled: !!customerId,
  });
}

export function useAdminOrders(filters: AdminOrderFilters = {}) {
  return useQuery({
    queryKey: queryKeys.admin.list({
      scope: "orders",
      status: filters.status,
      search: filters.search,
      customerId: filters.customerId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    }),
    queryFn: () => AdminHttpRepository.listOrders(filters),
  });
}

export function useUpdateAdminOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      OrderHttpRepository.updateStatus(orderId, status),
    onSuccess: () => invalidateAdminOperations(queryClient),
  });
}

export function useCancelAdminOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => OrderHttpRepository.cancel(orderId),
    onSuccess: () => invalidateAdminOperations(queryClient),
  });
}

export function useAdminPayments(filters: { status?: PaymentStatus; search?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.list({
      scope: "payments",
      status: filters.status,
      search: filters.search,
    }),
    queryFn: () => AdminHttpRepository.listPayments(filters),
  });
}

export function useAdminReports() {
  return useQuery({
    queryKey: queryKeys.admin.detail("reports"),
    queryFn: () => AdminHttpRepository.getReports(),
  });
}

export function useAdminAuditLogs() {
  return useQuery({
    queryKey: queryKeys.admin.list({ scope: "audit-logs" }),
    queryFn: () => AdminHttpRepository.listAuditLogs(),
    refetchInterval: 15_000,
  });
}
