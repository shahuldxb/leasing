import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function WorkflowEscalations() {
  const { data, refetch } = trpc.workflow.getQueue.useQuery({ page: 1, pageSize: 100 });
  const tasks: any[] = (Array.isArray(data) ? data : (data as any)?.tasks ?? []).filter((t: any) => t.is_overdue);

  const completeMutation = trpc.workflow.completeTask.useMutation({
    onSuccess: () => { toast.success("Task escalated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-[#e60000]" /> Escalation Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFWKFESCL0006P001 · SLA-breached tasks requiring immediate attention</p>
        </div>

        {tasks.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400"><strong>{tasks.length} task(s)</strong> have breached their SLA and require immediate escalation.</p>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Task</TableHead>
                <TableHead className="text-xs">Process</TableHead>
                <TableHead className="text-xs">Entity</TableHead>
                <TableHead className="text-xs">Assigned To</TableHead>
                <TableHead className="text-xs">Due Date</TableHead>
                <TableHead className="text-xs">Days Overdue</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t: any) => {
                const daysOverdue = t.due_date ? Math.floor((Date.now() - new Date(t.due_date).getTime()) / 86400000) : 0;
                return (
                  <TableRow key={t.task_id} className="text-sm hover:bg-muted/30 bg-red-500/5">
                    <TableCell className="font-medium">{t.task_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.process_type}</TableCell>
                    <TableCell className="font-mono text-xs">{t.entity_ref ?? "—"}</TableCell>
                    <TableCell>{t.assigned_to_name ?? "Unassigned"}</TableCell>
                    <TableCell className="text-red-400 text-xs">{t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell><Badge className="bg-red-500/20 text-red-400 border-red-500/30">{daysOverdue}d</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                          onClick={() => toast.info("Reassign dialog coming soon")}>Reassign</Button>
                        <Button size="sm" className="bg-[#e60000] hover:bg-[#cc0000] text-white h-7 px-2 text-xs"
                          onClick={() => completeMutation.mutate({ taskId: t.task_id, outcome: "Escalated", comment: "Force-escalated by admin" })}>Escalate</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {tasks.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No escalations — all tasks are within SLA</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
