import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, RefreshCw, ArrowLeft, FileText, Package, Pencil, Trash2, Plus } from "lucide-react";
import { useLocation } from "wouter";

// ── Helpers ───────────────────────────────────────────────────────────────────
function actionBadge(action: string) {
  const map: Record<string, { label: string; cls: string }> = {
    INSERT:      { label: "Created",     cls: "bg-green-500/15 text-green-400 border-green-500/30" },
    UPDATE:      { label: "Updated",     cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    DELETE:      { label: "Deleted",     cls: "bg-red-500/15 text-red-400 border-red-500/30" },
    ITEM_ADD:    { label: "Item Added",  cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    ITEM_EDIT:   { label: "Item Edited", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    ITEM_DELETE: { label: "Item Removed",cls: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  };
  const m = map[action] ?? { label: action, cls: "bg-muted text-muted-foreground" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${m.cls}`}>{m.label}</span>;
}

function entityIcon(entityType: string) {
  return entityType === "SET" ? <Package className="w-4 h-4 text-[#e60000]" /> : <FileText className="w-4 h-4 text-blue-400" />;
}

function actionIcon(action: string) {
  if (action === "INSERT" || action === "ITEM_ADD") return <Plus className="w-3.5 h-3.5" />;
  if (action === "UPDATE" || action === "ITEM_EDIT") return <Pencil className="w-3.5 h-3.5" />;
  if (action === "DELETE" || action === "ITEM_DELETE") return <Trash2 className="w-3.5 h-3.5" />;
  return null;
}

function formatDate(dt: string | null) {
  if (!dt) return "—";
  try { return new Date(dt).toLocaleString(); } catch { return dt; }
}

// ── JSON Diff Viewer ──────────────────────────────────────────────────────────
function JsonDiffViewer({ before, after }: { before: string | null; after: string | null }) {
  const parse = (s: string | null) => {
    if (!s) return null;
    try { return JSON.parse(s); } catch { return s; }
  };
  const beforeObj = parse(before);
  const afterObj  = parse(after);

  if (!beforeObj && !afterObj) return <p className="text-xs text-muted-foreground italic">No snapshot data</p>;

  // Collect all keys
  const allKeys = Array.from(new Set([
    ...(beforeObj && typeof beforeObj === "object" ? Object.keys(beforeObj) : []),
    ...(afterObj  && typeof afterObj  === "object" ? Object.keys(afterObj)  : []),
  ]));

  if (typeof beforeObj !== "object" || typeof afterObj !== "object") {
    // Plain string diff
    return (
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        {before && <div className="bg-red-500/10 border border-red-500/20 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap text-red-300">{before}</div>}
        {after  && <div className="bg-green-500/10 border border-green-500/20 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap text-green-300">{after}</div>}
      </div>
    );
  }

  // Ignore "lines" key for top-level diff table (shown separately)
  const simpleKeys = allKeys.filter(k => k !== "lines");
  const hasLines = allKeys.includes("lines");

  const stringify = (v: unknown) => {
    if (v === undefined || v === null) return "—";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  return (
    <div className="space-y-3">
      {simpleKeys.length > 0 && (
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1 pr-3 text-muted-foreground font-medium w-32">Field</th>
              <th className="text-left py-1 pr-3 text-red-400 font-medium">Before</th>
              <th className="text-left py-1 text-green-400 font-medium">After</th>
            </tr>
          </thead>
          <tbody>
            {simpleKeys.map(k => {
              const bv = stringify((beforeObj as any)?.[k]);
              const av = stringify((afterObj  as any)?.[k]);
              const changed = bv !== av;
              return (
                <tr key={k} className={`border-b border-border/50 ${changed ? "bg-amber-500/5" : ""}`}>
                  <td className="py-1 pr-3 font-mono text-muted-foreground">{k}</td>
                  <td className={`py-1 pr-3 font-mono ${changed ? "text-red-400 line-through opacity-70" : "text-foreground"}`}>{bv}</td>
                  <td className={`py-1 font-mono ${changed ? "text-green-400 font-semibold" : "text-foreground"}`}>{av}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {hasLines && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">Line Items</p>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: "Before", data: (beforeObj as any)?.lines, cls: "bg-red-500/10 border-red-500/20 text-red-300" },
              { label: "After",  data: (afterObj  as any)?.lines, cls: "bg-green-500/10 border-green-500/20 text-green-300" }]
              .map(({ label, data, cls }) => (
                <div key={label} className={`border rounded p-2 text-xs font-mono overflow-auto max-h-48 ${cls}`}>
                  <p className="font-semibold mb-1 opacity-80">{label}</p>
                  {Array.isArray(data) ? data.map((l: any, i: number) => (
                    <div key={i} className="mb-1">
                      <span className="font-bold">{l.code}</span> × {l.qty}
                      {l.serialNumbers?.filter(Boolean).length > 0 && (
                        <span className="opacity-70"> [SN: {l.serialNumbers.filter(Boolean).join(", ")}]</span>
                      )}
                    </div>
                  )) : <span className="opacity-50">—</span>}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SubAssetTransactionLog() {
  const [, setLocation] = useLocation();

  // Filters
  const [filterAction,    setFilterAction]    = useState<string>("all");
  const [filterEntityType,setFilterEntityType]= useState<string>("all");
  const [filterUser,      setFilterUser]      = useState("");
  const [filterDateFrom,  setFilterDateFrom]  = useState("");
  const [filterDateTo,    setFilterDateTo]    = useState("");
  const [page,            setPage]            = useState(1);
  const PAGE_SIZE = 50;

  // Expanded row state
  const [expandedTxnId, setExpandedTxnId] = useState<number | null>(null);

  const queryInput = useMemo(() => ({
    entityType: filterEntityType !== "all" ? filterEntityType : undefined,
    action:     filterAction     !== "all" ? filterAction     : undefined,
    changedBy:  filterUser.trim() || undefined,
    dateFrom:   filterDateFrom   || undefined,
    dateTo:     filterDateTo     || undefined,
    page,
    pageSize:   PAGE_SIZE,
  }), [filterEntityType, filterAction, filterUser, filterDateFrom, filterDateTo, page]);

  const { data, isLoading, refetch, isFetching } = trpc.asset.getSubAssetTxns.useQuery(queryInput);
  const rows  = data?.rows  ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function applyFilters() { setPage(1); refetch(); }
  function clearFilters() {
    setFilterAction("all"); setFilterEntityType("all");
    setFilterUser(""); setFilterDateFrom(""); setFilterDateTo("");
    setPage(1);
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full gap-4 p-4 overflow-auto">
        <ScreenHeader
          screenId="VFLSASSET002"
          title="Sub-Asset Transaction Log"
          subtitle="Full audit trail of all Sub-Asset Registry operations"
          formType="asset_registry"
          onAIFormFill={() => {}}
        />

        {/* Back button */}
        <Button variant="ghost" size="sm" className="self-start -mt-2 text-muted-foreground" onClick={() => setLocation("/sub-asset-registry")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Sub-Asset Registry
        </Button>

        {/* Filter Bar */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 items-end">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Action</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="INSERT">Created</SelectItem>
                  <SelectItem value="UPDATE">Updated</SelectItem>
                  <SelectItem value="DELETE">Deleted</SelectItem>
                  <SelectItem value="ITEM_ADD">Item Added</SelectItem>
                  <SelectItem value="ITEM_EDIT">Item Edited</SelectItem>
                  <SelectItem value="ITEM_DELETE">Item Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Entity Type</Label>
              <Select value={filterEntityType} onValueChange={setFilterEntityType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="SET">Sub-Asset Set</SelectItem>
                  <SelectItem value="LIBRARY_ITEM">Library Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Changed By</Label>
              <Input className="h-8 text-xs" placeholder="User name..." value={filterUser} onChange={e => setFilterUser(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Date From</Label>
              <Input type="date" className="h-8 text-xs" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Date To</Label>
              <Input type="date" className="h-8 text-xs" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="bg-[#e60000] hover:bg-[#cc0000] text-white h-8 text-xs" onClick={applyFilters} disabled={isFetching}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Apply Filters
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={clearFilters}>Clear</Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total.toLocaleString()} transaction{total !== 1 ? "s" : ""} found</span>
          <span>Page {page} of {totalPages}</span>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">Loading transactions...</div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <FileText className="w-8 h-8 opacity-30" />
              <p className="text-sm">No transactions found</p>
              <p className="text-xs">Transactions are recorded when you add, edit, or delete sets and library items.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-8"></th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Txn #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Changed By</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Date & Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Screen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <>
                    <tr
                      key={row.txnId}
                      className={`border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"} ${expandedTxnId === row.txnId ? "bg-muted/40" : ""}`}
                      onClick={() => setExpandedTxnId(expandedTxnId === row.txnId ? null : row.txnId)}
                    >
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {expandedTxnId === row.txnId
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">#{row.txnId}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {actionIcon(row.action)}
                          {actionBadge(row.action)}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {entityIcon(row.entityType)}
                          <span className="text-xs text-muted-foreground">{row.entityType === "SET" ? "Set" : "Library Item"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{row.entityCode ?? "—"}</td>
                      <td className="px-4 py-2.5 font-medium max-w-[200px] truncate">{row.entityName ?? "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.changedBy}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">{formatDate(row.changedAt)}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.screenId ?? "—"}</td>
                    </tr>

                    {/* Expanded diff row */}
                    {expandedTxnId === row.txnId && (
                      <tr key={`${row.txnId}-diff`} className="bg-muted/20 border-b border-border">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-foreground mb-2">
                              Change Detail — Txn #{row.txnId} · {row.action} · {formatDate(row.changedAt)}
                            </p>
                            {row.sessionRef && (
                              <p className="text-xs text-muted-foreground">Session: {row.sessionRef}</p>
                            )}
                            <JsonDiffViewer before={row.beforeJson} after={row.afterJson} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
