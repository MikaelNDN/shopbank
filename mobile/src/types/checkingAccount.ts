export type AccountType = 'CUSTOMER' | 'STORE' | 'MARKETPLACE';

export type TransactionType =
  | 'CREDIT'
  | 'DEBIT'
  | 'REFUND'
  | 'DEPOSIT'
  | 'WITHDRAWAL';

export interface CheckingAccount {
  id: string;
  bankId: string;
  customerId?: string;
  storeId?: string;
  agency: string;
  number: string;
  digit: string;
  balance: number;
  type: AccountType;
  active: boolean;
}

export interface AccountTransaction {
  id: string;
  checkingAccountId: string;
  orderId?: string;
  paymentId?: string;
  type: TransactionType;
  amount: number;
  description?: string;
  createdAt: string;
}

export interface AmountRequest {
  amount: number;
  description?: string;
}

export interface TransactionFilter {
  from?: string;
  to?: string;
  type?: TransactionType;
}
