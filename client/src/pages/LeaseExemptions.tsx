import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Info, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

export default function LeaseExemptions() {
  const [showForm, setShowForm] = useState(false);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<{ contract_id: number; exemption_type: "SHORT_TERM" | "LOW_VALUE"; asset_fair_value: number; annual_expense: number; notes: string }>({ contract_id: 0, exemption_type: "SHORT_TERM", asset_fair_value: 0, annual_expense: 0, notes: "" });

  const { data: exemptions = [], refetch } = trpc.accounting.exemption.list.useQuery({});
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = contractsData?.rows ?? [];

  const create = trpc.accounting.exemption.create.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); toast.success("Exemption recorded"); },
  });
  const remove = trpc.accounting.exemption.remove.useMutation({
    onSuccess: () => { refetch(); toast.success("Exemption removed"); },
  });

  const shortTerm = (exemptions as any[]).filter((e: any) => e.exemption_type === "SHORT_TERM");
  const lowValue = (exemptions as any[]).filter((e: any) => e.exemption_type === "LOW_VALUE");

  const totalExpense = (exemptions as any[]).reduce((a: number, e: any) => a + Number(e.annual_expense ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLLEAEXM0001P001"
  title="Lease Exemptions"
  subtitle="Short-term and low-value lease exemption register"

          screenType="lease_exemptions"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />

        {/* Info */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p><strong>Short-term leases (IFRS 16.5a):</strong> Leases with a term of 12 months or less at commencement date. Recognise as expense on straight-line basis.</p>
              <p><strong>Low-value assets (IFRS 16.5b):</strong> Underlying assets with a fair value of USD 5,000 or less when new. Recognise as expense on straight-line or systematic basis.</p>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Short-Term Leases</p><p className="text-3xl font-bold text-blue-600">{shortTerm.length}</p></div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Low-Value Leases</p><p className="text-3xl font-bold text-purple-600">{lowValue.length}</p></div>
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Annual Expense</p>
                <p className="text-2xl font-bold text-emerald-600">{fmt(totalExpense)}</p>
                <p className="text-xs text-muted-foreground">Disclosed in IFRS 16 note</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exemptions table */}
        <Card>
          <CardHeader><CardTitle className="text-base">Exempted Leases</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Exemption Type</TableHead>
                  <TableHead>Asset Fair Value</TableHead>
                  <TableHead>Annual Expense</TableHead>
                  <TableHead>Approval Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(exemptions as any[]).map((e: any) => (
                  <TableRow key={e.exemption_id}>
                    <TableCell className="font-mono text-sm">{e.contract_ref}</TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm">{e.asset_description}</TableCell>
                    <TableCell>
                      <Badge variant={e.exemption_type === "SHORT_TERM" ? "default" : "secondary"}>
                        {e.exemption_type === "SHORT_TERM" ? "Short-Term" : "Low-Value"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{fmt(e.asset_fair_value)}</TableCell>
                    <TableCell className="font-mono text-sm font-bold">{fmt(e.annual_expense)}</TableCell>
                    <TableCell className="text-sm">{e.approval_date?.slice(0, 10)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{e.notes}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => remove.mutate({ exemption_id: e.exemption_id })}>Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(exemptions as any[]).length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No exemptions recorded</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Lease Exemption</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Contract</Label>
                <Select value={form.contract_id.toString()} onValueChange={v => setForm(f => ({ ...f, contract_id: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select contract..." /></SelectTrigger>
                  <SelectContent>
                    {contracts.map((c: any) => <SelectItem key={c.contract_id} value={c.contract_id.toString()}>{c.contract_ref} — {c.asset_description}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Exemption Type</Label>
                <Select value={form.exemption_type} onValueChange={v => setForm(f => ({ ...f, exemption_type: v as "SHORT_TERM" | "LOW_VALUE" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHORT_TERM">Short-Term (≤12 months)</SelectItem>
                    <SelectItem value="LOW_VALUE">Low-Value Asset (≤USD 5,000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Asset Fair Value (AED)</Label>
                  <Input type="number" value={form.asset_fair_value} onChange={e => setForm(f => ({ ...f, asset_fair_value: parseFloat(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label>Annual Expense (AED)</Label>
                  <Input type="number" value={form.annual_expense} onChange={e => setForm(f => ({ ...f, annual_expense: parseFloat(e.target.value) }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Justification for exemption..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => create.mutate(form)} disabled={create.isPending || !form.contract_id}>
                {create.isPending ? "Saving..." : "Save Exemption"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
