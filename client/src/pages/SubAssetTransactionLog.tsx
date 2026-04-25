/**
 * VodaLease Enterprise — Sub-Asset Transaction Log
 * Screen ID: VFLSEASTTXN0001P001
 *
 * Workflow:
 *   1. Select a Lease Number → Sub-Asset Set dropdown populates with sets on that lease
 *   2. Select a Sub-Asset Set → action toolbar activates
 *   3. Click an action (Add/Return/Write Off/Replace/Condemn) → dialog → records transaction
 *   4. Transaction History table shows all transactions for the selected lease/set
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, RefreshCw, Filter, X, ChevronDown, ChevronRight,
  Plus, RotateCcw, ShieldOff, Repeat2, Skull, Trash2, Pencil,
  Building2, Package,
} from "lucide-react";

// ── Badge colour maps ────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  Active:    "bg-green-500/20 text-green-400 border-green-500/30",
  Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  Returned:  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  BackIn:    "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Replaced:  "bg-purple-500/20 text-purple-400 border-purple-500/30",
  WriteOff:  "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Condemned: "bg-rose-700/20 text-rose-400 border-rose-700/30",
};
const ACTION_BADGE: Record<string, string> = {
  INSERT:           "bg-green-500/20 text-green-400",
  UPDATE:           "bg-blue-500/20 text-blue-400",
  DELETE:           "bg-red-500/20 text-red-400",
  ATTACH:           "bg-emerald-500/20 text-emerald-400",
  STATUS_CHANGE:    "bg-amber-500/20 text-amber-400",
  OWNERSHIP_CHANGE: "bg-violet-500/20 text-violet-400",
  ITEM_ADD:         "bg-sky-500/20 text-sky-400",
  ITEM_EDIT:        "bg-indigo-500/20 text-indigo-400",
  ITEM_DELETE:      "bg-pink-500/20 text-pink-400",
};

// ── Action definitions ───────────────────────────────────────
const ACTIONS = [
  { id: "returned",  label: "Returned",  icon: RotateCcw, newStatus: "Returned",  color: "text-blue-400",   btnClass: "border-blue-500/40 text-blue-400 hover:bg-blue-500/10" },
  { id: "writeoff",  label: "Write Off", icon: ShieldOff, newStatus: "WriteOff",  color: "text-orange-400", btnClass: "border-orange-500/40 text-orange-400 hover:bg-orange-500/10" },
  { id: "replaced",  label: "Replaced",  icon: Repeat2,   newStatus: "Replaced",  color: "text-purple-400", btnClass: "border-purple-500/40 text-purple-400 hover:bg-purple-500/10" },
  { id: "condemned", label: "Condemned", icon: Skull,     newStatus: "Condemned", color: "text-rose-400",   btnClass: "border-rose-500/40 text-rose-400 hover:bg-rose-500/10" },
  { id: "backin",    label: "Back In",   icon: RefreshCw, newStatus: "BackIn",    color: "text-cyan-400",   btnClass: "border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10" },
  { id: "cancelled", label: "Cancel",    icon: Trash2,    newStatus: "Cancelled", color: "text-red-400",    btnClass: "border-red-500/40 text-red-400 hover:bg-red-500/10" },
];

// ── Item diff viewer — parses tags_with_serials JSON ─────────
function ItemDiffViewer({ before, after }: { before: string | null; after: string | null }) {
  const parse = (s: string | null): unknown => { try { return s ? JSON.parse(s) : null; } catch { return s; } };
  const b = parse(before);
  const a = parse(after);

  // If after is an array of items (ATTACH transaction)
  const renderItemTable = (items: unknown, label: string, colour: string) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    return (
      <div className="mb-3">
        <p className={`text-xs font-semibold mb-1 ${colour}`}>{label}</p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left py-1 px-2 font-medium text-muted-foreground">Code</th>
              <th className="text-left py-1 px-2 font-medium text-muted-foreground">Name</th>
              <th className="text-left py-1 px-2 font-medium text-muted-foreground">Qty</th>
              <th className="text-left py-1 px-2 font-medium text-muted-foreground">Serial Numbers</th>
              <th className="text-left py-1 px-2 font-medium text-muted-foreground">Lease Date</th>
              <th className="text-left py-1 px-2 font-medium text-muted-foreground">Warranty Expiry</th>
            </tr>
          </thead>
          <tbody>
            {(items as Record<string,unknown>[]).map((item, i) => (
              <tr key={i} className="border-b border-border/40">
                <td className="py-1 px-2 font-mono text-[#e60000]">{String(item.code ?? "—")}</td>
                <td className="py-1 px-2">{String(item.name ?? "—")}</td>
                <td className="py-1 px-2 text-center">{String(item.qty ?? 1)}</td>
                <td className="py-1 px-2 font-mono">
                  {Array.isArray(item.serialNumbers)
                    ? (item.serialNumbers as string[]).filter(Boolean).join(", ") || <span className="text-muted-foreground italic">—</span>
                    : <span className="text-muted-foreground italic">—</span>}
                </td>
                <td className="py-1 px-2">{String(item.leaseDate ?? "—")}</td>
                <td className="py-1 px-2">{String(item.warrantyExpiry ?? "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ATTACH: before=null, after=array
  if (!b && Array.isArray(a)) {
    return <div>{renderItemTable(a, "Items Attached", "text-green-400")}</div>;
  }

  // STATUS_CHANGE: both are objects with status field
  if (b && typeof b === "object" && !Array.isArray(b) && a && typeof a === "object" && !Array.isArray(a)) {
    const bObj = b as Record<string,unknown>;
    const aObj = a as Record<string,unknown>;
    const allKeys = Array.from(new Set([...Object.keys(bObj), ...Object.keys(aObj)]));
    const str = (v: unknown) => v === undefined || v === null ? "—" : String(v);
    return (
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-1 pr-3 text-muted-foreground font-medium w-32">Field</th>
            <th className="text-left py-1 pr-3 text-red-400 font-medium">Before</th>
            <th className="text-left py-1 text-green-400 font-medium">After</th>
          </tr>
        </thead>
        <tbody>
          {allKeys.map(k => {
            const bv = str(bObj[k]); const av = str(aObj[k]);
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
    );
  }

  // Fallback: raw display
  return (
    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
      {before && <div className="bg-red-500/10 border border-red-500/20 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap text-red-300">{before}</div>}
      {after  && <div className="bg-green-500/10 border border-green-500/20 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap text-green-300">{after}</div>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function SubAssetTransactionLog() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // ── Step 1: Lease selection ──────────────────────────────
  const [selectedLeaseId,  setSelectedLeaseId]  = useState<string>("none");
  const [selectedLeaseRef, setSelectedLeaseRef] = useState<string>("");

  // ── Step 2: Sub-Asset Set selection ─────────────────────
  const [selectedSetRecordId, setSelectedSetRecordId] = useState<string>("none"); // lease_sub_asset_id
  const [selectedSetRecord,   setSelectedSetRecord]   = useState<Record<string,unknown> | null>(null);

  // ── Filters ──────────────────────────────────────────────
  const [filterAction,   setFilterAction]   = useState<string>("all");
  const [filterUser,     setFilterUser]     = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo,   setFilterDateTo]   = useState<string>("");
  const [expandedRow,    setExpandedRow]    = useState<number | null>(null);

  // ── Action dialog ─────────────────────────────────────────
  const [actionDialog, setActionDialog] = useState<{
    open: boolean; actionId: string; label: string; newStatus: string;
  }>({ open: false, actionId: "", label: "", newStatus: "" });
  const [actionDate,    setActionDate]    = useState<string>("");
  const [actionReason,  setActionReason]  = useState<string>("");
  const [actionNotes,   setActionNotes]   = useState<string>("");
  const [actionReplaceSet, setActionReplaceSet] = useState<string>("none");

  // ── Queries ───────────────────────────────────────────────
  const { data: leaseList = [] } = trpc.asset.getLeaseList.useQuery();

  // Sets attached to selected lease
  const leaseSelected = selectedLeaseId !== "none";
  const { data: leaseSets = [], refetch: refetchSets } = trpc.asset.getLeaseSubAssets.useQuery(
    { leaseId: selectedLeaseId },
    { enabled: leaseSelected }
  );

  // All available sets (for Replace action)
  const { data: allAvailSets = [] } = trpc.asset.getSubAssetGroups.useQuery();

  // Transaction history
  const txnInput = useMemo(() => ({
    entityId:  selectedSetRecord ? Number((selectedSetRecord as any).leaseSubAssetId) : undefined,
    action:    filterAction !== "all" ? filterAction : undefined,
    changedBy: filterUser.trim() || undefined,
    dateFrom:  filterDateFrom || undefined,
    dateTo:    filterDateTo   || undefined,
  }), [selectedSetRecord, filterAction, filterUser, filterDateFrom, filterDateTo]);

  const setSelected = selectedSetRecordId !== "none";
  const {
    data: txnData,
    isLoading: txnLoading,
    refetch: refetchTxns,
    isFetching: txnFetching,
  } = trpc.asset.getSubAssetTxns.useQuery(txnInput, { enabled: leaseSelected });

  const txns = ((txnData as any)?.rows ?? []) as any[];

  // ── Mutations ─────────────────────────────────────────────
  const statusMutation = trpc.asset.updateSubAssetStatus.useMutation({
    onSuccess: () => {
      toast.success(`Status updated to ${actionDialog.newStatus}`);
      closeActionDialog();
      refetchTxns();
      refetchSets();
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Handlers ─────────────────────────────────────────────
  function handleLeaseChange(leaseId: string) {
    setSelectedLeaseId(leaseId);
    const lease = (leaseList as any[]).find((l: any) => String(l.leaseId) === leaseId);
    setSelectedLeaseRef(lease?.leaseRef ?? "");
    setSelectedSetRecordId("none");
    setSelectedSetRecord(null);
    setExpandedRow(null);
  }

  function handleSetChange(recordId: string) {
    setSelectedSetRecordId(recordId);
    const rec = (leaseSets as any[]).find((s: any) => String(s.leaseSubAssetId) === recordId);
    setSelectedSetRecord(rec ?? null);
    setExpandedRow(null);
  }

  function openAction(actionId: string) {
    if (!setSelected) { toast.error("Select a Sub-Asset Set first"); return; }
    const a = ACTIONS.find(x => x.id === actionId);
    if (!a) return;
    setActionDate(new Date().toISOString().split("T")[0]);
    setActionReason("");
    setActionNotes("");
    setActionReplaceSet("none");
    setActionDialog({ open: true, actionId, label: a.label, newStatus: a.newStatus });
  }

  function closeActionDialog() {
    setActionDialog({ open: false, actionId: "", label: "", newStatus: "" });
  }

  async function confirmAction() {
    if (!selectedSetRecord) return;
    const rec = selectedSetRecord as any;
    await statusMutation.mutateAsync({
      leaseSubAssetId: rec.leaseSubAssetId,
      newStatus: actionDialog.newStatus as "Active" | "Cancelled" | "Returned" | "BackIn" | "Replaced" | "WriteOff" | "Condemned",
      statusDate: actionDate || new Date().toISOString().split("T")[0],
      reason: actionReason || undefined,
      notes: actionNotes || undefined,
      replacedByAssetId: actionReplaceSet !== "none" ? parseInt(actionReplaceSet) : undefined,
    });
  }

  function clearFilters() {
    setFilterAction("all");
    setFilterUser("");
    setFilterDateFrom("");
    setFilterDateTo("");
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <ScreenHeader
          screenId="VFLSEASTTXN0001P001"
          title="Sub-Asset Transaction Log"
          subtitle="Audit trail for all sub-asset operations on a lease"
          actions={
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setLocation("/sub-asset-registry")}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sub-Asset Registry
            </Button>
          }
        />

        <div className="flex-1 overflow-auto p-4 space-y-4">

          {/* ── Step 1 & 2: Selectors ─────────────────────── */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Step 1 — Select Lease &amp; Sub-Asset Set</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lease Number */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Lease Number <span className="text-red-400">*</span>
                </Label>
                <Select value={selectedLeaseId} onValueChange={handleLeaseChange}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="— Select a lease —" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="none">— Select a lease —</SelectItem>
                    {(leaseList as any[]).map((l: any) => (
                      <SelectItem key={l.leaseId} value={String(l.leaseId)}>
                        <span className="font-mono text-[#e60000] mr-2">{l.leaseRef}</span>
                        <span className="text-muted-foreground">{l.assetName}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sub-Asset Set */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Sub-Asset Set
                  {!leaseSelected && <span className="text-muted-foreground italic font-normal">(select a lease first)</span>}
                </Label>
                <Select
                  value={selectedSetRecordId}
                  onValueChange={handleSetChange}
                  disabled={!leaseSelected}
                >
                  <SelectTrigger className="bg-background border-border disabled:opacity-50">
                    <SelectValue placeholder={leaseSelected ? "— Select a set —" : "— Select a lease first —"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="none">— All sets on this lease —</SelectItem>
                    {(leaseSets as any[]).map((s: any) => (
                      <SelectItem key={s.leaseSubAssetId} value={String(s.leaseSubAssetId)}>
                        <span className="font-mono text-[#e60000] mr-2">{s.assetCode}</span>
                        <span>{s.setName}</span>
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] border ${STATUS_BADGE[s.status] ?? "bg-muted text-muted-foreground"}`}>{s.status}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selected set info card */}
            {selectedSetRecord && (() => {
              const rec = selectedSetRecord as any;
              return (
                <div className="bg-muted/20 border border-border rounded-md p-3 flex flex-wrap items-center gap-4 text-xs">
                  <div><span className="text-muted-foreground">Set Code:</span> <span className="font-mono text-[#e60000] font-semibold">{rec.assetCode}</span></div>
                  <div><span className="text-muted-foreground">Set Name:</span> <span className="font-medium">{rec.setName}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <span className={`ml-1 px-2 py-0.5 rounded border text-[10px] ${STATUS_BADGE[rec.status] ?? "bg-muted text-muted-foreground"}`}>{rec.status}</span></div>
                  <div><span className="text-muted-foreground">Ownership:</span> <span className="font-medium">{rec.ownership ?? "Lease"}</span></div>
                  {rec.statusDate && <div><span className="text-muted-foreground">Status Date:</span> <span>{rec.statusDate}</span></div>}
                </div>
              );
            })()}
          </div>

          {/* ── Action Toolbar ────────────────────────────── */}
          {leaseSelected && (
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
                Step 2 — Record a Transaction
                {!setSelected && <span className="ml-2 text-amber-400 normal-case">(select a Sub-Asset Set above to enable actions)</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {ACTIONS.map(a => {
                  const Icon = a.icon;
                  return (
                    <Button
                      key={a.id}
                      size="sm"
                      variant="outline"
                      className={`h-8 gap-1.5 text-xs ${a.btnClass} ${!setSelected ? "opacity-40 cursor-not-allowed" : ""}`}
                      onClick={() => openAction(a.id)}
                      disabled={!setSelected}
                    >
                      <Icon className="w-3.5 h-3.5" /> {a.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Filters ───────────────────────────────────── */}
          {leaseSelected && (
            <div className="bg-card border border-border rounded-lg p-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Filter Transaction History</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Action</Label>
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger className="h-8 text-xs bg-background border-border">
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {["INSERT","UPDATE","DELETE","ATTACH","STATUS_CHANGE","OWNERSHIP_CHANGE","ITEM_ADD","ITEM_EDIT","ITEM_DELETE"].map(a => (
                        <SelectItem key={a} value={a}>{a.replace(/_/g," ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Changed By</Label>
                  <Input className="h-8 text-xs bg-background border-border" placeholder="User name..." value={filterUser} onChange={e => setFilterUser(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Date From</Label>
                  <Input type="date" className="h-8 text-xs bg-background border-border" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Date To</Label>
                  <Input type="date" className="h-8 text-xs bg-background border-border" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="h-8 gap-1.5 text-xs bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => refetchTxns()} disabled={txnFetching}>
                  <Filter className="w-3.5 h-3.5" /> Apply Filters
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={clearFilters}>
                  <X className="w-3.5 h-3.5" /> Clear
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs ml-auto" onClick={() => { refetchTxns(); refetchSets(); }} disabled={txnFetching}>
                  <RefreshCw className={`w-3.5 h-3.5 ${txnFetching ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>
            </div>
          )}

          {/* ── Transaction History Table ─────────────────── */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium">
                Transaction History
                {txns.length > 0 && <span className="ml-2 text-xs text-muted-foreground">{txns.length} record{txns.length !== 1 ? "s" : ""}</span>}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left py-2 pl-4 pr-2 font-medium w-4"></th>
                    <th className="text-left py-2 px-2 font-medium">Txn ID</th>
                    <th className="text-left py-2 px-2 font-medium">Action</th>
                    <th className="text-left py-2 px-2 font-medium">Entity</th>
                    <th className="text-left py-2 px-2 font-medium">Changed By</th>
                    <th className="text-left py-2 px-2 font-medium">Changed At</th>
                    <th className="text-left py-2 pl-2 pr-4 font-medium">Screen</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Empty states */}
                  {!leaseSelected && (
                    <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Select a Lease Number above to view its transaction history.</p>
                    </td></tr>
                  )}
                  {leaseSelected && txnLoading && (
                    <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Loading transactions…</td></tr>
                  )}
                  {leaseSelected && !txnLoading && txns.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No transactions found for the selected filters.</td></tr>
                  )}

                  {/* Data rows */}
                  {leaseSelected && (txns as any[]).flatMap((t: any) => {
                    const isExpanded = expandedRow === t.txnId;
                    return [
                      <tr
                        key={`row-${t.txnId}`}
                        className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors"
                        onClick={() => setExpandedRow(isExpanded ? null : t.txnId)}
                      >
                        <td className="py-2 pl-4 pr-2">
                          {isExpanded
                            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                        </td>
                        <td className="py-2 px-2 font-mono text-muted-foreground">#{t.txnId}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_BADGE[t.action] ?? "bg-muted text-muted-foreground"}`}>
                            {t.action?.replace(/_/g," ")}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <span className="font-mono text-[#e60000] text-xs">{t.entityCode ?? `ID:${t.entityId}`}</span>
                          {t.entityName && <span className="ml-1 text-muted-foreground text-xs">· {t.entityName}</span>}
                        </td>
                        <td className="py-2 px-2 text-muted-foreground text-xs">{t.changedBy ?? "—"}</td>
                        <td className="py-2 px-2 text-muted-foreground text-xs">{t.changedAt ? new Date(t.changedAt).toLocaleString() : "—"}</td>
                        <td className="py-2 pl-2 pr-4 text-muted-foreground font-mono text-[10px]">{t.screenId ?? "—"}</td>
                      </tr>,
                      ...(isExpanded ? [
                        <tr key={`exp-${t.txnId}`} className="border-b border-border/50 bg-muted/10">
                          <td colSpan={7} className="py-3 px-6">
                            <ItemDiffViewer before={t.beforeJson} after={t.afterJson} />
                          </td>
                        </tr>
                      ] : []),
                    ];
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* ── Action Dialog ──────────────────────────────────── */}
      <Dialog open={actionDialog.open} onOpenChange={open => !open && closeActionDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(() => {
                const a = ACTIONS.find(x => x.id === actionDialog.actionId);
                if (!a) return null;
                const Icon = a.icon;
                return <><Icon className={`w-4 h-4 ${a.color}`} /> {a.label} Sub-Asset</>;
              })()}
            </DialogTitle>
          </DialogHeader>

          {selectedSetRecord && (() => {
            const rec = selectedSetRecord as any;
            return (
              <div className="bg-muted/20 border border-border rounded-md p-3 text-xs mb-2">
                <span className="font-mono text-[#e60000] font-semibold">{rec.assetCode}</span>
                <span className="mx-2 text-muted-foreground">·</span>
                <span>{rec.setName}</span>
                <span className={`ml-3 px-2 py-0.5 rounded border text-[10px] ${STATUS_BADGE[rec.status] ?? "bg-muted text-muted-foreground"}`}>{rec.status}</span>
              </div>
            );
          })()}

          <div className="space-y-3 py-1">
            <div>
              <Label className="text-xs text-muted-foreground">Transaction Date <span className="text-red-400">*</span></Label>
              <Input type="date" className="mt-1 bg-background border-border" value={actionDate} onChange={e => setActionDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Reason</Label>
              <Input className="mt-1 bg-background border-border" placeholder="Reason for this action..." value={actionReason} onChange={e => setActionReason(e.target.value)} />
            </div>
            {actionDialog.actionId === "replaced" && (
              <div>
                <Label className="text-xs text-muted-foreground">Replacement Set</Label>
                <Select value={actionReplaceSet} onValueChange={setActionReplaceSet}>
                  <SelectTrigger className="mt-1 bg-background border-border">
                    <SelectValue placeholder="— Select replacement set —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Select replacement set —</SelectItem>
                    {(allAvailSets as any[]).map((s: any) => (
                      <SelectItem key={s.assetId} value={String(s.assetId)}>
                        {s.assetCode} · {s.setName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
              <Input className="mt-1 bg-background border-border" placeholder="Additional notes..." value={actionNotes} onChange={e => setActionNotes(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={closeActionDialog}>Cancel</Button>
            <Button
              size="sm"
              className="bg-[#e60000] hover:bg-[#cc0000] text-white"
              onClick={confirmAction}
              disabled={statusMutation.isPending || !actionDate}
            >
              {statusMutation.isPending ? "Saving…" : `Confirm ${actionDialog.label}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
