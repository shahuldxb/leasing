import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Mail, Calendar, Plus, Edit2, Trash2, Send, CheckCircle, Clock, Download } from "lucide-react";
import { toast } from "sonner";

const EVENT_TYPES = [
  "Lease Expiry", "Renewal Option Deadline", "Break Clause Notice", "Rent Review Date",
  "Security Deposit Return", "Insurance Renewal", "Maintenance Due", "Payment Due",
  "CPI Escalation Date", "Lease Commencement", "Audit Deadline",
];

const SAMPLE_RULES = [
  { id: 1, event_type: "Lease Expiry", days_before: 180, recipients: "Finance Team, Legal", channels: ["Email", "ICS"], is_active: true, last_sent: "2026-04-01" },
  { id: 2, event_type: "Lease Expiry", days_before: 90, recipients: "CFO, Finance Team", channels: ["Email"], is_active: true, last_sent: "2026-04-10" },
  { id: 3, event_type: "Renewal Option Deadline", days_before: 120, recipients: "Legal, Asset Manager", channels: ["Email", "ICS"], is_active: true, last_sent: "2026-03-15" },
  { id: 4, event_type: "Break Clause Notice", days_before: 60, recipients: "Finance Team", channels: ["Email"], is_active: true, last_sent: "2026-04-05" },
  { id: 5, event_type: "Rent Review Date", days_before: 30, recipients: "Finance Team, Procurement", channels: ["Email", "ICS"], is_active: false, last_sent: "—" },
  { id: 6, event_type: "Payment Due", days_before: 7, recipients: "AP Team", channels: ["Email"], is_active: true, last_sent: "2026-04-20" },
];

const SENT_LOG = [
  { id: 1, event: "Lease Expiry Alert", contract: "VF-2024-001", recipient: "finance@vodafone.ae", sent_at: "2026-04-20 09:00", status: "DELIVERED" },
  { id: 2, event: "Renewal Deadline", contract: "VF-2024-003", recipient: "legal@vodafone.ae", sent_at: "2026-04-18 09:00", status: "DELIVERED" },
  { id: 3, event: "Break Clause Notice", contract: "VF-2023-015", recipient: "finance@vodafone.ae", sent_at: "2026-04-15 09:00", status: "DELIVERED" },
  { id: 4, event: "Payment Due Reminder", contract: "VF-2024-007", recipient: "ap@vodafone.ae", sent_at: "2026-04-22 09:00", status: "DELIVERED" },
  { id: 5, event: "Lease Expiry Alert", contract: "VF-2023-022", recipient: "cfo@vodafone.ae", sent_at: "2026-04-10 09:00", status: "BOUNCED" },
];

export default function NotificationSettings() {
  const [tab, setTab] = useState("rules");
  const [showDialog, setShowDialog] = useState(false);
  const [rules, setRules] = useState(SAMPLE_RULES);
  const [form, setForm] = useState({
    event_type: "", days_before: "30", recipients: "", email_subject: "", email_body: "",
    include_ics: false, include_email: true,
  });

  function toggleRule(id: number) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
    toast.success("Notification rule updated");
  }

  function deleteRule(id: number) {
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success("Rule deleted");
  }

  function exportICS(rule: any) {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//VodaLease Enterprise//EN",
      "BEGIN:VEVENT",
      `DTSTART:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTEND:${new Date(Date.now() + 3600000).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `SUMMARY:${rule.event_type} — VodaLease Alert`,
      `DESCRIPTION:Automated alert for ${rule.event_type} — ${rule.days_before} days notice`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vodalease-${rule.event_type.replace(/\s+/g, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("ICS calendar file downloaded");
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notification Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Email notification engine for critical lease dates — expiry, renewal, break clauses, rent reviews</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.info("Sending test notification...")}>
              <Send className="w-4 h-4 mr-2" /> Send Test
            </Button>
            <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Rule
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Rules", value: rules.filter(r => r.is_active).length, icon: Bell, color: "text-green-400" },
            { label: "Emails Sent (30d)", value: "47", icon: Mail, color: "text-blue-400" },
            { label: "ICS Exports (30d)", value: "12", icon: Calendar, color: "text-purple-400" },
            { label: "Delivery Rate", value: "96.8%", icon: CheckCircle, color: "text-yellow-400" },
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
            <TabsTrigger value="rules">Alert Rules</TabsTrigger>
            <TabsTrigger value="log">Sent Log</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="ics">ICS Calendar Export</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Event Type</TableHead>
                      <TableHead className="text-xs">Lead Time</TableHead>
                      <TableHead className="text-xs">Recipients</TableHead>
                      <TableHead className="text-xs">Channels</TableHead>
                      <TableHead className="text-xs">Last Sent</TableHead>
                      <TableHead className="text-xs">Active</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="text-sm font-medium">{rule.event_type}</TableCell>
                        <TableCell className="text-sm">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground" /> {rule.days_before} days</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{rule.recipients}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {rule.channels.map(c => (
                              <Badge key={c} className={`text-xs ${c === "Email" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-purple-500/20 text-purple-400 border-purple-500/30"} border`}>{c}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{rule.last_sent}</TableCell>
                        <TableCell>
                          <Switch checked={rule.is_active} onCheckedChange={() => toggleRule(rule.id)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => exportICS(rule)} title="Download ICS">
                              <Calendar className="w-3.5 h-3.5 text-purple-400" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast.info("Edit rule — coming soon")} title="Edit">
                              <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteRule(rule.id)} title="Delete">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Event</TableHead>
                      <TableHead className="text-xs">Contract</TableHead>
                      <TableHead className="text-xs">Recipient</TableHead>
                      <TableHead className="text-xs">Sent At</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SENT_LOG.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">{log.event}</TableCell>
                        <TableCell className="font-mono text-sm">{log.contract}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{log.recipient}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{log.sent_at}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs border ${log.status === "DELIVERED" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                            {log.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["Lease Expiry Alert", "Renewal Deadline", "Break Clause Notice", "Payment Reminder"].map((tmpl) => (
                <Card key={tmpl} className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      {tmpl}
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toast.info("Template editor — coming soon")}>
                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 rounded bg-muted/20 border border-border text-xs text-muted-foreground font-mono leading-relaxed">
                      <p>Subject: [VodaLease] {tmpl} — {"{{contract_ref}}"}</p>
                      <p className="mt-2">Dear {"{{recipient_name}}"},</p>
                      <p className="mt-1">This is an automated notification from VodaLease Enterprise regarding lease {"{{contract_ref}}"} for {"{{asset_description}}"}.</p>
                      <p className="mt-1">{"{{event_details}}"}</p>
                      <p className="mt-1">Action required by: {"{{action_date}}"}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ics" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-purple-400" /> Outlook / Google Calendar Export</CardTitle>
                <p className="text-xs text-muted-foreground">Download .ics calendar files for lease events — compatible with Outlook, Google Calendar, Apple Calendar</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "All Lease Expiries (Next 12 months)", count: 8, color: "text-red-400" },
                    { title: "Renewal Option Deadlines", count: 5, color: "text-orange-400" },
                    { title: "Break Clause Notices", count: 3, color: "text-yellow-400" },
                    { title: "Rent Review Dates", count: 7, color: "text-blue-400" },
                    { title: "Payment Due Dates (Next 30 days)", count: 12, color: "text-green-400" },
                    { title: "All Critical Dates (Full Portfolio)", count: 47, color: "text-purple-400" },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className={`text-xs ${item.color}`}>{item.count} events</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs"
                        onClick={() => {
                          const icsContent = [
                            "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VodaLease Enterprise//EN",
                            "BEGIN:VEVENT",
                            `DTSTART:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
                            `DTEND:${new Date(Date.now() + 3600000).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
                            `SUMMARY:${item.title}`,
                            `DESCRIPTION:VodaLease Enterprise — ${item.count} events exported`,
                            "END:VEVENT", "END:VCALENDAR",
                          ].join("\r\n");
                          const blob = new Blob([icsContent], { type: "text/calendar" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `vodalease-${item.title.replace(/\s+/g, "-").toLowerCase()}.ics`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success(`ICS file downloaded — ${item.count} events`);
                        }}>
                        <Download className="w-3 h-3 mr-1" /> .ics
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Rule Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Notification Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">Event Type *</Label>
                <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select event type..." /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Lead Time (days before)</Label>
                  <Input type="number" className="mt-1" value={form.days_before} onChange={e => setForm(f => ({ ...f, days_before: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-medium">Recipients (roles/emails)</Label>
                  <Input className="mt-1" placeholder="Finance Team, CFO..." value={form.recipients} onChange={e => setForm(f => ({ ...f, recipients: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Email Subject</Label>
                <Input className="mt-1" placeholder="[VodaLease] {{event_type}} — {{contract_ref}}" value={form.email_subject} onChange={e => setForm(f => ({ ...f, email_subject: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-medium">Email Body</Label>
                <Textarea className="mt-1 resize-none" rows={3} placeholder="Notification message..." value={form.email_body} onChange={e => setForm(f => ({ ...f, email_body: e.target.value }))} />
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={form.include_email} onCheckedChange={v => setForm(f => ({ ...f, include_email: v }))} />
                  <Label className="text-xs">Send Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.include_ics} onCheckedChange={v => setForm(f => ({ ...f, include_ics: v }))} />
                  <Label className="text-xs">Attach ICS Calendar</Label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white"
                  disabled={!form.event_type}
                  onClick={() => {
                    setRules(prev => [...prev, {
                      id: prev.length + 1, event_type: form.event_type,
                      days_before: Number(form.days_before), recipients: form.recipients,
                      channels: [form.include_email ? "Email" : "", form.include_ics ? "ICS" : ""].filter(Boolean),
                      is_active: true, last_sent: "—",
                    }]);
                    toast.success("Notification rule created");
                    setShowDialog(false);
                  }}>
                  Create Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
