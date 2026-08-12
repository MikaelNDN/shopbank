import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export function useTableState<T>(
  data: T[],
  opts: { initialSort?: { key: keyof T; dir: SortDir }; pageSize?: number } = {},
) {
  const [sort, setSort] = useState<{ key: keyof T; dir: SortDir } | null>(
    opts.initialSort ?? null,
  );
  const [page, setPage] = useState(0);
  const pageSize = opts.pageSize ?? 10;

  const sorted = useMemo(() => {
    if (!sort) return data;
    const arr = [...data];
    arr.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sort.dir === "asc" ? av - bv : bv - av;
      }
      const sa = String(av);
      const sb = String(bv);
      return sort.dir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return arr;
  }, [data, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageData = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  function toggleSort(key: keyof T) {
    setPage(0);
    setSort((s) =>
      s && s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }

  return {
    sort,
    toggleSort,
    page: safePage,
    setPage,
    totalPages,
    total: sorted.length,
    pageSize,
    pageData,
  };
}
