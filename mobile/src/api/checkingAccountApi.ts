import { USE_MOCK } from '@/api/apiClient';
import { checkingAccountApiMock } from '@/api/mock/checkingAccountApi';
import { checkingAccountApiHttp } from '@/api/http/checkingAccountApi';

export const checkingAccountApi = USE_MOCK ? checkingAccountApiMock : checkingAccountApiHttp;
