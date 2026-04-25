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
import { Search, RefreshCw, Download, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

function formatElapsed(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function elapsedColor(ms: number | null | undefined): string {
  if (!ms) return "text-muted-foreground";
  if (ms < 500) return "text-green-400";
  if (ms < 2000) return "text-amber-400";
  return "text-red-400";
}

export default function AuditLog() {
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
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

  const utils = trpc.useUtils();
  const notifyMut = trpc.system.notifyOwner.useMutation({
    onSuccess: () => toast.success("Report sent to owner"),
    onError: (e) => toast.error(e.message),
  });

  const rows       = data?.rows ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <ScreenHeader
            screenId="VFCMPAUDIT0001P001"
            title="Audit Log"
            subtitle="Complete audit trail of all system actions"
            screenType="audit_log"
            onAIData={(r) => setAiRows(r)}
          />

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
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Module</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Record</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Screen ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Elapsed</span>
                    </th>
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
                      <tr key={row.audit_id ?? row.log_id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs text-primary">{row.audit_no ?? `AUD-${row.log_id ?? row.audit_id}`}</td>
                        <td className="px-4 py-3 text-xs">
                          <div className="font-medium">{row.timestamp_local ? new Date(row.timestamp_local).toLocaleString() : row.timestamp_utc ? new Date(row.timestamp_utc).toLocaleString() : row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</div>
                          {row.timestamp_utc && <div className="text-muted-foreground text-[10px]">UTC {new Date(row.timestamp_utc).toISOString().replace('T',' ').slice(0,19)}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div>{row.username ?? "—"}</div>
                          {row.user_id && <div className="text-muted-foreground text-[10px]">ID: {row.user_id}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{row.user_role ?? "—"}</td>
                        <td className="px-4 py-3"><span className="badge-draft">{row.module}</span></td>
                        <td className="px-4 py-3 font-mono text-xs">{row.action_type}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-32">{row.record_table} #{row.record_id}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.screen_id ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-xs font-semibold ${elapsedColor(row.elapsed_ms)}`}>
                            {formatElapsed(row.elapsed_ms)}
                          </span>
                        </td>
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
