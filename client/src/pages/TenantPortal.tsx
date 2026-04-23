import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, MessageSquare, CreditCard, CheckCircle, Clock, Plus, Download, Bell } from "lucide-react";
import { toast } from "sonner";

const TENANT_LEASES = [
  { id: 1, ref: "VF-2024-001", property: "Vodafone HQ — Floor 12", lessor: "Al Futtaim Properties", monthly_rent: 185000, next_payment: "2026-05-01", lease_end: "2028-12-31", status: "ACTIVE" },
  { id: 2, ref: "VF-2024-003", property: "Vodafone HQ — Floor 13", lessor: "Al Futtaim Properties", monthly_rent: 175000, next_payment: "2026-05-01", lease_end: "2029-06-30", status: "ACTIVE" },
  { id: 3, ref: "VF-2023-041", property: "Vodafone Abu Dhabi Office", lessor: "TECOM Investments", monthly_rent: 125000, next_payment: "2026-05-15", lease_end: "2026-08-15", status: "EXPIRING_SOON" },
];

const REQUESTS = [
  { id: 1, type: "Maintenance", subject: "HVAC not cooling — Floor 12", date: "2026-04-20", status: "IN_PROGRESS", priority: "HIGH" },
  { id: 2, type: "Document", subject: "Request lease certificate for bank", date: "2026-04-18", status: "COMPLETED", priority: "MEDIUM" },
  { id: 3, type: "Renewal", subject: "Renewal enquiry — VF-2023-041", date: "2026-04-15", status: "PENDING", priority: "HIGH" },
  { id: 4, type: "Alteration", subject: "Permission to install additional server racks", date: "2026-04-10", status: "APPROVED", priority: "LOW" },
];

const DOCUMENTS = [
  { name: "Lease Agreement — VF-2024-001.pdf", date: "2024-01-15", size: "2.4 MB", type: "Lease" },
  { name: "Lease Agreement — VF-2024-003.pdf", date: "2024-03-01", size: "2.1 MB", type: "Lease" },
  { name: "Lease Agreement — VF-2023-041.pdf", date: "2023-08-15", size: "1.9 MB", type: "Lease" },
  { name: "Rent Review Notice — Apr 2026.pdf", date: "2026-03-01", size: "0.3 MB", type: "Notice" },
  { name: "Insurance Certificate — 2026.pdf", date: "2026-01-01", size: "0.8 MB", type: "Insurance" },
  { name: "Building Rules & Regulations.pdf", date: "2024-01-01", size: "1.2 MB", type: "Policy" },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
  EXPIRING_SOON: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  EXPIRED: "bg-red-500/20 text-red-400 border-red-500/30",
  IN_PROGRESS: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
  PENDING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function TenantPortal() {
  const [tab, setTab] = useState("overview");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requests, setRequests] = useState(REQUESTS);
  const [form, setForm] = useState({ type: "Maintenance", subject: "", description: "", lease: "", priority: "MEDIUM" });

  const totalMonthlyRent = TENANT_LEASES.reduce((s, l) => s + l.monthly_rent, 0);
  const activeLeases = TENANT_LEASES.filter(l => l.status === "ACTIVE").length;
  const openRequests = requests.filter(r => r.status === "PENDING" || r.status === "IN_PROGRESS").length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tenant Self-Service Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">Lease overview, document access, maintenance requests, renewal enquiries, and payment history</p>
          </div>
          <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setShowRequestDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Request
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Leases", value: activeLeases, icon: FileText, color: "text-blue-400" },
            { label: "Monthly Rent (AED)", value: `${(totalMonthlyRent / 1000).toFixed(0)}K`, icon: CreditCard, color: "text-green-400" },
            { label: "Open Requests", value: openRequests, icon: MessageSquare, color: "text-yellow-400" },
            { label: "Expiring Soon", value: TENANT_LEASES.filter(l => l.status === "EXPIRING_SOON").length, icon: Bell, color: "text-orange-400" },
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

        {TENANT_LEASES.some(l => l.status === "EXPIRING_SOON") && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Bell className="w-5 h-5 text-orange-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-400">Lease Expiry Alert</p>
              <p className="text-xs text-muted-foreground">VF-2023-041 (Vodafone Abu Dhabi) expires on 15 Aug 2026 — 113 days remaining. Please contact your property manager to discuss renewal options.</p>
            </div>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs" onClick={() => toast.info("Renewal enquiry submitted")}>
              Enquire Now
            </Button>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/30">
            <TabsTrigger value="overview">My Leases</TabsTrigger>
            <TabsTrigger value="requests">Service Requests</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="space-y-4">
              {TENANT_LEASES.map((lease) => (
                <Card key={lease.id} className="bg-card border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold">{lease.ref}</span>
                          <Badge className={`text-xs border ${STATUS_COLORS[lease.status]}`}>{lease.status.replace("_", " ")}</Badge>
                        </div>
                        <p className="text-sm font-medium">{lease.property}</p>
                        <p className="text-xs text-muted-foreground">Lessor: {lease.lessor}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">AED {lease.monthly_rent.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">per month</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border text-center">
                      <div>
                        <p className="text-sm font-semibold">{lease.next_payment}</p>
                        <p className="text-xs text-muted-foreground">Next Payment</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{lease.lease_end}</p>
                        <p className="text-xs text-muted-foreground">Lease Expiry</p>
                      </div>
                      <div>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info("Downloading lease document...")}>
                          <Download className="w-3 h-3 mr-1" /> Download Lease
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Subject</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Priority</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell><Badge className="text-xs bg-muted/30 text-muted-foreground border border-border">{r.type}</Badge></TableCell>
                        <TableCell className="text-sm">{r.subject}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.date}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs border ${r.priority === "HIGH" ? "bg-red-500/20 text-red-400 border-red-500/30" : r.priority === "MEDIUM" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}`}>{r.priority}</Badge>
                        </TableCell>
                        <TableCell><Badge className={`text-xs border ${STATUS_COLORS[r.status]}`}>{r.status.replace("_", " ")}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Document Name</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Size</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DOCUMENTS.map((doc, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{doc.name}</TableCell>
                        <TableCell><Badge className="text-xs bg-muted/30 text-muted-foreground border border-border">{doc.type}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{doc.date}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{doc.size}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast.info(`Downloading ${doc.name}...`)}>
                            <Download className="w-3 h-3 mr-1" /> Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Period</TableHead>
                      <TableHead className="text-xs">Lease Ref</TableHead>
                      <TableHead className="text-xs">Property</TableHead>
                      <TableHead className="text-xs text-right">Amount (AED)</TableHead>
                      <TableHead className="text-xs">Payment Date</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {["Apr 2026", "Mar 2026", "Feb 2026", "Jan 2026"].flatMap((period, pi) =>
                      TENANT_LEASES.map((lease, li) => ({
                        period, ref: lease.ref, property: lease.property.split(" — ")[0],
                        amount: lease.monthly_rent, date: `${["2026-04-01", "2026-03-01", "2026-02-01", "2026-01-01"][pi]}`,
                        status: pi === 0 && li === 0 ? "PENDING" : "COMPLETED",
                      }))
                    ).slice(0, 8).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{row.period}</TableCell>
                        <TableCell className="font-mono text-xs">{row.ref}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.property}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{row.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{row.date}</TableCell>
                        <TableCell><Badge className={`text-xs border ${STATUS_COLORS[row.status]}`}>{row.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Service Request</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Request Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Maintenance", "Document", "Renewal", "Alteration", "Complaint", "Other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Subject *</Label>
                <Input className="mt-1" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-medium">Lease Reference</Label>
                <Select value={form.lease} onValueChange={v => setForm(f => ({ ...f, lease: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select lease..." /></SelectTrigger>
                  <SelectContent>
                    {TENANT_LEASES.map(l => <SelectItem key={l.ref} value={l.ref}>{l.ref} — {l.property}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Description</Label>
                <Textarea className="mt-1 resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowRequestDialog(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white"
                  disabled={!form.subject}
                  onClick={() => {
                    setRequests(prev => [...prev, {
                      id: prev.length + 1, type: form.type, subject: form.subject,
                      date: new Date().toISOString().split("T")[0], status: "PENDING", priority: form.priority,
                    }]);
                    toast.success("Service request submitted");
                    setShowRequestDialog(false);
                  }}>
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
