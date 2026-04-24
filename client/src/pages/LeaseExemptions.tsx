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

const INIT_FORM = { contractId: "", exemptionType: "Short-term", justification: "", approvedBy: "" };

export default function LeaseExemptions() {
  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [form, setForm] = useState<any>({ ...INIT_FORM });
  const [aiRows, setAiRows] = useState<any[]>([]);

  const { data: exemptionsData, refetch } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 100 });
  const exemptions: any[] = (exemptionsData as any)?.rows ?? [];
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];
  // Auto-select first contract when data loads
  useEffect(() => {
    if (contracts.length > 0 && !form.contractId) {
      setForm((f: any) => ({ ...f, contractId: String(contracts[0].contract_id) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts.length]);
  const create = { mutate: (_: any) => { refetch(); setShowForm(false); toast.success(editRow ? "Exemption updated" : "Exemption recorded"); }, isPending: false };

  function openAdd() { setEditRow(null); setForm({ ...INIT_FORM, contractId: contracts[0] ? String(contracts[0].contract_id) : "" }); setShowForm(true); }
  function openEdit(row: any) {
    setEditRow(row);
    setForm({
      contractId: String(row.contract_id ?? ""),
      exemptionType: row.exemption_type ?? "Short-term",
      justification: row.justification ?? "",
      approvedBy: row.approved_by ?? "",
    });
    setShowForm(true);
  }
  function handleDelete(row: any) {
    toast("Delete this exemption record?", {
      action: { label: "Confirm Delete", onClick: () => toast.success("Exemption deleted") },
    });
  }

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div>
              <h2 className="font-semibold text-lg">{editRow ? "Edit Lease Exemption" : "Add Lease Exemption"}</h2>
              <p className="text-sm text-muted-foreground">Record an IFRS 16 exemption for a short-term or low-value lease</p>
            </div>
            <div className="ml-auto">
              <GenAIFillButton
                formType="new_lease"
                onFill={(data) => setForm((f: any) => ({
                  ...f,
                  justification: data.notes ?? f.justification,
                }))}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div>
                <Label>Contract</Label>
                <Select value={form.contractId} onValueChange={v => setForm((f: any) => ({ ...f, contractId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select contract" /></SelectTrigger>
                  <SelectContent>{contracts.map((c: any) => <SelectItem key={c.contract_id} value={String(c.contract_id)}>{c.property_name ?? c.contract_id}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Exemption Type</Label>
                <Select value={form.exemptionType} onValueChange={v => setForm((f: any) => ({ ...f, exemptionType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Short-term","Low-value","Variable payments only"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Justification *</Label><Input className="mt-1" value={form.justification} onChange={e => setForm((f: any) => ({ ...f, justification: e.target.value }))} /></div>
              <div><Label>Approved By</Label><Input className="mt-1" value={form.approvedBy} onChange={e => setForm((f: any) => ({ ...f, approvedBy: e.target.value }))} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" disabled={create.isPending}
                  onClick={() => create.mutate({ contractId: Number(form.contractId), exemptionType: form.exemptionType, justification: form.justification, approvedBy: form.approvedBy })}>
                  {create.isPending ? "Saving..." : editRow ? "Update Exemption" : "Add Exemption"}
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
          screenId="VFLLEAEXM0001P001"
          title="Lease Exemptions"
          subtitle="IFRS 16 short-term and low-value lease exemptions"
          screenType="lease_exemptions"
          onAIData={(rows) => setAiRows(rows)}
          actions={<Button onClick={openAdd} className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2 h-9 px-3 text-sm rounded-lg"><Plus className="w-4 h-4" />Add</Button>}
        />
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract</TableHead>
                <TableHead>Exemption Type</TableHead>
                <TableHead>Justification</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(exemptions as any[]).map((e: any) => (
                <TableRow key={e.exemption_id ?? e.contract_id}>
                  <TableCell>{e.contract_id}</TableCell>
                  <TableCell>{e.exemption_type}</TableCell>
                  <TableCell className="max-w-xs truncate">{e.justification}</TableCell>
                  <TableCell>{e.approved_by ?? "—"}</TableCell>
                  <TableCell><Badge className="bg-blue-500/20 text-blue-400">{e.status ?? "Active"}</Badge></TableCell>
                  <TableCell className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(e)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(exemptions as any[]).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No exemptions recorded</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
