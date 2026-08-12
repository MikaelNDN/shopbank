export type PaymentMethod = "ABACATEPAY" | "PIX" | "CREDIT_CARD" | "BOLETO";

export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  qrCode?: string;
  qrCodeBase64?: string;
  redirectUrl?: string;
  boletoUrl?: string;
  gatewayPaymentId?: string;
  statusDetail?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface PaymentConfig {
  publicKey?: string;
  abacatePayEnabled?: boolean;
  transparentCheckoutEnabled?: boolean;
  sandbox?: boolean;
  maxInstallments?: number;
}

export interface CardPaymentInput {
  token?: string;
  paymentMethodId?: string;
  issuerId?: string;
  installments: number;
  payerEmail: string;
  payerCpf?: string;
  payerFirstName?: string;
  payerLastName?: string;
  returnUrl?: string;
  completionUrl?: string;
}

export interface PixPaymentInput {
  payerEmail: string;
  payerCpf?: string;
  payerFirstName?: string;
  payerLastName?: string;
}

export interface BoletoPaymentInput {
  payerEmail: string;
  payerCpf: string;
  payerFirstName: string;
  payerLastName: string;
}

export interface PaymentRepository {
  getConfig(): Promise<PaymentConfig>;
  createCheckout(orderId: string): Promise<Payment>;
  getById(id: string): Promise<Payment | null>;
  getByOrderId(orderId: string): Promise<Payment | null>;
  simulateApproval(paymentId: string): Promise<Payment>;
  payWithCard(orderId: string, input: CardPaymentInput): Promise<Payment>;
  payWithPix(orderId: string, input: PixPaymentInput): Promise<Payment>;
  payWithBoleto(orderId: string, input: BoletoPaymentInput): Promise<Payment>;
  getTransparentByOrderId(orderId: string): Promise<Payment | null>;
  refreshFromAbacatePay(orderId: string): Promise<Payment | null>;
  simulateAbacatePayPayment(orderId: string): Promise<Payment>;
}
