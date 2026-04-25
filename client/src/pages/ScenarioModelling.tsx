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
import { TrendingUp, TrendingDown, Play, History, FlaskConical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const fmt = (n: any) => n != null ? `QAR ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";
const pct = (a: number, b: number) => b ? ((b - a) / Math.abs(a) * 100).toFixed(1) : "0";

export default function ScenarioModelling() {
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
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

  // When AI fills, pre-populate the form
  const handleAIData = (rows: Record<string, unknown>[]) => {
    const rec = rows[0];
    if (!rec) return;
    setAiRecord(rec);
    setForm({
      scenario_name: String(rec.scenario_name ?? "AI Scenario — IBR +50bps"),
      ibr_adjustment: Number(rec.ibr_adjustment ?? 0.5),
      rent_increase_pct: Number(rec.rent_increase_pct ?? 5),
      include_renewals: Boolean(rec.include_renewals ?? true),
      description: String(rec.description ?? ""),
    });
    toast.success("Gen AI filled the scenario form with realistic values");
  };

  const liabilityDelta = result ? Number(result.scenario_total_liability) - Number(result.current_total_liability) : 0;
  const paymentDelta = result ? Number(result.scenario_annual_payments) - Number(result.current_annual_payments) : 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
          screenId="VFLSCNMOD0001P001"
          title="Scenario Modelling"
          subtitle="What-if analysis for lease portfolio — adjust IBR, rent escalation, and renewal assumptions"
          icon={<FlaskConical className="w-6 h-6 text-[#e60000]" />}
          screenType="scenario_modelling"
          onAIData={handleAIData}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="bg-[#111] border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Play className="w-4 h-4 text-[#e60000]" />
                Scenario Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Scenario Name *</Label>
                <Input
                  placeholder="e.g. IBR +50bps sensitivity"
                  value={form.scenario_name}
                  onChange={e => setForm(f => ({ ...f, scenario_name: e.target.value }))}
                  className="bg-[#1a1a1a] border-border"
                />
              </div>

              <div className="space-y-2">
                <Label>IBR Adjustment: <span className="text-[#e60000] font-mono">{form.ibr_adjustment > 0 ? "+" : ""}{form.ibr_adjustment.toFixed(2)}%</span></Label>
                <Slider
                  min={-2} max={3} step={0.05}
                  value={[form.ibr_adjustment]}
                  onValueChange={([v]) => setForm(f => ({ ...f, ibr_adjustment: v }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>−2.00%</span><span>0%</span><span>+3.00%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rent Increase: <span className="text-[#e60000] font-mono">{form.rent_increase_pct.toFixed(1)}%</span></Label>
                <Slider
                  min={-10} max={20} step={0.5}
                  value={[form.rent_increase_pct]}
                  onValueChange={([v]) => setForm(f => ({ ...f, rent_increase_pct: v }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>−10%</span><span>0%</span><span>+20%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Include Renewal Options</Label>
                <Switch
                  checked={form.include_renewals}
                  onCheckedChange={v => setForm(f => ({ ...f, include_renewals: v }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the scenario assumptions…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="bg-[#1a1a1a] border-border resize-none"
                  rows={3}
                />
              </div>

              <Button
                className="w-full bg-[#e60000] hover:bg-[#cc0000] text-white"
                disabled={!form.scenario_name || run.isPending}
                onClick={() => run.mutate(form)}
              >
                <Play className="w-4 h-4 mr-2" />
                {run.isPending ? "Running…" : "Run Scenario"}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="bg-[#111] border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Scenario Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Current Liability", value: fmt(result.current_total_liability), sub: "Baseline" },
                      { label: "Scenario Liability", value: fmt(result.scenario_total_liability), sub: `${liabilityDelta >= 0 ? "+" : ""}${pct(Number(result.current_total_liability), Number(result.scenario_total_liability))}%` },
                      { label: "Current Payments/yr", value: fmt(result.current_annual_payments), sub: "Baseline" },
                      { label: "Scenario Payments/yr", value: fmt(result.scenario_annual_payments), sub: `${paymentDelta >= 0 ? "+" : ""}${pct(Number(result.current_annual_payments), Number(result.scenario_annual_payments))}%` },
                    ].map(kpi => (
                      <div key={kpi.label} className="bg-[#1a1a1a] rounded-lg p-3 border border-border">
                        <p className="text-xs text-muted-foreground">{kpi.label}</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">{kpi.value}</p>
                        <p className={`text-xs mt-0.5 ${kpi.sub.startsWith("+") ? "text-red-400" : kpi.sub.startsWith("-") ? "text-emerald-400" : "text-muted-foreground"}`}>{kpi.sub}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {liabilityDelta > 0
                      ? <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><TrendingUp className="w-3 h-3 mr-1" />Liability Increases</Badge>
                      : <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><TrendingDown className="w-3 h-3 mr-1" />Liability Decreases</Badge>
                    }
                    <Badge variant="outline" className="text-xs">{result.affected_leases} leases affected</Badge>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
                  <FlaskConical className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Configure parameters and click <strong>Run Scenario</strong> to see results</p>
                  <p className="text-xs text-muted-foreground/60">Or click <strong>Gen AI</strong> above to auto-fill with realistic values</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card className="bg-[#111] border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              Scenario History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(history as any[]).length === 0 ? (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">No scenarios run yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Scenario Name</TableHead>
                    <TableHead>IBR Adj.</TableHead>
                    <TableHead>Rent Inc.</TableHead>
                    <TableHead>Renewals</TableHead>
                    <TableHead>Liability Δ</TableHead>
                    <TableHead>Run At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(history as any[]).map((h: any) => {
                    const delta = Number(h.scenario_total_liability) - Number(h.current_total_liability);
                    return (
                      <TableRow key={h.id} className="border-border">
                        <TableCell className="font-medium">{h.scenario_name}</TableCell>
                        <TableCell className="font-mono text-xs">{Number(h.ibr_adjustment) > 0 ? "+" : ""}{Number(h.ibr_adjustment).toFixed(2)}%</TableCell>
                        <TableCell className="font-mono text-xs">{Number(h.rent_increase_pct) > 0 ? "+" : ""}{Number(h.rent_increase_pct).toFixed(1)}%</TableCell>
                        <TableCell>{h.include_renewals ? <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Yes</Badge> : <Badge variant="outline" className="text-xs">No</Badge>}</TableCell>
                        <TableCell className={`font-mono text-xs ${delta > 0 ? "text-red-400" : "text-emerald-400"}`}>
                          {delta > 0 ? "+" : ""}{fmt(delta)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-400" onClick={() => toast("Remove this scenario?", { action: { label: "Remove", onClick: () => toast.success("Scenario removed") } })}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
