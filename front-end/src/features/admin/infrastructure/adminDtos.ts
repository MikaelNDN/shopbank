import type { Numeric } from "@/shared/lib/number";

export interface BackendDashboard {
  totalCustomers: number;
  totalOrders: number;
  totalProducts: number;
  lowStockItems: number;
  approvedPayments: number;
  pendingPayments: number;
  canceledOrders: number;
  totalUnitsSold: number;
  totalRevenue: Numeric;
  monthRevenue: Numeric;
  averageTicket: Numeric;
  bestSellingProduct: { id: number; name: string; sold: number } | null;
  revenueByMonth: Array<{ month: string; value: Numeric }>;
  topProducts: Array<{ productId: number; name: string; sold: number }>;
  ordersByStatus: Record<string, number>;
  revenueByCategory: Array<{ categoryId: number; category: string; value: Numeric }>;
  lowStockList: Array<{ productId: number; name: string; quantity: number }>;
}

export interface BackendReport {
  ordersByStatus: Record<string, number>;
  paymentsByStatus: Record<string, number>;
  totalRevenue: Numeric;
}

export interface BackendCustomer {
  id: number;
  userId: number;
  fullName: string;
  cpf: string;
  phone?: string | null;
  birthDate?: string | null;
  marketingOptIn?: boolean | null;
  active: boolean;
}

export interface BackendAdminInventoryItem {
  inventoryId?: number;
  productId: number;
  productName?: string;
  name?: string;
  availableQuantity?: number;
  reservedQuantity?: number;
  productActive?: boolean;
  quantity?: number;
}

export interface BackendAuditLog {
  id: number;
  entityName: string;
  entityId?: number | null;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  userId?: number | null;
  description?: string | null;
  createdAt: string;
}
