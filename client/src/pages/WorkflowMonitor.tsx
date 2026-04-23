import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-500/20 text-green-400 border-green-500/30",
  Completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Suspended: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function WorkflowMonitor() {
  const { data } = trpc.workflow.getQueue.useQuery({ page: 1, pageSize: 100 });
  const rows: any[] = Array.isArray(data) ? data : (data as any)?.tasks ?? [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6 text-[#e60000]" /> Process Monitor</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFWKFMONI0007P001 · Live view of all running workflow instances</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {["Active","Completed","Suspended","Failed"].map(s => (
            <div key={s} className={`rounded-xl p-4 border ${STATUS_COLORS[s]?.replace("text-","border-").replace("/20","/20").replace("bg-","bg-")}`}>
              <p className="text-xs text-muted-foreground">{s}</p>
              <p className="text-2xl font-bold mt-1">{rows.filter((r: any) => r.status === s).length}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Task ID</TableHead>
                <TableHead className="text-xs">Process Type</TableHead>
                <TableHead className="text-xs">Entity</TableHead>
                <TableHead className="text-xs">Assigned To</TableHead>
                <TableHead className="text-xs">Created</TableHead>
                <TableHead className="text-xs">Due</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t: any) => (
                <TableRow key={t.task_id} className="text-sm hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{t.task_id}</TableCell>
                  <TableCell>{t.process_type ?? t.task_name}</TableCell>
                  <TableCell className="font-mono text-xs">{t.entity_ref ?? "—"}</TableCell>
                  <TableCell>{t.assigned_to_name ?? "Unassigned"}</TableCell>
                  <TableCell className="text-xs">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className={`text-xs ${t.is_overdue ? "text-red-400" : ""}`}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[t.status] ?? "bg-muted text-muted-foreground"}>{t.status}</Badge></TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No active workflow instances</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
