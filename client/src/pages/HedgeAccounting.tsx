import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Shield, Plus, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  DESIGNATED: "bg-green-500/20 text-green-400 border-green-500/30",
  PROSPECTIVE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DEDESIGNATED: "bg-red-500/20 text-red-400 border-red-500/30",
  EXPIRED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const HEDGES = [
  { id: 1, contract_ref: "VF-2024-FX-001", hedged_item: "USD-denominated lease — New York Office", currency: "USD", notional_usd: 2400000, spot_rate: 3.6725, hedge_rate: 3.6500, instrument: "Forward Contract", maturity: "2027-12-31", effectiveness: 98.2, oci_balance: -45200, status: "DESIGNATED" },
  { id: 2, contract_ref: "VF-2024-FX-002", hedged_item: "GBP-denominated lease — London Hub", currency: "GBP", notional_usd: 1850000, spot_rate: 4.6800, hedge_rate: 4.6200, instrument: "Cross-Currency Swap", maturity: "2026-06-30", effectiveness: 96.7, oci_balance: 28700, status: "DESIGNATED" },
  { id: 3, contract_ref: "VF-2023-FX-003", hedged_item: "EUR-denominated lease — Frankfurt DC", currency: "EUR", notional_usd: 980000, spot_rate: 4.0100, hedge_rate: 3.9800, instrument: "Forward Contract", maturity: "2025-12-31", effectiveness: 94.1, oci_balance: -12300, status: "PROSPECTIVE" },
];

const GL_IMPACT = [
  { period: "Q1 2026", hedged_item_change: -125000, hedging_instrument_change: 118500, ineffectiveness: -6500, oci_movement: 118500, p_and_l: -6500 },
  { period: "Q2 2026", hedged_item_change: 87000, hedging_instrument_change: -82000, ineffectiveness: 5000, oci_movement: -82000, p_and_l: 5000 },
  { period: "Q3 2026", hedged_item_change: -45000, hedging_instrument_change: 43200, ineffectiveness: -1800, oci_movement: 43200, p_and_l: -1800 },
];

export default function HedgeAccounting() {
  const [tab, setTab] = useState("hedges");
  const [showDialog, setShowDialog] = useState(false);

  const totalOCI = HEDGES.reduce((s, h) => s + h.oci_balance, 0);
  const avgEffectiveness = HEDGES.reduce((s, h) => s + h.effectiveness, 0) / HEDGES.length;
  const designated = HEDGES.filter(h => h.status === "DESIGNATED").length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hedge Accounting</h1>
            <p className="text-sm text-muted-foreground mt-1">IFRS 9 hedge accounting for FX-denominated leases — effectiveness testing, OCI tracking, and GL impact</p>
          </div>
          <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Designate Hedge
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Designated Hedges", value: designated, icon: Shield, color: "text-green-400" },
            { label: "Avg Effectiveness", value: `${avgEffectiveness.toFixed(1)}%`, icon: BarChart3, color: avgEffectiveness >= 95 ? "text-green-400" : "text-yellow-400" },
            { label: "OCI Balance (AED)", value: totalOCI >= 0 ? `+${totalOCI.toLocaleString()}` : totalOCI.toLocaleString(), icon: totalOCI >= 0 ? TrendingUp : TrendingDown, color: totalOCI >= 0 ? "text-green-400" : "text-red-400" },
            { label: "FX Leases", value: HEDGES.length, icon: DollarSign, color: "text-blue-400" },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/30">
            <TabsTrigger value="hedges">Hedge Register</TabsTrigger>
            <TabsTrigger value="effectiveness">Effectiveness Tests</TabsTrigger>
            <TabsTrigger value="gl-impact">GL Impact</TabsTrigger>
            <TabsTrigger value="disclosure">IFRS 9 Disclosure</TabsTrigger>
          </TabsList>

          <TabsContent value="hedges" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Contract Ref</TableHead>
                      <TableHead className="text-xs">Hedged Item</TableHead>
                      <TableHead className="text-xs">CCY</TableHead>
                      <TableHead className="text-xs text-right">Notional (AED)</TableHead>
                      <TableHead className="text-xs text-right">Spot Rate</TableHead>
                      <TableHead className="text-xs text-right">Hedge Rate</TableHead>
                      <TableHead className="text-xs">Instrument</TableHead>
                      <TableHead className="text-xs">Maturity</TableHead>
                      <TableHead className="text-xs text-right">OCI (AED)</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {HEDGES.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-mono text-xs">{h.contract_ref}</TableCell>
                        <TableCell className="text-xs max-w-[140px] truncate">{h.hedged_item}</TableCell>
                        <TableCell className="font-mono text-xs font-bold">{h.currency}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{(h.notional_usd * h.spot_rate / 1000000).toFixed(2)}M</TableCell>
                        <TableCell className="text-right font-mono text-xs">{h.spot_rate.toFixed(4)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{h.hedge_rate.toFixed(4)}</TableCell>
                        <TableCell className="text-xs">{h.instrument}</TableCell>
                        <TableCell className="text-xs">{h.maturity}</TableCell>
                        <TableCell className={`text-right font-mono text-xs ${h.oci_balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {h.oci_balance >= 0 ? "+" : ""}{h.oci_balance.toLocaleString()}
                        </TableCell>
                        <TableCell><Badge className={`text-xs border ${STATUS_COLORS[h.status]}`}>{h.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="effectiveness" className="mt-4">
            <div className="space-y-4">
              {HEDGES.map(h => (
                <Card key={h.id} className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{h.contract_ref} — {h.hedged_item}</CardTitle>
                      <Badge className={`text-xs border ${h.effectiveness >= 95 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}`}>
                        {h.effectiveness}% Effective
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 rounded bg-muted/20">
                        <p className="text-sm font-bold">{h.effectiveness}%</p>
                        <p className="text-xs text-muted-foreground">Effectiveness Ratio</p>
                        <p className="text-xs text-muted-foreground mt-1">{h.effectiveness >= 80 && h.effectiveness <= 125 ? "✓ Within 80-125% band" : "✗ Outside IFRS 9 band"}</p>
                      </div>
                      <div className="p-3 rounded bg-muted/20">
                        <p className="text-sm font-bold">{h.instrument}</p>
                        <p className="text-xs text-muted-foreground">Hedging Instrument</p>
                        <p className="text-xs text-muted-foreground mt-1">Matures {h.maturity}</p>
                      </div>
                      <div className="p-3 rounded bg-muted/20">
                        <p className={`text-sm font-bold ${h.oci_balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                          AED {h.oci_balance >= 0 ? "+" : ""}{h.oci_balance.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">OCI Reserve</p>
                        <p className="text-xs text-muted-foreground mt-1">Cash flow hedge reserve</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gl-impact" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">Quarterly GL Impact — Hedge Accounting</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Period</TableHead>
                      <TableHead className="text-xs text-right">Hedged Item Change</TableHead>
                      <TableHead className="text-xs text-right">Instrument Change</TableHead>
                      <TableHead className="text-xs text-right">Ineffectiveness (P&L)</TableHead>
                      <TableHead className="text-xs text-right">OCI Movement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {GL_IMPACT.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm font-medium">{row.period}</TableCell>
                        <TableCell className={`text-right font-mono text-sm ${row.hedged_item_change >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {row.hedged_item_change >= 0 ? "+" : ""}{row.hedged_item_change.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${row.hedging_instrument_change >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {row.hedging_instrument_change >= 0 ? "+" : ""}{row.hedging_instrument_change.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${row.p_and_l >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {row.p_and_l >= 0 ? "+" : ""}{row.p_and_l.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${row.oci_movement >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {row.oci_movement >= 0 ? "+" : ""}{row.oci_movement.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disclosure" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-sm">IFRS 9 Hedge Accounting Disclosure Note</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="p-4 rounded-lg bg-muted/20 border border-border">
                  <p className="font-semibold mb-2">Note 32 — Hedge Accounting</p>
                  <p className="text-muted-foreground leading-relaxed">
                    The Group applies cash flow hedge accounting in accordance with IFRS 9 Financial Instruments for certain foreign currency denominated lease obligations. The Group designates forward foreign exchange contracts and cross-currency interest rate swaps as hedging instruments to hedge the variability in cash flows arising from changes in foreign exchange rates on lease payments denominated in USD, GBP, and EUR.
                  </p>
                </div>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-semibold">Currency Pair</th>
                        <th className="text-right p-3 font-semibold">Notional (AED)</th>
                        <th className="text-right p-3 font-semibold">Avg Hedge Rate</th>
                        <th className="text-right p-3 font-semibold">OCI Reserve</th>
                        <th className="text-right p-3 font-semibold">Effectiveness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HEDGES.map((h, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="p-3 font-mono">AED/{h.currency}</td>
                          <td className="p-3 text-right font-mono">{(h.notional_usd * h.spot_rate / 1000000).toFixed(2)}M</td>
                          <td className="p-3 text-right font-mono">{h.hedge_rate.toFixed(4)}</td>
                          <td className={`p-3 text-right font-mono ${h.oci_balance >= 0 ? "text-green-400" : "text-red-400"}`}>{h.oci_balance.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono">{h.effectiveness}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Designate New Hedge Relationship</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Hedged Lease Contract</Label>
                  <Input className="mt-1" placeholder="VF-2024-FX-XXX" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Currency</Label>
                  <Select>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {["USD", "GBP", "EUR", "JPY", "CHF", "SGD"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Hedging Instrument</Label>
                  <Select>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forward">Forward Contract</SelectItem>
                      <SelectItem value="swap">Cross-Currency Swap</SelectItem>
                      <SelectItem value="option">FX Option</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Hedge Rate</Label>
                  <Input type="number" className="mt-1" placeholder="3.6500" step="0.0001" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Notional Amount (FCY)</Label>
                  <Input type="number" className="mt-1" placeholder="0.00" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Maturity Date</Label>
                  <Input type="date" className="mt-1" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => { toast.success("Hedge relationship designated"); setShowDialog(false); }}>
                  Designate Hedge
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
