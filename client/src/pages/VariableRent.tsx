import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ScreenHeader from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function VariableRent() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ contractId: "", period: "", variableType: "Turnover", amount: "", currency: "AED", notes: "" });
  const [aiRows, setAiRows] = useState<any[]>([]);

  const { data: items = [], refetch } = trpc.accounting.variableRent.list.useQuery({});
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.contracts ?? [];
  const create = trpc.accounting.variableRent.record.useMutation({ onSuccess: () => { refetch(); setShowForm(false); toast.success("Variable rent recorded"); }, onError: (e: any) => toast.error(e.message) });

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div>
              <h2 className="font-semibold text-lg">Record Variable Rent</h2>
              <p className="text-sm text-muted-foreground">Record a variable rent payment (turnover, index-linked, etc.)</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div><Label>Contract</Label>
                <Select value={form.contractId} onValueChange={v => setForm((f: any) => ({ ...f, contractId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select contract" /></SelectTrigger>
                  <SelectContent>{contracts.map((c: any) => <SelectItem key={c.contract_id} value={String(c.contract_id)}>{c.property_name ?? c.contract_id}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Variable Type</Label>
                <Select value={form.variableType} onValueChange={v => setForm((f: any) => ({ ...f, variableType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Turnover","Index-linked","Usage-based","Performance"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Period (YYYY-MM)</Label><Input className="mt-1" placeholder="2024-01" value={form.period} onChange={e => setForm((f: any) => ({ ...f, period: e.target.value }))} /></div>
                <div><Label>Amount</Label><Input className="mt-1" type="number" value={form.amount} onChange={e => setForm((f: any) => ({ ...f, amount: e.target.value }))} /></div>
              </div>
              <div><Label>Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm((f: any) => ({ ...f, currency: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["AED","USD","EUR","GBP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Input className="mt-1" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" disabled={create.isPending}
                  onClick={() => create.mutate({ contract_id: Number(form.contractId), period_from: form.period || new Date().toISOString().split("T")[0], period_to: form.periodTo || new Date().toISOString().split("T")[0], variable_type: (form.variableType || 'OTHER') as any, description: form.description || form.variableType || 'Variable rent', actual_amount: Number(form.amount), notes: form.notes })}>
                  {create.isPending ? "Saving..." : "Record Variable Rent"}
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
          screenId="VFLVARNT0001P001"
          title="Variable Rent"
          subtitle="Turnover, index-linked and usage-based variable rent records"
          screenType="variable_rent"
          onAIData={(rows) => setAiRows(rows)}
          actions={<Button onClick={() => setShowForm(true)} className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2 h-9 px-3 text-sm rounded-lg"><Plus className="w-4 h-4" />Add</Button>}
        />
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Contract</TableHead><TableHead>Type</TableHead><TableHead>Period</TableHead><TableHead>Amount</TableHead><TableHead>Currency</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(items as any[]).map((i: any) => (
                <TableRow key={i.variable_rent_id}>
                  <TableCell>{i.contract_id}</TableCell>
                  <TableCell>{i.variable_type}</TableCell>
                  <TableCell>{i.period}</TableCell>
                  <TableCell>{Number(i.amount).toLocaleString()}</TableCell>
                  <TableCell>{i.currency}</TableCell>
                </TableRow>
              ))}
              {(items as any[]).length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No variable rent records</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
