import type { Address } from "@/features/addresses/domain/address";
import type { PaymentMethod } from "@/features/payments/domain/payment";

export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED";

export interface OrderItem {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  shippingAddress: Address;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  customerId: string;
  customerAddressId: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod?: PaymentMethod;
}

export interface AdminOrderFilters {
  status?: OrderStatus;
  search?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface OrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  getMyOrders(): Promise<Order[]>;
  getByCustomer(customerId: string): Promise<Order[]>;
  getById(id: string): Promise<Order | null>;
  cancel(id: string): Promise<Order | null>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  listAll(filters?: AdminOrderFilters): Promise<Order[]>;
}

