import { apiClient } from '@/api/apiClient';

export interface PaymentConfig {
  publicKey?: string | null;
  sandbox: boolean;
}

export const paymentConfigApi = {
  async get(): Promise<PaymentConfig> {
    const { data } = await apiClient.get<PaymentConfig>('/api/payments/config');
    return data;
  },
};
