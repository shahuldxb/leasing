import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GenAIFillButton } from "@/components/GenAIFillButton";
import SlidePanel from "@/components/SlidePanel";

const MOD_TYPES = ["Rent Change","Term Extension","Term Reduction","Scope Change","Remeasurement","Other"];

export default function LeaseModifications() {
  const [open, setOpen] = useState(false);
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [selectedLease, setSelectedLease] = useState("");
  const [modType, setModType] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [newRent, setNewRent] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [editRow, setEditRow] = useState<any>(null);
  const utils = trpc.useUtils();
  const { data: leases = [] } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 200 });
  const createMut = trpc.leaseModification.create.useMutation({
    onSuccess: () => { utils.leaseModification.list.invalidate(); toast.success("Modification created"); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.leaseModification.update.useMutation({
    onSuccess: () => { utils.leaseModification.list.invalidate(); toast.success("Modification updated"); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.leaseModification.delete.useMutation({
    onSuccess: () => { utils.leaseModification.list.invalidate(); toast.success("Deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const { data: mods = [], isLoading } = trpc.leaseModification.list.useQuery({});

  const handleSubmit = () => {
    if (!selectedLease || !modType || !effectiveDate) { toast.error("Please fill in all required fields"); return; }
    const payload = {
      contract_id: Number(selectedLease),
      modification_date: effectiveDate,
      modification_type: modType as any,
      liability_adjustment: newRent ? Number(newRent) : undefined,
      status: "Draft" as const,
    };
    if (editRow) {
      updateMut.mutate({ modification_id: editRow.modification_id, ...payload });
    } else {
      createMut.mutate(payload);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLLEAMOD0001P001"
          screenType="lease_modifications"
          onAIData={(rows) => setAiRows(rows)}
  title="Lease Modifications"
  subtitle="Lease modification and remeasurement processing"
/>

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
              {isLoading && aiRows.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading…</TableCell></TableRow>
              ) : (aiRows.length > 0 ? aiRows : (mods as any[])).length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No modifications yet</TableCell></TableRow>
              ) : (
                (aiRows.length > 0 ? aiRows : (mods as any[])).map((row: any, i: number) => (
                  <TableRow key={row.modification_id ?? i}>
                    <TableCell className="font-mono text-xs">{row.mod_ref ?? row.contract_ref ?? "—"}</TableCell>
                    <TableCell>{row.lessor_name ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{row.modification_type ?? "—"}</Badge></TableCell>
                    <TableCell>{row.modification_date ? new Date(row.modification_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-right">{row.liability_adjustment ?? "—"}</TableCell>
                    <TableCell className="text-right">{row.rou_adjustment ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant="outline">{row.status ?? "Draft"}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => { setEditRow(row); setSelectedLease(String(row.contract_id)); setModType(row.modification_type); setEffectiveDate(row.modification_date?.split("T")[0] ?? ""); setOpen(true); }}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMut.mutate({ modification_id: row.modification_id })}>Del</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <SlidePanel open={open} onClose={() => setOpen(false)} title="" width="xl">
          
            
              
            
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
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={handleSubmit}>Submit for Remeasurement</Button>
            </div>
          
        </SlidePanel>
      </div>
    </DashboardLayout>
  );
}
