import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Plus, CheckCircle, Clock, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

const EVENT_TYPES = [
  { value: "EXTENSION_EXERCISE", label: "Extension Option Exercised" },
  { value: "TERMINATION_EXERCISE", label: "Termination Option Exercised" },
  { value: "PURCHASE_OPTION", label: "Purchase Option Reassessment" },
  { value: "MODIFICATION", label: "Lease Modification" },
  { value: "CPI_UPDATE", label: "CPI / Index Update" },
  { value: "RATE_REVISION", label: "IBR Rate Revision" },
  { value: "SCOPE_CHANGE", label: "Scope Change" },
];

const fmt = (n: number | null | undefined) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

export default function RemeasurementEngine() {
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ contract_id: 0, event_type: "RATE_REVISION", event_date: new Date().toISOString().slice(0, 10), trigger_description: "", new_ibr: 5.5, new_remaining_term: 36 });
  const [calcResult, setCalcResult] = useState<any>(null);

  const { data: events = [], refetch } = trpc.accounting.remeasurement.list.useQuery({ status: filterStatus || undefined });
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = contractsData?.rows ?? [];

  const create = trpc.accounting.remeasurement.create.useMutation({
    onSuccess: (data) => {
      setCalcResult(data);
      refetch();
      toast.success("Remeasurement calculated successfully");
    },
  });
  const post = trpc.accounting.remeasurement.post.useMutation({
    onSuccess: () => { refetch(); toast.success("Remeasurement posted to contracts"); },
  });

  const statusColor = (s: string) => {
    if (s === "POSTED") return "default";
    if (s === "PENDING") return "secondary";
    return "outline";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Remeasurement Engine</h1>
            <p className="text-muted-foreground text-sm">Recalculate lease liability and ROU asset on triggering events — IFRS 16.45–46</p>
          </div>
          <Button onClick={() => { setCalcResult(null); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" />New Remeasurement</Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending Review", status: "PENDING", color: "text-amber-600" },
            { label: "Posted", status: "POSTED", color: "text-emerald-600" },
            { label: "Total Events", status: "", color: "text-blue-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color}`}>
                  {s.status ? (events as any[]).filter((e: any) => e.status === s.status).length : (events as any[]).length}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-3 items-center">
          <Label>Status:</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="POSTED">Posted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Events table */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><RefreshCw className="w-4 h-4" />Remeasurement Events</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Old Liability</TableHead>
                  <TableHead>New Liability</TableHead>
                  <TableHead>Adjustment</TableHead>
                  <TableHead>New IBR</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(events as any[]).map((e: any) => (
                  <TableRow key={e.remeasurement_id}>
                    <TableCell className="font-mono text-sm">{e.contract_ref}</TableCell>
                    <TableCell className="text-sm">{EVENT_TYPES.find(t => t.value === e.event_type)?.label ?? e.event_type}</TableCell>
                    <TableCell>{e.event_date?.slice(0, 10)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(e.old_liability)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(e.new_liability)}</TableCell>
                    <TableCell className={`text-right font-mono text-sm font-bold ${Number(e.liability_adjustment) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {Number(e.liability_adjustment) >= 0 ? "+" : ""}{fmt(e.liability_adjustment)}
                    </TableCell>
                    <TableCell className="text-sm">{Number(e.new_ibr).toFixed(2)}%</TableCell>
                    <TableCell><Badge variant={statusColor(e.status)}>{e.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {e.status === "PENDING" && (
                        <Button size="sm" variant="outline" onClick={() => post.mutate({ remeasurement_id: e.remeasurement_id })}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />Post
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(events as any[]).length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No remeasurement events found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* New remeasurement dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Remeasurement Event</DialogTitle></DialogHeader>
            {!calcResult ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Contract</Label>
                  <Select value={form.contract_id.toString()} onValueChange={v => setForm(f => ({ ...f, contract_id: parseInt(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Select contract..." /></SelectTrigger>
                    <SelectContent>
                      {contracts.map((c: any) => <SelectItem key={c.contract_id} value={c.contract_id.toString()}>{c.contract_ref} — {c.asset_description}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Event Type</Label>
                  <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Event Date</Label>
                    <Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>New IBR (%)</Label>
                    <Input type="number" step="0.01" value={form.new_ibr} onChange={e => setForm(f => ({ ...f, new_ibr: parseFloat(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>New Remaining Term (months)</Label>
                    <Input type="number" value={form.new_remaining_term} onChange={e => setForm(f => ({ ...f, new_remaining_term: parseInt(e.target.value) }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Trigger Description</Label>
                  <Textarea value={form.trigger_description} onChange={e => setForm(f => ({ ...f, trigger_description: e.target.value }))} placeholder="Describe the event triggering remeasurement..." rows={2} />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button onClick={() => create.mutate(form)} disabled={create.isPending || !form.contract_id}>
                    {create.isPending ? "Calculating..." : "Calculate"}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200">
                  <p className="font-bold text-emerald-700 dark:text-emerald-300 mb-3">Remeasurement Calculated</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-muted-foreground">New Liability</p><p className="font-bold">{fmt(calcResult.newLiability)}</p></div>
                    <div><p className="text-muted-foreground">Adjustment</p><p className={`font-bold ${calcResult.liabilityAdj >= 0 ? "text-emerald-600" : "text-red-600"}`}>{calcResult.liabilityAdj >= 0 ? "+" : ""}{fmt(calcResult.liabilityAdj)}</p></div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">The remeasurement has been saved as PENDING. Post it to update the contract values.</p>
                <DialogFooter>
                  <Button onClick={() => setShowForm(false)}>Close</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
