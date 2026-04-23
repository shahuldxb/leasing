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
import { Wrench, PlusCircle } from "lucide-react";
import { toast } from "sonner";

const TICKET_TYPES = ["Routine Maintenance","Major Repair","Emergency","Structural","HVAC/Power","Cleaning","Security","Compliance Inspection"];
const RESPONSIBILITY = ["Vodafone","Lessor","Shared"];

export default function OpsMaintenance() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ leaseId: "", ticketType: "", description: "", responsibility: "Lessor", priority: "Normal", estimatedCost: "" });

  const { data: tickets = [], refetch } = trpc.lease.getMaintenanceTickets.useQuery({});
  const { data: leases = [] } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 200 });

  const rows: any[] = Array.isArray(tickets) ? tickets : (tickets as any)?.tickets ?? [];
  const leaseList: any[] = Array.isArray(leases) ? leases : (leases as any)?.leases ?? [];

  const statusColor = (s: string) => {
    if (s === "Open") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    if (s === "In Progress") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (s === "Closed") return "bg-green-500/20 text-green-400 border-green-500/30";
    return "bg-muted text-muted-foreground";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Wrench className="w-6 h-6 text-[#e60000]" /> Asset Maintenance</h1>
            <p className="text-sm text-muted-foreground mt-1">Screen ID: VFOPSMNT0001P001 · Maintenance ticketing with responsibility matrix and cost recovery</p>
          </div>
          <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" /> Raise Ticket
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Open Tickets", value: rows.filter((r: any) => r.status === "Open").length, color: "text-amber-400" },
            { label: "In Progress", value: rows.filter((r: any) => r.status === "In Progress").length, color: "text-blue-400" },
            { label: "Lessor Responsibility", value: rows.filter((r: any) => r.responsibility === "Lessor").length, color: "text-purple-400" },
            { label: "Cost Recovery Pending", value: rows.filter((r: any) => r.cost_recovery_required).length, color: "text-red-400" },
          ].map(k => (
            <div key={k.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Ticket #</TableHead>
                <TableHead className="text-xs">Lease</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Responsibility</TableHead>
                <TableHead className="text-xs">Priority</TableHead>
                <TableHead className="text-xs text-right">Est. Cost</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t: any) => (
                <TableRow key={t.ticket_id} className="text-sm hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{t.ticket_ref ?? `TKT-${t.ticket_id}`}</TableCell>
                  <TableCell className="font-mono text-xs">{t.contract_ref ?? "—"}</TableCell>
                  <TableCell>{t.ticket_type}</TableCell>
                  <TableCell>
                    <Badge className={t.responsibility === "Lessor" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}>
                      {t.responsibility}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.priority}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{t.estimated_cost ? `$${Number(t.estimated_cost).toLocaleString()}` : "—"}</TableCell>
                  <TableCell><Badge className={statusColor(t.status)}>{t.status}</Badge></TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No maintenance tickets</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Raise Maintenance Ticket</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Lease *</Label>
                <Select value={form.leaseId} onValueChange={v => setForm(f => ({ ...f, leaseId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select lease..." /></SelectTrigger>
                  <SelectContent>{leaseList.map((l: any) => <SelectItem key={l.contract_id} value={String(l.contract_id)}>{l.contract_ref} — {l.asset_description}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">Ticket Type</Label>
                  <Select value={form.ticketType} onValueChange={v => setForm(f => ({ ...f, ticketType: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{TICKET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Responsibility</Label>
                  <Select value={form.responsibility} onValueChange={v => setForm(f => ({ ...f, responsibility: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{RESPONSIBILITY.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-sm font-medium">Description</Label><Input className="mt-1" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Low","Normal","High","Critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-sm font-medium">Estimated Cost ($)</Label><Input type="number" className="mt-1" value={form.estimatedCost} onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white"
                onClick={() => { toast.success("Ticket raised"); setOpen(false); refetch(); }}>Raise Ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
