import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ScreenHeader from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calculator, CheckCircle2, AlertTriangle, BookOpen, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function RemeasurementEngine() {
  const [mode, setMode] = useState<"list" | "form" | "preview">("list");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterContractId, setFilterContractId] = useState("");
  const [form, setForm] = useState({
    contractId: "",
    triggerType: "Modification",
    eventDate: new Date().toISOString().slice(0, 10),
    triggerDescription: "",
    newIbr: "",
    newRemainingTerm: "",
    newMonthlyPayment: "",
  });
  const [preview, setPreview] = useState<any>(null);
  const [calcExplanation, setCalcExplanation] = useState<string | null>(null);

  const { data: events = [], refetch } = trpc.accounting.remeasurement.list.useQuery({ status: filterStatus || undefined });
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({});
  const contracts = useMemo(() => (contractsData as any)?.rows ?? [], [contractsData]);

  // Fetch full contract details when a contract is selected (form mode)
  const { data: fullContractDetails } = trpc.lease.getLeaseById.useQuery(
    { contractId: Number(form.contractId) },
    { enabled: !!form.contractId }
  );
  const selectedContract = fullContractDetails as any;

  // Fetch full contract details for the list filter dropdown
  const { data: listContractDetails } = trpc.lease.getLeaseById.useQuery(
    { contractId: Number(filterContractId) },
    { enabled: !!filterContractId }
  );
  const listSelectedContract = listContractDetails as any;

  const calculateMut = trpc.accounting.remeasurement.calculate.useMutation({
    onSuccess: (data) => {
      setPreview(data);
      setMode("preview");
    },
    onError: (e: any) => toast.error(`Calculation failed: ${e.message}`),
  });

  const executeMut = trpc.accounting.remeasurement.execute.useMutation({
    onSuccess: (data: any) => {
      refetch();
      setMode("list");
      setPreview(null);
      toast.success(`Remeasurement posted — JV ${data.jv_number ?? ''} created. Old JVs preserved.`);
    },
    onError: (e: any) => toast.error(`Execution failed: ${e.message}`),
  });

  const sendToJvMut = trpc.journalVoucher.generateRemeasurement.useMutation({
    onSuccess: (r: any) => { toast.success(`JV ${r?.jv_number} created`); },
    onError: (e: any) => toast.error(`JV generation failed: ${e.message}`),
  });

  const handleCalculate = () => {
    if (!form.contractId) { toast.error("Select a contract"); return; }
    calculateMut.mutate({
      contract_id: Number(form.contractId),
      event_type: form.triggerType,
      event_date: form.eventDate,
      trigger_description: form.triggerDescription,
      new_ibr: form.newIbr ? Number(form.newIbr) : null,
      new_remaining_term: form.newRemainingTerm ? Number(form.newRemainingTerm) : null,
      new_monthly_payment: form.newMonthlyPayment ? Number(form.newMonthlyPayment) : null,
    });
  };

  const handleConfirmPost = () => {
    executeMut.mutate({
      contract_id: Number(form.contractId),
      event_type: form.triggerType,
      event_date: form.eventDate,
      trigger_description: form.triggerDescription,
      new_ibr: form.newIbr ? Number(form.newIbr) : null,
      new_remaining_term: form.newRemainingTerm ? Number(form.newRemainingTerm) : null,
      new_monthly_payment: form.newMonthlyPayment ? Number(form.newMonthlyPayment) : null,
    });
  };

  const fmt = (v: any) => v != null ? Number(v).toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
  const fmtPct = (v: any) => v != null ? `${(Number(v) * 100).toFixed(3)}%` : "—";

  // ═══ PREVIEW MODE ═══════════════════════════════════════════════════════════
  if (mode === "preview" && preview?.summary) {
    const s = preview.summary;
    const schedule = preview.schedule ?? [];
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setMode("form")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back to Form
            </Button>
            <div>
              <h2 className="font-semibold text-lg">Remeasurement Preview</h2>
              <p className="text-sm text-muted-foreground">Review before confirming — old JVs will NOT be touched</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => setMode("form")}>Edit Parameters</Button>
              <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2" onClick={handleConfirmPost} disabled={executeMut.isPending}>
                <CheckCircle2 className="w-4 h-4" />{executeMut.isPending ? "Posting..." : "Confirm & Post"}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <Tabs defaultValue="summary" className="space-y-4">
              <TabsList>
                <TabsTrigger value="summary">Adjustment Summary</TabsTrigger>
                <TabsTrigger value="schedule">New Amortisation Schedule ({schedule.length} months)</TabsTrigger>
                <TabsTrigger value="jv">JV Preview</TabsTrigger>
              </TabsList>

              {/* ─── Summary Tab ─────────────────────────────────────────── */}
              <TabsContent value="summary">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Old vs New comparison */}
                  <div className="rounded-xl border border-border p-5 space-y-4">
                    <h3 className="font-semibold text-base flex items-center gap-2"><Info className="w-4 h-4 text-blue-400" />Comparison: Old vs New</h3>
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border"><th className="text-left py-2">Parameter</th><th className="text-right py-2">Old</th><th className="text-right py-2">New</th><th className="text-right py-2">Change</th></tr></thead>
                      <tbody>
                        <tr className="border-b border-border/50"><td className="py-2">Lease Liability</td><td className="text-right">{fmt(s.old_liability)}</td><td className="text-right font-semibold">{fmt(s.new_liability)}</td><td className="text-right">{fmt(s.liability_adjustment)}</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2">ROU Asset</td><td className="text-right">{fmt(s.old_rou_asset)}</td><td className="text-right font-semibold">{fmt(s.new_rou_asset)}</td><td className="text-right">{fmt(s.rou_adjustment)}</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2">IBR</td><td className="text-right">{fmtPct(s.old_ibr)}</td><td className="text-right font-semibold">{fmtPct(s.new_ibr)}</td><td className="text-right">—</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2">Monthly Payment</td><td className="text-right">{fmt(s.old_monthly_payment)}</td><td className="text-right font-semibold">{fmt(s.new_monthly_payment)}</td><td className="text-right">—</td></tr>
                        <tr><td className="py-2">Remaining Term</td><td className="text-right">{s.old_remaining_term} mo</td><td className="text-right font-semibold">{s.new_remaining_term} mo</td><td className="text-right">—</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Key Facts */}
                  <div className="rounded-xl border border-border p-5 space-y-4">
                    <h3 className="font-semibold text-base">Key Facts</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Contract</span><span className="font-mono">{s.contract_ref}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Event Type</span><Badge variant="outline">{s.event_type}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Effective Date</span><span>{new Date(s.event_date).toLocaleDateString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Months Already Posted</span><span>{s.months_already_posted}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><span>{s.currency}</span></div>
                      {Number(s.pnl_adjustment) !== 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-amber-300 text-xs">ROU Asset reduced to zero. Excess {fmt(Math.abs(s.pnl_adjustment))} {s.currency} recognised in P&L per IFRS 16.46(b).</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground italic">{s.jv_description}</p>
                    </div>
                  </div>
                </div>

                {/* Calculation Explanation */}
                <div className="mt-6 rounded-xl border border-border p-5">
                  <h3 className="font-semibold text-base mb-3">Calculation Explanation</h3>
                  <div className="bg-black/30 rounded-lg p-4 font-mono text-xs text-green-300 whitespace-pre-wrap leading-relaxed">
{`IFRS 16 Remeasurement — ${s.event_type}
Contract: ${s.contract_ref} | Date: ${new Date(s.event_date).toLocaleDateString()} | Currency: ${s.currency}

═══ STEP 1: Determine Current Outstanding Liability ═══
Current liability (from last posted schedule): ${fmt(s.old_liability)} ${s.currency}
Current ROU NBV: ${fmt(s.old_rou_asset)} ${s.currency}
Months already posted: ${s.months_already_posted}

═══ STEP 2: Calculate New Lease Liability ═══
Formula: PV = PMT × [1 - (1 + r)^(-n)] / r
Where:
  PMT = ${fmt(s.new_monthly_payment)} (revised monthly payment)
  r   = ${fmtPct(s.new_ibr)} / 12 = ${(Number(s.new_ibr) / 12).toFixed(8)} (monthly rate)
  n   = ${s.new_remaining_term} months (revised remaining term)

New Lease Liability = ${fmt(s.new_liability)} ${s.currency}

═══ STEP 3: Calculate Adjustment ═══
Liability Adjustment = New Liability - Old Liability
                     = ${fmt(s.new_liability)} - ${fmt(s.old_liability)}
                     = ${fmt(s.liability_adjustment)} ${s.currency}

ROU Adjustment = ${fmt(s.rou_adjustment)} ${s.currency}${Number(s.pnl_adjustment) !== 0 ? `\nP&L Adjustment = ${fmt(s.pnl_adjustment)} ${s.currency} (ROU reduced to zero, excess to P&L)` : ''}

═══ STEP 4: Prospective Treatment (IFRS 16.45) ═══
• Old JVs: PRESERVED — never reversed or modified
• Adjustment JV: Single entry on ${new Date(s.event_date).toLocaleDateString()}
• Future Schedule: Regenerated for ${s.new_remaining_term} months from event date
• Depreciation: New ROU (${fmt(s.new_rou_asset)}) / ${s.new_remaining_term} months = ${fmt(Number(s.new_rou_asset) / s.new_remaining_term)} per month`}
                  </div>
                </div>
              </TabsContent>

              {/* ─── Schedule Tab ────────────────────────────────────────── */}
              <TabsContent value="schedule">
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead className="text-right">Opening Liability</TableHead>
                          <TableHead className="text-right">Interest</TableHead>
                          <TableHead className="text-right">Payment</TableHead>
                          <TableHead className="text-right">Principal</TableHead>
                          <TableHead className="text-right">Closing Liability</TableHead>
                          <TableHead className="text-right">ROU NBV</TableHead>
                          <TableHead className="text-right">Depreciation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedule.map((row: any) => (
                          <TableRow key={row.month_num}>
                            <TableCell className="text-muted-foreground">{row.month_num}</TableCell>
                            <TableCell>{new Date(row.period_date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmt(row.opening_liability)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmt(row.interest_expense)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmt(row.payment)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmt(row.principal)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmt(row.closing_liability)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmt(row.rou_nbv)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmt(row.depreciation)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              {/* ─── JV Preview Tab ─────────────────────────────────────── */}
              <TabsContent value="jv">
                <div className="rounded-xl border border-border p-5 space-y-4">
                  <h3 className="font-semibold">Adjustment Journal Voucher</h3>
                  <p className="text-sm text-muted-foreground">This single JV will be posted on {new Date(s.event_date).toLocaleDateString()}. Existing JVs remain untouched.</p>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Account</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {Number(s.liability_adjustment) > 0 ? (
                        <>
                          <TableRow>
                            <TableCell className="font-mono">10100</TableCell>
                            <TableCell>Right-of-Use Asset — Property</TableCell>
                            <TableCell className="text-right font-semibold text-green-400">{fmt(Math.abs(s.rou_adjustment))}</TableCell>
                            <TableCell className="text-right">—</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-mono">21020</TableCell>
                            <TableCell>Lease Liability — Property</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right font-semibold text-red-400">{fmt(Math.abs(s.liability_adjustment))}</TableCell>
                          </TableRow>
                        </>
                      ) : (
                        <>
                          <TableRow>
                            <TableCell className="font-mono">21020</TableCell>
                            <TableCell>Lease Liability — Property</TableCell>
                            <TableCell className="text-right font-semibold text-green-400">{fmt(Math.abs(s.liability_adjustment))}</TableCell>
                            <TableCell className="text-right">—</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-mono">10100</TableCell>
                            <TableCell>Right-of-Use Asset — Property</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right font-semibold text-red-400">{fmt(Math.abs(s.rou_adjustment))}</TableCell>
                          </TableRow>
                          {Number(s.pnl_adjustment) !== 0 && (
                            <TableRow>
                              <TableCell className="font-mono">40500</TableCell>
                              <TableCell>Gain on Lease Remeasurement (P&L)</TableCell>
                              <TableCell className="text-right">—</TableCell>
                              <TableCell className="text-right font-semibold text-amber-400">{fmt(Math.abs(s.pnl_adjustment))}</TableCell>
                            </TableRow>
                          )}
                        </>
                      )}
                    </TableBody>
                  </Table>
                  <div className="flex justify-between pt-3 border-t border-border text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{fmt(Math.abs(s.liability_adjustment))} {s.currency}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ═══ FORM MODE ══════════════════════════════════════════════════════════════
  if (mode === "form") {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setMode("list")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div>
              <h2 className="font-semibold text-lg">New Remeasurement</h2>
              <p className="text-sm text-muted-foreground">IFRS 16 lease liability remeasurement — prospective treatment</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Contract Selection */}
              <div className="rounded-xl border border-border p-5 space-y-4">
                <h3 className="font-semibold">1. Select Contract</h3>
                <Select value={form.contractId} onValueChange={v => setForm(f => ({ ...f, contractId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select lease contract" /></SelectTrigger>
                  <SelectContent>
                    {contracts.map((c: any) => (
                      <SelectItem key={c.contract_id} value={String(c.contract_id)}>
                        {c.contract_ref} — {c.lessor_name || c.asset_name || `Contract ${c.contract_id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedContract && (
                  <div className="space-y-3">
                    {/* Row 1: Key Financial Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-muted/30 rounded-lg p-4">
                      <div><span className="text-muted-foreground block text-xs mb-1">Lease Liability (Commence)</span><span className="font-mono font-semibold text-base">{fmt(selectedContract.lease_liability_commence)}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">ROU Asset Value</span><span className="font-mono font-semibold text-base">{fmt(selectedContract.rou_asset_value)}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">IBR</span><span className="font-mono font-semibold text-base">{selectedContract.ibr != null ? `${(Number(selectedContract.ibr) * 100).toFixed(3)}%` : '—'}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Monthly Payment</span><span className="font-mono font-semibold text-base">{fmt(selectedContract.monthly_payment)} {selectedContract.currency}</span></div>
                    </div>
                    {/* Row 2: Lease Term & Dates */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-muted/20 rounded-lg p-4">
                      <div><span className="text-muted-foreground block text-xs mb-1">Commencement Date</span><span className="font-mono">{selectedContract.commencement_date ? new Date(selectedContract.commencement_date).toLocaleDateString() : '—'}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Expiry Date</span><span className="font-mono">{selectedContract.expiry_date ? new Date(selectedContract.expiry_date).toLocaleDateString() : '—'}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Term (months)</span><span className="font-mono">{selectedContract.term_months ?? '—'}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Remaining Term</span><span className="font-mono">{selectedContract.expiry_date ? `${Math.max(0, Math.ceil((new Date(selectedContract.expiry_date).getTime() - Date.now()) / (1000*60*60*24*30.44)))} mo` : '—'}</span></div>
                    </div>
                    {/* Row 3: Contract Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-muted/10 rounded-lg p-4">
                      <div><span className="text-muted-foreground block text-xs mb-1">Lessor</span><span>{selectedContract.lessor_name ?? '—'}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Asset Type</span><Badge variant="outline" className="mt-0.5">{selectedContract.asset_type ?? '—'}</Badge></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Asset Description</span><span className="text-xs">{selectedContract.asset_description ?? '—'}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Classification</span><Badge variant="outline" className="mt-0.5">{selectedContract.ifrs16_classification ?? '—'}</Badge></div>
                    </div>
                    {/* Row 4: Additional Financial Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-muted/10 rounded-lg p-4">
                      <div><span className="text-muted-foreground block text-xs mb-1">Currency</span><span className="font-mono">{selectedContract.currency ?? '—'}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Escalation Rate</span><span className="font-mono">{selectedContract.escalation_rate != null ? `${(Number(selectedContract.escalation_rate) * 100).toFixed(2)}%` : '—'}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Deposit Amount</span><span className="font-mono">{fmt(selectedContract.deposit_amount)}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Status</span><Badge variant={selectedContract.status === 'Active' ? 'default' : 'secondary'}>{selectedContract.status ?? '—'}</Badge></div>
                    </div>
                    {/* Row 5: Options */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-muted/10 rounded-lg p-4">
                      <div><span className="text-muted-foreground block text-xs mb-1">Renewal Option</span><span>{selectedContract.renewal_option ? 'Yes' : 'No'}{selectedContract.renewal_certain ? ' (Certain)' : ''}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Purchase Option</span><span>{selectedContract.purchase_option ? 'Yes' : 'No'}{selectedContract.purchase_certain ? ' (Certain)' : ''}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Make-Good Obligation</span><span>{selectedContract.make_good_obligation ? `Yes (${fmt(selectedContract.make_good_estimate)})` : 'No'}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Maintenance</span><span>{selectedContract.maintenance_responsibility ?? '—'}</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Trigger */}
              <div className="rounded-xl border border-border p-5 space-y-4">
                <h3 className="font-semibold">2. Remeasurement Trigger</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Trigger Type</Label>
                    <Select value={form.triggerType} onValueChange={v => setForm(f => ({ ...f, triggerType: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Modification", "IBR Change", "Rent Review", "Extension", "Termination", "Index/Rate Change", "Purchase Option"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Remeasurement Date</Label>
                    <Input className="mt-1" type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Description / Reason</Label>
                  <Input className="mt-1" placeholder="e.g., Renewal option exercised, adding 24 months" value={form.triggerDescription} onChange={e => setForm(f => ({ ...f, triggerDescription: e.target.value }))} />
                </div>
              </div>

              {/* Revised Parameters */}
              <div className="rounded-xl border border-border p-5 space-y-4">
                <h3 className="font-semibold">3. Revised Parameters</h3>
                <p className="text-xs text-muted-foreground">Leave blank to keep existing value unchanged</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>New IBR (decimal, e.g. 0.065)</Label>
                    <Input className="mt-1" type="number" step="0.001" placeholder={selectedContract?.ibr ? String(selectedContract.ibr) : "e.g. 0.065"} value={form.newIbr} onChange={e => setForm(f => ({ ...f, newIbr: e.target.value }))} />
                  </div>
                  <div>
                    <Label>New Remaining Term (months)</Label>
                    <Input className="mt-1" type="number" placeholder="e.g., 36" value={form.newRemainingTerm} onChange={e => setForm(f => ({ ...f, newRemainingTerm: e.target.value }))} />
                  </div>
                  <div>
                    <Label>New Monthly Payment</Label>
                    <Input className="mt-1" type="number" step="0.01" placeholder={selectedContract?.monthly_payment ? String(selectedContract.monthly_payment) : "Current payment"} value={form.newMonthlyPayment} onChange={e => setForm(f => ({ ...f, newMonthlyPayment: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setMode("list")}>Cancel</Button>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2" onClick={handleCalculate} disabled={calculateMut.isPending}>
                  <Calculator className="w-4 h-4" />{calculateMut.isPending ? "Calculating..." : "Calculate & Preview"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ═══ LIST MODE ══════════════════════════════════════════════════════════════
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
          screenId="VFLRMSENG0001P001"
          title="Remeasurement Engine"
          subtitle="IFRS 16 lease liability remeasurement — prospective treatment, old JVs preserved"
          screenType="remeasurement_engine"
          actions={
            <Button onClick={() => { setForm({ contractId: "", triggerType: "Modification", eventDate: new Date().toISOString().slice(0, 10), triggerDescription: "", newIbr: "", newRemainingTerm: "", newMonthlyPayment: "" }); setPreview(null); setMode("form"); }} className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2 h-9 px-3 text-sm rounded-lg">
              <Calculator className="w-4 h-4" />New Remeasurement
            </Button>
          }
        />

        {/* Filters Row */}
        <div className="flex gap-3 flex-wrap">
          <Select value={filterContractId || "all"} onValueChange={v => setFilterContractId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Select Lease" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leases</SelectItem>
              {contracts.map((c: any) => (
                <SelectItem key={c.contract_id} value={String(c.contract_id)}>
                  {c.contract_ref} — {c.lessor_name || c.asset_name || `Contract ${c.contract_id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus || "all"} onValueChange={v => setFilterStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {["PENDING", "CALCULATED", "POSTED"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Lease Details Panel - shown when a lease is selected */}
        {listSelectedContract && (
          <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/10">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Lease Details — {listSelectedContract.contract_ref}</h4>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setFilterContractId("")}>Clear</Button>
            </div>
            {/* Row 1: Key Financial Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div><span className="text-muted-foreground block text-xs">Lease Liability</span><span className="font-mono font-semibold">{fmt(listSelectedContract.lease_liability_commence)}</span></div>
              <div><span className="text-muted-foreground block text-xs">ROU Asset</span><span className="font-mono font-semibold">{fmt(listSelectedContract.rou_asset_value)}</span></div>
              <div><span className="text-muted-foreground block text-xs">IBR</span><span className="font-mono font-semibold">{listSelectedContract.ibr != null ? `${(Number(listSelectedContract.ibr) * 100).toFixed(3)}%` : '—'}</span></div>
              <div><span className="text-muted-foreground block text-xs">Monthly Payment</span><span className="font-mono font-semibold">{fmt(listSelectedContract.monthly_payment)} {listSelectedContract.currency}</span></div>
              <div><span className="text-muted-foreground block text-xs">Classification</span><Badge variant="outline">{listSelectedContract.ifrs16_classification ?? '—'}</Badge></div>
            </div>
            {/* Row 2: Dates & Term */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div><span className="text-muted-foreground block text-xs">Commencement</span><span className="font-mono">{listSelectedContract.commencement_date ? new Date(listSelectedContract.commencement_date).toLocaleDateString() : '—'}</span></div>
              <div><span className="text-muted-foreground block text-xs">Expiry</span><span className="font-mono">{listSelectedContract.expiry_date ? new Date(listSelectedContract.expiry_date).toLocaleDateString() : '—'}</span></div>
              <div><span className="text-muted-foreground block text-xs">Term</span><span className="font-mono">{listSelectedContract.term_months ?? '—'} months</span></div>
              <div><span className="text-muted-foreground block text-xs">Remaining</span><span className="font-mono">{listSelectedContract.expiry_date ? `${Math.max(0, Math.ceil((new Date(listSelectedContract.expiry_date).getTime() - Date.now()) / (1000*60*60*24*30.44)))} mo` : '—'}</span></div>
              <div><span className="text-muted-foreground block text-xs">Escalation</span><span className="font-mono">{listSelectedContract.escalation_rate != null ? `${(Number(listSelectedContract.escalation_rate) * 100).toFixed(2)}%` : '—'}</span></div>
            </div>
            {/* Row 3: Lessor & Asset */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div><span className="text-muted-foreground block text-xs">Lessor</span><span>{listSelectedContract.lessor_name ?? '—'}</span></div>
              <div><span className="text-muted-foreground block text-xs">Asset Type</span><Badge variant="outline">{listSelectedContract.asset_type ?? '—'}</Badge></div>
              <div><span className="text-muted-foreground block text-xs">Asset</span><span className="text-xs">{listSelectedContract.asset_description ?? '—'}</span></div>
              <div><span className="text-muted-foreground block text-xs">Deposit</span><span className="font-mono">{fmt(listSelectedContract.deposit_amount)}</span></div>
              <div><span className="text-muted-foreground block text-xs">Status</span><Badge variant="secondary">{listSelectedContract.status ?? '—'}</Badge></div>
            </div>
            {/* Row 4: Options */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div><span className="text-muted-foreground block text-xs">Renewal Option</span><span>{listSelectedContract.renewal_option ? 'Yes' : 'No'}{listSelectedContract.renewal_certain ? ' (Certain)' : ''}</span></div>
              <div><span className="text-muted-foreground block text-xs">Purchase Option</span><span>{listSelectedContract.purchase_option ? 'Yes' : 'No'}{listSelectedContract.purchase_certain ? ' (Certain)' : ''}</span></div>
              <div><span className="text-muted-foreground block text-xs">Make-Good</span><span>{listSelectedContract.make_good_obligation ? `Yes (${fmt(listSelectedContract.make_good_estimate)})` : 'No'}</span></div>
              <div><span className="text-muted-foreground block text-xs">Maintenance</span><span>{listSelectedContract.maintenance_responsibility ?? '—'}</span></div>
              <div><span className="text-muted-foreground block text-xs">Currency</span><span className="font-mono">{listSelectedContract.currency ?? '—'}</span></div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Contract</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Old Liability</TableHead>
              <TableHead className="text-right">New Liability</TableHead>
              <TableHead className="text-right">Adjustment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(events as any[]).map((e: any) => (
                <TableRow key={e.remeasurement_id}>
                  <TableCell className="font-mono text-xs">{e.contract_ref || e.contract_id}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{e.event_type}</Badge></TableCell>
                  <TableCell>{e.event_date ? new Date(e.event_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(e.old_liability)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(e.new_liability)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{fmt(e.liability_adjustment)}</TableCell>
                  <TableCell>
                    <Badge className={e.status === "POSTED" ? "bg-green-500/20 text-green-400" : e.status === "CALCULATED" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}>
                      {e.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {e.status === "CALCULATED" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => sendToJvMut.mutate({ remeasurement_id: e.remeasurement_id })}>
                          <BookOpen className="w-3 h-3 mr-1" />Post
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                        const explanation = `Remeasurement Event #${e.remeasurement_id}\n` +
                          `Contract: ${e.contract_ref}\n` +
                          `Trigger: ${e.event_type} — ${e.trigger_description || ''}\n` +
                          `Date: ${new Date(e.event_date).toLocaleDateString()}\n\n` +
                          `Old Liability: ${fmt(e.old_liability)}\n` +
                          `New Liability: ${fmt(e.new_liability)}\n` +
                          `Adjustment: ${fmt(e.liability_adjustment)}\n\n` +
                          `Old ROU: ${fmt(e.old_rou_asset)}\n` +
                          `New ROU: ${fmt(e.new_rou_asset)}\n` +
                          `ROU Adjustment: ${fmt(e.rou_adjustment)}\n\n` +
                          `Old IBR: ${fmtPct(e.old_ibr)} → New IBR: ${fmtPct(e.new_ibr)}\n` +
                          `Old Term: ${e.old_remaining_term} mo → New Term: ${e.new_remaining_term} mo\n\n` +
                          `Treatment: Prospective (IFRS 16.45)\n` +
                          `Old JVs: Preserved — never reversed`;
                        setCalcExplanation(explanation);
                      }}>
                        <Info className="w-3 h-3 mr-1" />Explain
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(events as any[]).length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No remeasurement events — click "New Remeasurement" to begin</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* IFRS 16 Reference */}
        <div className="rounded-xl border border-border/50 p-4 bg-muted/20">
          <h4 className="text-sm font-semibold mb-2">IFRS 16 Remeasurement Rules</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div><span className="font-semibold text-foreground block mb-1">Prospective Treatment</span>Old JVs are never reversed. Adjustment is a single entry on the remeasurement date.</div>
            <div><span className="font-semibold text-foreground block mb-1">ROU Asset Adjustment</span>Normally offsets liability change. If ROU goes to zero, excess recognised in P&L (IFRS 16.46b).</div>
            <div><span className="font-semibold text-foreground block mb-1">Schedule Regeneration</span>Future amortisation recalculated from event date using revised IBR, term, and payments.</div>
          </div>
        </div>
      </div>

      {/* Calculation Explanation Dialog */}
      <Dialog open={!!calcExplanation} onOpenChange={() => setCalcExplanation(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Calculation Explanation</DialogTitle></DialogHeader>
          <div className="bg-black/30 rounded-lg p-4 font-mono text-xs text-green-300 whitespace-pre-wrap leading-relaxed">
            {calcExplanation}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
