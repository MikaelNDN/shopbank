import type { Address } from './address';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELED';

export type PaymentMethod =
  | 'ABACATEPAY'
  | 'PIX'
  | 'CREDIT_CARD'
  | 'BOLETO';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';

export interface OrderItem {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  qrCode?: string;
  redirectUrl?: string;
  createdAt: string;
  approvedAt?: string;
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
