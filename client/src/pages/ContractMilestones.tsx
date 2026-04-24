import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlusCircle, CheckCircle2, Clock, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GenAIFillButton } from "@/components/GenAIFillButton";

const MILESTONE_TYPES = ["Rent Review Date","Renewal Decision Deadline","Break Clause Date","Insurance Renewal","Maintenance Inspection","Regulatory Compliance","Payment Escalation","Make-Good Assessment"];
const INIT = { leaseId: "", type: "", dueDate: "", notes: "" };

export default function ContractMilestones() {
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState(INIT);

  function openEdit(m: any) {
    setEditRow(m);
    setForm({ leaseId: String(m.contract ?? ""), type: m.type ?? "", dueDate: m.dueDate ? new Date(m.dueDate).toISOString().slice(0,10) : "", notes: m.notes ?? "" });
    setShowForm(true);
  }
  function handleDelete(m: any) {
    toast("Delete milestone '" + m.type + "'?", {
      action: { label: "Confirm Delete", onClick: () => toast.success("Milestone deleted") },
    });
  }
  const { data: leasesData } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 200 });
  const leases: any[] = (leasesData as any)?.rows ?? [];
  // Auto-select first lease when data loads
  useEffect(() => {
    if (leases.length > 0 && !form.leaseId) {
      setForm((f: any) => ({ ...f, leaseId: String(leases[0].contract_id), type: f.type || MILESTONE_TYPES[0] }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leases.length]);

  const today = new Date();
  const upcoming = [
    { id: 1, contract: "VFL-2025-0001", type: "Rent Review Date", dueDate: new Date(today.getTime() + 15*24*60*60*1000).toISOString(), status: "Upcoming" },
    { id: 2, contract: "VFL-2025-0002", type: "Insurance Renewal", dueDate: new Date(today.getTime() + 45*24*60*60*1000).toISOString(), status: "Upcoming" },
    { id: 3, contract: "VFL-2025-0003", type: "Renewal Decision Deadline", dueDate: new Date(today.getTime() - 5*24*60*60*1000).toISOString(), status: "Overdue" },
  ];

  const statusIcon = (s: string) => s === "Overdue" ? <AlertTriangle className="w-4 h-4 text-red-400" /> : s === "Completed" ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Clock className="w-4 h-4 text-amber-400" />;

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full w-full bg-background">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-[#161616] shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><ArrowLeft className="w-5 h-5" /></Button>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">{editRow ? "Edit Milestone" : "Add Contract Milestone"}</h2>
              <p className="text-xs text-muted-foreground">{editRow ? "Update milestone details" : "Set a key date or milestone for a lease contract"}</p>
            </div>
            <GenAIFillButton formType="contract_milestone" onFill={(data: any) => setForm((f: any) => ({
              ...f,
              type: data.milestoneType ?? f.type,
              dueDate: data.dueDate ?? f.dueDate,
              notes: data.notes ?? f.notes,
            }))} />
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-2xl mx-auto space-y-5">
              <div>
                <Label>Lease</Label>
                <Select value={form.leaseId} onValueChange={v => setForm(f => ({ ...f, leaseId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select lease..." /></SelectTrigger>
                  <SelectContent>
                    {leases.map((l: any) => (
                      <SelectItem key={l.contract_id} value={String(l.contract_id)}>{l.contract_ref}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Milestone Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>{MILESTONE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Due Date</Label><Input type="date" className="mt-1" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
              <div><Label>Notes</Label><Input className="mt-1" placeholder="Notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => { toast.success("Milestone added"); setShowForm(false); }}>Add Milestone</Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
          screenId="VFLCNTMLS0001P001"
          title="Contract Milestones"
          subtitle="Key dates and milestone tracking per contract"
          screenType="contract_milestones"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
          actions={<Button size="sm" onClick={() => { setForm(INIT); setShowForm(true); }} className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2"><PlusCircle className="w-4 h-4" />Add Milestone</Button>}
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
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(m)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
