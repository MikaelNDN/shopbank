import { apiClient } from "@/shared/http/apiClient";
import type { AdminOrderFilters, CreateOrderInput, Order, OrderRepository, OrderStatus } from "../domain/order";
import type { BackendOrder } from "./orderDtos";
import { mapCreateOrderRequest, mapOrderResponse, mapOrderStatusRequest } from "./orderMapper";

function filterOrders(orders: Order[], filters: AdminOrderFilters = {}): Order[] {
  let result = [...orders];
  if (filters.status) result = result.filter((order) => order.status === filters.status);
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter(
      (order) => order.id.toLowerCase().includes(q) || order.items.some((item) => item.name.toLowerCase().includes(q)),
    );
  }
  if (filters.dateFrom) result = result.filter((order) => order.createdAt >= new Date(filters.dateFrom!).toISOString());
  if (filters.dateTo) result = result.filter((order) => order.createdAt <= new Date(filters.dateTo!).toISOString());
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const OrderHttpRepository: OrderRepository = {
  async create(input: CreateOrderInput): Promise<Order> {
    const { data } = await apiClient.post<BackendOrder>("/api/orders", mapCreateOrderRequest(input));
    return mapOrderResponse(data);
  },

  async getMyOrders(): Promise<Order[]> {
    const { data } = await apiClient.get<BackendOrder[]>("/api/orders/my-orders");
    return data.map(mapOrderResponse).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getByCustomer(customerId): Promise<Order[]> {
    const { data } = await apiClient.get<BackendOrder[]>(`/api/orders/customer/${customerId}`);
    return data.map(mapOrderResponse).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getById(id): Promise<Order | null> {
    try {
      const { data } = await apiClient.get<BackendOrder>(`/api/orders/${id}`);
      return mapOrderResponse(data);
    } catch {
      return null;
    }
  },

  async cancel(id): Promise<Order | null> {
    const { data } = await apiClient.patch<BackendOrder>(`/api/orders/${id}/cancel`);
    return mapOrderResponse(data);
  },

  async updateStatus(id, status: OrderStatus): Promise<Order> {
    const { data } = await apiClient.patch<BackendOrder>(`/api/orders/${id}/status`, mapOrderStatusRequest(status));
    return mapOrderResponse(data);
  },

  async listAll(filters: AdminOrderFilters = {}): Promise<Order[]> {
    if (filters.customerId) return filterOrders(await this.getByCustomer(filters.customerId), filters);
    const { data } = await apiClient.get<BackendOrder[]>("/api/admin/orders");
    return filterOrders(data.map(mapOrderResponse), filters);
  },
};

