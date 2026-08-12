import { StorageKeys, storageService } from '@/services/storageService';
import type {
  AccountTransaction,
  AmountRequest,
  CheckingAccount,
  TransactionFilter,
} from '@/types/checkingAccount';

const ACCOUNTS_KEY = '@shopbank/mock/checkingAccounts' as never;
const TRANSACTIONS_KEY = '@shopbank/mock/accountTransactions' as never;

async function readAccounts(): Promise<CheckingAccount[]> {
  return (await storageService.get<CheckingAccount[]>(ACCOUNTS_KEY)) ?? [];
}

async function writeAccounts(list: CheckingAccount[]) {
  await storageService.set(ACCOUNTS_KEY, list);
}

async function readTransactions(): Promise<AccountTransaction[]> {
  return (await storageService.get<AccountTransaction[]>(TRANSACTIONS_KEY)) ?? [];
}

async function writeTransactions(list: AccountTransaction[]) {
  await storageService.set(TRANSACTIONS_KEY, list);
}

function genId(): string {
  return Math.floor(Math.random() * 1_000_000).toString();
}

async function ensureCustomerAccount(customerId: string): Promise<CheckingAccount> {
  const accounts = await readAccounts();
  const existing = accounts.find(
    (a) => a.type === 'CUSTOMER' && a.customerId === customerId && a.active,
  );
  if (existing) return existing;

  const fresh: CheckingAccount = {
    id: genId(),
    bankId: '1',
    customerId,
    agency: '0001',
    number: genId().padStart(6, '0'),
    digit: '0',
    balance: 0,
    type: 'CUSTOMER',
    active: true,
  };

  accounts.push(fresh);
  await writeAccounts(accounts);
  return fresh;
}

async function recordTransaction(
  accountId: string,
  type: AccountTransaction['type'],
  amount: number,
  description?: string,
): Promise<AccountTransaction> {
  const transactions = await readTransactions();
  const tx: AccountTransaction = {
    id: genId(),
    checkingAccountId: accountId,
    type,
    amount,
    description,
    createdAt: new Date().toISOString(),
  };
  transactions.push(tx);
  await writeTransactions(transactions);
  return tx;
}

async function updateAccount(account: CheckingAccount) {
  const accounts = await readAccounts();
  const next = accounts.map((a) => (a.id === account.id ? account : a));
  await writeAccounts(next);
}

export const checkingAccountApiMock = {
  async getByCustomer(customerId: string): Promise<CheckingAccount> {
    return ensureCustomerAccount(customerId);
  },

  async getById(accountId: string): Promise<CheckingAccount> {
    const accounts = await readAccounts();
    const account = accounts.find((a) => a.id === accountId);
    if (!account) throw new Error('Conta não encontrada');
    return account;
  },

  async listTransactions(
    accountId: string,
    filter: TransactionFilter = {},
  ): Promise<AccountTransaction[]> {
    let txns = (await readTransactions()).filter(
      (t) => t.checkingAccountId === accountId,
    );

    if (filter.from) txns = txns.filter((t) => t.createdAt >= filter.from!);
    if (filter.to) txns = txns.filter((t) => t.createdAt <= `${filter.to}T23:59:59.999Z`);
    if (filter.type) txns = txns.filter((t) => t.type === filter.type);

    return txns.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async deposit(
    accountId: string,
    payload: AmountRequest,
  ): Promise<CheckingAccount> {
    if (payload.amount <= 0) throw new Error('Valor deve ser maior que zero');
    const account = await this.getById(accountId);
    if (account.type !== 'CUSTOMER') throw new Error('Depósito apenas em conta cliente');

    account.balance = account.balance + payload.amount;
    await updateAccount(account);
    await recordTransaction(accountId, 'DEPOSIT', payload.amount, payload.description ?? 'Depósito');
    return account;
  },

  async withdraw(
    accountId: string,
    payload: AmountRequest,
  ): Promise<CheckingAccount> {
    if (payload.amount <= 0) throw new Error('Valor deve ser maior que zero');
    const account = await this.getById(accountId);
    if (account.type !== 'CUSTOMER') throw new Error('Saque apenas em conta cliente');
    if (account.balance < payload.amount) throw new Error('Saldo insuficiente');

    account.balance = account.balance - payload.amount;
    await updateAccount(account);
    await recordTransaction(accountId, 'WITHDRAWAL', payload.amount, payload.description ?? 'Saque');
    return account;
  },
};
