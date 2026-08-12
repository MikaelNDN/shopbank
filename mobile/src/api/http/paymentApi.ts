import { apiClient } from '@/api/apiClient';
import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '@/types/order';

type BackendPaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELED'
  | 'REFUNDED';

interface BackendPayment {
  id: number;
  orderId: number;
  method: PaymentMethod;
  status: BackendPaymentStatus;
  amount: number | string;
  checkoutUrl?: string;
  createdAt: string;
  confirmedAt?: string;
}

interface BackendTransparentPayment extends BackendPayment {
  statusDetail?: string;
  gatewayPaymentId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  boletoUrl?: string;
}

export interface TransparentPayment extends Payment {
  statusDetail?: string;
  gatewayPaymentId?: string;
  qrCodeBase64?: string;
  boletoUrl?: string;
}

export interface CardPaymentInput {
  token?: string;
  paymentMethodId?: string;
  issuerId?: string;
  installments: number;
  payerEmail: string;
  payerCpf: string;
  payerFirstName?: string;
  payerLastName?: string;
  returnUrl?: string;
  completionUrl?: string;
}

export interface PixPaymentInput {
  payerEmail: string;
  payerCpf: string;
  payerFirstName?: string;
  payerLastName?: string;
}

export interface BoletoPaymentInput {
  payerEmail: string;
  payerCpf: string;
  payerFirstName: string;
  payerLastName: string;
}

function statusToApp(s: BackendPaymentStatus): PaymentStatus {
  switch (s) {
    case 'CREATED':
    case 'PENDING':
      return 'PENDING';
    case 'APPROVED':
      return 'APPROVED';
    case 'CANCELED':
    case 'REJECTED':
      return 'REJECTED';
    case 'REFUNDED':
      return 'REFUNDED';
  }
}

function num(v: number | string): number {
  return typeof v === 'string' ? Number.parseFloat(v) : v;
}

function toPayment(b: BackendPayment): Payment {
  return {
    id: String(b.id),
    orderId: String(b.orderId),
    method: b.method,
    status: statusToApp(b.status),
    amount: num(b.amount),
    qrCode: undefined,
    redirectUrl: b.checkoutUrl,
    createdAt: b.createdAt,
    approvedAt: b.confirmedAt,
  };
}

function toTransparentPayment(b: BackendTransparentPayment): TransparentPayment {
  return {
    ...toPayment(b),
    qrCode: b.qrCode,
    qrCodeBase64: b.qrCodeBase64,
    boletoUrl: b.boletoUrl,
    redirectUrl: b.checkoutUrl ?? b.boletoUrl,
    gatewayPaymentId: b.gatewayPaymentId,
    statusDetail: b.statusDetail,
  };
}

export const paymentApiHttp = {
  async createCheckout(orderId: string, _method: PaymentMethod = 'ABACATEPAY'): Promise<Payment> {
    const { data } = await apiClient.post<BackendPayment>(
      `/api/payments/abacatepay/checkout/${orderId}`,
    );
    return toPayment(data);
  },

  async getById(id: string): Promise<Payment | null> {
    try {
      const { data } = await apiClient.get<BackendPayment>(
        `/api/payments/${id}`,
      );
      return toPayment(data);
    } catch {
      return null;
    }
  },

  async getByOrderId(orderId: string): Promise<Payment | null> {
    try {
      const { data } = await apiClient.get<BackendPayment>(
        `/api/payments/order/${orderId}`,
      );
      return toPayment(data);
    } catch {
      return null;
    }
  },

  async simulateApproval(paymentId: string): Promise<Payment> {
    const { data } = await apiClient.post<BackendPayment>(
      `/api/payments/${paymentId}/simulate-approval`,
    );
    return toPayment(data);
  },

  async reject(_paymentId: string): Promise<Payment> {
    throw new Error('Reject não suportado pelo backend HTTP');
  },

  // ====== Checkout Transparente ======

  async payWithCard(orderId: string, input: CardPaymentInput): Promise<TransparentPayment> {
    const { data } = await apiClient.post<BackendTransparentPayment>(
      `/api/payments/orders/${orderId}/card`,
      input,
    );
    return toTransparentPayment(data);
  },

  async payWithPix(orderId: string, input: PixPaymentInput): Promise<TransparentPayment> {
    const { data } = await apiClient.post<BackendTransparentPayment>(
      `/api/payments/orders/${orderId}/pix`,
      input,
    );
    return toTransparentPayment(data);
  },

  async payWithBoleto(orderId: string, input: BoletoPaymentInput): Promise<TransparentPayment> {
    const { data } = await apiClient.post<BackendTransparentPayment>(
      `/api/payments/orders/${orderId}/boleto`,
      input,
    );
    return toTransparentPayment(data);
  },

  async getTransparentByOrderId(orderId: string): Promise<TransparentPayment | null> {
    try {
      const { data } = await apiClient.get<BackendTransparentPayment>(
        `/api/payments/orders/${orderId}/transparent`,
      );
      return toTransparentPayment(data);
    } catch {
      return null;
    }
  },

  async refreshFromAbacatePay(orderId: string): Promise<TransparentPayment | null> {
    try {
      const { data } = await apiClient.post<BackendTransparentPayment>(
        `/api/payments/orders/${orderId}/refresh`,
      );
      return toTransparentPayment(data);
    } catch {
      return null;
    }
  },

  async simulateAbacatePayPayment(orderId: string): Promise<TransparentPayment> {
    const { data } = await apiClient.post<BackendTransparentPayment>(
      `/api/payments/orders/${orderId}/simulate-abacatepay`,
    );
    return toTransparentPayment(data);
  },
};
