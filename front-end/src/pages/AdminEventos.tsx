import { useMemo, useState } from "react";
import { Bell, Eye, Filter, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JsonViewer } from "@/components/common/JsonViewer";
import { SortableHeader } from "@/components/common/SortableHeader";
import { TablePagination } from "@/components/common/TablePagination";
import { useTableState } from "@/hooks/useTableState";
import { useAdminAuditLogs } from "@/features/admin/application/useAdminOperations";
import type { AuditLog } from "@/features/admin/domain/admin";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/AsyncState";

interface AuditRow {
  id: string;
  entityName: string;
  entityId: string;
  action: string;
  createdAt: string;
  description: string;
  log: AuditLog;
}

function actionClass(action: string) {
  if (action.includes("CANCEL")) return "bg-destructive/15 text-destructive border-destructive/30";
  if (action.includes("APPROV") || action.includes("PAID") || action.includes("CREATED")) {
    return "bg-success/15 text-success border-success/30";
  }
  if (action.includes("STATUS") || action.includes("RECEIVED")) return "bg-primary/15 text-primary border-primary/30";
  return "bg-muted text-muted-foreground border-border";
}

function asPayload(log: AuditLog) {
  return {
    id: log.id,
    entityName: log.entityName,
    entityId: log.entityId,
    action: log.action,
    oldValue: log.oldValue,
    newValue: log.newValue,
    userId: log.userId,
    description: log.description,
    createdAt: log.createdAt,
  };
}

export default function AdminEventos() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const logsQuery = useAdminAuditLogs();

  const entities = useMemo(() => {
    return Array.from(new Set((logsQuery.data ?? []).map((log) => log.entityName))).sort();
  }, [logsQuery.data]);

  const rows = useMemo<AuditRow[]>(() => {
    const term = search.trim().toLowerCase();
    return (logsQuery.data ?? [])
      .filter((log) => {
        if (entityFilter !== "ALL" && log.entityName !== entityFilter) return false;
        if (!term) return true;
        return `${log.id} ${log.entityName} ${log.entityId ?? ""} ${log.action} ${log.description ?? ""} ${log.newValue ?? ""}`
          .toLowerCase()
          .includes(term);
      })
      .map((log) => ({
        id: log.id,
        entityName: log.entityName,
        entityId: log.entityId ?? "-",
        action: log.action,
        createdAt: log.createdAt,
        description: log.description ?? "",
        log,
      }));
  }, [entityFilter, logsQuery.data, search]);

  const table = useTableState<AuditRow>(rows, {
    initialSort: { key: "createdAt", dir: "desc" },
    pageSize: 10,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" /> Eventos e auditoria
          </h1>
          <p className="text-sm text-muted-foreground">Eventos reais de auditoria do back-end</p>
        </div>
        <Button variant="outline" onClick={() => logsQuery.refetch()} disabled={logsQuery.isFetching}>
          {logsQuery.isFetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_auto]">
          <Input
            placeholder="Buscar em id, entidade, acao ou payload"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as entidades</SelectItem>
              {entities.map((entity) => (
                <SelectItem key={entity} value={entity}>
                  {entity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="justify-center bg-accent text-accent-foreground">
            {rows.length} evento(s)
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {logsQuery.isLoading ? (
            <LoadingState message="Carregando eventos..." />
          ) : logsQuery.isError ? (
            <ErrorState onRetry={() => logsQuery.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState
              title="Nenhum evento encontrado"
              description="O back-end não retornou registros de auditoria para os filtros atuais."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader label="Evento" sortKey="id" current={table.sort} onToggle={() => table.toggleSort("id")} />
                    <SortableHeader label="Entidade" sortKey="entityName" current={table.sort} onToggle={() => table.toggleSort("entityName")} />
                    <SortableHeader label="Registro" sortKey="entityId" current={table.sort} onToggle={() => table.toggleSort("entityId")} />
                    <SortableHeader label="Acao" sortKey="action" current={table.sort} onToggle={() => table.toggleSort("action")} />
                    <SortableHeader label="Data" sortKey="createdAt" current={table.sort} onToggle={() => table.toggleSort("createdAt")} />
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.pageData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.id}</TableCell>
                      <TableCell>{row.entityName}</TableCell>
                      <TableCell className="font-mono text-xs">{row.entityId}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={actionClass(row.action)}>{row.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(row.createdAt).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(row.log)}>
                          <Eye className="h-4 w-4 mr-1" /> Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                page={table.page}
                totalPages={table.totalPages}
                total={table.total}
                pageSize={table.pageSize}
                onChange={table.setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Evento {selected.id}
                  <Badge variant="outline" className={actionClass(selected.action)}>{selected.action}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <div><span className="text-muted-foreground">Entidade:</span> {selected.entityName}</div>
                <div><span className="text-muted-foreground">Registro:</span> {selected.entityId ?? "-"}</div>
                <div><span className="text-muted-foreground">Usuario:</span> {selected.userId ?? "-"}</div>
                <div><span className="text-muted-foreground">Data:</span> {new Date(selected.createdAt).toLocaleString("pt-BR")}</div>
              </div>
              {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
              <JsonViewer data={asPayload(selected)} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
