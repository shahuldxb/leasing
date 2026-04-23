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
import { Plus, Scissors, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString()}` : "—";
const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

export default function LeaseOptionsBreaks() {
  const [optionOpen, setOptionOpen] = useState(false);
  const [breakOpen, setBreakOpen] = useState(false);
  const [optForm, setOptForm] = useState({ contract_id: 0, option_type: "RENEWAL" as const, exercise_deadline: "", notice_period_days: 90, new_term_months: 0, new_rent: 0, purchase_price: 0, reasonably_certain: false, notes: "" });
  const [brkForm, setBrkForm] = useState({ contract_id: 0, break_date: "", notice_deadline: "", penalty_amount: 0, conditions: "", status: "ACTIVE" as const });

  const { data: options = [], refetch: refetchOpts } = trpc.leaseOptions.list.useQuery({});
  const { data: breaks = [], refetch: refetchBrks } = trpc.breakClause.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];

  const createOpt = trpc.leaseOptions.upsert.useMutation({ onSuccess: () => { refetchOpts(); setOptionOpen(false); toast.success("Option saved"); }, onError: (e: any) => toast.error(e.message) });
  const exerciseOpt = trpc.leaseOptions.exercise.useMutation({ onSuccess: () => { refetchOpts(); toast.success("Option exercised"); }, onError: (e: any) => toast.error(e.message) });
  const createBrk = trpc.breakClause.upsert.useMutation({ onSuccess: () => { refetchBrks(); setBreakOpen(false); toast.success("Break clause saved"); }, onError: (e: any) => toast.error(e.message) });

  const urgency = (d: string) => { const days = daysUntil(d); return days < 30 ? "text-red-600 font-bold" : days < 90 ? "text-amber-600 font-semibold" : "text-muted-foreground"; };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Scissors className="w-6 h-6 text-violet-500" />Options & Break Clauses</h1>
          <p className="text-muted-foreground text-sm">Renewal options, purchase options, termination rights, and break clauses</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Options", value: (options as any[]).length, color: "text-blue-600" },
            { label: "Reasonably Certain", value: (options as any[]).filter((o: any) => o.reasonably_certain).length, color: "text-emerald-600" },
            { label: "Break Clauses", value: (breaks as any[]).length, color: "text-violet-600" },
            { label: "Upcoming (90 days)", value: (options as any[]).filter((o: any) => daysUntil(o.exercise_deadline) <= 90 && daysUntil(o.exercise_deadline) > 0).length + (breaks as any[]).filter((b: any) => daysUntil(b.notice_deadline) <= 90 && daysUntil(b.notice_deadline) > 0).length, color: "text-red-600" },
          ].map(k => <Card key={k.label}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k.label}</p><p className={`text-2xl font-bold ${k.color}`}>{k.value}</p></CardContent></Card>)}
        </div>

        <Tabs defaultValue="options">
          <TabsList>
            <TabsTrigger value="options">Lease Options ({(options as any[]).length})</TabsTrigger>
            <TabsTrigger value="breaks">Break Clauses ({(breaks as any[]).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="options">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Lease Options Register</CardTitle>
                <Dialog open={optionOpen} onOpenChange={setOptionOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Option</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Lease Option</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-4">
                      <div><Label>Contract</Label>
                        <Select onValueChange={v => setOptForm(p => ({ ...p, contract_id: Number(v) }))}>
                          <SelectTrigger><SelectValue placeholder="Select contract" /></SelectTrigger>
                          <SelectContent>{contracts.map((c: any) => <SelectItem key={c.contract_id} value={String(c.contract_id)}>{c.contract_ref} — {c.asset_description}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Option Type</Label>
                        <Select value={optForm.option_type} onValueChange={v => setOptForm(p => ({ ...p, option_type: v as any }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{["RENEWAL","PURCHASE","TERMINATION","EXTENSION"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Exercise Deadline</Label><Input type="date" value={optForm.exercise_deadline} onChange={e => setOptForm(p => ({ ...p, exercise_deadline: e.target.value }))} /></div>
                      <div><Label>Notice Period (days)</Label><Input type="number" value={optForm.notice_period_days} onChange={e => setOptForm(p => ({ ...p, notice_period_days: Number(e.target.value) }))} /></div>
                      {(optForm.option_type as string) === "RENEWAL" && <div><Label>New Term (months)</Label><Input type="number" value={optForm.new_term_months} onChange={e => setOptForm(p => ({ ...p, new_term_months: Number(e.target.value) }))} /></div>}
                      {(optForm.option_type as string) === "PURCHASE" && <div><Label>Purchase Price (AED)</Label><Input type="number" value={optForm.purchase_price} onChange={e => setOptForm(p => ({ ...p, purchase_price: Number(e.target.value) }))} /></div>}
                    </div>
                    <Button className="mt-4 w-full" onClick={() => createOpt.mutate(optForm)} disabled={createOpt.isPending}>Save Option</Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Contract</TableHead><TableHead>Type</TableHead><TableHead>Deadline</TableHead><TableHead>Days Left</TableHead><TableHead>Reasonably Certain</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(options as any[]).map((o: any) => (
                      <TableRow key={o.option_id}>
                        <TableCell className="font-mono text-xs">{o.contract_ref}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{o.option_type}</Badge></TableCell>
                        <TableCell className="text-sm">{o.exercise_deadline?.slice(0,10)}</TableCell>
                        <TableCell className={`text-sm ${urgency(o.exercise_deadline)}`}>{daysUntil(o.exercise_deadline)}d</TableCell>
                        <TableCell>{o.reasonably_certain ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <span className="text-muted-foreground text-xs">No</span>}</TableCell>
                        <TableCell><Badge className={`text-xs ${o.status === "EXERCISED" ? "bg-emerald-500" : o.status === "LAPSED" ? "bg-gray-500" : "bg-blue-500"} text-white`}>{o.status}</Badge></TableCell>
                        <TableCell>{o.status === "ACTIVE" && <Button size="sm" variant="outline" onClick={() => exerciseOpt.mutate({ option_id: o.option_id, exercise_date: new Date().toISOString().slice(0,10) })}>Exercise</Button>}</TableCell>
                      </TableRow>
                    ))}
                    {(options as any[]).length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No options registered</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breaks">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Break Clause Register</CardTitle>
                <Dialog open={breakOpen} onOpenChange={setBreakOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Break Clause</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Break Clause</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-4">
                      <div><Label>Contract</Label>
                        <Select onValueChange={v => setBrkForm(p => ({ ...p, contract_id: Number(v) }))}>
                          <SelectTrigger><SelectValue placeholder="Select contract" /></SelectTrigger>
                          <SelectContent>{contracts.map((c: any) => <SelectItem key={c.contract_id} value={String(c.contract_id)}>{c.contract_ref} — {c.asset_description}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Break Date</Label><Input type="date" value={brkForm.break_date} onChange={e => setBrkForm(p => ({ ...p, break_date: e.target.value }))} /></div>
                      <div><Label>Notice Deadline</Label><Input type="date" value={brkForm.notice_deadline} onChange={e => setBrkForm(p => ({ ...p, notice_deadline: e.target.value }))} /></div>
                      <div><Label>Penalty Amount (AED)</Label><Input type="number" value={brkForm.penalty_amount} onChange={e => setBrkForm(p => ({ ...p, penalty_amount: Number(e.target.value) }))} /></div>
                      <div><Label>Conditions</Label><Input value={brkForm.conditions} onChange={e => setBrkForm(p => ({ ...p, conditions: e.target.value }))} /></div>
                    </div>
                    <Button className="mt-4 w-full" onClick={() => createBrk.mutate(brkForm)} disabled={createBrk.isPending}>Save Break Clause</Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Contract</TableHead><TableHead>Break Date</TableHead><TableHead>Notice Deadline</TableHead><TableHead>Days to Notice</TableHead><TableHead className="text-right">Penalty</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(breaks as any[]).map((b: any) => (
                      <TableRow key={b.break_id}>
                        <TableCell className="font-mono text-xs">{b.contract_ref}</TableCell>
                        <TableCell className="text-sm">{b.break_date?.slice(0,10)}</TableCell>
                        <TableCell className="text-sm">{b.notice_deadline?.slice(0,10)}</TableCell>
                        <TableCell className={`text-sm ${urgency(b.notice_deadline)}`}>{daysUntil(b.notice_deadline)}d</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(b.penalty_amount)}</TableCell>
                        <TableCell><Badge className={`text-xs ${b.status === "EXERCISED" ? "bg-emerald-500" : b.status === "LAPSED" ? "bg-gray-500" : "bg-blue-500"} text-white`}>{b.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {(breaks as any[]).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No break clauses registered</TableCell></TableRow>}
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
