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
import { Download, Send, CheckCircle, Clock, AlertCircle, Database } from "lucide-react";
import { toast } from "sonner";

const ERP_SYSTEMS = ["SAP S/4HANA", "Oracle Fusion", "Microsoft Dynamics 365", "Sage Intacct", "NetSuite", "QuickBooks", "Xero", "Generic CSV"];

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

export default function ERPExport() {
  const [erpSystem, setErpSystem] = useState("SAP S/4HANA");
  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState("2025-03-31");
  const [exportType, setExportType] = useState("GL_JOURNALS");

  const { data: exports = [], refetch } = trpc.accounting.erpExport.exportLog.useQuery();
  const { data: configs = [] } = trpc.accounting.erpExport.configs.useQuery();
  const generate = trpc.accounting.erpExport.generateExport.useMutation({
    onSuccess: (data: any) => {
      refetch();
      toast.success(`Export generated: ${data.rowCount} rows`);
      // Trigger download
      const blob = new Blob([data.csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
    },
  });

  const statusIcon = (s: string) => {
    if (s === "COMPLETED") return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (s === "PENDING") return <Clock className="w-4 h-4 text-amber-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">ERP Export</h1>
          <p className="text-muted-foreground text-sm">Export GL journals, amortisation schedules, and lease data to your ERP system</p>
        </div>

        {/* ERP Config cards */}
        <div className="grid grid-cols-3 gap-4">
          {(configs as any[]).length > 0 ? (configs as any[]).map((c: any) => (
            <Card key={c.config_id} className="border-2 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-primary" />
                  <span className="font-semibold">{c.erp_system}</span>
                  <Badge variant={c.is_active ? "default" : "secondary"} className="ml-auto">{c.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Company: {c.company_code}</p>
                <p className="text-xs text-muted-foreground">Format: {c.export_format}</p>
              </CardContent>
            </Card>
          )) : (
            <Card className="col-span-3">
              <CardContent className="pt-4 text-center text-muted-foreground text-sm py-6">
                No ERP configurations found. Configure your ERP connection in Settings.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Generate export */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Send className="w-4 h-4" />Generate Export</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <Label>ERP System</Label>
                <Select value={erpSystem} onValueChange={setErpSystem}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ERP_SYSTEMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Export Type</Label>
                <Select value={exportType} onValueChange={setExportType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GL_JOURNALS">GL Journals</SelectItem>
                    <SelectItem value="AMORTISATION">Amortisation Schedule</SelectItem>
                    <SelectItem value="LEASE_REGISTER">Lease Register</SelectItem>
                    <SelectItem value="PAYMENT_SCHEDULE">Payment Schedule</SelectItem>
                    <SelectItem value="DISCLOSURE">Disclosure Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>From Date</Label>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>To Date</Label>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => generate.mutate({ config_id: (configs as any[])[0]?.config_id ?? 1, period_from: fromDate, period_to: toDate })} disabled={generate.isPending}>
                <Download className="w-4 h-4 mr-2" />{generate.isPending ? "Generating..." : "Generate & Download"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export history */}
        <Card>
          <CardHeader><CardTitle className="text-base">Export History</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>ERP System</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Exported By</TableHead>
                  <TableHead className="text-right">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(exports as any[]).map((e: any) => (
                  <TableRow key={e.export_id}>
                    <TableCell className="text-sm">{e.created_at?.slice(0, 16)?.replace("T", " ")}</TableCell>
                    <TableCell className="text-sm">{e.erp_system}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{e.export_type}</Badge></TableCell>
                    <TableCell className="text-sm font-mono">{e.period_from?.slice(0, 10)} – {e.period_to?.slice(0, 10)}</TableCell>
                    <TableCell className="text-sm">{e.row_count?.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.filename}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {statusIcon(e.status)}
                        <span className="text-sm">{e.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{e.exported_by_name}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => toast.info("Re-download not available for old exports")}>
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(exports as any[]).length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No exports yet. Generate your first export above.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
