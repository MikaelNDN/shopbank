import type { Numeric } from "@/shared/lib/number";
import type { PaymentMethod } from "../domain/payment";

export type BackendPaymentStatus = "CREATED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELED" | "REFUNDED";

export interface BackendPayment {
  id: number;
  orderId: number;
  method: PaymentMethod;
  status: BackendPaymentStatus;
  amount: Numeric;
  checkoutUrl?: string | null;
  createdAt: string;
  confirmedAt?: string | null;
}

export interface BackendTransparentPayment extends BackendPayment {
  statusDetail?: string | null;
  gatewayPaymentId?: string | null;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  boletoUrl?: string | null;
}

export interface BackendPaymentConfig {
  publicKey?: string | null;
  abacatePayEnabled?: boolean;
  transparentCheckoutEnabled?: boolean;
  sandbox?: boolean;
  maxInstallments?: number;
}
