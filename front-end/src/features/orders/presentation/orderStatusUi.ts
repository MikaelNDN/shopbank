import type { OrderStatus } from "../domain/order";

export const orderStatusUi: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_PAYMENT: {
    label: "Aguardando pagamento",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  PAID: {
    label: "Pago",
    className: "bg-success/15 text-success border-success/30",
  },
  SHIPPED: {
    label: "Enviado",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  DELIVERED: {
    label: "Entregue",
    className: "bg-success/15 text-success border-success/30",
  },
  CANCELED: {
    label: "Cancelado",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};
