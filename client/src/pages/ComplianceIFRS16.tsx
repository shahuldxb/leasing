import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

export default function ComplianceIFRS16() {
  const { data: kpis } = trpc.mis.getDashboardKPIs.useQuery();
  const rows: any[] = kpis ? [kpis] : [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-[#e60000]" /> IFRS 16 Disclosures</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFCMPIFRS0001P001 · IFRS 16 note disclosures for financial statement reporting</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total ROU Assets (NBV)", key: "total_rou_nbv" },
            { label: "Total Lease Liability", key: "total_lease_liability" },
            { label: "Interest Expense YTD", key: "interest_expense_ytd" },
          ].map(k => (
            <div key={k.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-xl font-bold text-[#e60000] mt-1">
                ${Number((rows[0] as any)?.[k.key] ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">Maturity Analysis — Undiscounted Future Payments</h3>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Maturity Band</TableHead>
                <TableHead className="text-xs text-right">Amount ($)</TableHead>
                <TableHead className="text-xs">Classification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { band: "Less than 1 year", key: "lt_1yr", cls: "Current" },
                { band: "1 to 2 years", key: "yr_1_2", cls: "Non-Current" },
                { band: "2 to 5 years", key: "yr_2_5", cls: "Non-Current" },
                { band: "More than 5 years", key: "gt_5yr", cls: "Non-Current" },
              ].map(b => (
                <TableRow key={b.band} className="text-sm hover:bg-muted/30">
                  <TableCell className="font-medium">{b.band}</TableCell>
                  <TableCell className="text-right font-mono">${Number((rows[0] as any)?.[b.key] ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell><Badge variant="outline">{b.cls}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-3">Depreciation & Interest Expense</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Depreciation Expense YTD", key: "depreciation_ytd" },
              { label: "Interest Expense YTD", key: "interest_expense_ytd" },
              { label: "Short-term Lease Expense", key: "short_term_expense" },
              { label: "Variable Lease Expense", key: "variable_expense" },
            ].map(k => (
              <div key={k.label} className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold mt-0.5">${Number((rows[0] as any)?.[k.key] ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
