import { describe, expect, it } from "@jest/globals";
import { mapAccountTransactionResponse, mapAmountRequest, mapCheckingAccountResponse } from "./accountMapper";

describe("accountMapper", () => {
  it("maps checking accounts and transactions", () => {
    expect(
      mapCheckingAccountResponse({
        id: 1,
        bankId: 2,
        customerId: 7,
        agency: "0001",
        number: "12345",
        digit: "6",
        balance: "150.75",
        type: "CUSTOMER",
        active: true,
      }),
    ).toEqual({
      id: "1",
      bankId: "2",
      customerId: "7",
      storeId: undefined,
      agency: "0001",
      number: "12345",
      digit: "6",
      balance: 150.75,
      type: "CUSTOMER",
      active: true,
    });

    expect(
      mapAccountTransactionResponse({
        id: 3,
        checkingAccountId: 1,
        orderId: 10,
        paymentId: null,
        type: "DEBIT",
        amount: "210.50",
        description: null,
        createdAt: "2026-05-13T10:00:00",
      }),
    ).toEqual({
      id: "3",
      checkingAccountId: "1",
      orderId: "10",
      paymentId: undefined,
      type: "DEBIT",
      amount: 210.5,
      description: undefined,
      createdAt: "2026-05-13T10:00:00",
    });
  });

  it("maps amount write payloads", () => {
    expect(mapAmountRequest({ amount: 100, description: "Deposito" })).toEqual({
      amount: 100,
      description: "Deposito",
    });
  });

  it("maps optional account ownership fields", () => {
    expect(
      mapCheckingAccountResponse({
        id: 1,
        bankId: 2,
        storeId: 9,
        agency: "0001",
        number: "12345",
        digit: "6",
        balance: 0,
        type: "STORE",
        active: false,
      }),
    ).toMatchObject({
      customerId: undefined,
      storeId: "9",
      type: "STORE",
      active: false,
    });
  });
});
