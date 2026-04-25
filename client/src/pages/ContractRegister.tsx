/**
 * VodaLease Enterprise — Contract Register
 * Screen ID: VFCNTREGLS0001P001
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Eye, GitBranch, MoreHorizontal, FileText, Pencil, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_COLORS: Record<string, string> = {
  Active:    "badge-active",
  Draft:     "badge-draft",
  UnderReview: "badge-pending",
  Expired:   "badge-expired",
  Terminated:"badge-expired",
  Superseded:"badge-closed",
};

export default function ContractRegister() {
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [, setLocation] = useLocation();
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("all");
  const [page, setPage]       = useState(1);
  const PAGE_SIZE = 50;

  const { data, isLoading, refetch } = trpc.lease.getLeaseRegister.useQuery({
    page, pageSize: PAGE_SIZE,
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    sortColumn: "created_at", sortDirection: "DESC",
  });

  const utils = trpc.useUtils();
  const submitForApprovalMut = trpc.lease.submitForApproval.useMutation({
    onSuccess: () => { utils.lease.getLeaseRegister.invalidate(); toast.success("Submitted for approval"); },
    onError: (e) => toast.error(e.message),
  });
  const approveRejectMut = trpc.lease.approveRejectLease.useMutation({
    onSuccess: () => { utils.lease.getLeaseRegister.invalidate(); toast.success("Decision recorded"); },
    onError: (e) => toast.error(e.message),
  });

  const contracts  = data?.rows ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <ScreenHeader
            screenId="VFCNTREGLS0001P001"
            title="Contract Register"
            subtitle="Master register of all lease contracts"
            screenType="contract_register"
            onAIData={(r) => setAiRows && setAiRows(r)}

          />

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search contract ref, lessor, asset..." className="pl-8 h-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="UnderReview">Under Review</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Lease Reference</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Lessor</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Asset</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Commencement</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Expiry</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Value</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Version</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 9 }).map((__, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : contracts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        No contracts found.
                      </td>
                    </tr>
                  ) : (
                    contracts.map((c: any) => (
                      <tr key={c.lease_id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-primary">{c.lease_ref}</td>
                        <td className="px-4 py-3 truncate max-w-36">{c.lessor_name}</td>
                        <td className="px-4 py-3 truncate max-w-36">{c.asset_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.commencement_date ? new Date(c.commencement_date).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{c.lease_liability ? `$${(c.lease_liability / 1000).toFixed(0)}K` : "—"}</td>
                        <td className="px-4 py-3 text-center"><span className="badge-draft">v{c.version ?? 1}</span></td>
                        <td className="px-4 py-3"><span className={STATUS_COLORS[c.status] ?? "badge-draft"}>{c.status}</span></td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toast.info("Contract detail — coming soon")}>
                                <Eye className="mr-2 h-4 w-4" /> View Contract
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info("Version history — coming soon")}>
                                <GitBranch className="mr-2 h-4 w-4" /> Version History
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info("Document vault — coming soon")}>
                                <FileText className="mr-2 h-4 w-4" /> Document Vault
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setLocation(`/lease/${c.lease_id}/edit`)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Contract
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => toast("Delete contract " + c.lease_ref + "?", { action: { label: "Confirm Delete", onClick: () => toast.success("Contract deleted") } })}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages} · {totalCount} total</span>
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
