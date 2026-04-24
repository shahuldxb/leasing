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
import { ScreenHeader } from "@/components/ScreenHeader";

const ERP_SYSTEMS = ["SAP S/4HANA", "Oracle Fusion", "Microsoft Dynamics 365", "Sage Intacct", "NetSuite", "QuickBooks", "Xero", "Generic CSV"];

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

export default function ERPExport() {
  const [erpSystem, setErpSystem] = useState("SAP S/4HANA");
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
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
      <ScreenHeader
  screenId="VFLERPEXP0001P001"
  title="ERP Export"
  subtitle="GL journal export to SAP, Oracle, and other ERP systems"

          screenType="erp_export"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />
    </DashboardLayout>
  );
}
