import type { Numeric } from "@/shared/lib/number";

export type BackendOrderStatus =
  | "CREATED"
  | "RESERVED"
  | "WAITING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED";

export interface BackendOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: Numeric;
  subtotal: Numeric;
}

export interface BackendOrderShippingAddress {
  customerAddressIdOrigin: number;
  recipientName: string;
  postalCode: string;
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  reference?: string | null;
}

export interface BackendOrder {
  id: number;
  customerId: number;
  status: BackendOrderStatus;
  totalAmount: Numeric;
  items: BackendOrderItem[];
  shippingAddress: BackendOrderShippingAddress;
  createdAt: string;
}

export interface BackendCreateOrderRequest {
  customerId: number;
  customerAddressId: number;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

export interface BackendOrderStatusRequest {
  status: BackendOrderStatus;
}

