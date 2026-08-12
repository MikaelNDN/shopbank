import { USE_MOCK } from '@/api/apiClient';
import { orderApi as orderMock } from '@/api/mock/orderApi';
import { orderApiHttp } from '@/api/http/orderApi';

export const orderApi = USE_MOCK ? orderMock : orderApiHttp;
