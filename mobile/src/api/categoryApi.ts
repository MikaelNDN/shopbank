import { USE_MOCK } from '@/api/apiClient';
import { categoryApi as categoryMock } from '@/api/mock/categoryApi';
import { categoryApiHttp } from '@/api/http/categoryApi';

export const categoryApi = USE_MOCK ? categoryMock : categoryApiHttp;
