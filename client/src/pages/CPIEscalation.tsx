import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number | null | undefined) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

export default function CPIEscalation() {
  const [applyDialog, setApplyDialog] = useState<any>(null);
  const [newRent, setNewRent] = useState("");

  const { data: escalations = [], refetch } = trpc.accounting.escalation.escalations.useQuery({});
  const { data: cpiData = [] } = trpc.accounting.escalation.cpiIndex.useQuery({});
  const apply = trpc.accounting.escalation.applyEscalation.useMutation({
    onSuccess: () => { refetch(); setApplyDialog(null); toast.success("Escalation applied and contract updated"); },
  });

  const pending = (escalations as any[]).filter((e: any) => e.status === "PENDING");
  const applied = (escalations as any[]).filter((e: any) => e.status === "APPLIED");

  const statusBadge = (s: string) => {
    if (s === "APPLIED") return <Badge variant="default">Applied</Badge>;
    if (s === "PENDING") return <Badge variant="secondary" className="text-amber-600">Pending</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">CPI & Rent Escalation</h1>
          <p className="text-muted-foreground text-sm">Track and apply rent reviews, CPI adjustments, and fixed escalations — IFRS 16.42</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Pending Reviews</p><p className="text-3xl font-bold text-amber-600">{pending.length}</p></div>
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">Applied This Year</p><p className="text-3xl font-bold text-emerald-600">{applied.length}</p></div>
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">UAE CPI (Latest)</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {(cpiData as any[]).find((c: any) => c.country_code === "UAE")?.cpi_value?.toFixed(1) ?? "—"}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="escalations">
          <TabsList>
            <TabsTrigger value="escalations">Rent Escalations</TabsTrigger>
            <TabsTrigger value="cpi">CPI Index</TabsTrigger>
          </TabsList>

          <TabsContent value="escalations" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Calendar className="w-4 h-4" />Escalation Schedule</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Review Date</TableHead>
                      <TableHead>Base Rent</TableHead>
                      <TableHead>Rate / Amount</TableHead>
                      <TableHead>New Rent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(escalations as any[]).map((e: any) => (
                      <TableRow key={e.escalation_id}>
                        <TableCell className="font-mono text-sm">{e.contract_ref}</TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm">{e.asset_description}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {e.escalation_type === "CPI" ? "CPI" : e.escalation_type === "FIXED_PCT" ? "Fixed %" : e.escalation_type === "FIXED_AMT" ? "Fixed Amt" : "Market"}
                          </Badge>
                        </TableCell>
                        <TableCell>{e.review_date?.slice(0, 10)}</TableCell>
                        <TableCell className="font-mono text-sm text-right">{fmt(e.base_rent)}</TableCell>
                        <TableCell className="text-sm">
                          {e.escalation_rate_pct != null ? `${Number(e.escalation_rate_pct).toFixed(2)}%` : e.escalation_amount != null ? fmt(e.escalation_amount) : "TBD"}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-right font-bold text-emerald-600">{fmt(e.new_rent)}</TableCell>
                        <TableCell>{statusBadge(e.status)}</TableCell>
                        <TableCell className="text-right">
                          {e.status === "PENDING" && (
                            <Button size="sm" variant="outline" onClick={() => { setApplyDialog(e); setNewRent(e.new_rent?.toString() ?? ""); }}>
                              Apply
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(escalations as any[]).length === 0 && (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No escalations found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cpi" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-4 h-4" />CPI Index History</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>CPI Value</TableHead>
                      <TableHead>YoY Change</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(cpiData as any[]).map((c: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell><Badge variant="outline">{c.country_code}</Badge></TableCell>
                        <TableCell>{c.period_month}/{c.period_year}</TableCell>
                        <TableCell className="font-mono font-bold">{Number(c.cpi_value).toFixed(1)}</TableCell>
                        <TableCell className={`font-bold ${Number(c.yoy_change_pct) > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {c.yoy_change_pct != null ? `${Number(c.yoy_change_pct) > 0 ? "+" : ""}${Number(c.yoy_change_pct).toFixed(1)}%` : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.source}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Apply dialog */}
        <Dialog open={!!applyDialog} onOpenChange={() => setApplyDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Apply Escalation — {applyDialog?.contract_ref}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
                <p><span className="text-muted-foreground">Asset:</span> {applyDialog?.asset_description}</p>
                <p><span className="text-muted-foreground">Current Rent:</span> {fmt(applyDialog?.base_rent)}/month</p>
                <p><span className="text-muted-foreground">Escalation:</span> {applyDialog?.escalation_rate_pct != null ? `${Number(applyDialog?.escalation_rate_pct).toFixed(2)}%` : fmt(applyDialog?.escalation_amount)}</p>
              </div>
              <div className="space-y-1">
                <Label>New Monthly Rent (AED)</Label>
                <Input type="number" value={newRent} onChange={e => setNewRent(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApplyDialog(null)}>Cancel</Button>
              <Button onClick={() => apply.mutate({ escalation_id: applyDialog.escalation_id, new_rent: parseFloat(newRent) })} disabled={apply.isPending}>
                {apply.isPending ? "Applying..." : "Apply & Update Contract"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
