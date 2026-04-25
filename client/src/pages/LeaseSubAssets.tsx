import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Package, Plus, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, RotateCcw, ArrowLeftRight, Inbox,
  AlertTriangle, ScrollText
} from "lucide-react";
import { useLocation } from "wouter";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string; bg: string }> = {
  Active:    { label: "Active",    icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "text-green-400 border-green-500/30",  bg: "bg-green-500/10" },
  Cancelled: { label: "Cancelled", icon: <XCircle      className="w-3.5 h-3.5" />, cls: "text-red-400 border-red-500/30",      bg: "bg-red-500/10" },
  Returned:  { label: "Returned",  icon: <RotateCcw    className="w-3.5 h-3.5" />, cls: "text-amber-400 border-amber-500/30",  bg: "bg-amber-500/10" },
  BackIn:    { label: "Back In",   icon: <Inbox        className="w-3.5 h-3.5" />, cls: "text-blue-400 border-blue-500/30",    bg: "bg-blue-500/10" },
  Replaced:  { label: "Replaced",  icon: <ArrowLeftRight className="w-3.5 h-3.5" />, cls: "text-purple-400 border-purple-500/30", bg: "bg-purple-500/10" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, icon: null, cls: "text-muted-foreground border-border", bg: "bg-muted" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ── Item count helper ─────────────────────────────────────────────────────────
function parseItemCount(tags: string | null): number {
  if (!tags) return 0;
  try { return (JSON.parse(tags) as Array<{ qty: number }>).reduce((s, l) => s + (l.qty ?? 1), 0); } catch { return 0; }
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LeaseSubAssets() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Lease selector
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>("");
  const [leaseSearch, setLeaseSearch] = useState("");

  // Attach set dialog
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachAssetId, setAttachAssetId] = useState<string>("none");

  // Status change dialog
  const [statusDialogRow, setStatusDialogRow] = useState<null | {
    leaseSubAssetId: number; assetCode: string; setName: string; currentStatus: string;
  }>(null);
  const [newStatus, setNewStatus]         = useState<string>("Active");
  const [statusDate, setStatusDate]       = useState(() => new Date().toISOString().slice(0, 10));
  const [statusReason, setStatusReason]   = useState("");
  const [statusNotes, setStatusNotes]     = useState("");
  const [replacedById, setReplacedById]   = useState<string>("none");

  // Expanded row
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Queries
  const { data: leaseList = [], isLoading: loadingLeases } = trpc.asset.getLeaseList.useQuery();
  const filteredLeases = useMemo(() =>
    leaseList.filter(l =>
      !leaseSearch.trim() ||
      l.leaseRef.toLowerCase().includes(leaseSearch.toLowerCase()) ||
      l.leaseId.toLowerCase().includes(leaseSearch.toLowerCase()) ||
      l.assetName.toLowerCase().includes(leaseSearch.toLowerCase())
    ), [leaseList, leaseSearch]);

  const { data: subAssets = [], isLoading: loadingSubAssets, refetch: refetchSubAssets } =
    trpc.asset.getLeaseSubAssets.useQuery(
      { leaseId: selectedLeaseId },
      { enabled: !!selectedLeaseId }
    );

  const { data: availableSets = [] } = trpc.asset.getSubAssetGroups.useQuery();

  // Already-attached asset IDs for this lease (active only)
  const attachedActiveIds = new Set(subAssets.filter(s => s.status === "Active").map(s => s.assetId));

  // Mutations
  const attachMutation = trpc.asset.attachSubAssetToLease.useMutation({
    onSuccess: (data) => {
      if (data.message === "Already attached") {
        toast.warning("This set is already actively attached to this lease.");
      } else {
        toast.success("Sub-asset set attached successfully.");
        utils.asset.getLeaseSubAssets.invalidate({ leaseId: selectedLeaseId });
        utils.asset.getLeaseList.invalidate();
      }
      setAttachOpen(false);
      setAttachAssetId("none");
    },
    onError: (e) => toast.error("Attach failed: " + e.message),
  });

  const statusMutation = trpc.asset.updateSubAssetStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated successfully.");
      utils.asset.getLeaseSubAssets.invalidate({ leaseId: selectedLeaseId });
      setStatusDialogRow(null);
    },
    onError: (e) => toast.error("Status update failed: " + e.message),
  });

  function openStatusDialog(row: typeof statusDialogRow) {
    setStatusDialogRow(row);
    setNewStatus(row?.currentStatus === "Active" ? "Returned" : "Active");
    setStatusDate(new Date().toISOString().slice(0, 10));
    setStatusReason("");
    setStatusNotes("");
    setReplacedById("none");
  }

  function handleAttach() {
    if (attachAssetId === "none") { toast.error("Please select a set to attach."); return; }
    const set = availableSets.find(s => s.assetId === Number(attachAssetId));
    if (!set) return;
    const lease = leaseList.find(l => l.leaseId === selectedLeaseId);
    attachMutation.mutate({
      leaseId:   selectedLeaseId,
      leaseRef:  lease?.leaseRef ?? selectedLeaseId,
      assetId:   set.assetId,
      assetCode: set.assetCode,
      setName:   set.setName,
    });
  }

  function handleStatusSave() {
    if (!statusDialogRow) return;
    if (!statusDate) { toast.error("Status date is required."); return; }
    const replacedSet = replacedById !== "none" ? availableSets.find(s => s.assetId === Number(replacedById)) : null;
    statusMutation.mutate({
      leaseSubAssetId:   statusDialogRow.leaseSubAssetId,
      newStatus:         newStatus as any,
      statusDate,
      reason:            statusReason || undefined,
      replacedByAssetId: replacedSet?.assetId,
      replacedByCode:    replacedSet?.assetCode,
      notes:             statusNotes || undefined,
    });
  }

  const selectedLease = leaseList.find(l => l.leaseId === selectedLeaseId);

  // Summary counts
  const counts = useMemo(() => {
    const c: Record<string, number> = { Active: 0, Cancelled: 0, Returned: 0, BackIn: 0, Replaced: 0 };
    subAssets.forEach(s => { c[s.status] = (c[s.status] ?? 0) + 1; });
    return c;
  }, [subAssets]);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full gap-4 p-4 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-[#e60000]" />
              Lease Sub-Asset Registry
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              View and manage sub-asset sets attached to a lease — track status lifecycle (Active → Cancelled / Returned / Back-In / Replaced)
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"
            onClick={() => setLocation("/sub-asset-registry/transactions")}>
            <ScrollText className="w-3.5 h-3.5" /> Txn Log
          </Button>
        </div>

        {/* Lease Selector */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Search Lease</Label>
              <Input
                className="h-9 text-sm"
                placeholder="Type lease ref, ID, or property name..."
                value={leaseSearch}
                onChange={e => setLeaseSearch(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Select Lease *</Label>
              <Select value={selectedLeaseId} onValueChange={setSelectedLeaseId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={loadingLeases ? "Loading leases..." : "— Select a lease —"} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {filteredLeases.length === 0 && (
                    <SelectItem value="__none__" disabled>No leases found</SelectItem>
                  )}
                  {filteredLeases.map(l => (
                    <SelectItem key={l.leaseId} value={l.leaseId}>
                      <span className="font-mono text-xs text-[#e60000] mr-2">{l.leaseRef || l.leaseId}</span>
                      {l.assetName && <span className="text-muted-foreground">{l.assetName}</span>}
                      {l.lessorName && <span className="text-muted-foreground ml-1">· {l.lessorName}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedLeaseId && (
              <Button size="sm" className="h-9 bg-[#e60000] hover:bg-[#cc0000] text-white gap-1.5"
                onClick={() => setAttachOpen(true)}>
                <Plus className="w-4 h-4" /> Attach Set
              </Button>
            )}
            {selectedLeaseId && (
              <Button size="sm" variant="outline" className="h-9 gap-1.5"
                onClick={() => refetchSubAssets()}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Lease info strip */}
          {selectedLease && (
            <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span><strong className="text-foreground">Lease Ref:</strong> {selectedLease.leaseRef}</span>
              {selectedLease.assetName  && <span><strong className="text-foreground">Property:</strong> {selectedLease.assetName}</span>}
              {selectedLease.lessorName && <span><strong className="text-foreground">Lessor:</strong> {selectedLease.lessorName}</span>}
              <span><strong className="text-foreground">Status:</strong> {selectedLease.status}</span>
            </div>
          )}
        </div>

        {/* Summary badges */}
        {selectedLeaseId && subAssets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${cfg.bg} ${cfg.cls}`}>
                {cfg.icon}
                <span>{cfg.label}</span>
                <span className="ml-1 font-bold">{counts[key] ?? 0}</span>
              </div>
            ))}
          </div>
        )}

        {/* Sub-asset grid */}
        {!selectedLeaseId ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground py-16">
            <Package className="w-12 h-12 opacity-20" />
            <p className="text-base font-medium">Select a lease to view its sub-asset sets</p>
            <p className="text-sm">Use the dropdown above to choose a lease, then attach and manage sub-asset sets.</p>
          </div>
        ) : loadingSubAssets ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading sub-assets...
          </div>
        ) : subAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground py-16">
            <AlertTriangle className="w-10 h-10 opacity-20" />
            <p className="text-base font-medium">No sub-asset sets attached to this lease</p>
            <p className="text-sm">Click "Attach Set" to add furniture or appliance sets from the Sub-Asset Registry.</p>
            <Button size="sm" className="mt-2 bg-[#e60000] hover:bg-[#cc0000] text-white gap-1.5"
              onClick={() => setAttachOpen(true)}>
              <Plus className="w-4 h-4" /> Attach Set
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {subAssets.map(row => {
              const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.Active;
              const itemCount = parseItemCount(row.setTags);
              const isExpanded = expandedId === row.leaseSubAssetId;

              return (
                <div key={row.leaseSubAssetId}
                  className={`bg-card border rounded-xl overflow-hidden transition-all ${cfg.bg} border-opacity-50`}
                  style={{ borderColor: row.status === "Active" ? "rgba(34,197,94,0.3)" :
                    row.status === "Cancelled" ? "rgba(239,68,68,0.3)" :
                    row.status === "Returned"  ? "rgba(245,158,11,0.3)" :
                    row.status === "BackIn"    ? "rgba(59,130,246,0.3)" :
                    "rgba(168,85,247,0.3)" }}>

                  {/* Card header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-[#e60000] font-bold">{row.assetCode}</span>
                          <StatusBadge status={row.status} />
                        </div>
                        <p className="font-semibold text-sm leading-tight truncate">{row.setName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? "s" : ""}` : "Items in set"}
                          {row.statusDate && <span className="ml-2">· {row.status} since {row.statusDate}</span>}
                        </p>
                      </div>
                      <button
                        className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                        onClick={() => setExpandedId(isExpanded ? null : row.leaseSubAssetId)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Reason / replacement */}
                    {row.reason && (
                      <p className="text-xs text-muted-foreground mt-2 italic">Reason: {row.reason}</p>
                    )}
                    {row.replacedByCode && (
                      <p className="text-xs text-purple-400 mt-1">
                        Replaced by: <span className="font-mono font-bold">{row.replacedByCode}</span>
                      </p>
                    )}
                    {row.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{row.notes}</p>
                    )}
                  </div>

                  {/* Expanded: item list from tags */}
                  {isExpanded && row.setTags && (
                    <div className="border-t border-border/50 px-4 py-3 bg-muted/20">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Set Contents</p>
                      <div className="space-y-1 max-h-40 overflow-auto">
                        {(() => {
                          try {
                            const lines = JSON.parse(row.setTags) as Array<{ code: string; qty: number; serialNumbers?: string[] }>;
                            return lines.map((l, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="font-mono text-muted-foreground">{l.code}</span>
                                <span className="font-medium">× {l.qty}</span>
                                {l.serialNumbers?.filter(Boolean).length ? (
                                  <span className="text-muted-foreground truncate max-w-[120px]">
                                    SN: {l.serialNumbers.filter(Boolean).join(", ")}
                                  </span>
                                ) : null}
                              </div>
                            ));
                          } catch { return <p className="text-xs text-muted-foreground">Unable to parse items</p>; }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Expanded: audit trail */}
                  {isExpanded && (
                    <div className="border-t border-border/50 px-4 py-3 bg-muted/10">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span><strong className="text-foreground">Attached by:</strong> {row.createdBy}</span>
                        <span><strong className="text-foreground">Attached at:</strong> {row.createdAt?.slice(0, 16)}</span>
                        {row.updatedBy && <span><strong className="text-foreground">Updated by:</strong> {row.updatedBy}</span>}
                        {row.updatedAt && <span><strong className="text-foreground">Updated at:</strong> {row.updatedAt?.slice(0, 16)}</span>}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="px-4 pb-4 pt-2 flex gap-2 flex-wrap">
                    {row.status === "Active" && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                          onClick={() => openStatusDialog({ leaseSubAssetId: row.leaseSubAssetId, assetCode: row.assetCode, setName: row.setName, currentStatus: row.status })}>
                          <RotateCcw className="w-3 h-3" /> Return
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-red-500/40 text-red-400 hover:bg-red-500/10"
                          onClick={() => { openStatusDialog({ leaseSubAssetId: row.leaseSubAssetId, assetCode: row.assetCode, setName: row.setName, currentStatus: row.status }); setNewStatus("Cancelled"); }}>
                          <XCircle className="w-3 h-3" /> Cancel
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
                          onClick={() => { openStatusDialog({ leaseSubAssetId: row.leaseSubAssetId, assetCode: row.assetCode, setName: row.setName, currentStatus: row.status }); setNewStatus("Replaced"); }}>
                          <ArrowLeftRight className="w-3 h-3" /> Replace
                        </Button>
                      </>
                    )}
                    {(row.status === "Returned" || row.status === "Cancelled") && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                        onClick={() => { openStatusDialog({ leaseSubAssetId: row.leaseSubAssetId, assetCode: row.assetCode, setName: row.setName, currentStatus: row.status }); setNewStatus("BackIn"); }}>
                        <Inbox className="w-3 h-3" /> Back In
                      </Button>
                    )}
                    {row.status === "BackIn" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-green-500/40 text-green-400 hover:bg-green-500/10"
                        onClick={() => { openStatusDialog({ leaseSubAssetId: row.leaseSubAssetId, assetCode: row.assetCode, setName: row.setName, currentStatus: row.status }); setNewStatus("Active"); }}>
                        <CheckCircle2 className="w-3 h-3" /> Re-Activate
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground ml-auto"
                      onClick={() => openStatusDialog({ leaseSubAssetId: row.leaseSubAssetId, assetCode: row.assetCode, setName: row.setName, currentStatus: row.status })}>
                      Change Status
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Attach Set Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#e60000]" /> Attach Sub-Asset Set
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Lease</Label>
              <p className="text-sm font-medium">{selectedLease?.leaseRef ?? selectedLeaseId}</p>
              {selectedLease?.assetName && <p className="text-xs text-muted-foreground">{selectedLease.assetName}</p>}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Sub-Asset Set *</Label>
              <Select value={attachAssetId} onValueChange={setAttachAssetId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select a set..." /></SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="none">— Select a set —</SelectItem>
                  {availableSets
                    .filter(s => !attachedActiveIds.has(s.assetId))
                    .map(s => {
                      const cnt = parseItemCount(s.tags ?? null);
                      return (
                        <SelectItem key={s.assetId} value={String(s.assetId)}>
                          <span className="font-mono text-xs text-[#e60000] mr-2">{s.assetCode}</span>
                          {s.setName}
                          {cnt > 0 && <span className="text-muted-foreground ml-1">({cnt} items)</span>}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              {attachedActiveIds.size > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {attachedActiveIds.size} set{attachedActiveIds.size !== 1 ? "s" : ""} already actively attached (hidden above).
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachOpen(false)}>Cancel</Button>
            <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white"
              onClick={handleAttach} disabled={attachMutation.isPending || attachAssetId === "none"}>
              {attachMutation.isPending ? "Attaching..." : "Attach Set"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Status Change Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!statusDialogRow} onOpenChange={v => { if (!v) setStatusDialogRow(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Sub-Asset Status</DialogTitle>
          </DialogHeader>
          {statusDialogRow && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Set</p>
                <p className="font-mono text-xs text-[#e60000]">{statusDialogRow.assetCode}</p>
                <p className="font-semibold text-sm">{statusDialogRow.setName}</p>
                <div className="mt-1"><StatusBadge status={statusDialogRow.currentStatus} /></div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">New Status *</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key} disabled={key === statusDialogRow.currentStatus}>
                        <span className="flex items-center gap-2">{cfg.icon} {cfg.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Effective Date *</Label>
                <Input type="date" className="h-9 text-sm" value={statusDate}
                  onChange={e => setStatusDate(e.target.value)} />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Reason</Label>
                <Input className="h-9 text-sm" placeholder="Brief reason for status change..."
                  value={statusReason} onChange={e => setStatusReason(e.target.value)} />
              </div>

              {newStatus === "Replaced" && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Replacement Set</Label>
                  <Select value={replacedById} onValueChange={setReplacedById}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select replacement set..." /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      <SelectItem value="none">— None / TBD —</SelectItem>
                      {availableSets
                        .filter(s => s.assetId !== statusDialogRow.leaseSubAssetId)
                        .map(s => (
                          <SelectItem key={s.assetId} value={String(s.assetId)}>
                            <span className="font-mono text-xs text-[#e60000] mr-2">{s.assetCode}</span>{s.setName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Notes</Label>
                <Textarea className="text-sm resize-none" rows={2} placeholder="Additional notes..."
                  value={statusNotes} onChange={e => setStatusNotes(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogRow(null)}>Cancel</Button>
            <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white"
              onClick={handleStatusSave} disabled={statusMutation.isPending}>
              {statusMutation.isPending ? "Saving..." : "Save Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
