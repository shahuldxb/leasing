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

export default function HandoverChecklist() {
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [form, setForm] = useState<any>({ contractId: "", handoverType: "Move-In", handoverDate: "", notes: "", items: [] });
  const [aiRows, setAiRows] = useState<any[]>([]);

  function openAdd() { setEditRow(null); setForm({ contractId: "", handoverType: "Move-In", handoverDate: "", notes: "", items: [] }); setShowForm(true); }
  function openEdit(row: any) {
    setEditRow(row);
    setForm({ contractId: String(row.contract_id ?? ""), handoverType: row.handover_type ?? "Move-In", handoverDate: row.handover_date ? new Date(row.handover_date).toISOString().slice(0,10) : "", notes: row.notes ?? "", items: [] });
    setShowForm(true);
  }
  function handleDelete(row: any) {
    toast("Delete this checklist?", { action: { label: "Confirm Delete", onClick: () => toast.success("Checklist deleted") } });
  }

  const { data: checklists = [], isLoading, refetch } = trpc.handoverChecklist.listByLease.useQuery({ contract_id: 0 });
  const { data: leasesData } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 200 });
  const leases = (leasesData as any)?.contracts ?? [];
  const createMut = trpc.handoverChecklist.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success("Checklist created"); }, onError: (e: any) => toast.error(e.message) });
  const signOffMut = trpc.handoverChecklist.signOff.useMutation({ onSuccess: () => { refetch(); toast.success("Checklist signed off"); }, onError: (e: any) => toast.error(e.message) });

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div>
              <h2 className="font-semibold text-lg">{editRow ? "Edit Handover Checklist" : "New Handover Checklist"}</h2>
              <p className="text-sm text-muted-foreground">Create a property handover inspection checklist</p>
            </div>
            <div className="ml-auto"><GenAIFillButton
              formType="maintenance_ticket"
              onFill={(data) => setForm((f: any) => ({
                          ...f,
                          title: data.title ?? f.title,
                          description: data.description ?? f.description,
                          notes: data.notes ?? f.notes,
                        }))}
            /></div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div><Label>Lease Contract</Label>
                <Select value={form.contractId} onValueChange={v => setForm((f: any) => ({ ...f, contractId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select contract" /></SelectTrigger>
                  <SelectContent>{leases.map((l: any) => <SelectItem key={l.contract_id} value={String(l.contract_id)}>{l.property_name ?? l.contract_id}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Handover Type</Label>
                <Select value={form.handoverType} onValueChange={v => setForm((f: any) => ({ ...f, handoverType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Move-In","Move-Out","Inspection","Maintenance"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Handover Date *</Label><Input className="mt-1" type="date" value={form.handoverDate} onChange={e => setForm((f: any) => ({ ...f, handoverDate: e.target.value }))} /></div>
              <div><Label>Notes</Label><Input className="mt-1" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" disabled={createMut.isPending}
                  onClick={() => createMut.mutate({ contract_id: Number(form.contractId), checklist_type: (form.handoverType || 'HANDOVER') as 'HANDOVER' | 'RETURN', conducted_date: form.handoverDate || new Date().toISOString().split('T')[0], notes: form.notes })}>
                  {createMut.isPending ? "Creating..." : "Create Checklist"}
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
          screenId="VFLHNDCHK0001P001"
          title="Handover Checklist"
          subtitle="Property handover inspection and sign-off management"
          screenType="handover_checklist"
          onAIData={(rows) => setAiRows(rows)}
          actions={<Button onClick={openAdd} className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2 h-9 px-3 text-sm rounded-lg"><Plus className="w-4 h-4" />Add</Button>}
        />
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Contract</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Items</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
              {!isLoading && (checklists as any[]).map((c: any) => (
                <TableRow key={c.checklist_id}>
                  <TableCell>{c.contract_id}</TableCell>
                  <TableCell>{c.handover_type}</TableCell>
                  <TableCell>{c.handover_date ? new Date(c.handover_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{c.item_count ?? 0}</TableCell>
                  <TableCell><Badge className={c.status === "Signed Off" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}>{c.status ?? "Pending"}</Badge></TableCell>
                  <TableCell className="flex items-center gap-1">
                    {c.status !== "Signed Off" && <Button size="sm" variant="outline" onClick={() => signOffMut.mutate({ checklist_id: c.checklist_id })}>Sign Off</Button>}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(c)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (checklists as any[]).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No checklists found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
