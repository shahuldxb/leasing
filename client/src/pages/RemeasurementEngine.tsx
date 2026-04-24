import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ScreenHeader from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { GenAIFillButton } from "@/components/GenAIFillButton";

export default function RemeasurementEngine() {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState<any>({ contractId: "", triggerType: "Modification", remeasurementDate: "", newIbr: "", notes: "" });
  const [aiRows, setAiRows] = useState<any[]>([]);

  const { data: events = [], refetch } = trpc.accounting.remeasurement.list.useQuery({ status: filterStatus || undefined });
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];
  const create = trpc.accounting.remeasurement.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success("Remeasurement event created"); }, onError: (e: any) => toast.error(e.message) });
  const post = trpc.accounting.remeasurement.post.useMutation({ onSuccess: () => { refetch(); toast.success("Remeasurement posted to GL"); }, onError: (e: any) => toast.error(e.message) });

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div>
              <h2 className="font-semibold text-lg">New Remeasurement Event</h2>
              <p className="text-sm text-muted-foreground">Trigger an IFRS 16 lease liability remeasurement</p>
            </div>
            <div className="ml-auto"><GenAIFillButton
              formType="lease_modification"
              onFill={(data) => setForm((f: any) => ({
                          ...f,
                          remeasurementDate: data.modificationDate ?? f.remeasurementDate,
                          newIbr: data.newIBR ?? f.newIbr,
                          notes: data.notes ?? f.notes,
                        }))}
            /></div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div><Label>Contract</Label>
                <Select value={form.contractId} onValueChange={v => setForm((f: any) => ({ ...f, contractId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select contract" /></SelectTrigger>
                  <SelectContent>{contracts.map((c: any) => <SelectItem key={c.contract_id} value={String(c.contract_id)}>{c.property_name ?? c.contract_id}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Trigger Type</Label>
                <Select value={form.triggerType} onValueChange={v => setForm((f: any) => ({ ...f, triggerType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Modification","IBR Change","Rent Review","Extension","Termination"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Remeasurement Date</Label><Input className="mt-1" type="date" value={form.remeasurementDate} onChange={e => setForm((f: any) => ({ ...f, remeasurementDate: e.target.value }))} /></div>
                <div><Label>New IBR (%)</Label><Input className="mt-1" type="number" step="0.001" value={form.newIbr} onChange={e => setForm((f: any) => ({ ...f, newIbr: e.target.value }))} /></div>
              </div>
              <div><Label>Notes</Label><Input className="mt-1" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" disabled={create.isPending}
                  onClick={() => create.mutate({ contract_id: Number(form.contractId), event_type: form.triggerType || 'MODIFICATION', event_date: form.remeasurementDate, trigger_description: form.triggerDescription || form.triggerType || 'Modification', new_ibr: Number(form.newIbr), new_remaining_term: Number(form.newRemainingTerm || 12) })}>
                  {create.isPending ? "Creating..." : "Create Event"}
                </Button>
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
          screenId="VFLRMSENG0001P001"
          title="Remeasurement Engine"
          subtitle="IFRS 16 lease liability remeasurement events"
          screenType="remeasurement_engine"
          onAIData={(rows) => setAiRows(rows)}
          actions={<Button onClick={() => setShowForm(true)} className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2 h-9 px-3 text-sm rounded-lg"><Plus className="w-4 h-4" />Add</Button>}
        />
        <div className="flex gap-3">
          <Select value={filterStatus || "all"} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {["Pending","Calculated","Posted"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Contract</TableHead><TableHead>Trigger</TableHead><TableHead>Date</TableHead><TableHead>New IBR</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(events as any[]).map((e: any) => (
                <TableRow key={e.event_id}>
                  <TableCell>{e.contract_id}</TableCell>
                  <TableCell>{e.trigger_type}</TableCell>
                  <TableCell>{e.remeasurement_date ? new Date(e.remeasurement_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{e.new_ibr ? `${Number(e.new_ibr).toFixed(3)}%` : "—"}</TableCell>
                  <TableCell><Badge className={e.status === "Posted" ? "bg-green-500/20 text-green-400" : e.status === "Calculated" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}>{e.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {e.status === "Calculated" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => post.mutate({ remeasurement_id: e.remeasurement_id || e.event_id })}>Post to GL</Button>}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-400" onClick={() => { setForm({ contractId: String(e.contract_id), triggerType: e.trigger_type, remeasurementDate: e.remeasurement_date?.slice(0,10) ?? "", newIbr: e.new_ibr ?? "", notes: "" }); setShowForm(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-400" onClick={() => toast("Remove this event?", { action: { label: "Remove", onClick: () => toast.success("Event removed") } })}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(events as any[]).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No remeasurement events</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
