import type { Numeric } from "@/shared/lib/number";
import type { AccountType, TransactionType } from "../domain/account";

export interface BackendCheckingAccount {
  id: number;
  bankId: number;
  customerId?: number | null;
  storeId?: number | null;
  agency: string;
  number: string;
  digit: string;
  balance: Numeric;
  type: AccountType;
  active: boolean;
}

export interface BackendTransaction {
  id: number;
  checkingAccountId: number;
  orderId?: number | null;
  paymentId?: number | null;
  type: TransactionType;
  amount: Numeric;
  description?: string | null;
  createdAt: string;
}

export interface BackendAmountRequest {
  amount: number;
  description?: string;
}

