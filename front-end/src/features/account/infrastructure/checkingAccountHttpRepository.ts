import { apiClient } from "@/shared/http/apiClient";
import type { AccountTransaction, AmountInput, CheckingAccount, CheckingAccountRepository } from "../domain/account";
import type { BackendCheckingAccount, BackendTransaction } from "./accountDtos";
import { mapAccountTransactionResponse, mapAmountRequest, mapCheckingAccountResponse } from "./accountMapper";

export const CheckingAccountHttpRepository: CheckingAccountRepository = {
  async getByCustomer(customerId: string): Promise<CheckingAccount> {
    const { data } = await apiClient.get<BackendCheckingAccount>(`/api/checking-accounts/customer/${customerId}`);
    return mapCheckingAccountResponse(data);
  },

  async getById(accountId: string): Promise<CheckingAccount> {
    const { data } = await apiClient.get<BackendCheckingAccount>(`/api/checking-accounts/${accountId}`);
    return mapCheckingAccountResponse(data);
  },

  async listTransactions(accountId: string): Promise<AccountTransaction[]> {
    const { data } = await apiClient.get<BackendTransaction[]>(`/api/checking-accounts/${accountId}/transactions`);
    return data.map(mapAccountTransactionResponse).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async deposit(accountId: string, input: AmountInput): Promise<CheckingAccount> {
    const { data } = await apiClient.post<BackendCheckingAccount>(
      `/api/checking-accounts/${accountId}/deposit`,
      mapAmountRequest(input),
    );
    return mapCheckingAccountResponse(data);
  },

  async withdraw(accountId: string, input: AmountInput): Promise<CheckingAccount> {
    const { data } = await apiClient.post<BackendCheckingAccount>(
      `/api/checking-accounts/${accountId}/withdraw`,
      mapAmountRequest(input),
    );
    return mapCheckingAccountResponse(data);
  },
};

