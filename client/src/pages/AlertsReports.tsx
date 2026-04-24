import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Bell, FileText } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const ALERT_TYPES = ["EXPIRY","PAYMENT_DUE","RENT_REVIEW","BREAK_CLAUSE","CRITICAL_DATE","COMPLIANCE"];
const FREQUENCIES = ["DAILY","WEEKLY","MONTHLY"];
const FORMATS = ["PDF","EXCEL","CSV","EMAIL"];
const INIT_ALERT = { alert_type: "EXPIRY", days_before: 30, email_recipients: "", is_active: true };
const INIT_REPORT = { report_name: "", report_type: "LEASE_SUMMARY", frequency: "MONTHLY", format: "PDF", recipients: "" };

export default function AlertsReports() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("alerts");
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [alertForm, setAlertForm] = useState({ ...INIT_ALERT });
  const [reportForm, setReportForm] = useState({ ...INIT_REPORT });
  const { data: alerts = [], refetch: refetchAlerts } = trpc.emailAlerts.list.useQuery();
  const { data: reports = [], refetch: refetchReports } = trpc.scheduledReports.list.useQuery();
  const saveAlert = trpc.emailAlerts.upsert.useMutation({ onSuccess: () => { refetchAlerts(); setPanelOpen(false); toast.success("Alert saved"); }, onError: (e) => toast.error(e.message) });
  const saveReport = trpc.scheduledReports.upsert.useMutation({ onSuccess: () => { refetchReports(); setPanelOpen(false); toast.success("Report saved"); }, onError: (e) => toast.error(e.message) });
  const displayAlerts = aiRows.length > 0 ? aiRows : (alerts as any[]);

  return (
    <DashboardLayout>
      {panelOpen ? (
        <div className="flex flex-col h-full w-full bg-background">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setPanelOpen(false)}><ArrowLeft className="w-5 h-5" /></Button>
              <div><h2 className="text-lg font-semibold">{activeTab === "alerts" ? "New Alert Rule" : "New Scheduled Report"}</h2></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPanelOpen(false)}>Cancel</Button>
              <Button onClick={() => activeTab === "alerts" ? saveAlert.mutate(alertForm as any) : saveReport.mutate(reportForm as any)}>Save</Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {activeTab === "alerts" ? (
              <div className="max-w-xl mx-auto space-y-5">
                <div><Label className="text-xs text-muted-foreground">Alert Type</Label>
                  <Select value={alertForm.alert_type} onValueChange={v => setAlertForm(f => ({ ...f, alert_type: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{ALERT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Days Before Event</Label><Input type="number" className="mt-1" value={alertForm.days_before} onChange={e => setAlertForm(f => ({ ...f, days_before: Number(e.target.value) }))} /></div>
                <div><Label className="text-xs text-muted-foreground">Email Recipients (comma-separated)</Label><Input className="mt-1" value={alertForm.email_recipients} onChange={e => setAlertForm(f => ({ ...f, email_recipients: e.target.value }))} /></div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto space-y-5">
                <div><Label className="text-xs text-muted-foreground">Report Name</Label><Input className="mt-1" value={reportForm.report_name} onChange={e => setReportForm(f => ({ ...f, report_name: e.target.value }))} /></div>
                <div><Label className="text-xs text-muted-foreground">Frequency</Label>
                  <Select value={reportForm.frequency} onValueChange={v => setReportForm(f => ({ ...f, frequency: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Format</Label>
                  <Select value={reportForm.format} onValueChange={v => setReportForm(f => ({ ...f, format: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Recipients</Label><Input className="mt-1" value={reportForm.recipients} onChange={e => setReportForm(f => ({ ...f, recipients: e.target.value }))} /></div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          <ScreenHeader screenId="VFLALERTS0001P001" title="Alerts & Scheduled Reports" subtitle="Email alert rules and automated report delivery"
            screenType="alerts_reports" onAIData={(rows) => setAiRows(rows)}
            actions={<Button size="sm" onClick={() => setPanelOpen(true)}><Plus className="w-4 h-4 mr-1" />Add</Button>} />
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList><TabsTrigger value="alerts"><Bell className="w-4 h-4 mr-1" />Alert Rules</TabsTrigger><TabsTrigger value="reports"><FileText className="w-4 h-4 mr-1" />Scheduled Reports</TabsTrigger></TabsList>
            <TabsContent value="alerts" className="mt-4">
              <Card><CardContent className="p-0"><Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Days Before</TableHead><TableHead>Recipients</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {displayAlerts.map((a: any, i: number) => (
                    <TableRow key={i}><TableCell><Badge variant="outline">{a.alert_type}</Badge></TableCell><TableCell>{a.days_before}</TableCell><TableCell className="text-sm text-muted-foreground truncate max-w-xs">{a.email_recipients}</TableCell><TableCell><Badge className={a.is_active ? "bg-emerald-600 text-white" : "bg-gray-500 text-white"}>{a.is_active ? "Active" : "Inactive"}</Badge></TableCell></TableRow>
                  ))}
                  {displayAlerts.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No alert rules configured</TableCell></TableRow>}
                </TableBody>
              </Table></CardContent></Card>
            </TabsContent>
            <TabsContent value="reports" className="mt-4">
              <Card><CardContent className="p-0"><Table>
                <TableHeader><TableRow><TableHead>Report Name</TableHead><TableHead>Frequency</TableHead><TableHead>Format</TableHead><TableHead>Recipients</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(reports as any[]).map((r: any, i: number) => (
                    <TableRow key={i}><TableCell className="font-medium">{r.report_name}</TableCell><TableCell><Badge variant="secondary">{r.frequency}</Badge></TableCell><TableCell><Badge variant="outline">{r.format}</Badge></TableCell><TableCell className="text-sm text-muted-foreground">{r.recipients}</TableCell></TableRow>
                  ))}
                  {(reports as any[]).length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No scheduled reports configured</TableCell></TableRow>}
                </TableBody>
              </Table></CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DashboardLayout>
  );
}
