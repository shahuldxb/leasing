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
import { ScreenHeader } from "@/components/ScreenHeader";

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
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState("2025-12-31");
  const [result, setResult] = useState<{ columns: string[]; rows: any[] } | null>(null);

  const run = trpc.reportBuilder.run.useQuery(
    { reportType: reportType as any, fromDate, toDate },
    { enabled: false }
  );

  const utils = trpc.useUtils();
  const notifyMut = trpc.system.notifyOwner.useMutation({
    onSuccess: () => toast.success("Report sent to owner"),
    onError: (e) => toast.error(e.message),
  });

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
      <ScreenHeader
  screenId="VFLRPTBLD0001P001"
  title="Report Builder"
  subtitle="Custom report builder with drag-and-drop fields"

          screenType="report_builder"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />
    </DashboardLayout>
  );
}
