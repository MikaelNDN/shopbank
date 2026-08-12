import { USE_MOCK } from '@/api/apiClient';
import {
  adminApi as adminMock,
  type CustomerDetail,
  type CustomerSummary,
  type DashboardData,
  type DashboardPeriod,
  type ReportsData,
} from '@/api/mock/adminApi';
import { adminApiHttp } from '@/api/http/adminApi';

export type {
  CustomerDetail,
  CustomerSummary,
  DashboardData,
  DashboardPeriod,
  ReportsData,
};

export const adminApi = USE_MOCK ? adminMock : adminApiHttp;
