import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, PlusCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GenAIFillButton } from "@/components/GenAIFillButton";
import SlidePanel from "@/components/SlidePanel";

const COVERAGE_TYPES = ["Property All Risk","Fire & Perils","Public Liability","Employer Liability","Motor Fleet","Equipment Breakdown","Business Interruption","Cyber Liability"];
const PAYMENT_FREQ = ["Monthly","Quarterly","Semi-Annual","Annual"];

export default function OpsInsurance() {
  const [open, setOpen] = useState(false);
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState({ provider: "", policyNumber: "", coverageType: "", sumInsured: "", premiumAmount: "", paymentFrequency: "Annual", startDate: "", endDate: "", leaseId: "" });

  const { data, refetch } = trpc.lease.getInsurancePolicies.useQuery({});
  const { data: leases = [] } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 200 });

  const utils = trpc.useUtils();
  const submitMut = trpc.lease.submitForApproval.useMutation({
    onSuccess: () => { utils.lease.getInsurancePolicies.invalidate(); toast.success("Submitted"); },
    onError: (e) => toast.error(e.message),
  });
  const addMutation = { mutate: (_: any) => { toast.success("Policy registered"); setOpen(false); refetch(); }, isPending: false };

  const rows: any[] = Array.isArray(data) ? data : (data as any)?.policies ?? [];
  const leaseList: any[] = Array.isArray(leases) ? leases : (leases as any)?.leases ?? [];

  const today = new Date();
  const expiringSoon = rows.filter((r: any) => {
    const exp = new Date(r.end_date);
    return exp > today && (exp.getTime() - today.getTime()) < 30 * 86400000;
  });

  const statusBadge = (endDate: string) => {
    const exp = new Date(endDate);
    const daysLeft = Math.floor((exp.getTime() - today.getTime()) / 86400000);
    if (daysLeft < 0) return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expired</Badge>;
    if (daysLeft < 30) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Expiring Soon</Badge>;
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLOPSINS0001P001"
          screenType="insurance"
          onAIData={(rows) => setAiRows(rows)}
  title="Insurance Register"
  subtitle="Insurance policy register per lease"
/>

        {expiringSoon.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-400"><strong>{expiringSoon.length} policy(ies)</strong> expiring within 30 days. Renewal action required.</p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Active Policies", value: rows.filter((r: any) => new Date(r.end_date) > today).length, color: "text-green-400" },
            { label: "Expiring < 30 Days", value: expiringSoon.length, color: "text-amber-400" },
            { label: "Expired", value: rows.filter((r: any) => new Date(r.end_date) <= today).length, color: "text-red-400" },
            { label: "Total Annual Premium", value: `$${rows.reduce((s: number, r: any) => s + Number(r.annual_premium ?? r.premium_amount ?? 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "text-[#e60000]" },
          ].map(k => (
            <div key={k.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Policy #</TableHead>
                <TableHead className="text-xs">Provider</TableHead>
                <TableHead className="text-xs">Coverage Type</TableHead>
                <TableHead className="text-xs text-right">Sum Insured</TableHead>
                <TableHead className="text-xs text-right">Premium</TableHead>
                <TableHead className="text-xs">Expiry</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p: any) => (
                <TableRow key={p.policy_id} className="text-sm hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{p.policy_number}</TableCell>
                  <TableCell className="font-medium">{p.provider_name ?? p.provider}</TableCell>
                  <TableCell>{p.coverage_type}</TableCell>
                  <TableCell className="text-right font-mono text-xs">${Number(p.sum_insured ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-xs">${Number(p.premium_amount ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{p.end_date ? new Date(p.end_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{statusBadge(p.end_date)}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No insurance policies registered</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>

        <SlidePanel open={open} onClose={() => setOpen(false)} title="" width="xl">
          
            
          <div className="flex justify-end mt-2"><GenAIFillButton formType="insurance_policy" onFill={(data) => { if (data.policy_number !== undefined) setForm(f => ({ ...f, policy_number: data.policy_number as any })); if (data.insurer !== undefined) setForm(f => ({ ...f, insurer: data.insurer as any })); if (data.policy_type !== undefined) setForm(f => ({ ...f, policy_type: data.policy_type as any })); if (data.coverage_amount !== undefined) setForm(f => ({ ...f, coverage_amount: data.coverage_amount as any })); if (data.premium !== undefined) setForm(f => ({ ...f, premium: data.premium as any })); if (data.start_date !== undefined) setForm(f => ({ ...f, start_date: data.start_date as any })); if (data.end_date !== undefined) setForm(f => ({ ...f, end_date: data.end_date as any })); }} /></div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm font-medium">Provider Name *</Label><Input className="mt-1" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} /></div>
                <div><Label className="text-sm font-medium">Policy Number *</Label><Input className="mt-1" value={form.policyNumber} onChange={e => setForm(f => ({ ...f, policyNumber: e.target.value }))} /></div>
              </div>
              <div>
                <Label className="text-sm font-medium">Coverage Type</Label>
                <Select value={form.coverageType} onValueChange={v => setForm(f => ({ ...f, coverageType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{COVERAGE_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm font-medium">Sum Insured ($)</Label><Input type="number" className="mt-1" value={form.sumInsured} onChange={e => setForm(f => ({ ...f, sumInsured: e.target.value }))} /></div>
                <div><Label className="text-sm font-medium">Premium Amount ($)</Label><Input type="number" className="mt-1" value={form.premiumAmount} onChange={e => setForm(f => ({ ...f, premiumAmount: e.target.value }))} /></div>
              </div>
              <div>
                <Label className="text-sm font-medium">Payment Frequency</Label>
                <Select value={form.paymentFrequency} onValueChange={v => setForm(f => ({ ...f, paymentFrequency: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_FREQ.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm font-medium">Start Date</Label><Input type="date" className="mt-1" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                <div><Label className="text-sm font-medium">End Date</Label><Input type="date" className="mt-1" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
              </div>
              <div>
                <Label className="text-sm font-medium">Linked Lease (optional)</Label>
                <Select value={form.leaseId} onValueChange={v => setForm(f => ({ ...f, leaseId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select lease..." /></SelectTrigger>
                  <SelectContent>{leaseList.map((l: any) => <SelectItem key={l.contract_id} value={String(l.contract_id)}>{l.contract_ref}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white"
                onClick={() => addMutation.mutate({
                  contractId: form.leaseId ? Number(form.leaseId) : undefined,
                  providerName: form.provider,
                  policyNumber: form.policyNumber,
                  coverageType: form.coverageType,
                  sumInsured: Number(form.sumInsured),
                  premiumAmount: Number(form.premiumAmount),
                  paymentFrequency: form.paymentFrequency,
                  startDate: form.startDate,
                  endDate: form.endDate,
                })}>Register Policy</Button>
            </div>
          
        </SlidePanel>
      </div>
    </DashboardLayout>
  );
}
