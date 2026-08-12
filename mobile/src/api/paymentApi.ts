import { USE_MOCK } from '@/api/apiClient';
import { paymentApi as paymentMock } from '@/api/mock/paymentApi';
import { paymentApiHttp } from '@/api/http/paymentApi';

export const paymentApi = USE_MOCK ? paymentMock : paymentApiHttp;
