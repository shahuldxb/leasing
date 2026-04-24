import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Search } from "lucide-react";

// Error log is stored in SQL Server security.error_log — displayed via audit log query
import { trpc } from "@/lib/trpc";
import { ScreenHeader } from "@/components/ScreenHeader";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-400 border-red-500/30",
  High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Info: "bg-muted text-muted-foreground",
};

export default function ComplianceErrors() {
  const [search, setSearch] = useState("");
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [severity, setSeverity] = useState("all");

  const { data } = trpc.compliance.getAuditLog.useQuery({
    module: "ERROR",
    page: 1,
    pageSize: 200,
  });
  const allRows: any[] = (data as any)?.rows ?? [];
  const rows = allRows.filter((r: any) => {
    const matchSearch = !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severity === "all" || r.severity === severity;
    return matchSearch && matchSeverity;
  });

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLCMPERR0001P001"
          screenType="error_log"
          onAIData={(rows) => setAiRows(rows)}
  title="Error Log"
  subtitle="System error log and exception management"
/>
    </DashboardLayout>
  );
}
