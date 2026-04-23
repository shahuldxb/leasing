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
import { Plus, Building2, Hammer } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString()}` : "—";
const pct = (used: any, total: any) => total ? `${((Number(used) / Number(total)) * 100).toFixed(0)}%` : "—";

export default function SpaceManagement() {
  const [spaceOpen, setSpaceOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);
  const [spaceForm, setSpaceForm] = useState<{ contract_id: number; building_name: string; floor_number: string; total_area_sqm: number; occupied_area_sqm: number; capacity_desks: number; occupied_desks: number; space_type: "OFFICE" | "RETAIL" | "WAREHOUSE" | "DATA_CENTRE" | "PARKING" | "OTHER" }>({ contract_id: 0, building_name: "", floor_number: "", total_area_sqm: 0, occupied_area_sqm: 0, capacity_desks: 0, occupied_desks: 0, space_type: "OFFICE" });
  const [projForm, setProjForm] = useState<{ contract_id: number; project_name: string; project_type: "FIT_OUT" | "REFURBISHMENT" | "EXPANSION" | "MAINTENANCE" | "OTHER"; budget_amount: number; committed_amount: number; actual_spend: number; start_date: string; expected_completion: string; status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "CANCELLED"; project_manager: string; notes: string }>({ contract_id: 0, project_name: "", project_type: "FIT_OUT", budget_amount: 0, committed_amount: 0, actual_spend: 0, start_date: "", expected_completion: "", status: "PLANNED", project_manager: "", notes: "" });

  const { data: spaces = [], refetch: refetchSpaces } = trpc.spaceManagement.list.useQuery();
  const { data: projects = [], refetch: refetchProjs } = trpc.capitalProjects.list.useQuery();
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const contracts = (contractsData as any)?.rows ?? [];

  const saveSpace = trpc.spaceManagement.upsert.useMutation({ onSuccess: () => { refetchSpaces(); setSpaceOpen(false); toast.success("Space record saved"); }, onError: (e: any) => toast.error(e.message) });
  const saveProj = trpc.capitalProjects.upsert.useMutation({ onSuccess: () => { refetchProjs(); setProjOpen(false); toast.success("Project saved"); }, onError: (e: any) => toast.error(e.message) });

  const totalSqm = (spaces as any[]).reduce((s: number, x: any) => s + Number(x.total_area_sqm ?? 0), 0);
  const occupiedSqm = (spaces as any[]).reduce((s: number, x: any) => s + Number(x.occupied_area_sqm ?? 0), 0);
  const totalBudget = (projects as any[]).reduce((s: number, p: any) => s + Number(p.budget_amount ?? 0), 0);
  const totalSpend = (projects as any[]).reduce((s: number, p: any) => s + Number(p.actual_spend ?? 0), 0);

  const STATUS_COLORS: Record<string, string> = { PLANNED: "bg-gray-500", IN_PROGRESS: "bg-blue-500", ON_HOLD: "bg-amber-500", COMPLETED: "bg-emerald-500", CANCELLED: "bg-red-500" };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-teal-500" />Space & Capital Projects</h1>
          <p className="text-muted-foreground text-sm">Occupancy management and capital expenditure tracking</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Portfolio Area", value: `${totalSqm.toLocaleString()} sqm`, color: "text-blue-600" },
            { label: "Occupied Area", value: `${occupiedSqm.toLocaleString()} sqm (${totalSqm ? ((occupiedSqm/totalSqm)*100).toFixed(0) : 0}%)`, color: "text-foreground" },
            { label: "Total CapEx Budget", value: fmt(totalBudget), color: "text-violet-600" },
            { label: "Total CapEx Spent", value: fmt(totalSpend), color: totalSpend > totalBudget ? "text-red-600" : "text-emerald-600" },
          ].map(k => <Card key={k.label}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k.label}</p><p className={`text-lg font-bold ${k.color}`}>{k.value}</p></CardContent></Card>)}
        </div>

        <Tabs defaultValue="space">
          <TabsList>
            <TabsTrigger value="space">Space Management ({(spaces as any[]).length})</TabsTrigger>
            <TabsTrigger value="projects">Capital Projects ({(projects as any[]).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="space">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Space Inventory</CardTitle>
                <Dialog open={spaceOpen} onOpenChange={setSpaceOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Space</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Space Record</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-4">
                      <div><Label>Contract</Label>
                        <Select onValueChange={v => setSpaceForm(p => ({ ...p, contract_id: Number(v) }))}>
                          <SelectTrigger><SelectValue placeholder="Select contract" /></SelectTrigger>
                          <SelectContent>{contracts.map((c: any) => <SelectItem key={c.contract_id} value={String(c.contract_id)}>{c.contract_ref}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Building Name</Label><Input value={spaceForm.building_name} onChange={e => setSpaceForm(p => ({ ...p, building_name: e.target.value }))} /></div>
                        <div><Label>Floor</Label><Input value={spaceForm.floor_number} onChange={e => setSpaceForm(p => ({ ...p, floor_number: e.target.value }))} /></div>
                        <div><Label>Total Area (sqm)</Label><Input type="number" value={spaceForm.total_area_sqm} onChange={e => setSpaceForm(p => ({ ...p, total_area_sqm: Number(e.target.value) }))} /></div>
                        <div><Label>Occupied Area (sqm)</Label><Input type="number" value={spaceForm.occupied_area_sqm} onChange={e => setSpaceForm(p => ({ ...p, occupied_area_sqm: Number(e.target.value) }))} /></div>
                        <div><Label>Capacity (desks)</Label><Input type="number" value={spaceForm.capacity_desks} onChange={e => setSpaceForm(p => ({ ...p, capacity_desks: Number(e.target.value) }))} /></div>
                        <div><Label>Occupied (desks)</Label><Input type="number" value={spaceForm.occupied_desks} onChange={e => setSpaceForm(p => ({ ...p, occupied_desks: Number(e.target.value) }))} /></div>
                      </div>
                    </div>
                    <Button className="mt-4 w-full" onClick={() => saveSpace.mutate(spaceForm)} disabled={saveSpace.isPending}>Save</Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Contract</TableHead><TableHead>Building</TableHead><TableHead>Floor</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Total sqm</TableHead><TableHead className="text-right">Occupied sqm</TableHead><TableHead className="text-right">Utilisation</TableHead><TableHead className="text-right">Desks</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(spaces as any[]).map((s: any) => (
                      <TableRow key={s.space_id}>
                        <TableCell className="font-mono text-xs">{s.contract_ref}</TableCell>
                        <TableCell className="font-medium text-sm">{s.building_name}</TableCell>
                        <TableCell className="text-sm">{s.floor_number ?? "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{s.space_type}</Badge></TableCell>
                        <TableCell className="text-right font-mono text-sm">{Number(s.total_area_sqm).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{Number(s.occupied_area_sqm ?? 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right"><Badge className={`text-xs ${Number(s.occupied_area_sqm)/Number(s.total_area_sqm) > 0.9 ? "bg-emerald-500" : Number(s.occupied_area_sqm)/Number(s.total_area_sqm) > 0.7 ? "bg-amber-500" : "bg-red-500"} text-white`}>{pct(s.occupied_area_sqm, s.total_area_sqm)}</Badge></TableCell>
                        <TableCell className="text-right text-sm">{s.occupied_desks ?? 0}/{s.capacity_desks ?? 0}</TableCell>
                      </TableRow>
                    ))}
                    {(spaces as any[]).length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No space records</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Hammer className="w-4 h-4" />Capital Projects</CardTitle>
                <Dialog open={projOpen} onOpenChange={setProjOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Project</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>New Capital Project</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-4">
                      <div><Label>Contract</Label>
                        <Select onValueChange={v => setProjForm(p => ({ ...p, contract_id: Number(v) }))}>
                          <SelectTrigger><SelectValue placeholder="Select contract" /></SelectTrigger>
                          <SelectContent>{contracts.map((c: any) => <SelectItem key={c.contract_id} value={String(c.contract_id)}>{c.contract_ref}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Project Name</Label><Input value={projForm.project_name} onChange={e => setProjForm(p => ({ ...p, project_name: e.target.value }))} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Type</Label>
                          <Select value={projForm.project_type} onValueChange={v => setProjForm(p => ({ ...p, project_type: v as "FIT_OUT" | "REFURBISHMENT" | "EXPANSION" | "MAINTENANCE" | "OTHER" }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{["FIT_OUT","REFURBISHMENT","EXPANSION","MAINTENANCE","OTHER"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div><Label>Status</Label>
                          <Select value={projForm.status} onValueChange={v => setProjForm(p => ({ ...p, status: v as "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | "CANCELLED" }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{["PLANNED","IN_PROGRESS","ON_HOLD","COMPLETED","CANCELLED"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div><Label>Budget (AED)</Label><Input type="number" value={projForm.budget_amount} onChange={e => setProjForm(p => ({ ...p, budget_amount: Number(e.target.value) }))} /></div>
                        <div><Label>Actual Spend (AED)</Label><Input type="number" value={projForm.actual_spend} onChange={e => setProjForm(p => ({ ...p, actual_spend: Number(e.target.value) }))} /></div>
                        <div><Label>Start Date</Label><Input type="date" value={projForm.start_date} onChange={e => setProjForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                        <div><Label>Expected Completion</Label><Input type="date" value={projForm.expected_completion} onChange={e => setProjForm(p => ({ ...p, expected_completion: e.target.value }))} /></div>
                      </div>
                      <div><Label>Project Manager</Label><Input value={projForm.project_manager} onChange={e => setProjForm(p => ({ ...p, project_manager: e.target.value }))} /></div>
                    </div>
                    <Button className="mt-4 w-full" onClick={() => saveProj.mutate(projForm)} disabled={saveProj.isPending}>Save Project</Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Project</TableHead><TableHead>Contract</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Budget</TableHead><TableHead className="text-right">Spent</TableHead><TableHead className="text-right">Remaining</TableHead><TableHead>Completion</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(projects as any[]).map((p: any) => {
                      const remaining = Number(p.budget_amount ?? 0) - Number(p.actual_spend ?? 0);
                      return (
                        <TableRow key={p.project_id}>
                          <TableCell className="font-medium text-sm">{p.project_name}</TableCell>
                          <TableCell className="font-mono text-xs">{p.contract_ref}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{p.project_type?.replace("_"," ")}</Badge></TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(p.budget_amount)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(p.actual_spend)}</TableCell>
                          <TableCell className={`text-right font-mono text-sm ${remaining < 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(Math.abs(remaining))}</TableCell>
                          <TableCell className="text-sm">{p.expected_completion?.slice(0,10)}</TableCell>
                          <TableCell><Badge className={`${STATUS_COLORS[p.status] ?? "bg-gray-500"} text-white text-xs`}>{p.status?.replace("_"," ")}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                    {(projects as any[]).length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No capital projects</TableCell></TableRow>}
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
