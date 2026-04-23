import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, GitBranch } from "lucide-react";
import { toast } from "sonner";

const MOD_TYPES = ["Rent Change","Term Extension","Term Reduction","Scope Change","Remeasurement","Other"];

export default function LeaseModifications() {
  const [open, setOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState("");
  const [modType, setModType] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [newRent, setNewRent] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [reason, setReason] = useState("");

  const { data: leases = [] } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 200 });

  const handleSubmit = () => {
    if (!selectedLease || !modType || !effectiveDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Modification submitted for IFRS 16 remeasurement and approval");
    setOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lease Modifications</h1>
            <p className="text-sm text-muted-foreground mt-1">Screen ID: VFLSEMODIF0001P001 · IFRS 16 remeasurement on contract changes</p>
          </div>
          <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" /> New Modification
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Contract Ref</TableHead>
                <TableHead className="text-xs">Lessor</TableHead>
                <TableHead className="text-xs">Mod Type</TableHead>
                <TableHead className="text-xs">Effective Date</TableHead>
                <TableHead className="text-xs">Old Rent</TableHead>
                <TableHead className="text-xs">New Rent</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No modifications recorded yet</TableCell></TableRow>
            </TableBody>
          </Table>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5" /> New Lease Modification</DialogTitle>
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
                <Label className="text-sm font-medium">Modification Type *</Label>
                <Select value={modType} onValueChange={setModType}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>{MOD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Effective Date *</Label>
                <Input type="date" className="mt-1" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
              </div>
              {(modType === "Rent Change" || modType === "Remeasurement") && (
                <div>
                  <Label className="text-sm font-medium">New Monthly Rent</Label>
                  <Input type="number" className="mt-1" placeholder="0.00" value={newRent} onChange={e => setNewRent(e.target.value)} />
                </div>
              )}
              {(modType === "Term Extension" || modType === "Term Reduction") && (
                <div>
                  <Label className="text-sm font-medium">New End Date</Label>
                  <Input type="date" className="mt-1" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} />
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">Reason / Notes</Label>
                <Input className="mt-1" placeholder="Reason for modification..." value={reason} onChange={e => setReason(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={handleSubmit}>Submit for Remeasurement</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
