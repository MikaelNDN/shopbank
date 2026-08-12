import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortDir } from "@/hooks/useTableState";

interface Props {
  label: string;
  sortKey: PropertyKey;
  current: { key: PropertyKey; dir: SortDir } | null;
  onToggle: () => void;
  className?: string;
}

export function SortableHeader({ label, sortKey, current, onToggle, className }: Props) {
  const active = current?.key === sortKey;
  const Icon = !active ? ArrowUpDown : current?.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium hover:text-foreground transition-colors",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </TableHead>
  );
}
