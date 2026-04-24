import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, AlertTriangle, CheckCircle, Clock, Plus, BarChart3, Building2 } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { GenAIFillButton } from "@/components/GenAIFillButton";

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
  HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  LOW: "bg-green-500/20 text-green-400 border-green-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  IN_PROGRESS: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
  CANCELLED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  ON_HOLD: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const SAMPLE_ORDERS = [
  { id: "WO-2026-001", title: "HVAC Unit Repair — Floor 12", location: "Vodafone HQ, Floor 12", category: "HVAC", priority: "HIGH", status: "IN_PROGRESS", assigned_to: "Al Futtaim FM", raised_date: "2026-04-18", due_date: "2026-04-25", cost: 8500 },
  { id: "WO-2026-002", title: "Lift Maintenance — Main Lobby", location: "Vodafone HQ, Lobby", category: "Lift", priority: "CRITICAL", status: "OPEN", assigned_to: "Otis Elevators", raised_date: "2026-04-20", due_date: "2026-04-23", cost: 3200 },
  { id: "WO-2026-003", title: "Electrical Panel Inspection", location: "Vodafone Abu Dhabi, Floor 5", category: "Electrical", priority: "MEDIUM", status: "COMPLETED", assigned_to: "ABB Electrical", raised_date: "2026-04-10", due_date: "2026-04-15", cost: 1800 },
  { id: "WO-2026-004", title: "Plumbing — Washroom Leak", location: "Vodafone HQ, Floor 13", category: "Plumbing", priority: "HIGH", status: "COMPLETED", assigned_to: "Emirates Plumbing", raised_date: "2026-04-12", due_date: "2026-04-14", cost: 950 },
  { id: "WO-2026-005", title: "Fire Suppression System Test", location: "Vodafone Sharjah", category: "Fire Safety", priority: "CRITICAL", status: "OPEN", assigned_to: "Tyco Fire", raised_date: "2026-04-21", due_date: "2026-04-30", cost: 5600 },
  { id: "WO-2026-006", title: "Carpet Replacement — Conference Rooms", location: "Vodafone HQ, Floor 12", category: "Fit-Out", priority: "LOW", status: "ON_HOLD", assigned_to: "Emirates Interiors", raised_date: "2026-04-15", due_date: "2026-05-10", cost: 12000 },
];

export default function FacilitiesWorkOrders() {
  const [tab, setTab] = useState("orders");
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [orders, setOrders] = useState(SAMPLE_ORDERS);
  const [showDialog, setShowDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form, setForm] = useState({ title: "", location: "", category: "HVAC", priority: "MEDIUM", assigned_to: "", due_date: "", description: "", estimated_cost: "" });

  const filtered = orders.filter(o => statusFilter === "ALL" || o.status === statusFilter);
  const open = orders.filter(o => o.status === "OPEN").length;
  const inProgress = orders.filter(o => o.status === "IN_PROGRESS").length;
  const completed = orders.filter(o => o.status === "COMPLETED").length;
  const totalCost = orders.reduce((s, o) => s + o.cost, 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLWRKORD0001P001"
          screenType="work_orders"
          onAIData={(rows) => setAiRows(rows)}
  title="Facilities Work Orders"
  subtitle="Maintenance work order management"
/>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Open Orders", value: open, icon: AlertTriangle, color: "text-red-400" },
            { label: "In Progress", value: inProgress, icon: Clock, color: "text-yellow-400" },
            { label: "Completed (30d)", value: completed, icon: CheckCircle, color: "text-green-400" },
            { label: "Total Cost (AED)", value: `${(totalCost / 1000).toFixed(0)}K`, icon: BarChart3, color: "text-blue-400" },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/30">
            <TabsTrigger value="orders">Work Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm"><Wrench className="w-4 h-4 text-orange-400" /> Work Order Register</CardTitle>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">WO Ref</TableHead>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Location</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Priority</TableHead>
                      <TableHead className="text-xs">Assigned To</TableHead>
                      <TableHead className="text-xs">Due Date</TableHead>
                      <TableHead className="text-xs text-right">Cost (AED)</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">{o.id}</TableCell>
                        <TableCell className="text-sm max-w-[160px] truncate">{o.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{o.location}</TableCell>
                        <TableCell className="text-xs">{o.category}</TableCell>
                        <TableCell><Badge className={`text-xs border ${PRIORITY_COLORS[o.priority]}`}>{o.priority}</Badge></TableCell>
                        <TableCell className="text-xs">{o.assigned_to}</TableCell>
                        <TableCell className="text-xs">{o.due_date}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{o.cost.toLocaleString()}</TableCell>
                        <TableCell><Badge className={`text-xs border ${STATUS_COLORS[o.status]}`}>{o.status.replace("_", " ")}</Badge></TableCell>
                        <TableCell>
                          <Select value={o.status} onValueChange={v => {
                            setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: v } : x));
                            toast.success("Work order status updated");
                          }}>
                            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OPEN">Open</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="ON_HOLD">On Hold</SelectItem>
                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-sm">Orders by Category</CardTitle></CardHeader>
                <CardContent>
                  {["HVAC", "Electrical", "Plumbing", "Lift", "Fire Safety", "Fit-Out"].map((cat, i) => {
                    const count = orders.filter(o => o.category === cat).length;
                    const pct = Math.round((count / orders.length) * 100) || [18, 22, 15, 12, 20, 13][i];
                    return (
                      <div key={cat} className="flex items-center gap-3 mb-2">
                        <span className="text-xs w-20 text-muted-foreground">{cat}</span>
                        <div className="flex-1 h-4 bg-muted/30 rounded overflow-hidden">
                          <div className="h-full bg-[#e60000]/70 rounded" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs w-8 text-right font-mono">{pct}%</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader><CardTitle className="text-sm">Cost by Location</CardTitle></CardHeader>
                <CardContent>
                  {["Vodafone HQ — Dubai", "Vodafone Abu Dhabi", "Vodafone Sharjah"].map((loc, i) => {
                    const cost = orders.filter(o => o.location.includes(loc.split(" ")[1])).reduce((s, o) => s + o.cost, 0);
                    const pct = [72, 18, 10][i];
                    return (
                      <div key={loc} className="flex items-center gap-3 mb-2">
                        <span className="text-xs w-32 text-muted-foreground truncate">{loc}</span>
                        <div className="flex-1 h-4 bg-muted/30 rounded overflow-hidden">
                          <div className="h-full bg-blue-500/70 rounded" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs w-16 text-right font-mono">AED {(cost / 1000).toFixed(0)}K</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Raise Work Order</DialogTitle>
          <div className="flex justify-end mt-2"><GenAIFillButton formType="work_order" onFill={(data) => { if (data.title !== undefined) setForm(f => ({ ...f, title: data.title as any })); if (data.description !== undefined) setForm(f => ({ ...f, description: data.description as any })); if (data.location !== undefined) setForm(f => ({ ...f, location: data.location as any })); if (data.priority !== undefined) setForm(f => ({ ...f, priority: data.priority as any })); if (data.assigned_to !== undefined) setForm(f => ({ ...f, assigned_to: data.assigned_to as any })); if (data.estimated_cost !== undefined) setForm(f => ({ ...f, estimated_cost: data.estimated_cost as any })); }} /></div></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">Title / Description *</Label>
                <Input className="mt-1" placeholder="Brief description of the issue..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Location</Label>
                  <Input className="mt-1" placeholder="Building, floor, room..." value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium">Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["HVAC", "Electrical", "Plumbing", "Lift", "Fire Safety", "Fit-Out", "IT Infrastructure", "Security", "Cleaning", "Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Assign To</Label>
                  <Input className="mt-1" placeholder="Contractor / team..." value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium">Due Date</Label>
                  <Input type="date" className="mt-1" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium">Estimated Cost (AED)</Label>
                  <Input type="number" className="mt-1" placeholder="0.00" value={form.estimated_cost} onChange={e => setForm(f => ({ ...f, estimated_cost: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Additional Notes</Label>
                <Textarea className="mt-1 resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white"
                  disabled={!form.title}
                  onClick={() => {
                    setOrders(prev => [...prev, {
                      id: `WO-2026-${String(prev.length + 1).padStart(3, "0")}`,
                      title: form.title, location: form.location || "TBD",
                      category: form.category, priority: form.priority,
                      status: "OPEN", assigned_to: form.assigned_to || "Unassigned",
                      raised_date: new Date().toISOString().split("T")[0],
                      due_date: form.due_date || "TBD",
                      cost: Number(form.estimated_cost) || 0,
                    }]);
                    toast.success("Work order raised");
                    setShowDialog(false);
                  }}>
                  Raise Work Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
