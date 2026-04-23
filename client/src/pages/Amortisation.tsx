import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Calculator } from "lucide-react";

export default function Amortisation() {
  const [leaseId, setLeaseId] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: leases = [] } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 100 });
  const { data: schedule, isLoading } = trpc.lease.getAmortisationSchedule.useQuery(
    { contractId: selectedId! },
    { enabled: !!selectedId }
  );

  const rows: any[] = Array.isArray((schedule as any)?.schedule) ? (schedule as any).schedule : [];

  const fmtCcy = (v: number) => v?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00";

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Amortisation Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFLSEAMRT0001P001 · IFRS 16 lease liability amortisation</p>
        </div>

        <div className="flex items-end gap-4 bg-card border border-border rounded-xl p-4">
          <div className="flex-1">
            <Label className="text-sm font-medium">Select Lease</Label>
            <Select onValueChange={v => setSelectedId(Number(v))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a lease..." /></SelectTrigger>
              <SelectContent>
                {(leases as any[]).map((l: any) => (
                  <SelectItem key={l.contract_id} value={String(l.contract_id)}>
                    {l.contract_ref} — {l.asset_description} ({l.lessor_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" disabled={!selectedId}>
            <Download className="w-4 h-4 mr-2" /> Export Excel
          </Button>
        </div>

        {isLoading && <div className="text-center py-12 text-muted-foreground">Loading schedule...</div>}

        {rows.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Opening Liability", value: fmtCcy(rows[0]?.opening_balance ?? 0) },
                { label: "Total Payments", value: fmtCcy(rows.reduce((s: number, r: any) => s + (r.payment ?? 0), 0)) },
                { label: "Total Interest", value: fmtCcy(rows.reduce((s: number, r: any) => s + (r.interest_expense ?? 0), 0)) },
                { label: "Closing Liability", value: fmtCcy(rows[rows.length - 1]?.closing_balance ?? 0) },
              ].map(c => (
                <div key={c.label} className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-xl font-bold mt-1">{c.value}</p>
                </div>
              ))}
            </div>

            {/* Schedule Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs text-right">Opening Balance</TableHead>
                      <TableHead className="text-xs text-right">Payment</TableHead>
                      <TableHead className="text-xs text-right">Interest</TableHead>
                      <TableHead className="text-xs text-right">Principal</TableHead>
                      <TableHead className="text-xs text-right">Closing Balance</TableHead>
                      <TableHead className="text-xs text-right">ROU Depreciation</TableHead>
                      <TableHead className="text-xs text-right">ROU NBV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r: any, i: number) => (
                      <TableRow key={i} className="text-xs hover:bg-muted/30">
                        <TableCell>{r.period_no ?? i + 1}</TableCell>
                        <TableCell>{r.payment_date ? new Date(r.payment_date).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-right font-mono">{fmtCcy(r.opening_balance)}</TableCell>
                        <TableCell className="text-right font-mono">{fmtCcy(r.payment)}</TableCell>
                        <TableCell className="text-right font-mono text-amber-500">{fmtCcy(r.interest_expense)}</TableCell>
                        <TableCell className="text-right font-mono text-green-500">{fmtCcy(r.principal_repayment)}</TableCell>
                        <TableCell className="text-right font-mono">{fmtCcy(r.closing_balance)}</TableCell>
                        <TableCell className="text-right font-mono text-blue-400">{fmtCcy(r.rou_depreciation)}</TableCell>
                        <TableCell className="text-right font-mono">{fmtCcy(r.rou_nbv)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {!isLoading && selectedId && rows.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calculator className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No amortisation schedule found for this lease.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
