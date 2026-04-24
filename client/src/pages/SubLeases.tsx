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

export default function SubLeases() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ parentContractId: "", subtenantName: "", startDate: "", endDate: "", monthlyRent: "", currency: "AED" });
  const [aiRows, setAiRows] = useState<any[]>([]);

  const { data: subleases = [], refetch } = trpc.subLease.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.contracts ?? [];
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
              <h2 className="font-semibold text-lg">New Sub-Lease</h2>
              <p className="text-sm text-muted-foreground">Create a sub-lease arrangement under a master lease contract</p>
            </div>
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
                    <SelectContent>{["AED","USD","EUR","GBP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
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
          actions={<Button onClick={() => setShowForm(true)} className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2 h-9 px-3 text-sm rounded-lg"><Plus className="w-4 h-4" />Add</Button>}
        />
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Parent Contract</TableHead><TableHead>Subtenant</TableHead><TableHead>Start Date</TableHead><TableHead>End Date</TableHead><TableHead>Monthly Rent</TableHead><TableHead>Status</TableHead>
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
