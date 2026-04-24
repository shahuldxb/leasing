import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Plus } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import SlidePanel from "@/components/SlidePanel";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

const TYPE_LABELS: Record<string, string> = {
  TURNOVER_BASED: "Turnover-Based",
  USAGE_BASED: "Usage-Based",
  INDEX_LINKED: "Index-Linked",
  PERFORMANCE_BASED: "Performance-Based",
  OTHER: "Other",
};

export default function VariableRent() {
  const [showForm, setShowForm] = useState(false);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ contract_id: 0, variable_type: "TURNOVER_BASED" as const, description: "", base_amount: 0, variable_rate_pct: 0, threshold_amount: 0, period_from: "", period_to: "", actual_amount: 0, notes: "" });

  const { data: items = [], refetch } = trpc.accounting.variableRent.list.useQuery({});
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];

  const create = trpc.accounting.variableRent.record.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); toast.success("Variable rent recorded"); },
    onError: (err: any) => toast.error(err.message),
  });

  const totalActual = (items as any[]).reduce((s: number, i: any) => s + Number(i.actual_amount ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLVARNT0001P001"
  title="Variable Rent"
  subtitle="Variable and contingent rent tracking"

          screenType="variable_rent"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total Variable Rent (YTD)</p><p className="text-3xl font-bold text-amber-600">{fmt(totalActual)}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Records</p><p className="text-3xl font-bold">{(items as any[]).length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Leases with Variable Rent</p><p className="text-3xl font-bold">{new Set((items as any[]).map((i: any) => i.contract_id)).size}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Variable Rent Register</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Base Amount</TableHead>
                  <TableHead className="text-right">Actual Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items as any[]).map((item: any) => (
                  <TableRow key={item.variable_rent_id}>
                    <TableCell className="font-mono text-xs">{item.contract_ref}</TableCell>
                    <TableCell className="text-sm max-w-[120px] truncate">{item.asset_description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{TYPE_LABELS[item.variable_type] ?? item.variable_type}</Badge></TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">{item.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.period_from?.slice(0, 10)} – {item.period_to?.slice(0, 10)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(item.base_amount)}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm">{fmt(item.actual_amount)}</TableCell>
                    <TableCell><Badge variant={item.gl_posted ? "default" : "secondary"} className="text-xs">{item.gl_posted ? "GL Posted" : "Pending"}</Badge></TableCell>
                  </TableRow>
                ))}
                {(items as any[]).length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No variable rent records</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <SlidePanel open={showForm} onClose={() => setShowForm(false)} title="" width="xl">
          
            
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Contract</Label>
                <Select value={form.contract_id.toString()} onValueChange={v => setForm(f => ({ ...f, contract_id: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select contract..." /></SelectTrigger>
                  <SelectContent>{(contracts as any[]).map((c: any) => <SelectItem key={c.contract_id} value={c.contract_id.toString()}>{c.contract_ref} — {c.asset_description}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Variable Type</Label>
                  <Select value={form.variable_type} onValueChange={v => setForm(f => ({ ...f, variable_type: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Variable Rate (%)</Label>
                  <Input type="number" step="0.01" value={form.variable_rate_pct} onChange={e => setForm(f => ({ ...f, variable_rate_pct: parseFloat(e.target.value) }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. 5% of annual turnover above AED 10M" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Base Amount (AED)</Label>
                  <Input type="number" value={form.base_amount} onChange={e => setForm(f => ({ ...f, base_amount: parseFloat(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label>Actual Amount (AED)</Label>
                  <Input type="number" value={form.actual_amount} onChange={e => setForm(f => ({ ...f, actual_amount: parseFloat(e.target.value) }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Period From</Label>
                  <Input type="date" value={form.period_from} onChange={e => setForm(f => ({ ...f, period_from: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Period To</Label>
                  <Input type="date" value={form.period_to} onChange={e => setForm(f => ({ ...f, period_to: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => create.mutate(form)} disabled={create.isPending || !form.contract_id || !form.period_from}>
                {create.isPending ? "Saving..." : "Record"}
              </Button>
            </div>
          
        </SlidePanel>
      </div>
    </DashboardLayout>
  );
}
