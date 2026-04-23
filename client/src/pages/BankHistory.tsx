import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

export default function BankHistory() {
  const { data } = trpc.bankRecon.getHistory.useQuery({ pageNumber: 1, pageSize: 50 });
  const rows: any[] = Array.isArray(data) ? data : (data as any)?.sessions ?? [];
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><History className="w-6 h-6 text-[#e60000]" /> Reconciliation History</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFBNKHIST0001P001 · Past reconciliation sessions and results</p>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Session Ref</TableHead>
                <TableHead className="text-xs">Bank Account</TableHead>
                <TableHead className="text-xs">Period</TableHead>
                <TableHead className="text-xs text-right">Matched</TableHead>
                <TableHead className="text-xs text-right">Unmatched</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Closed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s: any, i: number) => (
                <TableRow key={i} className="text-sm hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{s.session_ref ?? `RECON-${i+1}`}</TableCell>
                  <TableCell>{s.bank_name ?? "—"}</TableCell>
                  <TableCell>{s.period_from ? `${new Date(s.period_from).toLocaleDateString()} – ${new Date(s.period_to).toLocaleDateString()}` : "—"}</TableCell>
                  <TableCell className="text-right text-green-400">{s.matched_count ?? 0}</TableCell>
                  <TableCell className="text-right text-amber-400">{s.unmatched_count ?? 0}</TableCell>
                  <TableCell><Badge className={s.status === "Closed" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}>{s.status ?? "Closed"}</Badge></TableCell>
                  <TableCell>{s.closed_by ?? "System"}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No reconciliation history</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
