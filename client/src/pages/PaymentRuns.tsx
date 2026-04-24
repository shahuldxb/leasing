import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import SlidePanel from "@/components/SlidePanel";

export default function PaymentRuns() {
  const [open, setOpen] = useState(false);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [payDate, setPayDate] = useState("");
  const [bankFormat, setBankFormat] = useState("SWIFT");

  const createRunMutation = trpc.payables.createPaymentRun.useMutation({
    onSuccess: () => { toast.success("Payment run created and bank file generated"); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      {open && (
        <SlidePanel open={open} onClose={() => setOpen(false)} title="" width="xl">
          
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Payment Date *</Label>
                <Input type="date" className="mt-1" value={payDate} onChange={e => setPayDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium">Bank File Format *</Label>
                <Select value={bankFormat} onValueChange={setBankFormat}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SWIFT">SWIFT MT103</SelectItem>
                    <SelectItem value="EFT">EFT (Local)</SelectItem>
                    <SelectItem value="SEPA">SEPA Credit Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                All approved invoices due on or before the payment date will be included in this run.
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white"
                onClick={() => createRunMutation.mutate({ runDate: payDate, currency: 'USD', invoices: [], bankFileFormat: bankFormat as 'SWIFT' | 'EFT' })}
                disabled={!payDate || createRunMutation.isPending}>
                {createRunMutation.isPending ? "Processing..." : "Generate Run"}
              </Button>
            </div>
          
        </SlidePanel>
      )}
      {!open && (
        <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLPAYRUN0001P001"
  title="Payment Runs"
  subtitle="Payment run creation and bank file generation"

          screenType="payment_runs"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending Payments", value: "0", color: "text-amber-400" },
            { label: "This Month Paid", value: "$0", color: "text-green-400" },
            { label: "Overdue", value: "0", color: "text-red-400" },
          ].map(c => (
            <div key={c.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Run Ref</TableHead>
                <TableHead className="text-xs">Payment Date</TableHead>
                <TableHead className="text-xs">Bank Format</TableHead>
                <TableHead className="text-xs text-right">Total Amount</TableHead>
                <TableHead className="text-xs">Payments</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No payment runs yet</TableCell></TableRow>
            </TableBody>
          </Table>
        </div>
        </div>
      )}
    </DashboardLayout>
  );
}
