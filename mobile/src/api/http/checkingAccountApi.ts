import { apiClient } from '@/api/apiClient';
import type {
  AccountTransaction,
  AmountRequest,
  CheckingAccount,
  TransactionFilter,
} from '@/types/checkingAccount';

interface BackendCheckingAccount {
  id: number;
  bankId: number;
  customerId?: number | null;
  storeId?: number | null;
  agency: string;
  number: string;
  digit: string;
  balance: number | string;
  type: 'CUSTOMER' | 'STORE' | 'MARKETPLACE';
  active: boolean;
}

interface BackendTransaction {
  id: number;
  checkingAccountId: number;
  orderId?: number | null;
  paymentId?: number | null;
  type: 'CREDIT' | 'DEBIT' | 'REFUND' | 'DEPOSIT' | 'WITHDRAWAL';
  amount: number | string;
  description?: string;
  createdAt: string;
}

function num(v: number | string): number {
  return typeof v === 'string' ? Number.parseFloat(v) : v;
}

function toAccount(b: BackendCheckingAccount): CheckingAccount {
  return {
    id: String(b.id),
    bankId: String(b.bankId),
    customerId: b.customerId == null ? undefined : String(b.customerId),
    storeId: b.storeId == null ? undefined : String(b.storeId),
    agency: b.agency,
    number: b.number,
    digit: b.digit,
    balance: num(b.balance),
    type: b.type,
    active: !!b.active,
  };
}

function toTransaction(b: BackendTransaction): AccountTransaction {
  return {
    id: String(b.id),
    checkingAccountId: String(b.checkingAccountId),
    orderId: b.orderId == null ? undefined : String(b.orderId),
    paymentId: b.paymentId == null ? undefined : String(b.paymentId),
    type: b.type,
    amount: num(b.amount),
    description: b.description,
    createdAt: b.createdAt,
  };
}

export const checkingAccountApiHttp = {
  async getByCustomer(customerId: string): Promise<CheckingAccount> {
    const id = Number.parseInt(customerId, 10);
    const { data } = await apiClient.get<BackendCheckingAccount>(
      `/api/checking-accounts/customer/${id}`,
    );
    return toAccount(data);
  },

  async getById(accountId: string): Promise<CheckingAccount> {
    const id = Number.parseInt(accountId, 10);
    const { data } = await apiClient.get<BackendCheckingAccount>(
      `/api/checking-accounts/${id}`,
    );
    return toAccount(data);
  },

  async listTransactions(
    accountId: string,
    filter: TransactionFilter = {},
  ): Promise<AccountTransaction[]> {
    const id = Number.parseInt(accountId, 10);
    const params: Record<string, string> = {};
    if (filter.from) params.from = filter.from;
    if (filter.to) params.to = filter.to;
    if (filter.type) params.type = filter.type;

    const { data } = await apiClient.get<BackendTransaction[]>(
      `/api/checking-accounts/${id}/transactions`,
      { params },
    );
    return data.map(toTransaction);
  },

  async deposit(
    accountId: string,
    payload: AmountRequest,
  ): Promise<CheckingAccount> {
    const id = Number.parseInt(accountId, 10);
    const { data } = await apiClient.post<BackendCheckingAccount>(
      `/api/checking-accounts/${id}/deposit`,
      payload,
    );
    return toAccount(data);
  },

  async withdraw(
    accountId: string,
    payload: AmountRequest,
  ): Promise<CheckingAccount> {
    const id = Number.parseInt(accountId, 10);
    const { data } = await apiClient.post<BackendCheckingAccount>(
      `/api/checking-accounts/${id}/withdraw`,
      payload,
    );
    return toAccount(data);
  },
};
