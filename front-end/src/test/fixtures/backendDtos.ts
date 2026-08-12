import type { BackendCustomer } from "@/features/admin/infrastructure/adminDtos";
import type { BackendOrder } from "@/features/orders/infrastructure/orderDtos";

export const backendCustomerFixture: BackendCustomer = {
  id: 7,
  userId: 70,
  fullName: "Cliente Teste",
  cpf: "12345678901",
  active: true,
};

export const backendOrderFixture: BackendOrder = {
  id: 10,
  customerId: 7,
  status: "PAID",
  totalAmount: "210.50",
  items: [
    {
      productId: 3,
      productName: "Produto Teste",
      quantity: 2,
      unitPrice: "100.25",
      subtotal: "200.50",
    },
  ],
  shippingAddress: {
    customerAddressIdOrigin: 5,
    recipientName: "Cliente Teste",
    postalCode: "01001000",
    street: "Praca da Se",
    number: "100",
    district: "Se",
    city: "Sao Paulo",
    state: "SP",
  },
  createdAt: "2026-05-13T10:00:00",
};

