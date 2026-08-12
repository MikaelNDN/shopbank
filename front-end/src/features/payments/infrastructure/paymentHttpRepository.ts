import { apiClient } from "@/shared/http/apiClient";
import type {
  BoletoPaymentInput,
  CardPaymentInput,
  Payment,
  PaymentConfig,
  PaymentRepository,
  PixPaymentInput,
} from "../domain/payment";
import type { BackendPayment, BackendPaymentConfig, BackendTransparentPayment } from "./paymentDtos";
import { mapPaymentConfigResponse, mapPaymentResponse, mapTransparentPaymentResponse } from "./paymentMapper";

export const PaymentHttpRepository: PaymentRepository = {
  async getConfig(): Promise<PaymentConfig> {
    const { data } = await apiClient.get<BackendPaymentConfig>("/api/payments/config");
    return mapPaymentConfigResponse(data);
  },

  async createCheckout(orderId): Promise<Payment> {
    const { data } = await apiClient.post<BackendPayment>(`/api/payments/abacatepay/checkout/${orderId}`);
    return mapPaymentResponse(data);
  },

  async getById(id): Promise<Payment | null> {
    try {
      const { data } = await apiClient.get<BackendPayment>(`/api/payments/${id}`);
      return mapPaymentResponse(data);
    } catch {
      return null;
    }
  },

  async getByOrderId(orderId): Promise<Payment | null> {
    try {
      const { data } = await apiClient.get<BackendPayment>(`/api/payments/order/${orderId}`);
      return mapPaymentResponse(data);
    } catch {
      return null;
    }
  },

  async simulateApproval(paymentId): Promise<Payment> {
    const { data } = await apiClient.post<BackendPayment>(`/api/payments/${paymentId}/simulate-approval`);
    return mapPaymentResponse(data);
  },

  async payWithCard(orderId, input: CardPaymentInput): Promise<Payment> {
    const { data } = await apiClient.post<BackendTransparentPayment>(`/api/payments/orders/${orderId}/card`, input);
    return mapTransparentPaymentResponse(data);
  },

  async payWithPix(orderId, input: PixPaymentInput): Promise<Payment> {
    const { data } = await apiClient.post<BackendTransparentPayment>(`/api/payments/orders/${orderId}/pix`, input);
    return mapTransparentPaymentResponse(data);
  },

  async payWithBoleto(orderId, input: BoletoPaymentInput): Promise<Payment> {
    const { data } = await apiClient.post<BackendTransparentPayment>(`/api/payments/orders/${orderId}/boleto`, input);
    return mapTransparentPaymentResponse(data);
  },

  async getTransparentByOrderId(orderId): Promise<Payment | null> {
    try {
      const { data } = await apiClient.get<BackendTransparentPayment>(`/api/payments/orders/${orderId}/transparent`);
      return mapTransparentPaymentResponse(data);
    } catch {
      return null;
    }
  },

  async refreshFromAbacatePay(orderId): Promise<Payment | null> {
    try {
      const { data } = await apiClient.post<BackendTransparentPayment>(`/api/payments/orders/${orderId}/refresh`);
      return mapTransparentPaymentResponse(data);
    } catch {
      return null;
    }
  },

  async simulateAbacatePayPayment(orderId): Promise<Payment> {
    const { data } = await apiClient.post<BackendTransparentPayment>(
      `/api/payments/orders/${orderId}/simulate-abacatepay`,
    );
    return mapTransparentPaymentResponse(data);
  },
};

