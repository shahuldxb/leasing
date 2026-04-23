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
import { DollarSign, TrendingUp, BookOpen, Plus, Download, BarChart3, FileText } from "lucide-react";
import { toast } from "sonner";

const SAMPLE_RECEIVABLES = [
  { id: 1, contract_ref: "VF-FIN-001", lessee: "Vodafone Retail LLC", asset: "Network Equipment — Dubai Hub", lease_start: "2023-01-01", lease_end: "2027-12-31", gross_receivable: 2450000, unearned_income: 312500, net_receivable: 2137500, current_portion: 487500, non_current: 1650000, status: "ACTIVE" },
  { id: 2, contract_ref: "VF-FIN-002", lessee: "Vodafone Business Solutions", asset: "Data Centre Infrastructure", lease_start: "2022-06-01", lease_end: "2026-05-31", gross_receivable: 1875000, unearned_income: 198750, net_receivable: 1676250, current_portion: 375000, non_current: 1301250, status: "ACTIVE" },
  { id: 3, contract_ref: "VF-FIN-003", lessee: "Vodafone Consumer UAE", asset: "Tower Equipment — Abu Dhabi", lease_start: "2021-03-01", lease_end: "2025-02-28", gross_receivable: 980000, unearned_income: 54200, net_receivable: 925800, current_portion: 245000, non_current: 680800, status: "ACTIVE" },
];

const AMORTISATION = [
  { period: "Jan 2026", opening_receivable: 2137500, payment: 40625, interest_income: 14963, principal: 25662, closing_receivable: 2111838, unearned_income: 297537 },
  { period: "Feb 2026", opening_receivable: 2111838, payment: 40625, interest_income: 14783, principal: 25842, closing_receivable: 2085996, unearned_income: 282754 },
  { period: "Mar 2026", opening_receivable: 2085996, payment: 40625, interest_income: 14602, principal: 26023, closing_receivable: 2059973, unearned_income: 268152 },
  { period: "Apr 2026", opening_receivable: 2059973, payment: 40625, interest_income: 14420, principal: 26205, closing_receivable: 2033768, unearned_income: 253732 },
  { period: "May 2026", opening_receivable: 2033768, payment: 40625, interest_income: 14236, principal: 26389, closing_receivable: 2007379, unearned_income: 239496 },
  { period: "Jun 2026", opening_receivable: 2007379, payment: 40625, interest_income: 14052, principal: 26573, closing_receivable: 1980806, unearned_income: 225444 },
];

const GL_ENTRIES = [
  { date: "01 Jan 2026", description: "Monthly interest income recognition", dr_account: "1600 - Finance Lease Receivable", dr_amount: "14,963", cr_account: "7100 - Interest Income", cr_amount: "14,963" },
  { date: "01 Jan 2026", description: "Lessee payment received", dr_account: "1010 - Bank — ENBD AED", dr_amount: "40,625", cr_account: "1600 - Finance Lease Receivable", cr_amount: "40,625" },
  { date: "01 Jan 2026", description: "Unearned income release", dr_account: "2800 - Unearned Finance Income", dr_amount: "14,963", cr_account: "7100 - Interest Income", cr_amount: "14,963" },
];

export default function LessorFinanceLease() {
  const [tab, setTab] = useState("receivables");
  const [selectedLease, setSelectedLease] = useState<any>(SAMPLE_RECEIVABLES[0]);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const totalGross = SAMPLE_RECEIVABLES.reduce((s, r) => s + r.gross_receivable, 0);
  const totalNet = SAMPLE_RECEIVABLES.reduce((s, r) => s + r.net_receivable, 0);
  const totalUnearned = SAMPLE_RECEIVABLES.reduce((s, r) => s + r.unearned_income, 0);
  const totalCurrent = SAMPLE_RECEIVABLES.reduce((s, r) => s + r.current_portion, 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lessor Finance Lease Receivables</h1>
            <p className="text-sm text-muted-foreground mt-1">IFRS 16 / IAS 17 lessor-side accounting — finance lease receivable and unearned income tracking</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.info("Excel export initiated")}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => setShowNewDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Finance Lease
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Gross Receivable", value: `AED ${(totalGross / 1000000).toFixed(2)}M`, icon: DollarSign, color: "text-blue-400", sub: "Undiscounted future payments" },
            { label: "Net Receivable", value: `AED ${(totalNet / 1000000).toFixed(2)}M`, icon: TrendingUp, color: "text-green-400", sub: "Present value of receivables" },
            { label: "Unearned Income", value: `AED ${(totalUnearned / 1000).toFixed(0)}K`, icon: BookOpen, color: "text-yellow-400", sub: "Deferred interest income" },
            { label: "Current Portion", value: `AED ${(totalCurrent / 1000).toFixed(0)}K`, icon: BarChart3, color: "text-red-400", sub: "Due within 12 months" },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <kpi.icon className={`w-8 h-8 ${kpi.color} mt-0.5`} />
                  <div>
                    <p className="text-xl font-bold">{kpi.value}</p>
                    <p className="text-xs font-medium text-foreground">{kpi.label}</p>
                    <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/30">
            <TabsTrigger value="receivables">Receivable Register</TabsTrigger>
            <TabsTrigger value="amortisation">Amortisation Schedule</TabsTrigger>
            <TabsTrigger value="gl-entries">GL Entries</TabsTrigger>
            <TabsTrigger value="disclosure">Disclosure Note</TabsTrigger>
          </TabsList>

          <TabsContent value="receivables" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Contract Ref</TableHead>
                      <TableHead className="text-xs">Lessee</TableHead>
                      <TableHead className="text-xs">Asset</TableHead>
                      <TableHead className="text-xs">Lease End</TableHead>
                      <TableHead className="text-xs text-right">Gross Receivable</TableHead>
                      <TableHead className="text-xs text-right">Unearned Income</TableHead>
                      <TableHead className="text-xs text-right">Net Receivable</TableHead>
                      <TableHead className="text-xs text-right">Current</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_RECEIVABLES.map((r) => (
                      <TableRow key={r.id} className="cursor-pointer hover:bg-muted/30"
                        onClick={() => setSelectedLease(r)}>
                        <TableCell className="font-mono text-sm">{r.contract_ref}</TableCell>
                        <TableCell className="text-sm">{r.lessee}</TableCell>
                        <TableCell className="text-sm max-w-[160px] truncate">{r.asset}</TableCell>
                        <TableCell className="text-sm">{new Date(r.lease_end).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{r.gross_receivable.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-yellow-400">({r.unearned_income.toLocaleString()})</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{r.net_receivable.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-blue-400">{r.current_portion.toLocaleString()}</TableCell>
                        <TableCell><Badge className="text-xs bg-green-500/20 text-green-400 border border-green-500/30">{r.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="amortisation" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">Amortisation Schedule — {selectedLease?.contract_ref}</CardTitle>
                <p className="text-xs text-muted-foreground">Effective interest method — interest income recognition and principal reduction</p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Period</TableHead>
                      <TableHead className="text-xs text-right">Opening Receivable</TableHead>
                      <TableHead className="text-xs text-right">Payment Received</TableHead>
                      <TableHead className="text-xs text-right">Interest Income</TableHead>
                      <TableHead className="text-xs text-right">Principal</TableHead>
                      <TableHead className="text-xs text-right">Closing Receivable</TableHead>
                      <TableHead className="text-xs text-right">Unearned Income</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {AMORTISATION.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm font-medium">{row.period}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{row.opening_receivable.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-green-400">{row.payment.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-blue-400">{row.interest_income.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{row.principal.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{row.closing_receivable.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-yellow-400">({row.unearned_income.toLocaleString()})</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gl-entries" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">GL Journal Entries — Finance Lease Receivable</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Debit Account</TableHead>
                      <TableHead className="text-xs text-right">Dr Amount</TableHead>
                      <TableHead className="text-xs">Credit Account</TableHead>
                      <TableHead className="text-xs text-right">Cr Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {GL_ENTRIES.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{e.date}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.description}</TableCell>
                        <TableCell className="text-sm font-mono">{e.dr_account}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-green-400">{e.dr_amount}</TableCell>
                        <TableCell className="text-sm font-mono">{e.cr_account}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-red-400">{e.cr_amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disclosure" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm"><FileText className="w-4 h-4 text-red-400" /> IFRS 16 Lessor Disclosure Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="p-4 rounded-lg bg-muted/20 border border-border">
                  <p className="font-semibold mb-2">Note 24 — Finance Leases (Lessor)</p>
                  <p className="text-muted-foreground leading-relaxed">
                    The Group acts as a lessor in respect of certain network equipment and infrastructure assets leased to subsidiaries and third parties under finance lease arrangements. Under IFRS 16, the Group recognises a finance lease receivable at the commencement date, measured at the net investment in the lease.
                  </p>
                </div>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-semibold">Maturity Band</th>
                        <th className="text-right p-3 font-semibold">Gross Receivable (AED)</th>
                        <th className="text-right p-3 font-semibold">Unearned Income (AED)</th>
                        <th className="text-right p-3 font-semibold">Net Receivable (AED)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { band: "Within 1 year", gross: "1,107,500", unearned: "(89,450)", net: "1,018,050" },
                        { band: "1–2 years", gross: "1,107,500", unearned: "(74,625)", net: "1,032,875" },
                        { band: "2–5 years", gross: "2,215,000", unearned: "(112,500)", net: "2,102,500" },
                        { band: "Over 5 years", gross: "875,000", unearned: "(288,875)", net: "586,125" },
                        { band: "Total", gross: "5,305,000", unearned: "(565,450)", net: "4,739,550" },
                      ].map((row, i) => (
                        <tr key={i} className={`border-t border-border ${i === 4 ? "bg-muted/30 font-semibold" : ""}`}>
                          <td className="p-3">{row.band}</td>
                          <td className="p-3 text-right font-mono">{row.gross}</td>
                          <td className="p-3 text-right font-mono text-yellow-400">{row.unearned}</td>
                          <td className="p-3 text-right font-mono">{row.net}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Finance Lease Dialog */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Finance Lease (Lessor)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Contract Reference</Label>
                  <Input className="mt-1" placeholder="VF-FIN-XXX" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Lessee</Label>
                  <Input className="mt-1" placeholder="Lessee entity name" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Asset Description</Label>
                  <Input className="mt-1" placeholder="Network equipment, infrastructure..." />
                </div>
                <div>
                  <Label className="text-xs font-medium">Implicit Interest Rate (%)</Label>
                  <Input type="number" className="mt-1" placeholder="5.25" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Lease Start Date</Label>
                  <Input type="date" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Lease End Date</Label>
                  <Input type="date" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Annual Payment (AED)</Label>
                  <Input type="number" className="mt-1" placeholder="0.00" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Payment Frequency</Label>
                  <Select>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowNewDialog(false)} className="flex-1">Cancel</Button>
                <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white"
                  onClick={() => { toast.success("Finance lease receivable created"); setShowNewDialog(false); }}>
                  Create Finance Lease
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
