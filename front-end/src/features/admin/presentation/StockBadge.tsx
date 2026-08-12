import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StockBadge({ quantity, threshold = 5 }: { quantity: number; threshold?: number }) {
  const tone =
    quantity === 0
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : quantity <= threshold
        ? "bg-warning/15 text-warning border-warning/30"
        : "bg-success/15 text-success border-success/30";

  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", tone)}>
      {quantity === 0 ? "Sem estoque" : `${quantity} un.`}
    </Badge>
  );
}
