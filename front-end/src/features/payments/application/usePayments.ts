import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/queryKeys";
import type { BoletoPaymentInput, CardPaymentInput, Payment, PixPaymentInput } from "../domain/payment";
import { PaymentHttpRepository } from "../infrastructure/paymentHttpRepository";

function isPending(payment: Payment | null | undefined): boolean {
  return payment?.status === "PENDING";
}

function invalidatePaymentQueries(queryClient: ReturnType<typeof useQueryClient>, orderId?: string, paymentId?: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.account.all });
  if (orderId) queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
  if (paymentId) queryClient.invalidateQueries({ queryKey: queryKeys.payments.detail(paymentId) });
}

export function usePaymentConfig() {
  return useQuery({
    queryKey: queryKeys.payments.detail("config"),
    queryFn: () => PaymentHttpRepository.getConfig(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePaymentByOrder(orderId?: string) {
  return useQuery({
    queryKey: [...queryKeys.payments.all, "order", orderId ?? "missing"] as const,
    queryFn: () => (orderId ? PaymentHttpRepository.getByOrderId(orderId) : Promise.resolve(null)),
    enabled: !!orderId,
    refetchInterval: (query) => (isPending(query.state.data) ? 8_000 : false),
  });
}

export function useTransparentPaymentByOrder(orderId?: string) {
  return useQuery({
    queryKey: [...queryKeys.payments.all, "transparent", orderId ?? "missing"] as const,
    queryFn: () => (orderId ? PaymentHttpRepository.getTransparentByOrderId(orderId) : Promise.resolve(null)),
    enabled: !!orderId,
    refetchInterval: (query) => (isPending(query.state.data) ? 8_000 : false),
  });
}

export function useCreateAbacatePayCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => PaymentHttpRepository.createCheckout(orderId),
    onSuccess: (payment) => {
      invalidatePaymentQueries(queryClient, payment.orderId, payment.id);
    },
  });
}

export function usePayWithPix() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: PixPaymentInput }) =>
      PaymentHttpRepository.payWithPix(orderId, input),
    onSuccess: (payment) => {
      invalidatePaymentQueries(queryClient, payment.orderId, payment.id);
    },
  });
}

export function usePayWithCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: CardPaymentInput }) =>
      PaymentHttpRepository.payWithCard(orderId, input),
    onSuccess: (payment) => {
      invalidatePaymentQueries(queryClient, payment.orderId, payment.id);
    },
  });
}

export function usePayWithBoleto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: BoletoPaymentInput }) =>
      PaymentHttpRepository.payWithBoleto(orderId, input),
    onSuccess: (payment) => {
      invalidatePaymentQueries(queryClient, payment.orderId, payment.id);
    },
  });
}

export function useRefreshPaymentFromAbacatePay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => PaymentHttpRepository.refreshFromAbacatePay(orderId),
    onSuccess: (payment, orderId) => {
      invalidatePaymentQueries(queryClient, payment?.orderId ?? orderId, payment?.id);
    },
  });
}

export function useSimulatePaymentApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => PaymentHttpRepository.simulateApproval(paymentId),
    onSuccess: (payment) => {
      invalidatePaymentQueries(queryClient, payment.orderId, payment.id);
    },
  });
}

export function useSimulateAbacatePayPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => PaymentHttpRepository.simulateAbacatePayPayment(orderId),
    onSuccess: (payment, orderId) => {
      invalidatePaymentQueries(queryClient, payment.orderId ?? orderId, payment.id);
    },
  });
}
