import { USE_MOCK } from '@/api/apiClient';
import { productApi as productMock } from '@/api/mock/productApi';
import { productApiHttp } from '@/api/http/productApi';

export const productApi = USE_MOCK ? productMock : productApiHttp;
