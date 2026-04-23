import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Play, History } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";
const pct = (a: number, b: number) => b ? ((b - a) / Math.abs(a) * 100).toFixed(1) : "0";

export default function ScenarioModelling() {
  const [form, setForm] = useState({
    scenario_name: "",
    ibr_adjustment: 0,
    rent_increase_pct: 0,
    include_renewals: false,
    description: "",
  });
  const [result, setResult] = useState<any>(null);

  const { data: history = [], refetch: refetchHistory } = trpc.scenario.list.useQuery();

  const run = trpc.scenario.run.useMutation({
    onSuccess: (data) => {
      setResult(data);
      refetchHistory();
      toast.success(`Scenario "${data.scenario_name}" saved`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const liabilityDelta = result ? Number(result.scenario_total_liability) - Number(result.current_total_liability) : 0;
  const paymentDelta = result ? Number(result.scenario_annual_payments) - Number(result.current_annual_payments) : 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            Scenario Modelling
          </h1>
          <p className="text-muted-foreground text-sm">Model the impact of IBR changes, rent increases, and renewal assumptions on your IFRS 16 portfolio</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <Card>
            <CardHeader><CardTitle className="text-base">Scenario Parameters</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <Label>Scenario Name</Label>
                <Input value={form.scenario_name} onChange={e => setForm(f => ({ ...f, scenario_name: e.target.value }))} placeholder="e.g. IBR +100bps Stress Test" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>IBR Adjustment (basis points)</Label>
                  <Badge variant={form.ibr_adjustment > 0 ? "destructive" : form.ibr_adjustment < 0 ? "default" : "outline"}>
                    {form.ibr_adjustment > 0 ? "+" : ""}{form.ibr_adjustment} bps
                  </Badge>
                </div>
                <Slider
                  value={[form.ibr_adjustment]}
                  onValueChange={([v]) => setForm(f => ({ ...f, ibr_adjustment: v }))}
                  min={-200} max={300} step={25}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>-200 bps (rate cut)</span>
                  <span>0</span>
                  <span>+300 bps (rate hike)</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Rent Increase (%)</Label>
                  <Badge variant={form.rent_increase_pct > 0 ? "destructive" : form.rent_increase_pct < 0 ? "default" : "outline"}>
                    {form.rent_increase_pct > 0 ? "+" : ""}{form.rent_increase_pct}%
                  </Badge>
                </div>
                <Slider
                  value={[form.rent_increase_pct]}
                  onValueChange={([v]) => setForm(f => ({ ...f, rent_increase_pct: v }))}
                  min={-20} max={30} step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>-20% (reduction)</span>
                  <span>0</span>
                  <span>+30% (increase)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Include Renewal Options</Label>
                  <p className="text-xs text-muted-foreground">Extend lease terms where renewal options exist</p>
                </div>
                <Switch checked={form.include_renewals} onCheckedChange={v => setForm(f => ({ ...f, include_renewals: v }))} />
              </div>

              <div className="space-y-1">
                <Label>Description (optional)</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Notes about this scenario..." />
              </div>

              <Button
                className="w-full"
                onClick={() => run.mutate(form)}
                disabled={run.isPending || !form.scenario_name}
              >
                {run.isPending ? <><Play className="w-4 h-4 mr-2 animate-pulse" />Running...</> : <><Play className="w-4 h-4 mr-2" />Run Scenario</>}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {result ? (
              <>
                <Card className="border-primary/30">
                  <CardHeader><CardTitle className="text-base">Impact Summary — {result.scenario_name}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Current Total Liability", value: fmt(result.current_total_liability), delta: null },
                        { label: "Scenario Total Liability", value: fmt(result.scenario_total_liability), delta: liabilityDelta },
                        { label: "Current Annual Payments", value: fmt(result.current_annual_payments), delta: null },
                        { label: "Scenario Annual Payments", value: fmt(result.scenario_annual_payments), delta: paymentDelta },
                      ].map(m => (
                        <div key={m.label} className="space-y-1">
                          <p className="text-xs text-muted-foreground">{m.label}</p>
                          <p className="text-lg font-bold">{m.value}</p>
                          {m.delta != null && (
                            <div className={`flex items-center gap-1 text-xs font-medium ${m.delta > 0 ? "text-red-500" : m.delta < 0 ? "text-emerald-500" : "text-muted-foreground"}`}>
                              {m.delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {m.delta > 0 ? "+" : ""}{fmt(m.delta)} ({pct(m.delta > 0 ? Number(result.current_total_liability) : Number(result.current_annual_payments), m.delta > 0 ? Number(result.scenario_total_liability) : Number(result.scenario_annual_payments))}%)
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Affected Leases</p>
                      <p className="text-2xl font-bold text-primary">{result.affected_leases}</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Configure parameters and run a scenario to see impact</p>
                </CardContent>
              </Card>
            )}

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Saved Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>IBR Adj</TableHead>
                      <TableHead>Rent %</TableHead>
                      <TableHead>Liability Impact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(history as any[]).map((s: any) => (
                      <TableRow key={s.scenario_id}>
                        <TableCell className="font-medium text-sm">{s.scenario_name}</TableCell>
                        <TableCell className="text-sm font-mono">{s.ibr_adjustment > 0 ? "+" : ""}{s.ibr_adjustment} bps</TableCell>
                        <TableCell className="text-sm font-mono">{s.rent_increase_pct > 0 ? "+" : ""}{s.rent_increase_pct}%</TableCell>
                        <TableCell>
                          {s.scenario_liability && s.current_liability ? (
                            <span className={`text-xs font-medium ${s.scenario_liability > s.current_liability ? "text-red-500" : "text-emerald-500"}`}>
                              {s.scenario_liability > s.current_liability ? "+" : ""}{pct(s.current_liability, s.scenario_liability)}%
                            </span>
                          ) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(history as any[]).length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">No scenarios saved yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
