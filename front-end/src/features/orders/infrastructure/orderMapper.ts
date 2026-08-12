import type { Address } from "@/features/addresses/domain/address";
import { toId, toNumber } from "@/shared/lib/number";
import type { CreateOrderInput, Order, OrderItem, OrderStatus } from "../domain/order";
import type {
  BackendCreateOrderRequest,
  BackendOrder,
  BackendOrderItem,
  BackendOrderShippingAddress,
  BackendOrderStatus,
  BackendOrderStatusRequest,
} from "./orderDtos";

export function mapOrderStatus(status: BackendOrderStatus): OrderStatus {
  switch (status) {
    case "PAID":
      return "PAID";
    case "PREPARING":
    case "SHIPPED":
      return "SHIPPED";
    case "DELIVERED":
      return "DELIVERED";
    case "CANCELED":
      return "CANCELED";
    case "CREATED":
    case "RESERVED":
    case "WAITING_PAYMENT":
      return "PENDING_PAYMENT";
  }
}

export function mapOrderStatusToBackend(status: OrderStatus): BackendOrderStatus {
  switch (status) {
    case "PAID":
      return "PAID";
    case "SHIPPED":
      return "SHIPPED";
    case "DELIVERED":
      return "DELIVERED";
    case "CANCELED":
      return "CANCELED";
    case "PENDING_PAYMENT":
      return "WAITING_PAYMENT";
  }
}

export function mapOrderStatusRequest(status: OrderStatus): BackendOrderStatusRequest {
  return { status: mapOrderStatusToBackend(status) };
}

export function mapOrderItemResponse(dto: BackendOrderItem): OrderItem {
  return {
    productId: toId(dto.productId),
    name: dto.productName,
    imageUrl: "",
    price: toNumber(dto.unitPrice),
    quantity: dto.quantity,
  };
}

export function mapOrderShippingAddress(dto: BackendOrderShippingAddress, customerId = ""): Address {
  return {
    id: toId(dto.customerAddressIdOrigin),
    customerId,
    label: "Endereco de entrega",
    recipientName: dto.recipientName,
    zipCode: dto.postalCode,
    street: dto.street,
    number: dto.number,
    complement: dto.complement ?? undefined,
    neighborhood: dto.district,
    city: dto.city,
    state: dto.state,
    reference: dto.reference ?? undefined,
    isFavorite: false,
    active: true,
  };
}

export function mapOrderResponse(dto: BackendOrder): Order {
  const items = dto.items.map(mapOrderItemResponse);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = toNumber(dto.totalAmount);

  return {
    id: toId(dto.id),
    customerId: toId(dto.customerId),
    items,
    shippingAddress: mapOrderShippingAddress(dto.shippingAddress, toId(dto.customerId)),
    subtotal,
    shipping: Math.max(0, total - subtotal),
    total,
    status: mapOrderStatus(dto.status),
    paymentMethod: "ABACATEPAY",
    createdAt: dto.createdAt,
    updatedAt: dto.createdAt,
  };
}

export function mapCreateOrderRequest(input: CreateOrderInput): BackendCreateOrderRequest {
  return {
    customerId: Number.parseInt(input.customerId, 10),
    customerAddressId: Number.parseInt(input.customerAddressId, 10),
    items: input.items.map((item) => ({
      productId: Number.parseInt(item.productId, 10),
      quantity: item.quantity,
    })),
  };
}

