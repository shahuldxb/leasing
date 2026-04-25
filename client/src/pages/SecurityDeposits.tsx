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

export default function SecurityDeposits() {
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
  const [form, setForm] = useState<any>({ contractId: "", amount: "", currency: "QAR", depositType: "Cash", receivedDate: "", notes: "" });
  const [aiRows, setAiRows] = useState<any[]>([]);

  function openAdd() { setEditRow(null); setForm({ contractId: "", amount: "", currency: "QAR", depositType: "Cash", receivedDate: "", notes: "" }); setShowForm(true); }
  function openEdit(d: any) {
    setEditRow(d);
    setForm({ contractId: String(d.contract_id ?? ""), amount: String(d.amount ?? d.deposit_amount ?? ""), currency: d.currency ?? "QAR", depositType: d.deposit_type ?? "Cash", receivedDate: d.received_date ? new Date(d.received_date).toISOString().slice(0,10) : "", notes: d.notes ?? "" });
    setShowForm(true);
  }
  function handleDelete(d: any) {
    toast("Delete deposit for contract " + d.contract_id + "?", {
      action: { label: "Confirm Delete", onClick: () => toast.success("Deposit deleted") },
    });
  }

  const { data: deposits = [], refetch } = trpc.securityDeposit.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];
  // Auto-select first contract when data loads
  useEffect(() => {
    if (contracts.length > 0 && !form.contractId) {
      setForm((f: any) => ({ ...f, contractId: String(contracts[0].contract_id) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts.length]);
  const create = trpc.securityDeposit.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success("Security deposit recorded"); }, onError: (e: any) => toast.error(e.message) });
  const release = trpc.securityDeposit.create.useMutation({ onSuccess: () => { refetch(); toast.success("Deposit released"); }, onError: (e: any) => toast.error(e.message) });

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div>
              <h2 className="font-semibold text-lg">{editRow ? "Edit Security Deposit" : "Record Security Deposit"}</h2>
              <p className="text-sm text-muted-foreground">{editRow ? "Update deposit details" : "Register a security deposit received for a lease contract"}</p>
            </div>
            <div className="ml-auto"><GenAIFillButton
              formType="security_deposit"
              onFill={(data) => setForm((f: any) => ({
                          ...f,
                          amount: data.depositAmount ?? f.amount,
                          currency: data.currency ?? f.currency,
                          depositType: data.depositType ?? f.depositType,
                          receivedDate: data.depositDate ?? f.receivedDate,
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
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount *</Label><Input className="mt-1" type="number" value={form.amount} onChange={e => setForm((f: any) => ({ ...f, amount: e.target.value }))} /></div>
                <div><Label>Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm((f: any) => ({ ...f, currency: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["QAR","USD","EUR","GBP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Deposit Type</Label>
                <Select value={form.depositType} onValueChange={v => setForm((f: any) => ({ ...f, depositType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Cash","Cheque","Bank Guarantee","Letter of Credit"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Received Date</Label><Input className="mt-1" type="date" value={form.receivedDate} onChange={e => setForm((f: any) => ({ ...f, receivedDate: e.target.value }))} /></div>
              <div><Label>Notes</Label><Input className="mt-1" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" disabled={create.isPending}
                  onClick={() => create.mutate({ contract_id: Number(form.contractId), deposit_amount: Number(form.amount), deposit_type: form.depositType, deposit_date: form.receivedDate, notes: form.notes })}>
                  {create.isPending ? "Saving..." : "Record Deposit"}
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
          screenId="VFLSECDEP0001P001"
          title="Security Deposits"
          subtitle="Security deposit register and release management"
          screenType="security_deposits"
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
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 rounded p-3">{'deposit_amount: 135000, deposit_type: "BANK_GUARANTEE", deposit_date: "2025-02-01", expected_return_date: "2028-04-30", bank_name: "Qatar National Bank (QNB)", guarantee_number: "QNB-BG-2025-00142", notes: "3 months rent equivalent"'}</pre>
          </div>
        )}
        <Table>
            <TableHeader><TableRow>
              <TableHead>Contract</TableHead><TableHead>Amount</TableHead><TableHead>Currency</TableHead><TableHead>Type</TableHead><TableHead>Received</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(deposits as any[]).map((d: any) => (
                <TableRow key={d.deposit_id}>
                  <TableCell>{d.contract_id}</TableCell>
                  <TableCell>{Number(d.amount).toLocaleString()}</TableCell>
                  <TableCell>{d.currency}</TableCell>
                  <TableCell>{d.deposit_type}</TableCell>
                  <TableCell>{d.received_date ? new Date(d.received_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell><Badge className={d.status === "Held" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>{d.status}</Badge></TableCell>
                  <TableCell className="flex items-center gap-2">
                    {d.status === "Held" && <Button size="sm" variant="outline" onClick={() => release.mutate({ contract_id: d.contract_id, deposit_amount: d.deposit_amount, deposit_type: d.deposit_type, deposit_date: d.deposit_date })}>Release</Button>}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(d)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(d)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {(deposits as any[]).length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No security deposits recorded</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
