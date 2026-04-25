/**
 * VodaLease Enterprise — Sub-Asset Transaction Log
 * Screen ID: VFLSEASTTXN0001P001
 *
 * Full audit trail for all sub-asset operations on a lease.
 * Filters: Lease Number, Sub-Asset Set, Action, Entity Type, Changed By, Date range.
 * Action toolbar: Add (Attach), Edit (Status), Delete, Returned, Write Off, Replaced, Condemned.
 * Ownership toggle per record: Lease ↔ Lessor.
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, RefreshCw, Filter, X, ChevronDown, ChevronRight,
  Plus, Pencil, Trash2, RotateCcw, ShieldOff, Repeat2, Skull,
  Building2, FileText, Package,
} from "lucide-react";

// ── Status badge colours ─────────────────────────────────────
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
  { id: "add",       label: "Add",       icon: Plus,      status: null,        color: "text-green-400",  desc: "Attach a new sub-asset set to this lease" },
  { id: "edit",      label: "Edit",      icon: Pencil,    status: null,        color: "text-blue-400",   desc: "Edit status or details of selected record" },
  { id: "delete",    label: "Delete",    icon: Trash2,    status: "Cancelled", color: "text-red-400",    desc: "Cancel / remove selected sub-asset from lease" },
  { id: "returned",  label: "Returned",  icon: RotateCcw, status: "Returned",  color: "text-blue-400",   desc: "Mark as returned to lessor" },
  { id: "writeoff",  label: "Write Off", icon: ShieldOff, status: "WriteOff",  color: "text-orange-400", desc: "Write off — asset lost or unrecoverable" },
  { id: "replaced",  label: "Replaced",  icon: Repeat2,   status: "Replaced",  color: "text-purple-400", desc: "Replace with another asset" },
  { id: "condemned", label: "Condemned", icon: Skull,     status: "Condemned", color: "text-rose-400",   desc: "Condemn — asset beyond repair" },
];

// ── JSON Diff Viewer ─────────────────────────────────────────
function JsonDiffViewer({ before, after }: { before: string | null; after: string | null }) {
  const parse = (s: string | null) => { try { return s ? JSON.parse(s) : null; } catch { return s; } };
  const b = parse(before); const a = parse(after);
  if (!b && !a) return <p className="text-xs text-muted-foreground italic">No snapshot data</p>;
  const allKeys = Array.from(new Set([
    ...(b && typeof b === "object" ? Object.keys(b) : []),
    ...(a && typeof a === "object" ? Object.keys(a) : []),
  ]));
  if (typeof b !== "object" || typeof a !== "object") {
    return (
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        {before && <div className="bg-red-500/10 border border-red-500/20 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap text-red-300">{before}</div>}
        {after  && <div className="bg-green-500/10 border border-green-500/20 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap text-green-300">{after}</div>}
      </div>
    );
  }
  const str = (v: unknown) => v === undefined || v === null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v);
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
          const bv = str((b as any)?.[k]); const av = str((a as any)?.[k]);
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

// ── Main Component ────────────────────────────────────────────
export default function SubAssetTransactionLog() {
  const [, setLocation] = useLocation();

  // ── Filter state ─────────────────────────────────────────────
  const [filterLeaseId,   setFilterLeaseId]   = useState<string>("all");
  const [filterSetId,     setFilterSetId]     = useState<string>("all");
  const [filterAction,    setFilterAction]    = useState<string>("all");
  const [filterEntityType,setFilterEntityType]= useState<string>("all");
  const [filterUser,      setFilterUser]      = useState<string>("");
  const [filterDateFrom,  setFilterDateFrom]  = useState<string>("");
  const [filterDateTo,    setFilterDateTo]    = useState<string>("");
  const [expandedRow,     setExpandedRow]     = useState<number | null>(null);
  const [selectedId,      setSelectedId]      = useState<number | null>(null);

  // ── Action dialog state ───────────────────────────────────────
  const [actionDialog,    setActionDialog]    = useState<{ open: boolean; actionId: string; record: any | null }>({ open: false, actionId: "", record: null });
  const [actionReason,    setActionReason]    = useState("");
  const [actionDate,      setActionDate]      = useState(new Date().toISOString().split("T")[0]);
  const [actionNotes,     setActionNotes]     = useState("");
  const [actionReplaceSet,setActionReplaceSet]= useState<string>("none");

  // ── Data queries ─────────────────────────────────────────────
  const { data: leases = [] }  = trpc.asset.getLeaseList.useQuery();
  const { data: allSets = [] } = trpc.asset.getSubAssetGroups.useQuery();

  const txnInput = useMemo(() => ({
    entityType: filterEntityType !== "all" ? filterEntityType : undefined,
    action:     filterAction     !== "all" ? filterAction     : undefined,
    changedBy:  filterUser.trim() || undefined,
    dateFrom:   filterDateFrom   || undefined,
    dateTo:     filterDateTo     || undefined,
  }), [filterEntityType, filterAction, filterUser, filterDateFrom, filterDateTo]);

  const { data: txnData, isLoading, refetch, isFetching } = trpc.asset.getSubAssetTxns.useQuery(txnInput);
  const txnRaw = Array.isArray(txnData) ? txnData : (txnData as any)?.rows ?? [];

  const { data: leaseSubAssets = [], refetch: refetchLSA } = trpc.asset.getLeaseSubAssets.useQuery(
    { leaseId: filterLeaseId !== "all" ? filterLeaseId : "" },
    { enabled: filterLeaseId !== "all" }
  );

  // ── Mutations ─────────────────────────────────────────────────
  const statusMut = trpc.asset.updateSubAssetStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); refetchLSA(); closeActionDialog(); },
    onError: e => toast.error("Error: " + e.message),
  });
  const ownerMut = trpc.asset.changeSubAssetOwnership.useMutation({
    onSuccess: () => { toast.success("Ownership updated"); refetch(); refetchLSA(); },
    onError: e => toast.error("Error: " + e.message),
  });
  const attachMut = trpc.asset.attachSubAssetToLease.useMutation({
    onSuccess: () => { toast.success("Set attached to lease"); refetch(); refetchLSA(); closeActionDialog(); },
    onError: e => toast.error("Error: " + e.message),
  });

  // ── Filtered txns ─────────────────────────────────────────────
  const txns = useMemo(() => {
    let list = txnRaw as any[];
    if (filterLeaseId !== "all") {
      const leaseSetIds = new Set((leaseSubAssets as any[]).map((lsa: any) => lsa.leaseSubAssetId));
      list = list.filter(t => leaseSetIds.has(t.entityId));
    }
    if (filterSetId !== "all") {
      list = list.filter(t => String(t.entityId) === filterSetId);
    }
    return list;
  }, [txnRaw, filterLeaseId, filterSetId, leaseSubAssets]);

  const selectedRecord = useMemo(() =>
    (leaseSubAssets as any[]).find((lsa: any) => lsa.leaseSubAssetId === selectedId) ?? null,
    [leaseSubAssets, selectedId]
  );

  const selectedLease = (leases as any[]).find((l: any) => l.leaseId === filterLeaseId);

  function openActionDialog(actionId: string) {
    if (actionId === "add") {
      setActionDialog({ open: true, actionId, record: null });
    } else {
      if (!selectedRecord) { toast.warning("Select a sub-asset record first from the grid above"); return; }
      setActionDialog({ open: true, actionId, record: selectedRecord });
    }
    setActionReason(""); setActionDate(new Date().toISOString().split("T")[0]);
    setActionNotes(""); setActionReplaceSet("none");
  }
  function closeActionDialog() { setActionDialog({ open: false, actionId: "", record: null }); }

  function submitAction() {
    const { actionId, record } = actionDialog;
    const actionDef = ACTIONS.find(a => a.id === actionId);
    if (!actionDef) return;
    if (actionId === "add") {
      if (filterLeaseId === "all") { toast.warning("Select a lease first using the Lease Number filter"); return; }
      if (actionReplaceSet === "none") { toast.warning("Select a sub-asset set to attach"); return; }
      const set = (allSets as any[]).find((s: any) => String(s.assetId) === actionReplaceSet);
      if (!set) return;
      attachMut.mutate({ leaseId: filterLeaseId, assetId: set.assetId, assetCode: set.assetCode, setName: set.setName, tagsWithSerials: set.tags });
      return;
    }
    if (!record) return;
    statusMut.mutate({
      leaseSubAssetId:   record.leaseSubAssetId,
      newStatus:         (actionDef.status ?? "Cancelled") as "Active" | "Cancelled" | "Returned" | "BackIn" | "Replaced" | "WriteOff" | "Condemned",
      statusDate:        actionDate,
      reason:            actionReason || undefined,
      replacedByAssetId: actionReplaceSet !== "none" ? Number(actionReplaceSet) : undefined,
      notes:             actionNotes || undefined,
    });
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-auto p-6 space-y-4">
          <ScreenHeader
            screenId="VFLSEASTTXN0001P001"
            title="Sub-Asset Transaction Log"
            subtitle="Full audit trail — Add, Edit, Status changes, Ownership transfers"
          />

          {/* Back link */}
          <button
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setLocation("/sub-asset-registry")}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sub-Asset Registry
          </button>

          {/* ── Action Toolbar ──────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 border border-border rounded-lg">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Actions:</span>
            {ACTIONS.map(a => {
              const Icon = a.icon;
              const disabled = a.id !== "add" && !selectedRecord;
              return (
                <Button
                  key={a.id}
                  size="sm"
                  variant="outline"
                  className={`h-8 gap-1.5 text-xs ${a.color} border-border bg-transparent hover:bg-muted/60 disabled:opacity-40`}
                  disabled={disabled}
                  title={a.desc}
                  onClick={() => openActionDialog(a.id)}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {a.label}
                </Button>
              );
            })}
            {/* Ownership toggle — shown when a record is selected */}
            {selectedRecord && (
              <div className="ml-auto flex items-center gap-2 border border-border rounded px-2 py-1 bg-muted/40">
                <span className="text-xs text-muted-foreground">Ownership:</span>
                <button
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    (selectedRecord as any).ownership !== "Lessor"
                      ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                  onClick={() => ownerMut.mutate({ leaseSubAssetId: (selectedRecord as any).leaseSubAssetId, ownership: "Lease" })}
                >
                  <FileText className="w-3 h-3" /> Lease
                </button>
                <button
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    (selectedRecord as any).ownership === "Lessor"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                  onClick={() => ownerMut.mutate({ leaseSubAssetId: (selectedRecord as any).leaseSubAssetId, ownership: "Lessor" })}
                >
                  <Building2 className="w-3 h-3" /> Lessor
                </button>
              </div>
            )}
          </div>

          {/* ── Filters ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-2 p-3 bg-muted/20 border border-border rounded-lg">
            {/* Lease Number */}
            <div className="xl:col-span-2">
              <Label className="text-xs text-muted-foreground mb-1 block">Lease Number</Label>
              <Select value={filterLeaseId} onValueChange={v => { setFilterLeaseId(v); setFilterSetId("all"); setSelectedId(null); }}>
                <SelectTrigger className="h-8 text-xs bg-background border-border">
                  <SelectValue placeholder="All Leases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leases</SelectItem>
                  {(leases as any[]).map((l: any) => (
                    <SelectItem key={l.leaseId} value={l.leaseId}>
                      {l.leaseRef}{l.assetName ? ` — ${l.assetName}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sub-Asset Set */}
            <div className="xl:col-span-2">
              <Label className="text-xs text-muted-foreground mb-1 block">Sub-Asset Set</Label>
              <Select value={filterSetId} onValueChange={setFilterSetId}>
                <SelectTrigger className="h-8 text-xs bg-background border-border">
                  <SelectValue placeholder="All Sets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sets</SelectItem>
                  {(allSets as any[]).map((s: any) => (
                    <SelectItem key={s.assetId} value={String(s.assetId)}>
                      {s.assetCode} · {s.setName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action */}
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

            {/* Changed By */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Changed By</Label>
              <Input className="h-8 text-xs bg-background border-border" placeholder="User name..." value={filterUser} onChange={e => setFilterUser(e.target.value)} />
            </div>

            {/* Date From */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Date From</Label>
              <Input type="date" className="h-8 text-xs bg-background border-border" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
            </div>

            {/* Date To */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Date To</Label>
              <Input type="date" className="h-8 text-xs bg-background border-border" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
            </div>

            {/* Buttons */}
            <div className="xl:col-span-7 flex gap-2 pt-1">
              <Button size="sm" className="h-8 gap-1.5 text-xs bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => refetch()} disabled={isFetching}>
                <Filter className="w-3.5 h-3.5" /> Apply Filters
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => {
                setFilterLeaseId("all"); setFilterSetId("all"); setFilterAction("all");
                setFilterEntityType("all"); setFilterUser(""); setFilterDateFrom(""); setFilterDateTo(""); setSelectedId(null);
              }}>
                <X className="w-3.5 h-3.5" /> Clear
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs ml-auto" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>
          </div>

          {/* ── Lease Sub-Assets Grid (when lease selected) ── */}
          {filterLeaseId !== "all" && (leaseSubAssets as any[]).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Sub-Asset Sets on <span className="text-foreground">{selectedLease?.leaseRef ?? filterLeaseId}</span>
                <span className="ml-2 font-normal">— click a row to select for actions</span>
              </p>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30 text-muted-foreground border-b border-border">
                      <th className="text-left py-2 pl-4 pr-2 font-medium w-4"></th>
                      <th className="text-left py-2 px-2 font-medium">Set Code</th>
                      <th className="text-left py-2 px-2 font-medium">Set Name</th>
                      <th className="text-left py-2 px-2 font-medium">Status</th>
                      <th className="text-left py-2 px-2 font-medium">Ownership</th>
                      <th className="text-left py-2 px-2 font-medium">Status Date</th>
                      <th className="text-left py-2 px-2 font-medium">Reason</th>
                      <th className="text-left py-2 pl-2 pr-4 font-medium">Created By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(leaseSubAssets as any[]).map((lsa: any) => {
                      const isSel = selectedId === lsa.leaseSubAssetId;
                      return (
                        <tr
                          key={lsa.leaseSubAssetId}
                          className={`border-b border-border/50 last:border-0 cursor-pointer transition-colors ${isSel ? "bg-[#e60000]/10 border-l-2 border-l-[#e60000]" : "hover:bg-muted/30"}`}
                          onClick={() => setSelectedId(isSel ? null : lsa.leaseSubAssetId)}
                        >
                          <td className="py-2 pl-4 pr-2">
                            <div className={`w-3 h-3 rounded-full border-2 ${isSel ? "bg-[#e60000] border-[#e60000]" : "border-muted-foreground"}`} />
                          </td>
                          <td className="py-2 px-2 font-mono text-[#e60000]">{lsa.assetCode}</td>
                          <td className="py-2 px-2 font-medium">{lsa.setName}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${STATUS_BADGE[lsa.status] ?? "bg-muted text-muted-foreground"}`}>
                              {lsa.status}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${lsa.ownership === "Lessor" ? "bg-amber-500/20 text-amber-400" : "bg-sky-500/20 text-sky-400"}`}>
                              {lsa.ownership ?? "Lease"}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">{lsa.statusDate ? new Date(lsa.statusDate).toLocaleDateString() : "—"}</td>
                          <td className="py-2 px-2 text-muted-foreground truncate max-w-[160px]">{lsa.reason ?? "—"}</td>
                          <td className="py-2 pl-2 pr-4 text-muted-foreground">{lsa.createdBy ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Transaction Log Table ─────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Transaction History
              {txns.length > 0 && <span className="ml-2 text-foreground">{txns.length} record{txns.length !== 1 ? "s" : ""}</span>}
            </p>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground border-b border-border">
                    <th className="text-left py-2 pl-4 pr-2 font-medium w-4"></th>
                    <th className="text-left py-2 px-2 font-medium">Txn ID</th>
                    <th className="text-left py-2 px-2 font-medium">Action</th>
                    <th className="text-left py-2 px-2 font-medium">Entity Type</th>
                    <th className="text-left py-2 px-2 font-medium">Entity</th>
                    <th className="text-left py-2 px-2 font-medium">Changed By</th>
                    <th className="text-left py-2 px-2 font-medium">Changed At</th>
                    <th className="text-left py-2 pl-2 pr-4 font-medium">Screen</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Loading transactions…</td></tr>
                  )}
                  {!isLoading && txns.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No transactions found for the selected filters.</td></tr>
                  )}
                  {(txns as any[]).flatMap((t: any) => {
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
                        <td className="py-2 px-2 text-muted-foreground">{t.entityType}</td>
                        <td className="py-2 px-2">
                          <span className="font-mono text-[#e60000]">{t.entityCode ?? `ID:${t.entityId}`}</span>
                          {t.entityName && <span className="ml-1 text-muted-foreground">· {t.entityName}</span>}
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">{t.changedBy ?? "—"}</td>
                        <td className="py-2 px-2 text-muted-foreground">{t.changedAt ? new Date(t.changedAt).toLocaleString() : "—"}</td>
                        <td className="py-2 pl-2 pr-4 text-muted-foreground font-mono text-[10px]">{t.screenId ?? "—"}</td>
                      </tr>,
                      ...(isExpanded ? [
                        <tr key={`exp-${t.txnId}`} className="border-b border-border/50 bg-muted/10">
                          <td colSpan={8} className="py-3 px-6">
                            <JsonDiffViewer before={t.beforeJson} after={t.afterJson} />
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

          <div className="space-y-3 py-2">
            {actionDialog.actionId === "add" ? (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Sub-Asset Set to Attach <span className="text-red-400">*</span></Label>
                  <Select value={actionReplaceSet} onValueChange={setActionReplaceSet}>
                    <SelectTrigger className="mt-1 bg-background border-border">
                      <SelectValue placeholder="— Select a set —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Select a set —</SelectItem>
                      {(allSets as any[]).map((s: any) => (
                        <SelectItem key={s.assetId} value={String(s.assetId)}>
                          {s.assetCode} · {s.setName} ({s.itemCount} items)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
                  <Input className="mt-1 bg-background border-border" placeholder="Attachment notes..." value={actionNotes} onChange={e => setActionNotes(e.target.value)} />
                </div>
              </>
            ) : (
              <>
                {actionDialog.record && (
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded border border-border text-xs">
                    <Package className="w-4 h-4 text-[#e60000]" />
                    <span className="font-mono text-[#e60000]">{(actionDialog.record as any).assetCode}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-medium">{(actionDialog.record as any).setName}</span>
                    <span className={`ml-auto px-2 py-0.5 rounded border text-xs ${STATUS_BADGE[(actionDialog.record as any).status] ?? ""}`}>
                      {(actionDialog.record as any).status}
                    </span>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Effective Date <span className="text-red-400">*</span></Label>
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
                        {(allSets as any[]).map((s: any) => (
                          <SelectItem key={s.assetId} value={String(s.assetId)}>
                            {s.assetCode} · {s.setName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <Input className="mt-1 bg-background border-border" placeholder="Additional notes..." value={actionNotes} onChange={e => setActionNotes(e.target.value)} />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={closeActionDialog}>Cancel</Button>
            <Button
              size="sm"
              className="bg-[#e60000] hover:bg-[#cc0000] text-white"
              onClick={submitAction}
              disabled={statusMut.isPending || attachMut.isPending}
            >
              {statusMut.isPending || attachMut.isPending ? "Saving…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
