import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Ban, Plus, FileText, TrendingDown, Clock, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
  CANCELLED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  GL_POSTED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function LeaseTerminations() {
  const [open, setOpen] = useState(false);
  const [showReject, setShowReject] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
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

  const pending = (terminations as any[]).filter((t: any) => t.status === "PENDING").length;
  const approved = (terminations as any[]).filter((t: any) => t.status === "APPROVED").length;
  const totalPenalty = (terminations as any[]).reduce((s: number, t: any) => s + (Number(t.penalty_amount) || 0), 0);
  const totalBuyout = (terminations as any[]).reduce((s: number, t: any) => s + (Number(t.buyout_amount) || 0), 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lease Terminations</h1>
            <p className="text-sm text-muted-foreground mt-1">IFRS 16 derecognition — manage early exit, penalty analysis, and GL posting</p>
          </div>
          <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Initiate Termination
          </Button>
        </div>

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
            { label: "Total Penalties", value: `AED ${(totalPenalty/1000).toFixed(0)}K`, icon: AlertTriangle, color: "text-red-400" },
            { label: "Total Buyouts", value: `AED ${(totalBuyout/1000).toFixed(0)}K`, icon: TrendingDown, color: "text-blue-400" },
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

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-red-400" /> Termination Register</CardTitle>
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
                  <TableHead className="text-xs">Make Good (AED)</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(terminations as any[]).length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No termination requests found</TableCell></TableRow>
                )}
                {(terminations as any[]).map((t: any) => (
                  <TableRow key={t.termination_id}>
                    <TableCell className="font-mono text-sm">{t.contract_ref}</TableCell>
                    <TableCell className="text-sm max-w-[140px] truncate">{t.asset_description}</TableCell>
                    <TableCell className="text-sm">{t.lessor_name}</TableCell>
                    <TableCell className="text-sm">{t.effective_date ? new Date(t.effective_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="font-mono text-sm text-red-400">{t.penalty_amount ? Number(t.penalty_amount).toLocaleString() : "—"}</TableCell>
                    <TableCell className="font-mono text-sm text-orange-400">{t.buyout_amount ? Number(t.buyout_amount).toLocaleString() : "—"}</TableCell>
                    <TableCell className="font-mono text-sm text-yellow-400">{t.make_good_amount ? Number(t.make_good_amount).toLocaleString() : "—"}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs border ${STATUS_COLORS[t.status] ?? ""}`}>{t.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {t.status === "PENDING" && (
                          <>
                            <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300 h-7 px-2" title="Approve"
                              onClick={() => approveMut.mutate({ termination_id: t.termination_id })}>
                              <CheckCircle className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-7 px-2" title="Reject"
                              onClick={() => setShowReject(t.termination_id)}>
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground h-7 px-2" title="Cancel"
                              onClick={() => cancelMut.mutate({ termination_id: t.termination_id })}>
                              <Ban className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Initiate Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400"><XCircle className="w-5 h-5" /> Initiate Lease Termination</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Contract *</Label>
                <Select value={form.contract_id} onValueChange={v => setForm(f => ({ ...f, contract_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select contract..." /></SelectTrigger>
                  <SelectContent>
                    {contractRows.map((c: any) => (
                      <SelectItem key={c.contract_id} value={String(c.contract_id)}>{c.contract_ref} — {c.asset_description?.slice(0,40)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Effective Termination Date *</Label>
                <Input type="date" className="mt-1" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} />
              </div>
              <div>
                <Label className="text-sm font-medium">Reason *</Label>
                <Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Business closure, relocation, cost reduction..." rows={3} className="mt-1 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-medium">Penalty (AED)</Label>
                  <Input type="number" className="mt-1" placeholder="0" value={form.penalty_amount} onChange={e => setForm(f => ({ ...f, penalty_amount: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium">Buyout (AED)</Label>
                  <Input type="number" className="mt-1" placeholder="0" value={form.buyout_amount} onChange={e => setForm(f => ({ ...f, buyout_amount: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium">Make Good (AED)</Label>
                  <Input type="number" className="mt-1" placeholder="0" value={form.make_good_amount} onChange={e => setForm(f => ({ ...f, make_good_amount: e.target.value }))} />
                </div>
              </div>
            </div>
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
