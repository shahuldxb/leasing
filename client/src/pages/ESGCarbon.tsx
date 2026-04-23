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
import { Plus, Leaf, Zap, Droplets, Trash2 } from "lucide-react";
import { toast } from "sonner";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const RATINGS = ["Platinum","Gold","Silver","Bronze","None"];
const RATING_COLORS: Record<string, string> = { Platinum: "bg-violet-500", Gold: "bg-amber-500", Silver: "bg-gray-400", Bronze: "bg-orange-600", None: "bg-gray-600" };

export default function ESGCarbon() {
  const year = new Date().getFullYear();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ contract_id: 0, reporting_year: year, reporting_month: new Date().getMonth() + 1, scope1_tonnes: 0, scope2_tonnes: 0, scope3_tonnes: 0, energy_kwh: 0, water_m3: 0, waste_tonnes: 0, green_rating: "None", notes: "" });

  const { data: records = [], refetch } = trpc.esgCarbon.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];

  const save = trpc.esgCarbon.upsert.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("ESG record saved"); }, onError: (e: any) => toast.error(e.message) });

  const totalScope1 = (records as any[]).reduce((s: number, r: any) => s + Number(r.scope1_tonnes ?? 0), 0);
  const totalScope2 = (records as any[]).reduce((s: number, r: any) => s + Number(r.scope2_tonnes ?? 0), 0);
  const totalScope3 = (records as any[]).reduce((s: number, r: any) => s + Number(r.scope3_tonnes ?? 0), 0);
  const totalEnergy = (records as any[]).reduce((s: number, r: any) => s + Number(r.energy_kwh ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Leaf className="w-6 h-6 text-emerald-500" />ESG & Carbon Reporting</h1>
            <p className="text-muted-foreground text-sm">Scope 1/2/3 emissions, energy, water, and waste tracking per leased property</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Record</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>ESG Data Entry</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="col-span-2"><Label>Contract</Label>
                  <Select onValueChange={v => setForm(p => ({ ...p, contract_id: Number(v) }))}>
                    <SelectTrigger><SelectValue placeholder="Select contract" /></SelectTrigger>
                    <SelectContent>{contracts.map((c: any) => <SelectItem key={c.contract_id} value={String(c.contract_id)}>{c.contract_ref} — {c.asset_description}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Year</Label><Input type="number" value={form.reporting_year} onChange={e => setForm(p => ({ ...p, reporting_year: Number(e.target.value) }))} /></div>
                <div><Label>Month</Label>
                  <Select value={String(form.reporting_month)} onValueChange={v => setForm(p => ({ ...p, reporting_month: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Scope 1 (tonnes CO₂e)</Label><Input type="number" step="0.001" value={form.scope1_tonnes} onChange={e => setForm(p => ({ ...p, scope1_tonnes: Number(e.target.value) }))} /></div>
                <div><Label>Scope 2 (tonnes CO₂e)</Label><Input type="number" step="0.001" value={form.scope2_tonnes} onChange={e => setForm(p => ({ ...p, scope2_tonnes: Number(e.target.value) }))} /></div>
                <div><Label>Scope 3 (tonnes CO₂e)</Label><Input type="number" step="0.001" value={form.scope3_tonnes} onChange={e => setForm(p => ({ ...p, scope3_tonnes: Number(e.target.value) }))} /></div>
                <div><Label>Energy (kWh)</Label><Input type="number" value={form.energy_kwh} onChange={e => setForm(p => ({ ...p, energy_kwh: Number(e.target.value) }))} /></div>
                <div><Label>Water (m³)</Label><Input type="number" value={form.water_m3} onChange={e => setForm(p => ({ ...p, water_m3: Number(e.target.value) }))} /></div>
                <div><Label>Waste (tonnes)</Label><Input type="number" step="0.001" value={form.waste_tonnes} onChange={e => setForm(p => ({ ...p, waste_tonnes: Number(e.target.value) }))} /></div>
                <div><Label>Green Building Rating</Label>
                  <Select value={form.green_rating} onValueChange={v => setForm(p => ({ ...p, green_rating: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{RATINGS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="mt-4 w-full" onClick={() => save.mutate(form)} disabled={save.isPending}>Save ESG Record</Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: `Scope 1 — ${year}`, value: `${totalScope1.toFixed(1)} tCO₂e`, icon: <Leaf className="w-4 h-4 text-emerald-500" />, color: "text-emerald-600" },
            { label: `Scope 2 — ${year}`, value: `${totalScope2.toFixed(1)} tCO₂e`, icon: <Zap className="w-4 h-4 text-amber-500" />, color: "text-amber-600" },
            { label: `Scope 3 — ${year}`, value: `${totalScope3.toFixed(1)} tCO₂e`, icon: <Leaf className="w-4 h-4 text-blue-500" />, color: "text-blue-600" },
            { label: `Energy — ${year}`, value: `${(totalEnergy/1000).toFixed(0)} MWh`, icon: <Zap className="w-4 h-4 text-violet-500" />, color: "text-violet-600" },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">{k.icon}<p className="text-xs text-muted-foreground">{k.label}</p></div>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">ESG Records — {year} ({(records as any[]).length} entries)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Scope 1</TableHead>
                  <TableHead className="text-right">Scope 2</TableHead>
                  <TableHead className="text-right">Scope 3</TableHead>
                  <TableHead className="text-right">Energy (kWh)</TableHead>
                  <TableHead className="text-right">Water (m³)</TableHead>
                  <TableHead className="text-right">Waste (t)</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(records as any[]).map((r: any) => (
                  <TableRow key={r.carbon_id}>
                    <TableCell className="font-mono text-xs">{r.contract_ref}</TableCell>
                    <TableCell className="text-sm">{MONTHS[(r.reporting_month ?? 1) - 1]} {r.reporting_year}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(r.scope1_tonnes ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(r.scope2_tonnes ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(r.scope3_tonnes ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(r.energy_kwh ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(r.water_m3 ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(r.waste_tonnes ?? 0).toFixed(2)}</TableCell>
                    <TableCell>{r.green_rating && r.green_rating !== "None" ? <Badge className={`${RATING_COLORS[r.green_rating] ?? "bg-gray-500"} text-white text-xs`}>{r.green_rating}</Badge> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                  </TableRow>
                ))}
                {(records as any[]).length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">No ESG records for {year}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
