import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function PayablesApprovals() {
  const { data: invoices = [], refetch } = trpc.payables.getInvoiceRegister.useQuery({ page: 1, pageSize: 100, status: "Pending" });
  const rows: any[] = Array.isArray(invoices) ? invoices : (invoices as any)?.invoices ?? [];

  const approveMutation = trpc.payables.approveInvoice.useMutation({
    onSuccess: (d: any) => { toast.success(`Invoice ${d?.new_status ?? "updated"}`); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-[#e60000]" /> Payables Approval Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFPAYAPPQ0001P001 · Checker approval for pending invoices</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Pending Approval</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{rows.length}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Approved Today</p>
            <p className="text-2xl font-bold text-green-400 mt-1">0</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Rejected Today</p>
            <p className="text-2xl font-bold text-red-400 mt-1">0</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Invoice No</TableHead>
                <TableHead className="text-xs">Lease Ref</TableHead>
                <TableHead className="text-xs">Lessor</TableHead>
                <TableHead className="text-xs">Due Date</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Submitted By</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inv: any) => (
                <TableRow key={inv.invoice_id} className="text-sm hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                  <TableCell className="font-mono text-xs">{inv.contract_ref ?? "—"}</TableCell>
                  <TableCell>{inv.lessor_name ?? "—"}</TableCell>
                  <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-right font-mono">{inv.currency} {Number(inv.total ?? inv.gross_amount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>{inv.created_by ?? "System"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs"
                        onClick={() => approveMutation.mutate({ invoiceId: inv.invoice_id, outcome: "Approved" })}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-400 border-red-500/30 h-7 px-3 text-xs"
                        onClick={() => approveMutation.mutate({ invoiceId: inv.invoice_id, outcome: "Rejected", reason: "Rejected by checker" })}>
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No invoices pending approval</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
