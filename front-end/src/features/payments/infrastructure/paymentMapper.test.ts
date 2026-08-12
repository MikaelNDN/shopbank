import { describe, expect, it } from "@jest/globals";
import {
  mapPaymentConfigResponse,
  mapPaymentResponse,
  mapPaymentStatus,
  mapTransparentPaymentResponse,
} from "./paymentMapper";
import type { BackendPaymentStatus } from "./paymentDtos";
import type { PaymentStatus } from "../domain/payment";

describe("paymentMapper", () => {
  it("maps backend payment statuses to UI status buckets", () => {
    const expected: Record<BackendPaymentStatus, PaymentStatus> = {
      CREATED: "PENDING",
      PENDING: "PENDING",
      APPROVED: "APPROVED",
      REJECTED: "REJECTED",
      CANCELED: "REJECTED",
      REFUNDED: "REFUNDED",
    };

    for (const [backend, app] of Object.entries(expected)) {
      expect(mapPaymentStatus(backend as BackendPaymentStatus)).toBe(app);
    }
  });

  it("maps hosted and transparent payments", () => {
    expect(
      mapPaymentResponse({
        id: 1,
        orderId: 10,
        method: "ABACATEPAY",
        status: "CREATED",
        amount: "210.50",
        checkoutUrl: "https://checkout.test",
        createdAt: "2026-05-13T10:00:00",
      }),
    ).toMatchObject({
      id: "1",
      orderId: "10",
      status: "PENDING",
      amount: 210.5,
      redirectUrl: "https://checkout.test",
    });

    expect(
      mapTransparentPaymentResponse({
        id: 2,
        orderId: 10,
        method: "PIX",
        status: "APPROVED",
        amount: 210.5,
        qrCode: "000201",
        qrCodeBase64: "base64",
        gatewayPaymentId: "gw-1",
        statusDetail: "approved",
        boletoUrl: "https://boleto.test",
        createdAt: "2026-05-13T10:00:00",
        confirmedAt: "2026-05-13T10:10:00",
      }),
    ).toMatchObject({
      id: "2",
      method: "PIX",
      status: "APPROVED",
      qrCode: "000201",
      qrCodeBase64: "base64",
      redirectUrl: "https://boleto.test",
      gatewayPaymentId: "gw-1",
      approvedAt: "2026-05-13T10:10:00",
    });
  });

  it("maps missing optional payment fields to undefined", () => {
    expect(
      mapPaymentResponse({
        id: 3,
        orderId: 10,
        method: "BOLETO",
        status: "REFUNDED",
        amount: 10,
        checkoutUrl: null,
        createdAt: "2026-05-13T10:00:00",
        confirmedAt: null,
      }),
    ).toMatchObject({
      id: "3",
      status: "REFUNDED",
      redirectUrl: undefined,
      approvedAt: undefined,
    });

    expect(
      mapTransparentPaymentResponse({
        id: 4,
        orderId: 10,
        method: "PIX",
        status: "PENDING",
        amount: 10,
        checkoutUrl: "https://checkout.test",
        boletoUrl: "https://boleto.test",
        createdAt: "2026-05-13T10:00:00",
      }),
    ).toMatchObject({
      redirectUrl: "https://checkout.test",
      boletoUrl: "https://boleto.test",
      qrCode: undefined,
      statusDetail: undefined,
    });
  });

  it("maps payment configuration", () => {
    expect(mapPaymentConfigResponse({ publicKey: "pk_test", sandbox: true, maxInstallments: 12 })).toEqual({
      publicKey: "pk_test",
      abacatePayEnabled: true,
      transparentCheckoutEnabled: true,
      sandbox: true,
      maxInstallments: 12,
    });
  });
});
