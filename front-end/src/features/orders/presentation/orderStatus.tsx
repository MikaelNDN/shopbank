import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "../domain/order";
import { orderStatusUi } from "./orderStatusUi";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const ui = orderStatusUi[status];
  return (
    <Badge variant="outline" className={ui.className}>
      {ui.label}
    </Badge>
  );
}
