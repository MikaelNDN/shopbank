import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/queryKeys";
import type { CreateOrderInput, Order, OrderStatus } from "../domain/order";
import { OrderHttpRepository } from "../infrastructure/orderHttpRepository";

function hasPendingOrders(orders: Order[] | undefined): boolean {
  return (orders ?? []).some((order) => order.status === "PENDING_PAYMENT");
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => OrderHttpRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: queryKeys.orders.list({ scope: "my-orders" }),
    queryFn: () => OrderHttpRepository.getMyOrders(),
    refetchInterval: (query) => (hasPendingOrders(query.state.data) ? 10_000 : false),
  });
}

export function useOrder(orderId?: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId ?? "missing"),
    queryFn: () => (orderId ? OrderHttpRepository.getById(orderId) : Promise.resolve(null)),
    enabled: !!orderId,
    refetchInterval: (query) => (query.state.data?.status === "PENDING_PAYMENT" ? 10_000 : false),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => OrderHttpRepository.cancel(orderId),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      if (order) queryClient.setQueryData(queryKeys.orders.detail(order.id), order);
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      OrderHttpRepository.updateStatus(orderId, status),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order);
    },
  });
}
