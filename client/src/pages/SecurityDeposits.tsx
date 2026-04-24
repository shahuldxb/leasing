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
import { Shield, Plus, Banknote, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GenAIFillButton } from "@/components/GenAIFillButton";
import SlidePanel from "@/components/SlidePanel";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

const TYPE_ICONS: Record<string, string> = { CASH: "💵", BANK_GUARANTEE: "🏦", CHEQUE: "📄", LETTER_OF_CREDIT: "📋" };

export default function SecurityDeposits() {
  const [showForm, setShowForm] = useState(false);
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState({ contract_id: 0, deposit_amount: 0, deposit_type: "CASH" as const, deposit_date: "", expected_return_date: "", bank_name: "", guarantee_number: "", notes: "" });

  const { data: deposits = [], refetch } = trpc.securityDeposit.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];

  const create = trpc.securityDeposit.create.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); toast.success("Security deposit recorded"); },
    onError: (err: any) => toast.error(err.message),
  });

  const totalHeld = (deposits as any[]).filter((d: any) => d.status === "HELD").reduce((s: number, d: any) => s + Number(d.deposit_amount ?? 0), 0);
  const cashDeposits = (deposits as any[]).filter((d: any) => d.deposit_type === "CASH").reduce((s: number, d: any) => s + Number(d.deposit_amount ?? 0), 0);
  const guarantees = (deposits as any[]).filter((d: any) => d.deposit_type === "BANK_GUARANTEE").reduce((s: number, d: any) => s + Number(d.deposit_amount ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLSECDEP0001P001"
          screenType="security_deposits"
          onAIData={(rows) => setAiRows(rows)}
  title="Security Deposits"
  subtitle="Security deposit register and release management"
/>

        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total Held</p><p className="text-2xl font-bold text-emerald-600">{fmt(totalHeld)}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Cash Deposits</p><p className="text-2xl font-bold">{fmt(cashDeposits)}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Bank Guarantees</p><p className="text-2xl font-bold">{fmt(guarantees)}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total Records</p><p className="text-2xl font-bold">{(deposits as any[]).length}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Deposit Register</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Deposit Date</TableHead>
                  <TableHead>Expected Return</TableHead>
                  <TableHead>Bank / Guarantee No.</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(deposits as any[]).map((d: any) => (
                  <TableRow key={d.deposit_id}>
                    <TableCell className="font-mono text-xs">{d.contract_ref}</TableCell>
                    <TableCell className="text-sm max-w-[120px] truncate">{d.asset_description}</TableCell>
                    <TableCell>
                      <span className="text-sm">{TYPE_ICONS[d.deposit_type] ?? ""} {d.deposit_type?.replace(/_/g, " ")}</span>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-sm">{fmt(d.deposit_amount)}</TableCell>
                    <TableCell className="text-sm">{d.deposit_date?.slice(0, 10)}</TableCell>
                    <TableCell className="text-sm">{d.expected_return_date?.slice(0, 10) ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.bank_name ?? "—"}{d.guarantee_number ? ` / ${d.guarantee_number}` : ""}</TableCell>
                    <TableCell>
                      <Badge variant={d.status === "HELD" ? "default" : d.status === "RETURNED" ? "secondary" : "destructive"} className="text-xs">{d.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(deposits as any[]).length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No security deposits recorded</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <SlidePanel open={showForm} onClose={() => setShowForm(false)} title="" width="xl">
          
            
          <div className="flex justify-end mt-2"><GenAIFillButton formType="security_deposit" onFill={(data) => { if (data.amount !== undefined) setForm(f => ({ ...f, amount: data.amount as any })); if (data.currency !== undefined) setForm(f => ({ ...f, currency: data.currency as any })); if (data.bank_name !== undefined) setForm(f => ({ ...f, bank_name: data.bank_name as any })); if (data.bank_ref !== undefined) setForm(f => ({ ...f, bank_ref: data.bank_ref as any })); if (data.deposit_date !== undefined) setForm(f => ({ ...f, deposit_date: data.deposit_date as any })); }} /></div>
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
                  <Label>Deposit Type</Label>
                  <Select value={form.deposit_type} onValueChange={v => setForm(f => ({ ...f, deposit_type: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK_GUARANTEE">Bank Guarantee</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="LETTER_OF_CREDIT">Letter of Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Amount (AED)</Label>
                  <Input type="number" value={form.deposit_amount} onChange={e => setForm(f => ({ ...f, deposit_amount: parseFloat(e.target.value) }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Deposit Date</Label>
                  <Input type="date" value={form.deposit_date} onChange={e => setForm(f => ({ ...f, deposit_date: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Expected Return Date</Label>
                  <Input type="date" value={form.expected_return_date} onChange={e => setForm(f => ({ ...f, expected_return_date: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Bank Name</Label>
                  <Input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} placeholder="Emirates NBD..." />
                </div>
                <div className="space-y-1">
                  <Label>Guarantee / Reference No.</Label>
                  <Input value={form.guarantee_number} onChange={e => setForm(f => ({ ...f, guarantee_number: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => create.mutate(form)} disabled={create.isPending || !form.contract_id || !form.deposit_date}>
                {create.isPending ? "Saving..." : "Record Deposit"}
              </Button>
            </div>
          
        </SlidePanel>
      </div>
    </DashboardLayout>
  );
}
