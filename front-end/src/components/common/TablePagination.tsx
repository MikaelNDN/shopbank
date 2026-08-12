import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}

export function TablePagination({ page, totalPages, total, pageSize, onChange }: Props) {
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min(total, (page + 1) * pageSize);
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 border-t text-sm">
      <span className="text-muted-foreground">
        {start}–{end} de {total}
      </span>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" disabled={page === 0} onClick={() => onChange(0)}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" disabled={page === 0} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 tabular-nums">
          {page + 1} / {totalPages}
        </span>
        <Button size="icon" variant="ghost" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" disabled={page >= totalPages - 1} onClick={() => onChange(totalPages - 1)}>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
