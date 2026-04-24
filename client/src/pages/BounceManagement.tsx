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

export default function BounceManagement() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ chequeId: "", bounceDate: "", bounceReason: "Insufficient Funds", waiverReason: "", notes: "" });
  const [aiRows, setAiRows] = useState<any[]>([]);

  const { data: bounces = [], refetch } = trpc.bounceRecon.getPenaltyConfigs.useQuery({});
  const utils = trpc.useUtils();
  const recordMutation = trpc.bounceRecon.recordBounce.useMutation({
    onSuccess: () => { refetch(); setShowForm(false); toast.success("Bounce recorded successfully"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div>
              <h2 className="font-semibold text-lg">Record Bounced Cheque</h2>
              <p className="text-sm text-muted-foreground">Register a returned/bounced cheque and calculate penalties</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div><Label>Cheque ID *</Label><Input className="mt-1" type="number" value={form.chequeId} onChange={e => setForm((f: any) => ({ ...f, chequeId: e.target.value }))} /></div>
              <div><Label>Bounce Date *</Label><Input className="mt-1" type="date" value={form.bounceDate} onChange={e => setForm((f: any) => ({ ...f, bounceDate: e.target.value }))} /></div>
              <div><Label>Bounce Reason</Label>
                <Select value={form.bounceReason} onValueChange={v => setForm((f: any) => ({ ...f, bounceReason: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Insufficient Funds","Account Closed","Payment Stopped","Signature Mismatch","Post-dated","Stale Cheque"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Bank Charges</Label><Input className="mt-1" type="number" value={form.bankCharges} onChange={e => setForm((f: any) => ({ ...f, waiverReason: e.target.value }))} /></div>
              <div><Label>Notes</Label><Input className="mt-1" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" disabled={recordMutation.isPending}
                  onClick={() => recordMutation.mutate({ chequeId: Number(form.chequeId), bounceDate: form.bounceDate, bounceReason: (form.bounceReason as any) || "INSUFFICIENT_FUNDS" })}>
                  {recordMutation.isPending ? "Recording..." : "Record Bounce"}
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
          screenId="VFLBNCMGT0001P001"
          title="Bounce Management"
          subtitle="Bounced cheque tracking and penalty calculation"
          screenType="bounce_management"
          onAIData={(rows) => setAiRows(rows)}
          actions={<Button onClick={() => setShowForm(true)} className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2 h-9 px-3 text-sm rounded-lg"><Plus className="w-4 h-4" />Add</Button>}
        />
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Cheque ID</TableHead><TableHead>Bounce Date</TableHead><TableHead>Reason</TableHead><TableHead>Bank Charges</TableHead><TableHead>Penalty</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(bounces as any[]).map((b: any) => (
                <TableRow key={b.bounce_id}>
                  <TableCell>{b.cheque_id}</TableCell>
                  <TableCell>{b.bounce_date ? new Date(b.bounce_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{b.bounce_reason}</TableCell>
                  <TableCell>{b.bank_charges ? Number(b.bank_charges).toLocaleString() : "—"}</TableCell>
                  <TableCell>{b.penalty_amount ? Number(b.penalty_amount).toLocaleString() : "—"}</TableCell>
                  <TableCell><Badge className={b.status === "Resolved" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>{b.status ?? "Open"}</Badge></TableCell>
                </TableRow>
              ))}
              {(bounces as any[]).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No bounced cheques recorded</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
