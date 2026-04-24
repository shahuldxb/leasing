import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Ban, Plus, FileText, TrendingDown, Clock, AlertTriangle, XCircle, ChevronRight, DollarSign, Calendar, Building2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { MoreHorizontal, Search, Filter } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
  CANCELLED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  GL_POSTED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const GL_ENTRIES = [
  { account: "2100 - Lease Liability", dr: "114,700", cr: "—", note: "Derecognise remaining liability" },
  { account: "0810 - Accum. Depreciation - ROU", dr: "89,200", cr: "—", note: "Remove accumulated depreciation" },
  { account: "0800 - ROU Asset", dr: "—", cr: "185,000", note: "Derecognise ROU asset at cost" },
  { account: "8500 - Gain/Loss on Lease Exit", dr: "—", cr: "18,900", note: "Net gain on early termination" },
];

export default function LeaseTerminations() {
  const [open, setOpen] = useState(false);
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [showReject, setShowReject] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedTermination, setSelectedTermination] = useState<any>(null);
  const [form, setForm] = useState({
    contract_id: "", effective_date: "", reason: "",
    penalty_amount: "", buyout_amount: "", make_good_amount: "",
  });

  const { data: terminations = [], refetch } = trpc.termination.list.useQuery();
  const { data: contracts } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 100 });
  const contractRows = (contracts as any)?.rows ?? (contracts as any) ?? [];

  const initiateMut = trpc.termination.initiate.useMutation({
    onSuccess: () => { toast.success("Termination request initiated"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const approveMut = trpc.termination.approve.useMutation({
    onSuccess: () => { toast.success("Termination approved"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const rejectMut = trpc.termination.reject.useMutation({
    onSuccess: () => { toast.success("Termination rejected"); setShowReject(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const cancelMut = trpc.termination.cancel.useMutation({
    onSuccess: () => { toast.success("Termination cancelled"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredTerminations = (terminations as any[]).filter((t: any) => {
    const matchSearch = !search ||
      (t.contract_ref ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.asset_description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.lessor_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pending = (terminations as any[]).filter((t: any) => t.status === "PENDING").length;
  const approved = (terminations as any[]).filter((t: any) => t.status === "APPROVED").length;
  const totalPenalty = (terminations as any[]).reduce((s: number, t: any) => s + (Number(t.penalty_amount) || 0), 0);
  const totalBuyout = (terminations as any[]).reduce((s: number, t: any) => s + (Number(t.buyout_amount) || 0), 0);

  // Penalty vs Buyout comparison for selected termination
  const penaltyAmt = Number(selectedTermination?.penalty_amount) || 0;
  const buyoutAmt = Number(selectedTermination?.buyout_amount) || 0;
  const makeGoodAmt = Number(selectedTermination?.make_good_amount) || 0;
  const totalExitCost = penaltyAmt + makeGoodAmt;
  const saving = buyoutAmt > 0 ? buyoutAmt - totalExitCost : 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLLEATRM0001P001"
          screenType="lease_terminations"
          onAIData={(rows) => setAiRows(rows)}
  title="Lease Terminations"
  subtitle="Termination initiation and penalty calculation"
/>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-400">Important — IFRS 16 Derecognition</p>
            <p className="text-muted-foreground mt-1">Terminating a lease will derecognise the ROU Asset and Lease Liability, posting the difference as a gain or loss on termination. This action requires Maker/Checker approval.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pending Approval", value: pending, icon: Clock, color: "text-yellow-400" },
            { label: "Approved", value: approved, icon: CheckCircle, color: "text-green-400" },
            { label: "Total Penalties", value: `AED ${(totalPenalty / 1000).toFixed(0)}K`, icon: AlertTriangle, color: "text-red-400" },
            { label: "Total Buyouts", value: `AED ${(totalBuyout / 1000).toFixed(0)}K`, icon: TrendingDown, color: "text-blue-400" },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Main Table */}
          <div className="flex-1 min-w-0">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-red-400" /> Termination Register</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                      <Input className="pl-8 h-8 w-48 text-xs" placeholder="Search contract, asset, lessor..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8 w-36 text-xs"><Filter className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="GL_POSTED">GL Posted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Contract Ref</TableHead>
                      <TableHead className="text-xs">Asset</TableHead>
                      <TableHead className="text-xs">Lessor</TableHead>
                      <TableHead className="text-xs">Effective Date</TableHead>
                      <TableHead className="text-xs">Penalty (AED)</TableHead>
                      <TableHead className="text-xs">Buyout (AED)</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTerminations.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No termination requests found</TableCell></TableRow>
                    )}
                    {filteredTerminations.map((t: any) => (
                      <TableRow key={t.termination_id} className={`cursor-pointer hover:bg-muted/30 ${selectedTermination?.termination_id === t.termination_id ? "bg-muted/40" : ""}`}
                        onClick={() => setSelectedTermination(t)}>
                        <TableCell className="font-mono text-sm">{t.contract_ref}</TableCell>
                        <TableCell className="text-sm max-w-[120px] truncate">{t.asset_description}</TableCell>
                        <TableCell className="text-sm">{t.lessor_name}</TableCell>
                        <TableCell className="text-sm">{t.effective_date ? new Date(t.effective_date).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="font-mono text-sm text-red-400">{t.penalty_amount ? Number(t.penalty_amount).toLocaleString() : "—"}</TableCell>
                        <TableCell className="font-mono text-sm text-orange-400">{t.buyout_amount ? Number(t.buyout_amount).toLocaleString() : "—"}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs border ${STATUS_COLORS[t.status] ?? ""}`}>{t.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={e => e.stopPropagation()}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem className="cursor-pointer" onClick={e => { e.stopPropagation(); setSelectedTermination(t); }}>
                                <ChevronRight className="w-3.5 h-3.5 mr-2" /> View Details
                              </DropdownMenuItem>
                              {t.status === "PENDING" && (
                                <>
                                  <DropdownMenuItem className="text-green-400 cursor-pointer" onClick={e => { e.stopPropagation(); approveMut.mutate({ termination_id: t.termination_id }); }}>
                                    <CheckCircle className="w-3.5 h-3.5 mr-2" /> Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-400 cursor-pointer" onClick={e => { e.stopPropagation(); setShowReject(t.termination_id); }}>
                                    <XCircle className="w-3.5 h-3.5 mr-2" /> Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-muted-foreground cursor-pointer" onClick={e => { e.stopPropagation(); cancelMut.mutate({ termination_id: t.termination_id }); }}>
                                    <Ban className="w-3.5 h-3.5 mr-2" /> Cancel
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem className="cursor-pointer" onClick={e => { e.stopPropagation(); setSelectedTermination(t); }}>
                                <FileText className="w-3.5 h-3.5 mr-2" /> View GL Preview
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Detail Side Panel */}
          {selectedTermination && (
            <div className="w-96 shrink-0 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Termination Detail</CardTitle>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedTermination(null)}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                  <Badge className={`text-xs border w-fit ${STATUS_COLORS[selectedTermination.status] ?? ""}`}>{selectedTermination.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Contract</p>
                        <p className="font-mono font-semibold">{selectedTermination.contract_ref}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Lessor</p>
                        <p className="font-semibold truncate">{selectedTermination.lessor_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Effective Date</p>
                        <p className="font-semibold">{selectedTermination.effective_date ? new Date(selectedTermination.effective_date).toLocaleDateString() : "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <BarChart3 className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Asset</p>
                        <p className="font-semibold truncate">{selectedTermination.asset_description || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Penalty vs Buyout Comparison */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Penalty vs Buyout Analysis</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Contractual Penalty</span>
                        <span className="font-mono text-sm text-red-400">AED {penaltyAmt.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Make-Good / Reinstatement</span>
                        <span className="font-mono text-sm text-yellow-400">AED {makeGoodAmt.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-border pt-2">
                        <span className="text-xs font-semibold">Total Exit Cost</span>
                        <span className="font-mono text-sm font-bold">AED {totalExitCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Remaining Liability (Buyout)</span>
                        <span className="font-mono text-sm text-orange-400">AED {buyoutAmt.toLocaleString()}</span>
                      </div>
                      {buyoutAmt > 0 && (
                        <div className={`flex justify-between items-center border-t border-border pt-2 ${saving >= 0 ? "text-green-400" : "text-red-400"}`}>
                          <span className="text-xs font-semibold">{saving >= 0 ? "Saving vs Buyout" : "Premium over Buyout"}</span>
                          <span className="font-mono text-sm font-bold">AED {Math.abs(saving).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* GL Preview */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">IFRS 16 GL Preview</p>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-2 font-medium">Account</th>
                            <th className="text-right p-2 font-medium">Dr</th>
                            <th className="text-right p-2 font-medium">Cr</th>
                          </tr>
                        </thead>
                        <tbody>
                          {GL_ENTRIES.map((e, i) => (
                            <tr key={i} className="border-t border-border/50">
                              <td className="p-2 text-muted-foreground">{e.account}</td>
                              <td className="p-2 text-right font-mono text-green-400">{e.dr}</td>
                              <td className="p-2 text-right font-mono text-red-400">{e.cr}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 italic">* Illustrative GL entries. Actual amounts computed on approval.</p>
                  </div>

                  <Separator />

                  {/* Approval Timeline */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Approval Timeline</p>
                    <div className="space-y-2">
                      {[
                        { step: "Initiated", status: "done", date: selectedTermination.created_at ? new Date(selectedTermination.created_at).toLocaleDateString() : "Today", by: "System" },
                        { step: "Maker Review", status: selectedTermination.status !== "PENDING" ? "done" : "current", date: selectedTermination.status !== "PENDING" ? "Completed" : "Pending", by: "Finance Team" },
                        { step: "Checker Approval", status: selectedTermination.status === "APPROVED" || selectedTermination.status === "GL_POSTED" ? "done" : "pending", date: selectedTermination.status === "APPROVED" ? "Approved" : "Awaiting", by: "CFO" },
                        { step: "GL Posting", status: selectedTermination.status === "GL_POSTED" ? "done" : "pending", date: selectedTermination.status === "GL_POSTED" ? "Posted" : "Awaiting", by: "System" },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${step.status === "done" ? "bg-green-400" : step.status === "current" ? "bg-yellow-400" : "bg-muted-foreground/30"}`} />
                          <div className="flex-1 flex justify-between">
                            <span className={`text-xs ${step.status === "done" ? "text-foreground" : "text-muted-foreground"}`}>{step.step}</span>
                            <span className="text-xs text-muted-foreground">{step.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedTermination.status === "PENDING" && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                        onClick={() => approveMut.mutate({ termination_id: selectedTermination.termination_id })}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-red-400 border-red-500/30 text-xs"
                        onClick={() => setShowReject(selectedTermination.termination_id)}>
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Initiate Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400"><XCircle className="w-5 h-5" /> Initiate Lease Termination</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-sm font-medium">Contract *</Label>
                <Select value={form.contract_id} onValueChange={v => setForm(f => ({ ...f, contract_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select lease contract..." /></SelectTrigger>
                  <SelectContent>
                    {contractRows.map((c: any) => (
                      <SelectItem key={c.contract_id} value={String(c.contract_id)}>{c.contract_ref} — {c.asset_description?.slice(0, 40)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Effective Termination Date *</Label>
                <Input type="date" className="mt-1" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm font-medium">Penalty Amount (AED)</Label>
                <Input type="number" className="mt-1" placeholder="0.00" value={form.penalty_amount} onChange={e => setForm(f => ({ ...f, penalty_amount: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm font-medium">Buyout Amount (AED)</Label>
                <Input type="number" className="mt-1" placeholder="0.00" value={form.buyout_amount} onChange={e => setForm(f => ({ ...f, buyout_amount: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm font-medium">Make-Good / Reinstatement (AED)</Label>
                <Input type="number" className="mt-1" placeholder="0.00" value={form.make_good_amount} onChange={e => setForm(f => ({ ...f, make_good_amount: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-medium">Reason *</Label>
                <Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Business closure, relocation, cost reduction, lease restructuring..." rows={3} className="mt-1 resize-none" />
              </div>
            </div>

            {/* Penalty vs Buyout preview in dialog */}
            {(form.penalty_amount || form.buyout_amount) && (
              <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Penalty vs Buyout Comparison</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-red-400">AED {Number(form.penalty_amount || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Contractual Penalty</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-400">AED {Number(form.buyout_amount || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Remaining Liability</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${Number(form.buyout_amount || 0) > Number(form.penalty_amount || 0) ? "text-green-400" : "text-red-400"}`}>
                      AED {Math.abs(Number(form.buyout_amount || 0) - Number(form.penalty_amount || 0)).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{Number(form.buyout_amount || 0) > Number(form.penalty_amount || 0) ? "Saving" : "Premium"}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={!form.contract_id || !form.effective_date || !form.reason || initiateMut.isPending}
                onClick={() => initiateMut.mutate({
                  contract_id: Number(form.contract_id),
                  effective_date: form.effective_date,
                  reason: form.reason,
                  penalty_amount: form.penalty_amount ? Number(form.penalty_amount) : undefined,
                  buyout_amount: form.buyout_amount ? Number(form.buyout_amount) : undefined,
                  make_good_amount: form.make_good_amount ? Number(form.make_good_amount) : undefined,
                })}>
                {initiateMut.isPending ? "Submitting..." : "Submit for Approval"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showReject !== null} onOpenChange={() => setShowReject(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-400">Reject Termination Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Rejection Reason (mandatory)</Label>
                <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Provide a clear reason..." rows={3} className="mt-1 resize-none" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowReject(null)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={!rejectReason.trim() || rejectMut.isPending}
                  onClick={() => showReject && rejectMut.mutate({ termination_id: showReject, reason: rejectReason })}>
                  {rejectMut.isPending ? "Rejecting..." : "Confirm Reject"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
