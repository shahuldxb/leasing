import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500", SUBMITTED: "bg-blue-500", UNDER_REVIEW: "bg-amber-500",
  APPROVED: "bg-emerald-500", REJECTED: "bg-red-500", CONTRACTED: "bg-violet-500",
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-400", MEDIUM: "bg-blue-400", HIGH: "bg-amber-500", CRITICAL: "bg-red-500",
};

const WORKFLOW = ["DRAFT","SUBMITTED","UNDER_REVIEW","APPROVED","CONTRACTED"];

export default function LeaseOrigination() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ lessor_name: "", asset_description: "", asset_type: "OFFICE", proposed_start: "", proposed_end: "", estimated_annual_rent: 0, currency: "AED", business_justification: "", priority: "MEDIUM" as const });

  const { data: items = [], refetch } = trpc.leaseOrigination.list.useQuery();
  const create = trpc.leaseOrigination.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Lease request created"); }, onError: (e: any) => toast.error(e.message) });
  const advance = trpc.leaseOrigination.updateStatus.useMutation({ onSuccess: () => { refetch(); toast.success("Status updated"); }, onError: (e: any) => toast.error(e.message) });

  const fmt = (n: any) => n != null ? `${Number(n).toLocaleString()}` : "—";

  const nextStatus = (s: string) => {
    const i = WORKFLOW.indexOf(s);
    return i >= 0 && i < WORKFLOW.length - 1 ? WORKFLOW[i + 1] : null;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-blue-500" />Lease Origination</h1>
            <p className="text-muted-foreground text-sm">New lease requests, approvals, and pipeline management</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Request</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>New Lease Request</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {[
                  { label: "Lessor / Landlord", key: "lessor_name", type: "text" },
                  { label: "Asset Description", key: "asset_description", type: "text" },
                  { label: "Proposed Start", key: "proposed_start", type: "date" },
                  { label: "Proposed End", key: "proposed_end", type: "date" },
                  { label: "Est. Annual Rent", key: "estimated_annual_rent", type: "number" },
                ].map(f => (
                  <div key={f.key}><Label>{f.label}</Label><Input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))} /></div>
                ))}
                <div><Label>Asset Type</Label>
                  <Select value={form.asset_type} onValueChange={v => setForm(p => ({ ...p, asset_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["OFFICE","RETAIL","WAREHOUSE","DATA_CENTRE","VEHICLE","OTHER"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["LOW","MEDIUM","HIGH","CRITICAL"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Business Justification</Label><Textarea value={form.business_justification} onChange={e => setForm(p => ({ ...p, business_justification: e.target.value }))} rows={3} /></div>
              </div>
              <Button className="mt-4 w-full" onClick={() => create.mutate(form)} disabled={create.isPending}>Submit Request</Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {WORKFLOW.map(s => {
            const count = (items as any[]).filter((i: any) => i.status === s).length;
            return (
              <Card key={s} className="text-center">
                <CardContent className="pt-4">
                  <Badge className={`${STATUS_COLORS[s]} text-white mb-2`}>{s.replace("_"," ")}</Badge>
                  <p className="text-3xl font-bold">{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Lease Pipeline ({(items as any[]).length} requests)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lessor</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Est. Annual Rent</TableHead>
                  <TableHead>Proposed Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items as any[]).map((item: any) => (
                  <TableRow key={item.origination_id}>
                    <TableCell className="font-medium">{item.lessor_name}</TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">{item.asset_description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{item.asset_type}</Badge></TableCell>
                    <TableCell><Badge className={`${PRIORITY_COLORS[item.priority]} text-white text-xs`}>{item.priority}</Badge></TableCell>
                    <TableCell className="text-right font-mono text-sm">{item.currency} {fmt(item.estimated_annual_rent)}</TableCell>
                    <TableCell className="text-xs">{item.proposed_start?.slice(0,10)} → {item.proposed_end?.slice(0,10)}</TableCell>
                    <TableCell><Badge className={`${STATUS_COLORS[item.status] ?? "bg-gray-500"} text-white text-xs`}>{item.status?.replace("_"," ")}</Badge></TableCell>
                    <TableCell>
                      {nextStatus(item.status) && (
                        <Button size="sm" variant="outline" onClick={() => advance.mutate({ origination_id: item.origination_id, status: nextStatus(item.status)! })}>
                          <ArrowRight className="w-3 h-3 mr-1" />{nextStatus(item.status)?.replace("_"," ")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(items as any[]).length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No lease requests yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
