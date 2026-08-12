import { toId, toNumber } from "@/shared/lib/number";
import type { AccountTransaction, AmountInput, CheckingAccount } from "../domain/account";
import type { BackendAmountRequest, BackendCheckingAccount, BackendTransaction } from "./accountDtos";

export function mapCheckingAccountResponse(dto: BackendCheckingAccount): CheckingAccount {
  return {
    id: toId(dto.id),
    bankId: toId(dto.bankId),
    customerId: dto.customerId ? toId(dto.customerId) : undefined,
    storeId: dto.storeId ? toId(dto.storeId) : undefined,
    agency: dto.agency,
    number: dto.number,
    digit: dto.digit,
    balance: toNumber(dto.balance),
    type: dto.type,
    active: dto.active,
  };
}

export function mapAccountTransactionResponse(dto: BackendTransaction): AccountTransaction {
  return {
    id: toId(dto.id),
    checkingAccountId: toId(dto.checkingAccountId),
    orderId: dto.orderId ? toId(dto.orderId) : undefined,
    paymentId: dto.paymentId ? toId(dto.paymentId) : undefined,
    type: dto.type,
    amount: toNumber(dto.amount),
    description: dto.description ?? undefined,
    createdAt: dto.createdAt,
  };
}

export function mapAmountRequest(input: AmountInput): BackendAmountRequest {
  return {
    amount: input.amount,
    description: input.description,
  };
}

