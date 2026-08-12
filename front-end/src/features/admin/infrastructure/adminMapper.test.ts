import { describe, expect, it } from "@jest/globals";
import { backendCustomerFixture, backendOrderFixture } from "@/test/fixtures/backendDtos";
import {
  mapAdminInventoryResponse,
  mapAuditLogResponse,
  mapCustomerDetail,
  mapCustomerSummary,
  mapDashboardResponse,
  mapReportResponse,
  mapStatusBuckets,
} from "./adminMapper";
import { mapOrderResponse } from "@/features/orders/infrastructure/orderMapper";

describe("adminMapper", () => {
  it("maps status buckets from backend statuses", () => {
    expect(mapStatusBuckets({ CREATED: 1, PAID: 2, PREPARING: 3, DELIVERED: 4, CANCELED: 5 })).toEqual({
      PENDING_PAYMENT: 1,
      PAID: 2,
      SHIPPED: 3,
      DELIVERED: 4,
      CANCELED: 5,
    });
  });

  it("maps dashboard and reports", () => {
    const dashboard = mapDashboardResponse({
      totalCustomers: 5,
      totalOrders: 10,
      totalProducts: 20,
      lowStockItems: 2,
      approvedPayments: 7,
      pendingPayments: 2,
      canceledOrders: 1,
      totalUnitsSold: 30,
      totalRevenue: "1200.50",
      monthRevenue: "500.25",
      averageTicket: "120.05",
      bestSellingProduct: { id: 3, name: "Produto", sold: 9 },
      revenueByMonth: [{ month: "Mai", value: "500.25" }],
      topProducts: [{ productId: 3, name: "Produto", sold: 9 }],
      ordersByStatus: { WAITING_PAYMENT: 2, PAID: 7, CANCELED: 1 },
      revenueByCategory: [{ categoryId: 2, category: "Livros", value: "300.10" }],
      lowStockList: [{ productId: 4, name: "Baixo", quantity: 1 }],
    });

    expect(dashboard).toMatchObject({
      period: "30d",
      totalRevenue: 1200.5,
      monthRevenue: 500.25,
      bestSellingProduct: { id: "3", name: "Produto", sold: 9 },
      lowStockList: [{ id: "4", name: "Baixo", qty: 1 }],
    });

    expect(mapReportResponse({ ordersByStatus: { PAID: 1 }, paymentsByStatus: { APPROVED: 1 }, totalRevenue: "10" })).toEqual({
      ordersByStatus: {
        PENDING_PAYMENT: 0,
        PAID: 1,
        SHIPPED: 0,
        DELIVERED: 0,
        CANCELED: 0,
      },
      paymentsByStatus: { APPROVED: 1 },
      totalRevenue: 10,
    });
  });

  it("maps empty dashboard and report collections with defaults", () => {
    expect(
      mapDashboardResponse({
        totalCustomers: 0,
        totalOrders: 0,
        totalProducts: 0,
        lowStockItems: 0,
        approvedPayments: 0,
        pendingPayments: 0,
        canceledOrders: 0,
        totalUnitsSold: 0,
        totalRevenue: 0,
        monthRevenue: 0,
        averageTicket: 0,
        bestSellingProduct: null,
        revenueByMonth: [],
        topProducts: [],
        ordersByStatus: {},
        revenueByCategory: [],
        lowStockList: [],
      }, "7d"),
    ).toMatchObject({
      period: "7d",
      bestSellingProduct: null,
      ordersByStatus: [
        { status: "PENDING_PAYMENT", count: 0 },
        { status: "PAID", count: 0 },
        { status: "SHIPPED", count: 0 },
        { status: "DELIVERED", count: 0 },
        { status: "CANCELED", count: 0 },
      ],
    });

    expect(mapReportResponse({ ordersByStatus: {}, paymentsByStatus: {}, totalRevenue: 0 }).totalRevenue).toBe(0);
  });

  it("maps customer summaries, details and inventory", () => {
    const order = mapOrderResponse(backendOrderFixture);

    expect(mapCustomerSummary(backendCustomerFixture, [order])).toMatchObject({
      user: {
        id: "7",
        name: "Cliente Teste",
        cpf: "12345678901",
        role: "CLIENT",
      },
      totalOrders: 1,
      totalSpent: 210.5,
      averageTicket: 210.5,
      lastOrderAt: "2026-05-13T10:00:00",
    });

    expect(mapCustomerDetail(backendCustomerFixture, [backendOrderFixture]).orders).toHaveLength(1);
    expect(
      mapAdminInventoryResponse({
        inventoryId: 2,
        productId: 9,
        productName: "Produto",
        availableQuantity: 4,
        reservedQuantity: 1,
        productActive: true,
      }),
    ).toEqual({
      inventoryId: "2",
      productId: "9",
      name: "Produto",
      quantity: 4,
      reservedQuantity: 1,
      active: true,
    });
  });

  it("maps customer summaries with no orders", () => {
    expect(mapCustomerSummary(backendCustomerFixture, [])).toMatchObject({
      totalOrders: 0,
      totalSpent: 0,
      averageTicket: 0,
      lastOrderAt: null,
    });
  });

  it("maps audit logs", () => {
    expect(
      mapAuditLogResponse({
        id: 11,
        entityName: "Order",
        entityId: 5,
        action: "STATUS_UPDATED",
        oldValue: "PAID",
        newValue: "SHIPPED",
        userId: 3,
        description: "Order status updated",
        createdAt: "2026-05-14T10:00:00",
      }),
    ).toEqual({
      id: "11",
      entityName: "Order",
      entityId: "5",
      action: "STATUS_UPDATED",
      oldValue: "PAID",
      newValue: "SHIPPED",
      userId: "3",
      description: "Order status updated",
      createdAt: "2026-05-14T10:00:00",
    });
  });
});
