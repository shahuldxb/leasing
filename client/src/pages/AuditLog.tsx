/**
 * VodaLease Enterprise — Audit Log
 * Screen ID: VFCMPAUDIT0001P001
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, RefreshCw, Download, Shield } from "lucide-react";

export default function AuditLog() {
  const [module, setModule]     = useState("all");
  const [actionType, setActionType] = useState("all");
  const [page, setPage]         = useState(1);
  const PAGE_SIZE = 100;

  const { data, isLoading, refetch } = trpc.compliance.getAuditLog.useQuery({
    module: module !== "all" ? module : undefined,
    actionType: actionType !== "all" ? actionType : undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const rows       = data?.rows ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <div>
            <h1 className="page-title">Audit Log</h1>
            <p className="page-subtitle">Screen ID: VFCMPAUDIT0001P001 · {totalCount} entries</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap gap-3">
              <Select value={module} onValueChange={v => { setModule(v); setPage(1); }}>
                <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Module" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="Lease">Lease</SelectItem>
                  <SelectItem value="Payables">Payables</SelectItem>
                  <SelectItem value="Workflow">Workflow</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="BankRecon">Bank Recon</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionType} onValueChange={v => { setActionType(v); setPage(1); }}>
                <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Action Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="APPROVE">Approve</SelectItem>
                  <SelectItem value="REJECT">Reject</SelectItem>
                  <SelectItem value="POST_GL">Post GL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Audit No</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Timestamp</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Module</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Record</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Screen ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                        <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        No audit entries found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: any) => (
                      <tr key={row.audit_id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs text-primary">{row.audit_no ?? `AUD-${row.audit_id}`}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</td>
                        <td className="px-4 py-3">{row.username ?? "—"}</td>
                        <td className="px-4 py-3"><span className="badge-draft">{row.module}</span></td>
                        <td className="px-4 py-3 font-mono text-xs">{row.action_type}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-32">{row.record_table} #{row.record_id}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.screen_id ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={row.outcome === "Success" ? "badge-active" : "badge-expired"}>{row.outcome}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
