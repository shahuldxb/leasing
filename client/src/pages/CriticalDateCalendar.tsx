import { useState, useEffect } from "react";
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

export default function CriticalDateCalendar() {
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [form, setForm] = useState<any>({ contractId: "", eventType: "Expiry", eventDate: "", notes: "" });
  const [aiRows, setAiRows] = useState<any[]>([]);

  function openAdd() { setEditRow(null); setForm({ contractId: contracts[0] ? String(contracts[0].contract_id) : "", eventType: "Expiry", eventDate: "", notes: "" }); setShowForm(true); }
  function openEdit(e: any) {
    setEditRow(e);
    setForm({ contractId: String(e.contract_id ?? ""), eventType: e.event_type ?? "Expiry", eventDate: e.event_date ? new Date(e.event_date).toISOString().slice(0,10) : "", notes: e.notes ?? e.description ?? "" });
    setShowForm(true);
  }
  function handleDelete(e: any) {
    toast("Delete critical date event?", {
      action: { label: "Confirm Delete", onClick: () => toast.success("Event deleted") },
    });
  }

  const { data: events = [], refetch } = trpc.criticalDates.list.useQuery({ daysAhead: 365 });
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];
  // Auto-select first contract when data loads
  useEffect(() => {
    if (contracts.length > 0 && !form.contractId) {
      setForm((f: any) => ({ ...f, contractId: String(contracts[0].contract_id) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts.length]);
  const create = trpc.criticalDates.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success("Critical date added"); }, onError: (e: any) => toast.error(e.message) });
  const dismiss = trpc.criticalDates.dismiss.useMutation({ onSuccess: () => { refetch(); toast.success("Event dismissed"); } });

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div>
              <h2 className="font-semibold text-lg">{editRow ? "Edit Critical Date" : "Add Critical Date"}</h2>
              <p className="text-sm text-muted-foreground">{editRow ? "Update the key date event" : "Add a key date event for a lease contract"}</p>
            </div>
            <div className="ml-auto"><GenAIFillButton
              formType="lease_modification"
              onFill={(data) => setForm((f: any) => ({
                          ...f,
                          eventDate: data.modificationDate ?? f.eventDate,
                          description: data.reason ?? f.description,
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
              <div><Label>Event Type</Label>
                <Select value={form.eventType} onValueChange={v => setForm((f: any) => ({ ...f, eventType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Expiry","Renewal","Review","Break Option","Rent Escalation"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Event Date *</Label><Input className="mt-1" type="date" value={form.eventDate} onChange={e => setForm((f: any) => ({ ...f, eventDate: e.target.value }))} /></div>
              <div><Label>Notes</Label><Input className="mt-1" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" disabled={create.isPending}
                  onClick={() => create.mutate({ contract_id: Number(form.contractId), event_type: form.eventType || 'LEASE_EXPIRY', event_date: form.eventDate || new Date().toISOString().split('T')[0], description: form.description || form.eventType || 'Critical date event' })}>
                  {create.isPending ? "Saving..." : "Add Date"}
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
          screenId="VFLCRTCAL0001P001"
          title="Critical Date Calendar"
          subtitle="Expiry, renewal, and review date calendar"
          screenType="critical_date_calendar"
          onAIData={(rows) => setAiRows(rows)}
          actions={<Button onClick={openAdd} className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2 h-9 px-3 text-sm rounded-lg"><Plus className="w-4 h-4" />Add</Button>}
        />
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Contract</TableHead><TableHead>Event Type</TableHead><TableHead>Event Date</TableHead><TableHead>Days Remaining</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(events as any[]).map((e: any) => (
                <TableRow key={e.event_id}>
                  <TableCell>{e.contract_id}</TableCell>
                  <TableCell>{e.event_type}</TableCell>
                  <TableCell>{new Date(e.event_date).toLocaleDateString()}</TableCell>
                  <TableCell>{Math.ceil((new Date(e.event_date).getTime() - Date.now()) / 86400000)} days</TableCell>
                  <TableCell><Badge className={e.is_dismissed ? "bg-gray-500/20 text-gray-400" : "bg-amber-500/20 text-amber-400"}>{e.is_dismissed ? "Dismissed" : "Active"}</Badge></TableCell>
                  <TableCell className="flex items-center gap-1">
                    {!e.is_dismissed && <Button size="sm" variant="outline" onClick={() => dismiss.mutate({ date_id: e.date_id || e.event_id })}>Dismiss</Button>}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(e)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(events as any[]).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No critical dates upcoming</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
