import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Download, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

export default function RollForwardReport() {
  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState("2025-03-31");
  const [submitted, setSubmitted] = useState({ from: "2025-01-01", to: "2025-03-31" });

  const { data, isLoading } = trpc.accounting.reporting.rollForwardROU.useQuery({ fromDate: submitted.from, toDate: submitted.to });

  const run = () => {
    setSubmitted({ from: fromDate, to: toDate });
    toast.success("Roll-forward report generated");
  };

  const rows = Array.isArray(data) ? data : [];
  const totals = rows.length > 0 ? {
    opening_rou: rows.reduce((a: number, r: any) => a + Number(r.opening_balance ?? 0), 0),
    closing_rou: rows.reduce((a: number, r: any) => a + Number(r.closing_balance ?? 0), 0),
    total_depreciation: rows.reduce((a: number, r: any) => a + Number(r.depreciation ?? 0), 0),
    opening_liability: 0, closing_liability: 0, total_interest: 0, total_payments: 0,
  } : null;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Roll-Forward Report</h1>
            <p className="text-muted-foreground text-sm">Opening → movements → closing balances for ROU assets and lease liabilities</p>
          </div>
          <Button variant="outline" onClick={() => toast.info("Export to Excel coming soon")}><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>

        {/* Period selector */}
        <Card>
          <CardContent className="pt-4 flex items-end gap-4">
            <div className="space-y-1">
              <Label>From</Label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-44" />
            </div>
            <ArrowRight className="w-4 h-4 mb-2 text-muted-foreground" />
            <div className="space-y-1">
              <Label>To</Label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-44" />
            </div>
            <Button onClick={run} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />Run Report
            </Button>
          </CardContent>
        </Card>

        {/* Totals summary */}
        {totals && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Opening ROU", value: totals.opening_rou, icon: TrendingDown, color: "text-blue-600" },
              { label: "Closing ROU", value: totals.closing_rou, icon: TrendingDown, color: "text-blue-600" },
              { label: "Opening Liability", value: totals.opening_liability, icon: TrendingUp, color: "text-red-600" },
              { label: "Closing Liability", value: totals.closing_liability, icon: TrendingUp, color: "text-red-600" },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{fmt(s.value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Roll-forward table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Lease-by-Lease Roll-Forward
              <Badge variant="outline" className="ml-2">{rows.length} contracts</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Open ROU</TableHead>
                  <TableHead className="text-right">Depreciation</TableHead>
                  <TableHead className="text-right">Close ROU</TableHead>
                  <TableHead className="text-right">Open Liability</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Payments</TableHead>
                  <TableHead className="text-right">Close Liability</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: any) => (
                  <TableRow key={r.contract_id}>
                    <TableCell className="font-mono text-xs">{r.contract_ref}</TableCell>
                    <TableCell className="max-w-[140px] truncate text-sm">{r.asset_description}</TableCell>
                                    <TableCell className="text-right font-mono text-xs">{fmt(r.opening_balance)}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-red-600">({fmt(r.depreciation)})</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">{fmt(r.closing_balance)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">—</TableCell>
                    <TableCell className="text-right font-mono text-xs text-amber-600">—</TableCell>
                    <TableCell className="text-right font-mono text-xs text-red-600">—</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">—</TableCell>
                    <TableCell><Badge variant="default" className="text-xs">{r.asset_type}</Badge></TableCell>
                  </TableRow>
                ))}
                {totals && (
                  <TableRow className="font-bold bg-muted/30 border-t-2">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(totals.opening_rou)}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-red-600">({fmt(totals.total_depreciation)})</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(totals.closing_rou)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(totals.opening_liability)}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-amber-600">{fmt(totals.total_interest)}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-red-600">({fmt(totals.total_payments)})</TableCell>
                    <TableCell className="text-right font-mono text-xs">{fmt(totals.closing_liability)}</TableCell>
                    <TableCell />
                  </TableRow>
                )}
                {rows.length === 0 && !isLoading && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No data for selected period</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
