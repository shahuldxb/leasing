/**
 * VodaLease Enterprise — Maker/Checker Workflow Queue
 * Screen ID: VFWKFACTNS0003P001
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, RefreshCw, Clock, User, FileText } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function WorkflowQueue() {
  const [module, setModule]   = useState("all");
  const [outcome, setOutcome] = useState("Pending");
  const [page, setPage]       = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [comment, setComment]   = useState("");
  const [dialogAction, setDialogAction] = useState<"Approve" | "Reject" | null>(null);

  const { data, isLoading, refetch } = trpc.workflow.getQueue.useQuery({
    module: module !== "all" ? module : undefined,
    outcome,
    page,
    pageSize: 50,
  });

  const completeTask = trpc.workflow.completeTask.useMutation({
    onSuccess: () => {
      toast.success(`Task ${dialogAction?.toLowerCase()}d successfully`);
      setSelected(null);
      setComment("");
      setDialogAction(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const rows       = data?.rows ?? [];
  const totalCount = data?.totalCount ?? 0;

  const openDialog = (row: any, action: "Approve" | "Reject") => {
    setSelected(row);
    setDialogAction(action);
    setComment("");
  };

  const submitDecision = () => {
    if (!selected || !dialogAction) return;
    completeTask.mutate({
      taskId: selected.task_id,
      outcome: dialogAction === "Approve" ? "Approved" : "Rejected",
      comment: comment || undefined,
      screenId: "VFWKFACTNS0003P001",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <div>
            <ScreenHeader
  screenId="VFLWFLQUE0001P001"
  title="Maker/Checker Queue"
  subtitle="Pending approvals and maker/checker workflow"
/>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex gap-3">
              <Select value={module} onValueChange={v => { setModule(v); setPage(1); }}>
                <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Module" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="Lease">Lease</SelectItem>
                  <SelectItem value="Payables">Payables</SelectItem>
                  <SelectItem value="Payment">Payment</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                </SelectContent>
              </Select>
              <Select value={outcome} onValueChange={v => { setOutcome(v); setPage(1); }}>
                <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Task Ref</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Module</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Maker</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">SLA</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        No pending tasks in the queue.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: any) => (
                      <tr key={row.task_id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-primary">{row.task_ref ?? `TASK-${row.task_id}`}</td>
                        <td className="px-4 py-3"><span className="badge-draft">{row.module}</span></td>
                        <td className="px-4 py-3 truncate max-w-48">{row.description}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{row.maker_name ?? "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3">
                          {row.sla_due ? (
                            <div className="flex items-center gap-1">
                              <Clock className={`h-3.5 w-3.5 ${new Date(row.sla_due) < new Date() ? "text-red-500" : "text-amber-500"}`} />
                              <span className={`text-xs ${new Date(row.sla_due) < new Date() ? "text-red-500" : "text-muted-foreground"}`}>
                                {new Date(row.sla_due).toLocaleDateString()}
                              </span>
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={row.outcome === "Pending" ? "badge-pending" : row.outcome === "Approved" ? "badge-active" : "badge-expired"}>
                            {row.outcome}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {row.outcome === "Pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => openDialog(row, "Approve")}>
                                <CheckCircle2 className="h-3 w-3" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => openDialog(row, "Reject")}>
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval/Rejection Dialog */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setDialogAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogAction === "Approve"
                ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                : <XCircle className="h-5 w-5 text-red-500" />}
              {dialogAction} Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Module</span>
                <span className="font-medium">{selected?.module}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Description</span>
                <span className="font-medium truncate max-w-48">{selected?.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maker</span>
                <span className="font-medium">{selected?.maker_name ?? "—"}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Comment {dialogAction === "Reject" && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                placeholder={dialogAction === "Approve" ? "Optional comment..." : "Reason for rejection (required)"}
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setDialogAction(null); }}>Cancel</Button>
            <Button
              onClick={submitDecision}
              disabled={completeTask.isPending || (dialogAction === "Reject" && !comment.trim())}
              className={dialogAction === "Approve" ? "" : "bg-red-600 hover:bg-red-700"}
            >
              {completeTask.isPending ? "Processing..." : `Confirm ${dialogAction}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
