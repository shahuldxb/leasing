import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

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
      <ScreenHeader
  screenId="VFLWFLTSK0001P001"
  title="My Tasks"
  subtitle="Personal task inbox for workflow approvals"
/>
    </DashboardLayout>
  );
}
