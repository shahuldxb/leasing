import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Flag, PlusCircle, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const MILESTONE_TYPES = ["Rent Review Date","Renewal Decision Deadline","Break Clause Date","Insurance Renewal","Maintenance Inspection","Regulatory Compliance","Payment Escalation","Make-Good Assessment"];

export default function ContractMilestones() {
  const [open, setOpen] = useState(false);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ leaseId: "", type: "", dueDate: "", notes: "" });
  const { data: leases = [] } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 200 });

  const today = new Date();
  const upcoming = [
    { id: 1, contract: "VFL-2025-0001", type: "Rent Review Date", dueDate: new Date(today.getTime() + 15*24*60*60*1000).toISOString(), status: "Upcoming" },
    { id: 2, contract: "VFL-2025-0002", type: "Insurance Renewal", dueDate: new Date(today.getTime() + 45*24*60*60*1000).toISOString(), status: "Upcoming" },
    { id: 3, contract: "VFL-2025-0003", type: "Renewal Decision Deadline", dueDate: new Date(today.getTime() - 5*24*60*60*1000).toISOString(), status: "Overdue" },
  ];

  const statusIcon = (s: string) => s === "Overdue" ? <AlertTriangle className="w-4 h-4 text-red-400" /> : s === "Completed" ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Clock className="w-4 h-4 text-amber-400" />;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLCNTMLS0001P001"
  title="Contract Milestones"
  subtitle="Key dates and milestone tracking per contract"

          screenType="contract_milestones"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />

        <div className="grid gap-3">
          {upcoming.map(m => (
            <div key={m.id} className={`bg-card border rounded-xl p-4 flex items-center justify-between ${m.status === "Overdue" ? "border-red-500/30" : "border-border"}`}>
              <div className="flex items-center gap-3">
                {statusIcon(m.status)}
                <div>
                  <p className="font-medium text-sm">{m.type}</p>
                  <p className="text-xs text-muted-foreground">{m.contract} · Due {new Date(m.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={m.status === "Overdue" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}>{m.status}</Badge>
                <Button size="sm" variant="outline" onClick={() => toast.success("Milestone marked complete")}>Complete</Button>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Milestone</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Lease</Label>
                <Select value={form.leaseId} onValueChange={v => setForm(f => ({ ...f, leaseId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select lease..." /></SelectTrigger>
                  <SelectContent>{(leases as any[]).map((l: any) => <SelectItem key={l.contract_id} value={String(l.contract_id)}>{l.contract_ref}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Milestone Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>{MILESTONE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-sm font-medium">Due Date</Label><Input type="date" className="mt-1" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
              <div><Label className="text-sm font-medium">Notes</Label><Input className="mt-1" placeholder="Notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => { toast.success("Milestone added"); setOpen(false); }}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
