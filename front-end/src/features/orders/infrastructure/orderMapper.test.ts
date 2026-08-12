import { describe, expect, it } from "@jest/globals";
import { backendOrderFixture } from "@/test/fixtures/backendDtos";
import {
  mapCreateOrderRequest,
  mapOrderResponse,
  mapOrderStatus,
  mapOrderStatusRequest,
  mapOrderStatusToBackend,
} from "./orderMapper";
import type { BackendOrderStatus } from "./orderDtos";
import type { OrderStatus } from "../domain/order";

describe("orderMapper", () => {
  it("maps backend order statuses to UI status buckets", () => {
    const expected: Record<BackendOrderStatus, OrderStatus> = {
      CREATED: "PENDING_PAYMENT",
      RESERVED: "PENDING_PAYMENT",
      WAITING_PAYMENT: "PENDING_PAYMENT",
      PAID: "PAID",
      PREPARING: "SHIPPED",
      SHIPPED: "SHIPPED",
      DELIVERED: "DELIVERED",
      CANCELED: "CANCELED",
    };

    for (const [backend, app] of Object.entries(expected)) {
      expect(mapOrderStatus(backend as BackendOrderStatus)).toBe(app);
    }
  });

  it("maps UI statuses back to backend values", () => {
    expect(mapOrderStatusToBackend("PENDING_PAYMENT")).toBe("WAITING_PAYMENT");
    expect(mapOrderStatusToBackend("PAID")).toBe("PAID");
    expect(mapOrderStatusToBackend("SHIPPED")).toBe("SHIPPED");
    expect(mapOrderStatusToBackend("DELIVERED")).toBe("DELIVERED");
    expect(mapOrderStatusToBackend("CANCELED")).toBe("CANCELED");
    expect(mapOrderStatusRequest("PAID")).toEqual({ status: "PAID" });
  });

  it("maps orders with numeric string totals and shipping address", () => {
    expect(mapOrderResponse(backendOrderFixture)).toMatchObject({
      id: "10",
      customerId: "7",
      subtotal: 200.5,
      shipping: 10,
      total: 210.5,
      status: "PAID",
      paymentMethod: "ABACATEPAY",
      shippingAddress: {
        id: "5",
        zipCode: "01001000",
        city: "Sao Paulo",
      },
      items: [
        {
          productId: "3",
          name: "Produto Teste",
          price: 100.25,
          quantity: 2,
        },
      ],
    });
  });

  it("maps create order payloads", () => {
    expect(
      mapCreateOrderRequest({
        customerId: "7",
        customerAddressId: "5",
        items: [{ productId: "3", quantity: 2 }],
      }),
    ).toEqual({
      customerId: 7,
      customerAddressId: 5,
      items: [{ productId: 3, quantity: 2 }],
    });
  });
});

