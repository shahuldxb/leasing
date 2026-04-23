import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Search } from "lucide-react";

// Error log is stored in SQL Server security.error_log — displayed via audit log query
import { trpc } from "@/lib/trpc";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-400 border-red-500/30",
  High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Info: "bg-muted text-muted-foreground",
};

export default function ComplianceErrors() {
  const [search, setSearch] = useState("");
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
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlertCircle className="w-6 h-6 text-[#e60000]" /> Error Log</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFCMPERR0001P001 · System error log with severity classification and resolution tracking</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search errors..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              {["Critical","High","Medium","Low","Info"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {["Critical","High","Medium","Low"].map(s => (
            <div key={s} className={`rounded-xl p-4 border ${SEVERITY_COLORS[s]}`}>
              <p className="text-xs opacity-70">{s}</p>
              <p className="text-2xl font-bold mt-1">{allRows.filter((r: any) => r.severity === s).length}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Error #</TableHead>
                <TableHead className="text-xs">Screen ID</TableHead>
                <TableHead className="text-xs">Message</TableHead>
                <TableHead className="text-xs">Severity</TableHead>
                <TableHead className="text-xs">User</TableHead>
                <TableHead className="text-xs">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any, i: number) => (
                <TableRow key={r.audit_id ?? i} className="text-sm hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{r.audit_no ?? `ERR-${i+1}`}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.screen_id ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{r.action_description ?? r.outcome ?? "—"}</TableCell>
                  <TableCell><Badge className={SEVERITY_COLORS[r.severity ?? "Info"]}>{r.severity ?? "Info"}</Badge></TableCell>
                  <TableCell className="text-xs">{r.user_name ?? "System"}</TableCell>
                  <TableCell className="text-xs">{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No errors logged</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
