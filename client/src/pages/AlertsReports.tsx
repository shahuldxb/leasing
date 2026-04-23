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
import { Plus, Bell, Clock, Mail } from "lucide-react";
import { toast } from "sonner";

const ALERT_TYPES = ["EXPIRY","RENEWAL","RENT_REVIEW","BREAK_CLAUSE","INSURANCE_EXPIRY","PAYMENT_DUE","REMEASUREMENT","CUSTOM"];
const FREQ = ["DAILY","WEEKLY","MONTHLY","QUARTERLY"];
const STATUS_COLORS: Record<string, string> = { ACTIVE: "bg-emerald-500", PAUSED: "bg-amber-500", DRAFT: "bg-gray-500" };

export default function AlertsReports() {
  const [alertOpen, setAlertOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [alertForm, setAlertForm] = useState({ event_type: "EXPIRY", days_before: 30, recipient_roles: "", is_active: true, email_template: "" });
  const [reportForm, setReportForm] = useState({ report_name: "", report_type: "LEASE_REGISTER", cron_expression: "0 0 8 1 * *", recipients: "", output_format: "EXCEL" as "EXCEL" | "CSV" | "PDF" });

  const { data: alerts = [], refetch: refetchAlerts } = trpc.emailAlerts.list.useQuery();
  const { data: reports = [], refetch: refetchReports } = trpc.scheduledReports.list.useQuery();

  const saveAlert = trpc.emailAlerts.upsert.useMutation({ onSuccess: () => { refetchAlerts(); setAlertOpen(false); toast.success("Alert rule saved"); }, onError: (e: any) => toast.error(e.message) });
  const saveReport = trpc.scheduledReports.upsert.useMutation({ onSuccess: () => { refetchReports(); setReportOpen(false); toast.success("Scheduled report saved"); }, onError: (e: any) => toast.error(e.message) });
  const runReport = trpc.scheduledReports.runNow.useMutation({ onSuccess: () => toast.success("Report queued for delivery"), onError: (e: any) => toast.error(e.message) });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="w-6 h-6 text-amber-500" />Alerts & Scheduled Reports</h1>
          <p className="text-muted-foreground text-sm">Configure email alerts for critical dates and schedule automated report delivery</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Alert Rules", value: (alerts as any[]).length, color: "text-amber-600" },
            { label: "Active Alerts", value: (alerts as any[]).filter((a: any) => a.is_active).length, color: "text-emerald-600" },
            { label: "Scheduled Reports", value: (reports as any[]).length, color: "text-blue-600" },
            { label: "Active Schedules", value: (reports as any[]).filter((r: any) => r.status === "ACTIVE").length, color: "text-violet-600" },
          ].map(k => <Card key={k.label}><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{k.label}</p><p className={`text-2xl font-bold ${k.color}`}>{k.value}</p></CardContent></Card>)}
        </div>

        <Tabs defaultValue="alerts">
          <TabsList>
            <TabsTrigger value="alerts">Email Alert Rules ({(alerts as any[]).length})</TabsTrigger>
            <TabsTrigger value="reports">Scheduled Reports ({(reports as any[]).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Mail className="w-4 h-4" />Email Alert Rules</CardTitle>
                <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />New Alert Rule</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Configure Alert Rule</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-4">
                      <div><Label>Alert Type</Label>
                        <Select value={alertForm.event_type} onValueChange={v => setAlertForm(p => ({ ...p, event_type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{ALERT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Lead Days (alert X days before event)</Label><Input type="number" value={alertForm.days_before} onChange={e => setAlertForm(p => ({ ...p, days_before: Number(e.target.value) }))} /></div>
                      <div><Label>Recipients (roles or emails)</Label><Input value={alertForm.recipient_roles} onChange={e => setAlertForm(p => ({ ...p, recipient_roles: e.target.value }))} placeholder="finance,legal" /></div>
                      <div><Label>Email Template</Label><Input value={alertForm.email_template ?? ""} onChange={e => setAlertForm(p => ({ ...p, email_template: e.target.value }))} placeholder="[VodaLease] {{event_type}} — {{contract_ref}}" /></div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="active" checked={alertForm.is_active ?? true} onChange={e => setAlertForm(p => ({ ...p, is_active: e.target.checked }))} />
                        <Label htmlFor="active">Active</Label>
                      </div>
                    </div>
                    <Button className="mt-4 w-full" onClick={() => saveAlert.mutate(alertForm)} disabled={saveAlert.isPending}>Save Alert Rule</Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Alert Type</TableHead><TableHead className="text-right">Lead Days</TableHead><TableHead>Recipients</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(alerts as any[]).map((a: any) => (
                      <TableRow key={a.alert_id}>
                        <TableCell><Badge variant="outline" className="text-xs">{a.alert_type?.replace(/_/g," ")}</Badge></TableCell>
                        <TableCell className="text-right font-mono">{a.days_before}d</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{a.recipient_roles}</TableCell>
                        <TableCell>{a.is_active ? <Badge className="bg-emerald-500 text-white text-xs">Active</Badge> : <Badge variant="outline" className="text-xs">Inactive</Badge>}</TableCell>
                      </TableRow>
                    ))}
                    {(alerts as any[]).length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No alert rules configured</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" />Scheduled Report Delivery</CardTitle>
                <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Schedule Report</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Schedule Report</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-4">
                      <div><Label>Report Name</Label><Input value={reportForm.report_name} onChange={e => setReportForm(p => ({ ...p, report_name: e.target.value }))} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Report Type</Label>
                          <Select value={reportForm.report_type} onValueChange={v => setReportForm(p => ({ ...p, report_type: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{["LEASE_REGISTER","AMORTISATION","DISCLOSURE","ROLL_FORWARD","MATURITY","PAYMENT_RUN","BANK_RECON","CUSTOM"].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        
                        <div><Label>Format</Label>
                          <Select value={reportForm.output_format} onValueChange={v => setReportForm(p => ({ ...p, output_format: v as "EXCEL" | "CSV" | "PDF" }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{["EXCEL","PDF","CSV"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div><Label>Cron Expression</Label><Input value={reportForm.cron_expression} onChange={e => setReportForm(p => ({ ...p, cron_expression: e.target.value }))} placeholder="0 0 8 1 * *" /></div>
                      </div>
                      <div><Label>Recipients (comma-separated emails)</Label><Input value={reportForm.recipients} onChange={e => setReportForm(p => ({ ...p, recipients: e.target.value }))} placeholder="finance@company.com" /></div>
                    </div>
                    <Button className="mt-4 w-full" onClick={() => saveReport.mutate(reportForm)} disabled={saveReport.isPending}>Schedule Report</Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Report Name</TableHead><TableHead>Type</TableHead><TableHead>Frequency</TableHead><TableHead>Format</TableHead><TableHead>Next Run</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(reports as any[]).map((r: any) => (
                      <TableRow key={r.schedule_id}>
                        <TableCell className="font-medium">{r.report_name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{r.report_type?.replace(/_/g," ")}</Badge></TableCell>
                        <TableCell className="text-sm">{r.frequency}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{r.output_format}</Badge></TableCell>
                        <TableCell className="text-sm">{r.next_run_date?.slice(0,10)}</TableCell>
                        <TableCell><Badge className={`${STATUS_COLORS[r.status] ?? "bg-gray-500"} text-white text-xs`}>{r.status}</Badge></TableCell>
                        <TableCell><Button size="sm" variant="outline" onClick={() => runReport.mutate({ schedule_id: r.schedule_id })} disabled={runReport.isPending}>Run Now</Button></TableCell>
                      </TableRow>
                    ))}
                    {(reports as any[]).length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No scheduled reports configured</TableCell></TableRow>}
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
