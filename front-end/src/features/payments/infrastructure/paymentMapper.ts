import { toId, toNumber } from "@/shared/lib/number";
import type { Payment, PaymentConfig, PaymentStatus } from "../domain/payment";
import type { BackendPayment, BackendPaymentConfig, BackendPaymentStatus, BackendTransparentPayment } from "./paymentDtos";

export function mapPaymentStatus(status: BackendPaymentStatus): PaymentStatus {
  switch (status) {
    case "APPROVED":
      return "APPROVED";
    case "REJECTED":
    case "CANCELED":
      return "REJECTED";
    case "REFUNDED":
      return "REFUNDED";
    case "CREATED":
    case "PENDING":
      return "PENDING";
  }
}

export function mapPaymentResponse(dto: BackendPayment): Payment {
  return {
    id: toId(dto.id),
    orderId: toId(dto.orderId),
    method: dto.method,
    status: mapPaymentStatus(dto.status),
    amount: toNumber(dto.amount),
    redirectUrl: dto.checkoutUrl ?? undefined,
    createdAt: dto.createdAt,
    approvedAt: dto.confirmedAt ?? undefined,
  };
}

export function mapTransparentPaymentResponse(dto: BackendTransparentPayment): Payment {
  return {
    ...mapPaymentResponse(dto),
    qrCode: dto.qrCode ?? undefined,
    qrCodeBase64: dto.qrCodeBase64 ?? undefined,
    boletoUrl: dto.boletoUrl ?? undefined,
    redirectUrl: dto.checkoutUrl ?? dto.boletoUrl ?? undefined,
    gatewayPaymentId: dto.gatewayPaymentId ?? undefined,
    statusDetail: dto.statusDetail ?? undefined,
  };
}

export function mapPaymentConfigResponse(dto: BackendPaymentConfig): PaymentConfig {
  return {
    publicKey: dto.publicKey ?? undefined,
    abacatePayEnabled: dto.abacatePayEnabled ?? true,
    transparentCheckoutEnabled: dto.transparentCheckoutEnabled ?? true,
    sandbox: dto.sandbox,
    maxInstallments: dto.maxInstallments,
  };
}
