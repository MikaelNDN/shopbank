import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/queryKeys";
import type { AmountInput } from "../domain/account";
import { CheckingAccountHttpRepository } from "../infrastructure/checkingAccountHttpRepository";

function requireAccountId(accountId?: string): string {
  if (!accountId) throw new Error("Conta corrente não encontrada.");
  return accountId;
}

export function useCheckingAccount(customerId?: string) {
  return useQuery({
    queryKey: queryKeys.account.detail(customerId ?? "missing"),
    queryFn: () => CheckingAccountHttpRepository.getByCustomer(customerId!),
    enabled: !!customerId,
  });
}

export function useAccountTransactions(accountId?: string) {
  return useQuery({
    queryKey: [...queryKeys.account.all, "transactions", accountId ?? "missing"] as const,
    queryFn: () => CheckingAccountHttpRepository.listTransactions(requireAccountId(accountId)),
    enabled: !!accountId,
  });
}

export function useDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, input }: { accountId: string; input: AmountInput }) =>
      CheckingAccountHttpRepository.deposit(accountId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.account.all });
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, input }: { accountId: string; input: AmountInput }) =>
      CheckingAccountHttpRepository.withdraw(accountId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.account.all });
    },
  });
}
