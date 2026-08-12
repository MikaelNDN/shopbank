import { USE_MOCK } from '@/api/apiClient';
import { addressApi as addressMock } from '@/api/mock/addressApi';
import { addressApiHttp } from '@/api/http/addressApi';

export const addressApi = USE_MOCK ? addressMock : addressApiHttp;
