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
import { ArrowRight, RefreshCw, TrendingDown, TrendingUp, Banknote } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const fmt = (n: unknown) =>
  n != null ? `QAR ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

export default function RollForwardReport() {
  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState("2025-03-31");
  const [submitted, setSubmitted] = useState({ from: "2025-01-01", to: "2025-03-31" });
  const [activeTab, setActiveTab] = useState("rou");

  const { data, isLoading } = trpc.accounting.reporting.rollForwardROU.useQuery({
    fromDate: submitted.from,
    toDate: submitted.to,
  });

  const { data: liabData, isLoading: liabLoading } = trpc.lease.getLiabilityRollForward.useQuery(
    { periodStart: submitted.from, periodEnd: submitted.to },
    { enabled: activeTab === "liability" }
  );

  const rows = Array.isArray(data) ? data : [];
  const liabMovements = (liabData?.movements ?? []) as Record<string, unknown>[];
  const liabSummary = (liabData?.summary ?? {}) as Record<string, unknown>;

  const totals =
    rows.length > 0
      ? {
          opening_rou: rows.reduce((a: number, r: any) => a + Number(r.opening_balance ?? 0), 0),
          closing_rou: rows.reduce((a: number, r: any) => a + Number(r.closing_balance ?? 0), 0),
          total_depreciation: rows.reduce((a: number, r: any) => a + Number(r.depreciation ?? 0), 0),
          opening_liability: 0,
          closing_liability: 0,
          total_interest: 0,
          total_payments: 0,
        }
      : null;

  const run = () => {
    setSubmitted({ from: fromDate, to: toDate });
    toast.success("Roll-forward report generated");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
          screenId="VFLRLFWD0001P001"
          title="Roll Forward Report"
          subtitle="ROU asset and lease liability roll-forward"
          screenType="roll_forward_report"
          onAIData={() => {}}
        />

        <Card>
          <CardContent className="pt-4 flex items-end gap-4">
            <div className="space-y-1">
              <Label>From</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-44"
              />
            </div>
            <ArrowRight className="w-4 h-4 mb-2 text-muted-foreground" />
            <div className="space-y-1">
              <Label>To</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-44"
              />
            </div>
            <Button onClick={run} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Run Report
            </Button>
          </CardContent>
        </Card>

        {totals && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Opening ROU", value: totals.opening_rou, icon: TrendingDown, color: "text-blue-600" },
              { label: "Closing ROU", value: totals.closing_rou, icon: TrendingDown, color: "text-blue-600" },
              { label: "Opening Liability", value: totals.opening_liability, icon: TrendingUp, color: "text-red-600" },
              { label: "Closing Liability", value: totals.closing_liability, icon: TrendingUp, color: "text-red-600" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{fmt(s.value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="rou">ROU Asset Roll-Forward</TabsTrigger>
            <TabsTrigger value="liability">Lease Liability Roll-Forward</TabsTrigger>
          </TabsList>

          <TabsContent value="rou">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Lease-by-Lease ROU Roll-Forward
                  <Badge variant="outline" className="ml-2">
                    {rows.length} contracts
                  </Badge>
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
                    {rows.map((r: any, idx: number) => (
                      <TableRow key={`${r.contract_id}-${idx}`}>
                        <TableCell className="font-mono text-xs">{r.contract_ref}</TableCell>
                        <TableCell className="max-w-[140px] truncate text-sm">{r.asset_description}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{fmt(r.opening_balance)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-red-600">
                          ({fmt(r.depreciation)})
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold">{fmt(r.closing_balance)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">—</TableCell>
                        <TableCell className="text-right font-mono text-xs text-amber-600">—</TableCell>
                        <TableCell className="text-right font-mono text-xs text-red-600">—</TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold">—</TableCell>
                        <TableCell>
                          <Badge variant="default" className="text-xs">
                            {r.asset_type}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {totals && (
                      <TableRow className="font-bold bg-muted/30 border-t-2">
                        <TableCell colSpan={2}>TOTAL</TableCell>
                        <TableCell className="text-right font-mono text-xs">{fmt(totals.opening_rou)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-red-600">
                          ({fmt(totals.total_depreciation)})
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{fmt(totals.closing_rou)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{fmt(totals.opening_liability)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-amber-600">
                          {fmt(totals.total_interest)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-red-600">
                          ({fmt(totals.total_payments)})
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{fmt(totals.closing_liability)}</TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                    {rows.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                          No data for selected period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="liability">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Lease Liability Reconciliation — {submitted.from} to {submitted.to}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {liabLoading && (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading...
                  </div>
                )}
                {!liabLoading && liabMovements.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No liability movement data. Post transactions first.
                  </div>
                )}
                {liabMovements.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lease Ref</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead className="text-right">Opening</TableHead>
                        <TableHead className="text-right">New Leases</TableHead>
                        <TableHead className="text-right">Interest</TableHead>
                        <TableHead className="text-right">Payments</TableHead>
                        <TableHead className="text-right">Remeasurements</TableHead>
                        <TableHead className="text-right">Terminations</TableHead>
                        <TableHead className="text-right">FX Reval</TableHead>
                        <TableHead className="text-right">Closing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {liabMovements.map((m, i) => (
                        <TableRow
                          key={i}
                          className={
                            String(m.row_type ?? "") === "Total"
                              ? "font-bold bg-muted/40 border-t-2"
                              : ""
                          }
                        >
                          <TableCell className="font-mono text-xs">{String(m.contract_ref ?? "—")}</TableCell>
                          <TableCell className="max-w-[120px] truncate text-sm">
                            {String(m.asset_description ?? "—")}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">{fmt(m.opening_balance)}</TableCell>
                          <TableCell className="text-right font-mono text-xs text-green-500">
                            {fmt(m.additions)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-amber-500">
                            {fmt(m.interest_accrued)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-red-500">
                            ({fmt(m.payments_made)})
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">{fmt(m.remeasurements)}</TableCell>
                          <TableCell className="text-right font-mono text-xs text-red-500">
                            {fmt(m.terminations)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">{fmt(m.fx_revaluation)}</TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold">
                            {fmt(m.closing_balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded text-sm">
                    <span className="text-muted-foreground">Total Opening Liability: </span>
                    <span className="font-bold">{fmt(liabSummary.total_opening)}</span>
                  </div>
                  <div className="p-3 bg-muted/30 rounded text-sm">
                    <span className="text-muted-foreground">Total Closing Liability: </span>
                    <span className="font-bold">{fmt(liabSummary.total_closing)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
