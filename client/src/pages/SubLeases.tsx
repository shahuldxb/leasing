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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Plus, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GenAIFillButton } from "@/components/GenAIFillButton";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

export default function SubLeases() {
  const [showForm, setShowForm] = useState(false);
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState({ head_lease_contract_id: 0, sublessee_name: "", sublease_area_sqft: 0, monthly_income: 0, commencement_date: "", expiry_date: "", classification: "OPERATING_SUBLEASE" as const, notes: "" });

  const { data: subleases = [], refetch } = trpc.subLease.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];

  const create = trpc.subLease.create.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); toast.success("Sub-lease created"); },
    onError: (err: any) => toast.error(err.message),
  });

  const totalIncome = (subleases as any[]).reduce((s: number, sl: any) => s + Number(sl.monthly_income ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLSUBLSE0001P001"
          screenType="sub_leases"
          onAIData={(rows) => setAiRows(rows)}
  title="Sub-Leases"
  subtitle="Sub-lease register and income tracking"
/>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Active Sub-Leases</p><p className="text-3xl font-bold text-teal-600">{(subleases as any[]).filter((s: any) => s.status === "Active").length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Monthly Sub-Lease Income</p><p className="text-3xl font-bold text-emerald-600">{fmt(totalIncome)}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Annual Income</p><p className="text-3xl font-bold">{fmt(totalIncome * 12)}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Sub-Lease Register</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Head Lease</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Sublessee</TableHead>
                  <TableHead>Area (sqft)</TableHead>
                  <TableHead>Monthly Income</TableHead>
                  <TableHead>Commencement</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(subleases as any[]).map((sl: any) => (
                  <TableRow key={sl.sublease_id}>
                    <TableCell className="font-mono text-xs">{sl.head_lease_ref}</TableCell>
                    <TableCell className="text-sm max-w-[120px] truncate">{sl.asset_description}</TableCell>
                    <TableCell className="font-medium text-sm">{sl.sublessee_name}</TableCell>
                    <TableCell className="text-sm">{sl.sublease_area_sqft?.toLocaleString() ?? "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{fmt(sl.monthly_income)}</TableCell>
                    <TableCell className="text-sm">{sl.commencement_date?.slice(0, 10)}</TableCell>
                    <TableCell className="text-sm">{sl.expiry_date?.slice(0, 10)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{sl.classification?.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell><Badge variant={sl.status === "Active" ? "default" : "secondary"} className="text-xs">{sl.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {(subleases as any[]).length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No sub-leases found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Sub-Lease</DialogTitle>
          <div className="flex justify-end mt-2"><GenAIFillButton formType="sub_lease" onFill={(data) => { if (data.sub_tenant_name !== undefined) setForm(f => ({ ...f, sub_tenant_name: data.sub_tenant_name as any })); if (data.sub_rent !== undefined) setForm(f => ({ ...f, sub_rent: data.sub_rent as any })); if (data.start_date !== undefined) setForm(f => ({ ...f, start_date: data.start_date as any })); if (data.end_date !== undefined) setForm(f => ({ ...f, end_date: data.end_date as any })); if (data.area_sqm !== undefined) setForm(f => ({ ...f, area_sqm: data.area_sqm as any })); if (data.notes !== undefined) setForm(f => ({ ...f, notes: data.notes as any })); }} /></div></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Head Lease Contract</Label>
                <Select value={form.head_lease_contract_id.toString()} onValueChange={v => setForm(f => ({ ...f, head_lease_contract_id: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select head lease..." /></SelectTrigger>
                  <SelectContent>{(contracts as any[]).map((c: any) => <SelectItem key={c.contract_id} value={c.contract_id.toString()}>{c.contract_ref} — {c.asset_description}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Sublessee Name</Label>
                <Input value={form.sublessee_name} onChange={e => setForm(f => ({ ...f, sublessee_name: e.target.value }))} placeholder="Company name..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Area (sqft)</Label>
                  <Input type="number" value={form.sublease_area_sqft} onChange={e => setForm(f => ({ ...f, sublease_area_sqft: parseFloat(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <Label>Monthly Income (AED)</Label>
                  <Input type="number" value={form.monthly_income} onChange={e => setForm(f => ({ ...f, monthly_income: parseFloat(e.target.value) }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Commencement</Label>
                  <Input type="date" value={form.commencement_date} onChange={e => setForm(f => ({ ...f, commencement_date: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Expiry</Label>
                  <Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Classification</Label>
                <Select value={form.classification} onValueChange={v => setForm(f => ({ ...f, classification: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATING_SUBLEASE">Operating Sub-Lease</SelectItem>
                    <SelectItem value="FINANCE_SUBLEASE">Finance Sub-Lease</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => create.mutate(form)} disabled={create.isPending || !form.head_lease_contract_id || !form.sublessee_name}>
                {create.isPending ? "Saving..." : "Create Sub-Lease"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
