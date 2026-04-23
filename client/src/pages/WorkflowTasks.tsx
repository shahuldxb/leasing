import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function WorkflowTasks() {
  const { data, refetch } = trpc.workflow.getMyTasks.useQuery({ status: 'Pending' });
  const tasks: any[] = Array.isArray(data) ? data : (data as any)?.tasks ?? [];

  const completeMutation = trpc.workflow.completeTask.useMutation({
    onSuccess: () => { toast.success("Task completed"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const priorityColor = (p: string) => {
    if (p === "Critical") return "bg-red-500/20 text-red-400 border-red-500/30";
    if (p === "High") return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="w-6 h-6 text-[#e60000]" /> My Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFWKFMYTSK0001P001 · Pending tasks assigned to you for action</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{tasks.filter((t: any) => t.status === "Pending").length}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{tasks.filter((t: any) => t.is_overdue).length}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Completed Today</p>
            <p className="text-2xl font-bold text-green-400 mt-1">0</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Task</TableHead>
                <TableHead className="text-xs">Process</TableHead>
                <TableHead className="text-xs">Entity</TableHead>
                <TableHead className="text-xs">Due</TableHead>
                <TableHead className="text-xs">Priority</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t: any) => (
                <TableRow key={t.task_id} className="text-sm hover:bg-muted/30">
                  <TableCell className="font-medium">{t.task_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.process_type}</TableCell>
                  <TableCell className="font-mono text-xs">{t.entity_ref ?? "—"}</TableCell>
                  <TableCell className={t.is_overdue ? "text-red-400 text-xs" : "text-xs"}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell><Badge className={priorityColor(t.priority ?? "Normal")}>{t.priority ?? "Normal"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs"
                        onClick={() => completeMutation.mutate({ taskId: t.task_id, outcome: "Approved", comment: "Approved via My Tasks" })}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-400 border-red-500/30 h-7 px-2 text-xs"
                        onClick={() => completeMutation.mutate({ taskId: t.task_id, outcome: "Rejected", comment: "Rejected via My Tasks" })}>
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No tasks assigned to you</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
