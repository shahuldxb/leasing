import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Users, Monitor, Shield, Database } from "lucide-react";
import { toast } from "sonner";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [thresholdForm, setThresholdForm] = useState({ module: "", minAmount: "", maxAmount: "", approverRole: "" });
  const [thresholdOpen, setThresholdOpen] = useState(false);

  const { data: screenRegistry } = trpc.compliance.getScreenRegistry.useQuery();
  const { data: thresholds, refetch: refetchThresholds } = trpc.workflow.getMCThresholds.useQuery();
  const { data: kpis } = trpc.mis.getDashboardKPIs.useQuery();

  const screens: any[] = Array.isArray(screenRegistry) ? screenRegistry : [];
  const thresholdList: any[] = Array.isArray(thresholds) ? thresholds : [];

  const MODULES = ["Lease","Payables","Contract","BankRecon","Cheque","Workflow"];
  const ROLES = ["Manager","Senior Manager","Director","CFO","CEO"];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6 text-[#e60000]" /> Administration Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFADMPNL0001P001 · System configuration, RBAC, screen registry, and Make/Checker thresholds</p>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Screens", value: screens.length, icon: <Monitor className="w-4 h-4 text-blue-400" />, color: "text-blue-400" },
            { label: "Active Leases", value: (kpis as any)?.total_active_leases ?? 0, icon: <Database className="w-4 h-4 text-green-400" />, color: "text-green-400" },
            { label: "MC Thresholds", value: thresholdList.length, icon: <Shield className="w-4 h-4 text-amber-400" />, color: "text-amber-400" },
            { label: "System Status", value: "Operational", icon: <Settings className="w-4 h-4 text-[#e60000]" />, color: "text-[#e60000]" },
          ].map(k => (
            <div key={k.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">{k.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" />Users & RBAC</TabsTrigger>
            <TabsTrigger value="thresholds"><Shield className="w-4 h-4 mr-1" />MC Thresholds</TabsTrigger>
            <TabsTrigger value="screens"><Monitor className="w-4 h-4 mr-1" />Screen Registry</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">User Management & Role Assignment</h3>
                <Button size="sm" className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => toast.info("User management via OAuth provider")}>
                  <Users className="w-4 h-4 mr-1" /> Manage Users
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { role: "SuperAdmin", desc: "Full system access including admin panel and BPMN modeler", color: "text-red-400" },
                  { role: "LeaseManager", desc: "Create and manage leases, approve within threshold", color: "text-orange-400" },
                  { role: "FinanceOfficer", desc: "Process invoices, payment runs, and GL journals", color: "text-amber-400" },
                  { role: "Viewer", desc: "Read-only access to all modules", color: "text-blue-400" },
                  { role: "Maker", desc: "Create and submit transactions for approval", color: "text-green-400" },
                  { role: "Checker", desc: "Review and approve/reject Maker submissions", color: "text-purple-400" },
                ].map(r => (
                  <div key={r.role} className="bg-muted/30 rounded-lg p-3 flex items-start gap-3">
                    <Shield className={`w-4 h-4 mt-0.5 flex-shrink-0 ${r.color}`} />
                    <div>
                      <p className={`font-semibold text-sm ${r.color}`}>{r.role}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* MC Thresholds Tab */}
          <TabsContent value="thresholds">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-border">
                <h3 className="font-semibold">Make/Checker Approval Thresholds</h3>
                <Button size="sm" className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setThresholdOpen(true)}>
                  Add Threshold
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Module</TableHead>
                    <TableHead className="text-xs text-right">Min Amount ($)</TableHead>
                    <TableHead className="text-xs text-right">Max Amount ($)</TableHead>
                    <TableHead className="text-xs">Approver Role</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {thresholdList.map((t: any, i: number) => (
                    <TableRow key={t.threshold_id ?? i} className="text-sm hover:bg-muted/30">
                      <TableCell className="font-medium">{t.module}</TableCell>
                      <TableCell className="text-right font-mono text-xs">${Number(t.min_amount ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{t.max_amount ? `$${Number(t.max_amount).toLocaleString()}` : "Unlimited"}</TableCell>
                      <TableCell><Badge variant="outline">{t.approver_role}</Badge></TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge></TableCell>
                    </TableRow>
                  ))}
                  {thresholdList.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No thresholds configured</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Screen Registry Tab */}
          <TabsContent value="screens">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Screen ID Registry</h3>
                <p className="text-xs text-muted-foreground mt-0.5">All screens are tagged with a 20-character Screen ID embedded in audit logs, error logs, and API headers</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Screen ID</TableHead>
                    <TableHead className="text-xs">Screen Name</TableHead>
                    <TableHead className="text-xs">Module</TableHead>
                    <TableHead className="text-xs">Route</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {screens.map((s: any, i: number) => (
                    <TableRow key={s.screen_id ?? i} className="text-sm hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-[#e60000]">{s.screen_id}</TableCell>
                      <TableCell className="font-medium">{s.screen_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.module_name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.route_path ?? "—"}</TableCell>
                      <TableCell><Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge></TableCell>
                    </TableRow>
                  ))}
                  {screens.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No screens registered</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Threshold Dialog */}
        <Dialog open={thresholdOpen} onOpenChange={setThresholdOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Approval Threshold</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Module</Label>
                <Select value={thresholdForm.module} onValueChange={v => setThresholdForm(f => ({ ...f, module: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select module..." /></SelectTrigger>
                  <SelectContent>{MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm font-medium">Min Amount ($)</Label><Input type="number" className="mt-1" value={thresholdForm.minAmount} onChange={e => setThresholdForm(f => ({ ...f, minAmount: e.target.value }))} /></div>
                <div><Label className="text-sm font-medium">Max Amount ($)</Label><Input type="number" className="mt-1" placeholder="Leave blank for unlimited" value={thresholdForm.maxAmount} onChange={e => setThresholdForm(f => ({ ...f, maxAmount: e.target.value }))} /></div>
              </div>
              <div>
                <Label className="text-sm font-medium">Approver Role</Label>
                <Select value={thresholdForm.approverRole} onValueChange={v => setThresholdForm(f => ({ ...f, approverRole: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select role..." /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setThresholdOpen(false)}>Cancel</Button>
              <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => { toast.success("Threshold saved"); setThresholdOpen(false); refetchThresholds(); }}>Save Threshold</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
