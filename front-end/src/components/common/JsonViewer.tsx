import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NodeProps {
  name?: string;
  value: unknown;
  depth: number;
  defaultOpen?: boolean;
}

function JsonNode({ name, value, depth, defaultOpen = true }: NodeProps) {
  const [open, setOpen] = useState(depth < 2 ? true : defaultOpen);
  const isArray = Array.isArray(value);
  const isObject = !isArray && value !== null && typeof value === "object";
  const indent = { paddingLeft: depth * 12 };

  if (isObject || isArray) {
    const entries = isArray
      ? (value as unknown[]).map((v, i) => [String(i), v] as const)
      : Object.entries(value as Record<string, unknown>);
    const summary = isArray ? `Array(${entries.length})` : `{${entries.length}}`;
    return (
      <div style={indent} className="font-mono text-xs leading-6">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {name !== undefined && <span className="text-primary">"{name}"</span>}
          {name !== undefined && <span>:</span>}
          <span className="text-muted-foreground">{open ? (isArray ? "[" : "{") : `${isArray ? "[" : "{"} … ${isArray ? "]" : "}"}  `}</span>
          {!open && <span className="text-muted-foreground/70 ml-1">{summary}</span>}
        </button>
        {open && (
          <>
            {entries.map(([k, v]) => (
              <JsonNode key={k} name={isArray ? undefined : k} value={v} depth={depth + 1} />
            ))}
            <div style={indent} className="text-muted-foreground">
              {isArray ? "]" : "}"}
            </div>
          </>
        )}
      </div>
    );
  }

  let cls = "text-foreground";
  let display: string;
  if (typeof value === "string") {
    cls = "text-success";
    display = `"${value}"`;
  } else if (typeof value === "number") {
    cls = "text-warning";
    display = String(value);
  } else if (typeof value === "boolean") {
    cls = "text-primary";
    display = String(value);
  } else if (value === null) {
    cls = "text-muted-foreground";
    display = "null";
  } else {
    display = String(value);
  }

  return (
    <div style={indent} className="font-mono text-xs leading-6">
      {name !== undefined && <span className="text-primary">"{name}"</span>}
      {name !== undefined && <span className="text-muted-foreground">: </span>}
      <span className={cls}>{display}</span>
    </div>
  );
}

interface Props {
  data: unknown;
  className?: string;
}

export function JsonViewer({ data, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      toast.success("JSON copiado para a área de transferência");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <div className={`rounded-md border bg-muted/30 ${className ?? ""}`}>
      <div className="flex items-center justify-between border-b px-2 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">payload.json</span>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <div className="p-3 max-h-96 overflow-auto">
        <JsonNode value={data} depth={0} />
      </div>
    </div>
  );
}
