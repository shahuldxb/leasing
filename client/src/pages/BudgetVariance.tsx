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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString()}` : "—";
const pct = (n: any) => n != null ? `${Number(n).toFixed(1)}%` : "—";

export default function BudgetVariance() {
  const year = new Date().getFullYear();
  const [bvOpen, setBvOpen] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);
  const [bvForm, setBvForm] = useState({ contract_id: 0, budget_year: year, budget_month: new Date().getMonth() + 1, budgeted_amount: 0, actual_amount: 0, cost_centre: "", notes: "" });
  const [ccForm, setCcForm] = useState({ contract_id: 0, cost_centre_code: "", cost_centre_name: "", allocation_pct: 100, effective_from: "", effective_to: "" });

  const { data: variances = [], refetch: refetchBv } = trpc.budgetVariance.list.useQuery({ year });
  const { data: allocations = [], refetch: refetchCc } = trpc.costCentre.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];

  const saveBv = trpc.budgetVariance.upsert.useMutation({ onSuccess: () => { refetchBv(); setBvOpen(false); toast.success("Budget variance saved"); }, onError: (e: any) => toast.error(e.message) });
  const saveCc = trpc.costCentre.upsert.useMutation({ onSuccess: () => { refetchCc(); setCcOpen(false); toast.success("Cost centre allocation saved"); }, onError: (e: any) => toast.error(e.message) });

  const totalBudget = (variances as any[]).reduce((s: number, v: any) => s + Number(v.budgeted_amount ?? 0), 0);
  const totalActual = (variances as any[]).reduce((s: number, v: any) => s + Number(v.actual_amount ?? 0), 0);
  const totalVariance = totalActual - totalBudget;

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6 text-blue-500" />Budget Variance & Cost Centres</h1>
          <p className="text-muted-foreground text-sm">Lease cost budget vs actual tracking and cost centre allocation</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: `${year} Total Budget`, value: fmt(totalBudget), color: "text-blue-600" },
            { label: `${year} Total Actual`, value: fmt(totalActual), color: "text-foreground" },
            { label: "Total Variance", value: fmt(Math.abs(totalVariance)), color: totalVariance > 0 ? "text-red-600" : "text-emerald-600" },
            { label: "Variance %", value: totalBudget ? pct((totalVariance / totalBudget) * 100) : "—", color: totalVariance > 0 ? "text-red-600" : "text-emerald-600" },
          ].map(k => <Card key={k.label}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k.label}</p><p className={`text-xl font-bold ${k.color}`}>{k.value}</p></CardContent></Card>)}
        </div>

        <Tabs defaultValue="variance">
          <TabsList>
            <TabsTrigger value="variance">Budget Variance ({(variances as any[]).length})</TabsTrigger>
            <TabsTrigger value="costcentre">Cost Centre Allocations ({(allocations as any[]).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="variance">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Budget vs Actual — {year}</CardTitle>
                <Dialog open={bvOpen} onOpenChange={setBvOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Entry</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Budget Variance Entry</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-4">
                      <div><Label>Contract</Label>
                        <Select onValueChange={v => setBvForm(p => ({ ...p, contract_id: Number(v) }))}>
                          <SelectTrigger><SelectValue placeholder="Select contract" /></SelectTrigger>
                          <SelectContent>{contracts.map((c: any) => <SelectItem key={c.contract_id} value={String(c.contract_id)}>{c.contract_ref}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Year</Label><Input type="number" value={bvForm.budget_year} onChange={e => setBvForm(p => ({ ...p, budget_year: Number(e.target.value) }))} /></div>
                        <div><Label>Month</Label>
                          <Select value={String(bvForm.budget_month)} onValueChange={v => setBvForm(p => ({ ...p, budget_month: Number(v) }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div><Label>Budgeted (AED)</Label><Input type="number" value={bvForm.budgeted_amount} onChange={e => setBvForm(p => ({ ...p, budgeted_amount: Number(e.target.value) }))} /></div>
                        <div><Label>Actual (AED)</Label><Input type="number" value={bvForm.actual_amount} onChange={e => setBvForm(p => ({ ...p, actual_amount: Number(e.target.value) }))} /></div>
                      </div>
                      <div><Label>Cost Centre</Label><Input value={bvForm.cost_centre} onChange={e => setBvForm(p => ({ ...p, cost_centre: e.target.value }))} /></div>
                    </div>
                    <Button className="mt-4 w-full" onClick={() => saveBv.mutate(bvForm)} disabled={saveBv.isPending}>Save</Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Contract</TableHead><TableHead>Asset</TableHead><TableHead>Period</TableHead><TableHead className="text-right">Budget</TableHead><TableHead className="text-right">Actual</TableHead><TableHead className="text-right">Variance</TableHead><TableHead className="text-right">Var %</TableHead><TableHead>Cost Centre</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(variances as any[]).map((v: any) => {
                      const varAmt = Number(v.variance_amount ?? 0);
                      const Icon = varAmt > 0 ? TrendingUp : varAmt < 0 ? TrendingDown : Minus;
                      const color = varAmt > 0 ? "text-red-600" : varAmt < 0 ? "text-emerald-600" : "text-muted-foreground";
                      return (
                        <TableRow key={v.variance_id}>
                          <TableCell className="font-mono text-xs">{v.contract_ref}</TableCell>
                          <TableCell className="text-sm max-w-[120px] truncate">{v.asset_description}</TableCell>
                          <TableCell className="text-sm">{MONTHS[(v.budget_month ?? 1) - 1]} {v.budget_year}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(v.budgeted_amount)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(v.actual_amount)}</TableCell>
                          <TableCell className={`text-right font-mono text-sm ${color}`}><Icon className="w-3 h-3 inline mr-1" />{fmt(Math.abs(varAmt))}</TableCell>
                          <TableCell className={`text-right text-sm ${color}`}>{pct(v.variance_pct)}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{v.cost_centre ?? "—"}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                    {(variances as any[]).length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No budget variance data for {year}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costcentre">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Cost Centre Allocations</CardTitle>
                <Dialog open={ccOpen} onOpenChange={setCcOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Allocation</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Cost Centre Allocation</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-4">
                      <div><Label>Contract</Label>
                        <Select onValueChange={v => setCcForm(p => ({ ...p, contract_id: Number(v) }))}>
                          <SelectTrigger><SelectValue placeholder="Select contract" /></SelectTrigger>
                          <SelectContent>{contracts.map((c: any) => <SelectItem key={c.contract_id} value={String(c.contract_id)}>{c.contract_ref}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Cost Centre Code</Label><Input value={ccForm.cost_centre_code} onChange={e => setCcForm(p => ({ ...p, cost_centre_code: e.target.value }))} /></div>
                        <div><Label>Cost Centre Name</Label><Input value={ccForm.cost_centre_name} onChange={e => setCcForm(p => ({ ...p, cost_centre_name: e.target.value }))} /></div>
                        <div><Label>Allocation %</Label><Input type="number" min={0} max={100} value={ccForm.allocation_pct} onChange={e => setCcForm(p => ({ ...p, allocation_pct: Number(e.target.value) }))} /></div>
                        <div><Label>Effective From</Label><Input type="date" value={ccForm.effective_from} onChange={e => setCcForm(p => ({ ...p, effective_from: e.target.value }))} /></div>
                      </div>
                    </div>
                    <Button className="mt-4 w-full" onClick={() => saveCc.mutate(ccForm)} disabled={saveCc.isPending}>Save</Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Contract</TableHead><TableHead>Cost Centre</TableHead><TableHead className="text-right">Allocation %</TableHead><TableHead>Effective From</TableHead><TableHead>Effective To</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(allocations as any[]).map((a: any) => (
                      <TableRow key={a.allocation_id}>
                        <TableCell className="font-mono text-xs">{a.contract_ref}</TableCell>
                        <TableCell><span className="font-medium">{a.cost_centre_code}</span> — {a.cost_centre_name}</TableCell>
                        <TableCell className="text-right font-mono">{Number(a.allocation_pct).toFixed(1)}%</TableCell>
                        <TableCell className="text-sm">{a.effective_from?.slice(0,10)}</TableCell>
                        <TableCell className="text-sm">{a.effective_to?.slice(0,10) ?? <span className="text-muted-foreground">Open</span>}</TableCell>
                      </TableRow>
                    ))}
                    {(allocations as any[]).length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No allocations configured</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
