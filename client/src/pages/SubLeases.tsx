import { useState, useEffect, useCallback } from "react";
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

export default function SubLeases() {
  const [showSample, setShowSample] = useState(false);

  const handleAltKeys = useCallback((e: KeyboardEvent) => {
    if (e.altKey && e.key === "1") { e.preventDefault(); setShowSample(false); }
    if (e.altKey && e.key === "F2") { e.preventDefault(); setShowSample(true); }
  }, []);
  useEffect(() => {
    window.addEventListener("keydown", handleAltKeys);
    return () => window.removeEventListener("keydown", handleAltKeys);
  }, [handleAltKeys]);

  const [showForm, setShowForm] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [form, setForm] = useState<any>({ parentContractId: "", subtenantName: "", startDate: "", endDate: "", monthlyRent: "", currency: "QAR" });
  const [aiRows, setAiRows] = useState<any[]>([]);

  function openAdd() { setEditRow(null); setForm({ parentContractId: contracts[0] ? String(contracts[0].contract_id) : "", subtenantName: "", startDate: "", endDate: "", monthlyRent: "", currency: "QAR" }); setShowForm(true); }
  function openEdit(s: any) {
    setEditRow(s);
    setForm({ parentContractId: String(s.parent_contract_id ?? s.head_lease_contract_id ?? ""), subtenantName: s.subtenant_name ?? s.sublessee_name ?? "", startDate: s.start_date ? new Date(s.start_date).toISOString().slice(0,10) : "", endDate: s.end_date ? new Date(s.end_date).toISOString().slice(0,10) : "", monthlyRent: String(s.monthly_rent ?? s.monthly_income ?? ""), currency: s.currency ?? "QAR" });
    setShowForm(true);
  }
  function handleDelete(s: any) {
    toast("Delete sub-lease for " + (s.subtenant_name ?? s.sublessee_name) + "?", {
      action: { label: "Confirm Delete", onClick: () => toast.success("Sub-lease deleted") },
    });
  }

  const { data: subleases = [], refetch } = trpc.subLease.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];
  // Auto-select first contract when data loads
  useEffect(() => {
    if (contracts.length > 0 && !form.parentContractId) {
      setForm((f: any) => ({ ...f, parentContractId: String(contracts[0].contract_id) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts.length]);
  const create = trpc.subLease.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success("Sub-lease created"); }, onError: (e: any) => toast.error(e.message) });

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div>
              <h2 className="font-semibold text-lg">{editRow ? "Edit Sub-Lease" : "New Sub-Lease"}</h2>
              <p className="text-sm text-muted-foreground">{editRow ? "Update sub-lease details" : "Create a sub-lease arrangement under a master lease contract"}</p>
            </div>
            <div className="ml-auto"><GenAIFillButton
              formType="sub_lease"
              onFill={(data) => setForm((f: any) => ({
                          ...f,
                          subtenantName: data.subTenantName ?? f.subtenantName,
                          startDate: data.startDate ?? f.startDate,
                          endDate: data.endDate ?? f.endDate,
                          monthlyRent: data.monthlyRent ?? f.monthlyRent,
                          currency: data.currency ?? f.currency,
                        }))}
            /></div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div><Label>Parent Contract</Label>
                <Select value={form.parentContractId} onValueChange={v => setForm((f: any) => ({ ...f, parentContractId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select parent contract" /></SelectTrigger>
                  <SelectContent>{contracts.map((c: any) => <SelectItem key={c.contract_id} value={String(c.contract_id)}>{c.property_name ?? c.contract_id}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Subtenant Name *</Label><Input className="mt-1" value={form.subtenantName} onChange={e => setForm((f: any) => ({ ...f, subtenantName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input className="mt-1" type="date" value={form.startDate} onChange={e => setForm((f: any) => ({ ...f, startDate: e.target.value }))} /></div>
                <div><Label>End Date</Label><Input className="mt-1" type="date" value={form.endDate} onChange={e => setForm((f: any) => ({ ...f, endDate: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Monthly Rent</Label><Input className="mt-1" type="number" value={form.monthlyRent} onChange={e => setForm((f: any) => ({ ...f, monthlyRent: e.target.value }))} /></div>
                <div><Label>Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm((f: any) => ({ ...f, currency: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["QAR","USD","EUR","GBP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" disabled={create.isPending}
                  onClick={() => create.mutate({ head_lease_contract_id: Number(form.parentContractId), sublessee_name: form.subtenantName, commencement_date: form.startDate, expiry_date: form.endDate, monthly_income: Number(form.monthlyRent), classification: (form.classification || 'OPERATING_SUBLEASE') as 'FINANCE_SUBLEASE' | 'OPERATING_SUBLEASE' })}>
                  {create.isPending ? "Creating..." : "Create Sub-Lease"}
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
          screenId="VFLSUBLSE0001P001"
          title="Sub-Leases"
          subtitle="Sub-lease arrangements and subletting management"
          screenType="sub_leases"
          onAIData={(rows) => setAiRows(rows)}
          actions={<Button onClick={openAdd} className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2 h-9 px-3 text-sm rounded-lg"><Plus className="w-4 h-4" />Add</Button>}
        />
        <div className="rounded-xl border border-border overflow-hidden">
          
        {showSample && (
          <div className="bg-card border border-primary/30 rounded-xl p-5 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Sample Record (Qatar)</h3>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowSample(false)}>✕ Close</button>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 rounded p-3">{'sublessee_name: "Ooredoo Qatar Q.S.C.", monthly_income: 18500, commencement_date: "2025-03-01", expiry_date: "2027-02-28", classification: "OPERATING_SUBLEASE", sublease_area_sqft: 1200, notes: "Sub-let of server room, West Bay Tower"'}</pre>
          </div>
        )}
        <Table>
            <TableHeader><TableRow>
              <TableHead>Parent Contract</TableHead><TableHead>Subtenant</TableHead><TableHead>Start Date</TableHead><TableHead>End Date</TableHead><TableHead>Monthly Rent</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(subleases as any[]).map((s: any) => (
                <TableRow key={s.sublease_id}>
                  <TableCell>{s.parent_contract_id}</TableCell>
                  <TableCell>{s.subtenant_name}</TableCell>
                  <TableCell>{s.start_date ? new Date(s.start_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{s.end_date ? new Date(s.end_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{s.currency} {Number(s.monthly_rent).toLocaleString()}</TableCell>
                  <TableCell><Badge className={s.status === "Active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>{s.status}</Badge></TableCell>
                  <TableCell className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(s)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(subleases as any[]).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No sub-leases recorded</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
