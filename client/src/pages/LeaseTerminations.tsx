import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, XCircle } from "lucide-react";
import { toast } from "sonner";

const TERM_REASONS = ["Lease Expired","Early Termination","Asset Disposed","Mutual Agreement","Breach of Contract","Force Majeure"];

export default function LeaseTerminations() {
  const [open, setOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState("");
  const [terminationDate, setTerminationDate] = useState("");
  const [reason, setReason] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState("");

  const { data: leases = [] } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 200 });

  const handleSubmit = () => {
    if (!selectedLease || !terminationDate || !reason) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Termination submitted. Derecognition GL entries will be generated upon approval.");
    setOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lease Terminations</h1>
            <p className="text-sm text-muted-foreground mt-1">Screen ID: VFLSETERM0001P001 · Derecognition and early termination management</p>
          </div>
          <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setOpen(true)}>
            <XCircle className="w-4 h-4 mr-2" /> Initiate Termination
          </Button>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-400">Important — IFRS 16 Derecognition</p>
            <p className="text-muted-foreground mt-1">Terminating a lease will derecognise the ROU Asset and Lease Liability, posting the difference as a gain or loss on termination. This action requires Maker/Checker approval.</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Contract Ref</TableHead>
                <TableHead className="text-xs">Lessor</TableHead>
                <TableHead className="text-xs">Termination Date</TableHead>
                <TableHead className="text-xs">Reason</TableHead>
                <TableHead className="text-xs">Penalty</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No terminations recorded</TableCell></TableRow>
            </TableBody>
          </Table>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400"><XCircle className="w-5 h-5" /> Initiate Lease Termination</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Lease *</Label>
                <Select value={selectedLease} onValueChange={setSelectedLease}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select lease..." /></SelectTrigger>
                  <SelectContent>
                    {(leases as any[]).map((l: any) => (
                      <SelectItem key={l.contract_id} value={String(l.contract_id)}>{l.contract_ref} — {l.asset_description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Termination Date *</Label>
                <Input type="date" className="mt-1" value={terminationDate} onChange={e => setTerminationDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium">Reason *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                  <SelectContent>{TERM_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Early Termination Penalty</Label>
                <Input type="number" className="mt-1" placeholder="0.00 (if applicable)" value={penaltyAmount} onChange={e => setPenaltyAmount(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleSubmit}>Submit for Approval</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
