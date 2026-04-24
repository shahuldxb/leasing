import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import SlidePanel from "@/components/SlidePanel";

const statusColor: Record<string, string> = {
  Pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Approved: "bg-green-500/20 text-green-400 border-green-500/30",
  Paid: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  Overdue: "bg-red-600/20 text-red-500 border-red-600/30",
};

export default function InvoiceRegister() {
  const [open, setOpen] = useState(false);
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState({ leaseId: "", invoiceNo: "", invoiceDate: "", dueDate: "", amount: "", currency: "USD", description: "" });

  const { data: invoices = [], refetch } = trpc.payables.getInvoiceRegister.useQuery({ page: 1, pageSize: 50 });
  const { data: leases = [] } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 200 });

  const createMutation = trpc.payables.createInvoice.useMutation({
    onSuccess: () => { toast.success("Invoice created"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const approveMutation = trpc.payables.approveInvoice.useMutation({
    onSuccess: () => { toast.success("Invoice approved"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.leaseId || !form.invoiceNo || !form.amount) { toast.error("Fill required fields"); return; }
    const d = new Date(form.invoiceDate || new Date());
    createMutation.mutate({
      lessorId: 1,
      contractId: Number(form.leaseId),
      invoiceNumber: form.invoiceNo,
      invoiceDate: form.invoiceDate || new Date().toISOString().slice(0,10),
      dueDate: form.dueDate || new Date().toISOString().slice(0,10),
      periodMonth: d.getMonth() + 1,
      periodYear: d.getFullYear(),
      total: Number(form.amount),
      rentAmount: Number(form.amount),
      currency: form.currency,
    });
  };

  const rows: any[] = Array.isArray(invoices) ? invoices : (invoices as any)?.invoices ?? [];

  return (
    <DashboardLayout>
      {open && (
        <SlidePanel open={open} onClose={() => setOpen(false)} title="" width="xl">
          
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Lease *</Label>
                <Select value={form.leaseId} onValueChange={v => setForm(f => ({ ...f, leaseId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select lease..." /></SelectTrigger>
                  <SelectContent>{(leases as any[]).map((l: any) => <SelectItem key={l.contract_id} value={String(l.contract_id)}>{l.contract_ref} — {l.asset_description}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm font-medium">Invoice No *</Label><Input className="mt-1" value={form.invoiceNo} onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))} /></div>
                <div><Label className="text-sm font-medium">Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["USD","GHS","EUR","GBP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-sm font-medium">Invoice Date</Label><Input type="date" className="mt-1" value={form.invoiceDate} onChange={e => setForm(f => ({ ...f, invoiceDate: e.target.value }))} /></div>
                <div><Label className="text-sm font-medium">Due Date</Label><Input type="date" className="mt-1" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
                <div className="col-span-2"><Label className="text-sm font-medium">Amount *</Label><Input type="number" className="mt-1" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
                <div className="col-span-2"><Label className="text-sm font-medium">Description</Label><Input className="mt-1" placeholder="Invoice description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          
        </SlidePanel>
      )}
      {!open && (
        <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLINVREG0001P001"
          screenType="payables"
          onAIData={(rows) => setAiRows(rows)}
  title="Invoice Register"
  subtitle="Lease payment invoices and approval queue"
/>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Invoice No</TableHead>
                <TableHead className="text-xs">Lease Ref</TableHead>
                <TableHead className="text-xs">Lessor</TableHead>
                <TableHead className="text-xs">Invoice Date</TableHead>
                <TableHead className="text-xs">Due Date</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inv: any) => (
                <TableRow key={inv.invoice_id} className="text-sm hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                  <TableCell className="font-mono text-xs">{inv.contract_ref}</TableCell>
                  <TableCell>{inv.lessor_name}</TableCell>
                  <TableCell>{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-right font-mono">{inv.currency} {Number(inv.gross_amount).toLocaleString()}</TableCell>
                  <TableCell><Badge className={statusColor[inv.status] ?? ""}>{inv.status}</Badge></TableCell>
                  <TableCell>
                    {inv.status === "Pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="text-green-400 h-7 px-2" onClick={() => approveMutation.mutate({ invoiceId: inv.invoice_id, outcome: "Approved" })}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 h-7 px-2" onClick={() => approveMutation.mutate({ invoiceId: inv.invoice_id, outcome: "Rejected" })}>
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No invoices found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
        </div>
      )}
    </DashboardLayout>
  );
}
