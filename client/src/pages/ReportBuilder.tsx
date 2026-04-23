import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Play, Download, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const REPORT_TYPES = [
  { value: "LEASE_REGISTER", label: "Lease Register", desc: "Full list of all leases with IFRS 16 values" },
  { value: "AMORTISATION_SUMMARY", label: "Amortisation Summary", desc: "Principal/interest breakdown per lease" },
  { value: "PAYMENT_FORECAST", label: "Payment Forecast", desc: "Future payment schedule by period" },
  { value: "MATURITY_ANALYSIS", label: "Maturity Analysis", desc: "Lease liabilities by maturity band" },
  { value: "COST_CENTRE", label: "Cost Centre Analysis", desc: "Lease costs grouped by cost centre" },
  { value: "ASSET_TYPE_SUMMARY", label: "Asset Type Summary", desc: "Portfolio breakdown by asset category" },
  { value: "EXPIRY_REPORT", label: "Expiry Report", desc: "Leases expiring in the next 2 years" },
];

const fmt = (v: any) => {
  if (v == null) return "—";
  if (typeof v === "number") return v.toLocaleString("en-AE", { maximumFractionDigits: 2 });
  if (typeof v === "string" && v.match(/^\d{4}-\d{2}-\d{2}/)) return v.slice(0, 10);
  return String(v);
};

export default function ReportBuilder() {
  const [reportType, setReportType] = useState("LEASE_REGISTER");
  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState("2025-12-31");
  const [result, setResult] = useState<{ columns: string[]; rows: any[] } | null>(null);

  const run = trpc.reportBuilder.run.useQuery(
    { reportType: reportType as any, fromDate, toDate },
    { enabled: false }
  );

  const handleRun = async () => {
    const data = await run.refetch();
    if (data.data) setResult(data.data);
  };

  const exportCSV = () => {
    if (!result) return;
    const header = result.columns.join(",");
    const rows = result.rows.map(r => result.columns.map(c => `"${r[c] ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("CSV downloaded");
  };

  const selectedType = REPORT_TYPES.find(r => r.value === reportType);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            Custom Report Builder
          </h1>
          <p className="text-muted-foreground text-sm">Build, run, and export reports across all lease data</p>
        </div>

        {/* Report type selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {REPORT_TYPES.map(r => (
            <button
              key={r.value}
              onClick={() => { setReportType(r.value); setResult(null); }}
              className={`p-3 rounded-lg border text-left transition-colors ${reportType === r.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
            >
              <p className={`text-xs font-semibold ${reportType === r.value ? "text-primary" : ""}`}>{r.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.desc}</p>
            </button>
          ))}
        </div>

        {/* Parameters */}
        <Card>
          <CardContent className="pt-4 flex items-end gap-4">
            <div className="space-y-1">
              <Label>From Date</Label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label>To Date</Label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40" />
            </div>
            <Button onClick={handleRun} disabled={run.isFetching}>
              {run.isFetching ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Running...</> : <><Play className="w-4 h-4 mr-2" />Run Report</>}
            </Button>
            {result && (
              <>
                <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
                <Button variant="outline" onClick={() => toast.info("Save report coming soon")}><Save className="w-4 h-4 mr-2" />Save</Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {selectedType?.label}
                <Badge variant="outline">{result.rows.length} rows</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {result.columns.map(c => (
                      <TableHead key={c} className="text-xs whitespace-nowrap">{c.replace(/_/g, " ").toUpperCase()}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row, i) => (
                    <TableRow key={i}>
                      {result.columns.map(c => (
                        <TableCell key={c} className="text-sm font-mono whitespace-nowrap">{fmt(row[c])}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {result.rows.length === 0 && (
                    <TableRow><TableCell colSpan={result.columns.length} className="text-center text-muted-foreground py-8">No data for selected parameters</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {!result && !run.isFetching && (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select a report type and click Run Report to see results</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
