export type AccountType = "CUSTOMER" | "STORE" | "MARKETPLACE";

export type TransactionType = "CREDIT" | "DEBIT" | "REFUND" | "DEPOSIT" | "WITHDRAWAL";

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

export interface AmountInput {
  amount: number;
  description?: string;
}

export interface CheckingAccountRepository {
  getByCustomer(customerId: string): Promise<CheckingAccount>;
  getById(accountId: string): Promise<CheckingAccount>;
  listTransactions(accountId: string): Promise<AccountTransaction[]>;
  deposit(accountId: string, input: AmountInput): Promise<CheckingAccount>;
  withdraw(accountId: string, input: AmountInput): Promise<CheckingAccount>;
}
