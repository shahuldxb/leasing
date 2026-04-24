import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, Trash2 } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { toast } from "sonner";

export default function GLJournals() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState("all");

  // Use invoice register as proxy for GL entries until dedicated journal endpoint is added
  const { data, isLoading, refetch } = trpc.payables.getInvoiceRegister.useQuery({ page: 1, pageSize: 100 });

  const utils = trpc.useUtils();
  const createMut = trpc.glJournal.create.useMutation({
    onSuccess: () => { utils.glJournal.list.invalidate(); toast.success("Journal created"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.glJournal.update.useMutation({
    onSuccess: () => { utils.glJournal.list.invalidate(); toast.success("Journal updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.glJournal.delete.useMutation({
    onSuccess: () => { utils.glJournal.list.invalidate(); toast.success("Journal deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const rows: any[] = Array.isArray(data) ? data : (data as any)?.invoices ?? [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLGLJ0001P001"
          screenType="gl_journals"
          onAIData={(rows) => setAiRows(rows)}
  title="GL Journals"
  subtitle="General ledger journal entries and posting"
/>

        {/* Period Filter */}
        <div className="flex items-end gap-4 bg-card border border-border rounded-xl p-4">
          <div>
            <label className="text-sm font-medium block mb-1">Month</label>
            <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                  <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Year</label>
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2023,2024,2025,2026,2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Journal Ref</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Lease Ref</TableHead>
                <TableHead className="text-xs">GL Account</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs text-right">Debit</TableHead>
                <TableHead className="text-xs text-right">Credit</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading journals...</TableCell></TableRow>}
              {!isLoading && rows.map((j: any, i: number) => (
                <TableRow key={i} className="text-xs hover:bg-muted/30">
                  <TableCell className="font-mono">{j.journal_ref ?? j.jv_ref ?? `JV-${i+1}`}</TableCell>
                  <TableCell>{j.posting_date ? new Date(j.posting_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="font-mono">{j.contract_ref ?? "—"}</TableCell>
                  <TableCell className="font-mono">{j.gl_account ?? j.debit_gl ?? "—"}</TableCell>
                  <TableCell>{j.description ?? j.narration ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-green-400">{j.debit_amount ? Number(j.debit_amount).toLocaleString("en-US",{minimumFractionDigits:2}) : "—"}</TableCell>
                  <TableCell className="text-right font-mono text-red-400">{j.credit_amount ? Number(j.credit_amount).toLocaleString("en-US",{minimumFractionDigits:2}) : "—"}</TableCell>
                  <TableCell><Badge className="text-xs">{j.status ?? "Posted"}</Badge></TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => deleteMut.mutate({ journal_id: j.journal_id ?? j.id })}><Trash2 className="w-4 h-4 text-red-400" /></Button></TableCell>
                </TableRow>
              ))}
              {!isLoading && rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No journal entries for this period</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
