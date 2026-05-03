import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ScreenHeader from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calculator, CheckCircle2, AlertTriangle, BookOpen, Info, Pencil, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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
  const [showCalcExplanation, setShowCalcExplanation] = useState(false);
  // Editable lease fields
  const [editMode, setEditMode] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});

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
  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  // Helper to get editable value or original
  const getVal = (field: string, original: any) => editMode && editedFields[field] !== undefined ? editedFields[field] : (original ?? "");

  // ═══ FULL-SCREEN CALC EXPLANATION ═══════════════════════════════════════════
  if (showCalcExplanation && preview?.summary) {
    const s = preview.summary;
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowCalcExplanation(false)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back to Preview
            </Button>
            <div>
              <h2 className="font-semibold text-lg">Calculation Logic — Remeasurement</h2>
              <p className="text-sm text-muted-foreground">Full blackboard-style calculation breakdown</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-[#1a1a2e] rounded-xl p-8 font-mono text-sm text-[#ffd700] whitespace-pre-wrap leading-relaxed border border-[#ffd700]/20">
{`╔══════════════════════════════════════════════════════════════════════════════╗
║                    IFRS 16 REMEASUREMENT CALCULATION                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

Contract:  ${s.contract_ref}
Event:     ${s.event_type}
Date:      ${fmtDate(s.event_date)}
Currency:  ${s.currency}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: CURRENT OUTSTANDING BALANCES (Before Remeasurement)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Lease Liability (current balance)  = ${fmt(s.old_liability)} ${s.currency}
  ROU Asset (Net Book Value)         = ${fmt(s.old_rou_asset)} ${s.currency}
  Current IBR                        = ${fmtPct(s.old_ibr)} per annum
  Current Monthly Payment            = ${fmt(s.old_monthly_payment)} ${s.currency}
  Months Already Posted              = ${s.months_already_posted}
  Old Remaining Term                 = ${s.old_remaining_term} months

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: CALCULATE NEW LEASE LIABILITY (Present Value of Revised Payments)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Formula:  PV = PMT × [1 - (1 + r)^(-n)] / r

  Where:
    PMT  = ${fmt(s.new_monthly_payment)} ${s.currency}  (revised monthly payment)
    r    = ${fmtPct(s.new_ibr)} ÷ 12 = ${(Number(s.new_ibr) / 12).toFixed(8)}  (monthly discount rate)
    n    = ${s.new_remaining_term} months  (revised remaining lease term)

  Calculation:
    (1 + r)^(-n)  = (1 + ${(Number(s.new_ibr) / 12).toFixed(8)})^(-${s.new_remaining_term})
                  = ${Math.pow(1 + Number(s.new_ibr) / 12, -s.new_remaining_term).toFixed(8)}

    1 - (1+r)^(-n) = ${(1 - Math.pow(1 + Number(s.new_ibr) / 12, -s.new_remaining_term)).toFixed(8)}

    Annuity Factor = [1 - (1+r)^(-n)] / r
                   = ${((1 - Math.pow(1 + Number(s.new_ibr) / 12, -s.new_remaining_term)) / (Number(s.new_ibr) / 12)).toFixed(6)}

  ┌─────────────────────────────────────────────────────────────────────┐
  │  NEW LEASE LIABILITY = ${fmt(s.new_monthly_payment)} × ${((1 - Math.pow(1 + Number(s.new_ibr) / 12, -s.new_remaining_term)) / (Number(s.new_ibr) / 12)).toFixed(6)}
  │                      = ${fmt(s.new_liability)} ${s.currency}
  └─────────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: CALCULATE ADJUSTMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Liability Adjustment  = New Liability − Old Liability
                        = ${fmt(s.new_liability)} − ${fmt(s.old_liability)}
                        = ${fmt(s.liability_adjustment)} ${s.currency}

  ROU Asset Adjustment  = ${fmt(s.rou_adjustment)} ${s.currency}
${Number(s.pnl_adjustment) !== 0 ? `
  ⚠ ROU Asset reduced to ZERO
  P&L Adjustment        = ${fmt(s.pnl_adjustment)} ${s.currency}
  (Excess recognised in Profit & Loss per IFRS 16.46(b))
` : `
  (ROU Asset absorbs the full adjustment — no P&L impact)`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: PROSPECTIVE TREATMENT (IFRS 16.45)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓ Old JVs:        PRESERVED — never reversed or modified
  ✓ Adjustment JV:  Single entry posted on ${fmtDate(s.event_date)}
  ✓ Future Schedule: Regenerated for ${s.new_remaining_term} months from event date
  ✓ Depreciation:   New ROU (${fmt(s.new_rou_asset)}) ÷ ${s.new_remaining_term} months
                   = ${fmt(Number(s.new_rou_asset) / s.new_remaining_term)} ${s.currency} per month

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JOURNAL VOUCHER ENTRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${Number(s.liability_adjustment) > 0 ? `
  Dr.  Right-of-Use Asset (10100)     ${fmt(Math.abs(s.rou_adjustment))} ${s.currency}
  Cr.  Lease Liability (21020)        ${fmt(Math.abs(s.liability_adjustment))} ${s.currency}
` : `
  Dr.  Lease Liability (21020)        ${fmt(Math.abs(s.liability_adjustment))} ${s.currency}
  Cr.  Right-of-Use Asset (10100)     ${fmt(Math.abs(s.rou_adjustment))} ${s.currency}
${Number(s.pnl_adjustment) !== 0 ? `  Cr.  Gain on Remeasurement (40500)   ${fmt(Math.abs(s.pnl_adjustment))} ${s.currency}` : ''}`}

╔══════════════════════════════════════════════════════════════════════════════╗
║  RESULT: Lease remeasured prospectively. Schedule regenerated.             ║
╚══════════════════════════════════════════════════════════════════════════════╝`}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
            <div className="ml-auto flex gap-3">
              <Button
                className="bg-[#ffd700] hover:bg-[#e6c200] text-black font-semibold gap-2"
                onClick={() => setShowCalcExplanation(true)}
              >
                <Calculator className="w-4 h-4" />Calc Logic
              </Button>
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
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Parameter</TableHead><TableHead className="text-right">Old</TableHead><TableHead className="text-right">New</TableHead><TableHead className="text-right">Change</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        <TableRow><TableCell>Lease Liability</TableCell><TableCell className="text-right font-mono">{fmt(s.old_liability)}</TableCell><TableCell className="text-right font-mono font-semibold">{fmt(s.new_liability)}</TableCell><TableCell className="text-right font-mono">{fmt(s.liability_adjustment)}</TableCell></TableRow>
                        <TableRow><TableCell>ROU Asset</TableCell><TableCell className="text-right font-mono">{fmt(s.old_rou_asset)}</TableCell><TableCell className="text-right font-mono font-semibold">{fmt(s.new_rou_asset)}</TableCell><TableCell className="text-right font-mono">{fmt(s.rou_adjustment)}</TableCell></TableRow>
                        <TableRow><TableCell>IBR</TableCell><TableCell className="text-right font-mono">{fmtPct(s.old_ibr)}</TableCell><TableCell className="text-right font-mono font-semibold">{fmtPct(s.new_ibr)}</TableCell><TableCell className="text-right">—</TableCell></TableRow>
                        <TableRow><TableCell>Monthly Payment</TableCell><TableCell className="text-right font-mono">{fmt(s.old_monthly_payment)}</TableCell><TableCell className="text-right font-mono font-semibold">{fmt(s.new_monthly_payment)}</TableCell><TableCell className="text-right">—</TableCell></TableRow>
                        <TableRow><TableCell>Remaining Term</TableCell><TableCell className="text-right">{s.old_remaining_term} mo</TableCell><TableCell className="text-right font-semibold">{s.new_remaining_term} mo</TableCell><TableCell className="text-right">—</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Key Facts */}
                  <div className="rounded-xl border border-border p-5 space-y-4">
                    <h3 className="font-semibold text-base">Key Facts</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Contract</span><span className="font-mono">{s.contract_ref}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Event Type</span><Badge variant="outline">{s.event_type}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Effective Date</span><span>{fmtDate(s.event_date)}</span></div>
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
                  <p className="text-sm text-muted-foreground">This single JV will be posted on {fmtDate(s.event_date)}. Existing JVs remain untouched.</p>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>#</TableHead><TableHead>Account</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {Number(s.liability_adjustment) > 0 ? (
                        <>
                          <TableRow>
                            <TableCell>1</TableCell>
                            <TableCell className="font-mono">10100</TableCell>
                            <TableCell>Right-of-Use Asset — Property</TableCell>
                            <TableCell className="text-right font-semibold text-green-400">{fmt(Math.abs(s.rou_adjustment))}</TableCell>
                            <TableCell className="text-right">—</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>2</TableCell>
                            <TableCell className="font-mono">21020</TableCell>
                            <TableCell>Lease Liability — Property</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right font-semibold text-red-400">{fmt(Math.abs(s.liability_adjustment))}</TableCell>
                          </TableRow>
                        </>
                      ) : (
                        <>
                          <TableRow>
                            <TableCell>1</TableCell>
                            <TableCell className="font-mono">21020</TableCell>
                            <TableCell>Lease Liability — Property</TableCell>
                            <TableCell className="text-right font-semibold text-green-400">{fmt(Math.abs(s.liability_adjustment))}</TableCell>
                            <TableCell className="text-right">—</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>2</TableCell>
                            <TableCell className="font-mono">10100</TableCell>
                            <TableCell>Right-of-Use Asset — Property</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right font-semibold text-red-400">{fmt(Math.abs(s.rou_adjustment))}</TableCell>
                          </TableRow>
                          {Number(s.pnl_adjustment) !== 0 && (
                            <TableRow>
                              <TableCell>3</TableCell>
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
    const d = selectedContract || {};
    const remainingMonths = d.expiry_date ? Math.max(0, Math.ceil((new Date(d.expiry_date).getTime() - Date.now()) / (1000*60*60*24*30.44))) : null;

    // Lease details table rows
    const leaseTableRows = [
      { category: "Financial", fields: [
        { label: "Lease Liability (Commencement)", key: "lease_liability_commence", value: fmt(d.lease_liability_commence), editable: false },
        { label: "ROU Asset Value", key: "rou_asset_value", value: fmt(d.rou_asset_value), editable: false },
        { label: "Monthly Payment", key: "monthly_payment", value: fmt(d.monthly_payment), suffix: d.currency, editable: true, type: "number" },
        { label: "IBR (Annual)", key: "ibr", value: d.ibr != null ? fmtPct(d.ibr) : "—", editable: true, type: "number" },
        { label: "Escalation Rate", key: "escalation_rate", value: d.escalation_rate != null ? `${(Number(d.escalation_rate)*100).toFixed(2)}%` : "—", editable: false },
        { label: "Deposit Amount", key: "deposit_amount", value: fmt(d.deposit_amount), suffix: d.currency, editable: false },
        { label: "Currency", key: "currency", value: d.currency ?? "—", editable: false },
      ]},
      { category: "Term & Dates", fields: [
        { label: "Commencement Date", key: "commencement_date", value: fmtDate(d.commencement_date), editable: false },
        { label: "Expiry Date", key: "expiry_date", value: fmtDate(d.expiry_date), editable: true, type: "date" },
        { label: "Original Term (months)", key: "term_months", value: d.term_months ?? "—", editable: false },
        { label: "Remaining Term (months)", key: "remaining_term", value: remainingMonths ?? "—", editable: true, type: "number" },
        { label: "Payment Frequency", key: "payment_frequency", value: d.payment_frequency ?? "Monthly", editable: false },
      ]},
      { category: "Contract & Asset", fields: [
        { label: "Contract Reference", key: "contract_ref", value: d.contract_ref ?? "—", editable: false },
        { label: "Lessor Name", key: "lessor_name", value: d.lessor_name ?? "—", editable: false },
        { label: "Asset Type", key: "asset_type", value: d.asset_type ?? "—", editable: false },
        { label: "Asset Description", key: "asset_description", value: d.asset_description ?? "—", editable: false },
        { label: "IFRS 16 Classification", key: "ifrs16_classification", value: d.ifrs16_classification ?? "—", editable: false },
        { label: "Status", key: "status", value: d.status ?? "—", editable: false },
      ]},
      { category: "Options & Obligations", fields: [
        { label: "Renewal Option", key: "renewal_option", value: d.renewal_option ? "Yes" : "No", editable: false },
        { label: "Renewal Certain", key: "renewal_certain", value: d.renewal_certain ? "Yes" : "No", editable: false },
        { label: "Purchase Option", key: "purchase_option", value: d.purchase_option ? "Yes" : "No", editable: false },
        { label: "Purchase Certain", key: "purchase_certain", value: d.purchase_certain ? "Yes" : "No", editable: false },
        { label: "Make-Good Obligation", key: "make_good_obligation", value: d.make_good_obligation ? `Yes (${fmt(d.make_good_estimate)})` : "No", editable: false },
        { label: "Maintenance Responsibility", key: "maintenance_responsibility", value: d.maintenance_responsibility ?? "—", editable: false },
      ]},
    ];

    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setMode("list")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">New Remeasurement</h2>
              <p className="text-sm text-muted-foreground">Select lease → Check remeasurement option → Enter revised parameters</p>
            </div>
            {selectedContract && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => { setEditMode(!editMode); if (editMode) setEditedFields({}); }}
              >
                {editMode ? <><Save className="w-4 h-4" />Done Editing</> : <><Pencil className="w-4 h-4" />Edit Fields</>}
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ─── STEP 1: Lease Selection ─── */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base border-b border-border pb-2">Step 1 — Select Lease</h3>
              <Select value={form.contractId} onValueChange={v => { setForm(f => ({ ...f, contractId: v })); setEditedFields({}); setEditMode(false); }}>
                <SelectTrigger className="w-full max-w-lg"><SelectValue placeholder="Choose a lease contract..." /></SelectTrigger>
                <SelectContent>
                  {contracts.map((c: any) => (
                    <SelectItem key={c.contract_id} value={String(c.contract_id)}>
                      {c.contract_ref} — {c.lessor_name || c.asset_name || `Contract ${c.contract_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ─── Lease Details Table (shown when contract selected) ─── */}
            {selectedContract && (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-semibold">Lease Details — {d.contract_ref}</span>
                  {editMode && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Edit Mode</Badge>}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Category</TableHead>
                      <TableHead className="w-64">Field</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaseTableRows.map((section) => (
                      section.fields.map((field, idx) => (
                        <TableRow key={`${section.category}-${field.key}`} className={idx === 0 ? "border-t-2 border-border" : ""}>
                          {idx === 0 && (
                            <TableCell rowSpan={section.fields.length} className="align-top font-semibold text-xs uppercase tracking-wide text-muted-foreground bg-muted/20 border-r border-border">
                              {section.category}
                            </TableCell>
                          )}
                          <TableCell className="text-sm">{field.label}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {editMode && field.editable ? (
                              <Input
                                className="h-8 w-48 font-mono text-sm"
                                type={field.type || "text"}
                                defaultValue={field.type === "number" ? (d[field.key] ?? "") : (field.value !== "—" ? field.value : "")}
                                onChange={e => setEditedFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                                placeholder={field.value}
                              />
                            ) : (
                              <span>{field.value}{field.suffix ? ` ${field.suffix}` : ""}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* ─── STEP 2: Remeasurement Option ─── */}
            {selectedContract && (
              <div className="space-y-4">
                <h3 className="font-semibold text-base border-b border-border pb-2">Step 2 — Remeasurement Option</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trigger Type</Label>
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
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Remeasurement Date</Label>
                    <Input className="mt-1" type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description / Reason</Label>
                    <Input className="mt-1" placeholder="e.g., Renewal option exercised, adding 24 months" value={form.triggerDescription} onChange={e => setForm(f => ({ ...f, triggerDescription: e.target.value }))} />
                  </div>
                </div>

                {/* Trigger explanation */}
                <div className="rounded-lg border border-[#ffd700]/30 bg-[#ffd700]/5 p-3 text-xs">
                  <span className="font-semibold text-[#ffd700]">IFRS 16 Guidance:</span>
                  {form.triggerType === "Modification" && <span className="ml-2">A change in scope/consideration not part of original terms. Remeasure liability with revised payments at revised discount rate.</span>}
                  {form.triggerType === "IBR Change" && <span className="ml-2">Change in discount rate. Remeasure liability using revised IBR for remaining payments.</span>}
                  {form.triggerType === "Rent Review" && <span className="ml-2">Periodic rent review resulting in changed lease payments. Remeasure with new payment at current IBR.</span>}
                  {form.triggerType === "Extension" && <span className="ml-2">Lessee exercises renewal option or becomes reasonably certain to do so. Extend term and remeasure.</span>}
                  {form.triggerType === "Termination" && <span className="ml-2">Early termination or partial scope reduction. Reduce term and remeasure; gain/loss to P&L for scope reduction.</span>}
                  {form.triggerType === "Index/Rate Change" && <span className="ml-2">Variable payments linked to index/rate (e.g., CPI). Remeasure when actual payments change.</span>}
                  {form.triggerType === "Purchase Option" && <span className="ml-2">Lessee now reasonably certain to exercise purchase option. Add exercise price to payments and remeasure.</span>}
                </div>
              </div>
            )}

            {/* ─── STEP 3: Revised Parameters ─── */}
            {selectedContract && (
              <div className="space-y-4">
                <h3 className="font-semibold text-base border-b border-border pb-2">Step 3 — Revised Parameters</h3>
                <p className="text-xs text-muted-foreground">Leave blank to keep existing value unchanged</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New IBR (decimal, e.g. 0.065)</Label>
                    <Input className="mt-1" type="number" step="0.001" placeholder={d.ibr ? String(d.ibr) : "e.g. 0.065"} value={form.newIbr} onChange={e => setForm(f => ({ ...f, newIbr: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New Remaining Term (months)</Label>
                    <Input className="mt-1" type="number" placeholder={remainingMonths ? String(remainingMonths) : "e.g., 36"} value={form.newRemainingTerm} onChange={e => setForm(f => ({ ...f, newRemainingTerm: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New Monthly Payment</Label>
                    <Input className="mt-1" type="number" step="0.01" placeholder={d.monthly_payment ? String(d.monthly_payment) : "Current payment"} value={form.newMonthlyPayment} onChange={e => setForm(f => ({ ...f, newMonthlyPayment: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* ─── Actions ─── */}
            {selectedContract && (
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setMode("list")}>Cancel</Button>
                <div className="flex gap-3">
                  <Button
                    className="bg-[#ffd700] hover:bg-[#e6c200] text-black font-semibold gap-2"
                    onClick={handleCalculate}
                    disabled={calculateMut.isPending}
                  >
                    <Calculator className="w-4 h-4" />{calculateMut.isPending ? "Calculating..." : "Calculate & Preview"}
                  </Button>
                </div>
              </div>
            )}
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
          {filterContractId && (
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => setFilterContractId("")}>Clear Filter</Button>
          )}
        </div>

        {/* Lease Details Panel - shown when a lease is selected */}
        {listSelectedContract && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 border-b border-border">
              <span className="text-sm font-semibold">Lease Details — {listSelectedContract.contract_ref}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-3 p-4 text-sm">
              <div><span className="text-muted-foreground block text-xs">Lease Liability</span><span className="font-mono font-semibold">{fmt(listSelectedContract.lease_liability_commence)}</span></div>
              <div><span className="text-muted-foreground block text-xs">ROU Asset</span><span className="font-mono font-semibold">{fmt(listSelectedContract.rou_asset_value)}</span></div>
              <div><span className="text-muted-foreground block text-xs">IBR</span><span className="font-mono font-semibold">{listSelectedContract.ibr != null ? fmtPct(listSelectedContract.ibr) : '—'}</span></div>
              <div><span className="text-muted-foreground block text-xs">Monthly Payment</span><span className="font-mono font-semibold">{fmt(listSelectedContract.monthly_payment)} {listSelectedContract.currency}</span></div>
              <div><span className="text-muted-foreground block text-xs">Classification</span><Badge variant="outline">{listSelectedContract.ifrs16_classification ?? '—'}</Badge></div>
              <div><span className="text-muted-foreground block text-xs">Commencement</span><span className="font-mono">{fmtDate(listSelectedContract.commencement_date)}</span></div>
              <div><span className="text-muted-foreground block text-xs">Expiry</span><span className="font-mono">{fmtDate(listSelectedContract.expiry_date)}</span></div>
              <div><span className="text-muted-foreground block text-xs">Term</span><span className="font-mono">{listSelectedContract.term_months ?? '—'} months</span></div>
              <div><span className="text-muted-foreground block text-xs">Lessor</span><span>{listSelectedContract.lessor_name ?? '—'}</span></div>
              <div><span className="text-muted-foreground block text-xs">Asset</span><span className="text-xs">{listSelectedContract.asset_description ?? '—'}</span></div>
            </div>
          </div>
        )}

        {/* Register Table */}
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
              {(events as any[]).filter(e => !filterContractId || String(e.contract_id) === filterContractId).map((e: any) => (
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
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-[#ffd700] hover:bg-[#e6c200] text-black font-semibold gap-1"
                        onClick={() => {
                          // Set form with this event's data and trigger calculate to show explanation
                          setForm({
                            contractId: String(e.contract_id),
                            triggerType: e.event_type,
                            eventDate: e.event_date ? new Date(e.event_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                            triggerDescription: e.trigger_description || "",
                            newIbr: e.new_ibr ? String(e.new_ibr) : "",
                            newRemainingTerm: e.new_remaining_term ? String(e.new_remaining_term) : "",
                            newMonthlyPayment: e.new_monthly_payment ? String(e.new_monthly_payment) : "",
                          });
                          // Build inline explanation
                          const explanation = {
                            summary: {
                              contract_ref: e.contract_ref,
                              event_type: e.event_type,
                              event_date: e.event_date,
                              currency: e.currency || "QAR",
                              old_liability: e.old_liability,
                              new_liability: e.new_liability,
                              liability_adjustment: e.liability_adjustment,
                              old_rou_asset: e.old_rou_asset,
                              new_rou_asset: e.new_rou_asset,
                              rou_adjustment: e.rou_adjustment,
                              pnl_adjustment: e.pnl_adjustment || 0,
                              old_ibr: e.old_ibr,
                              new_ibr: e.new_ibr,
                              old_monthly_payment: e.old_monthly_payment,
                              new_monthly_payment: e.new_monthly_payment,
                              old_remaining_term: e.old_remaining_term,
                              new_remaining_term: e.new_remaining_term,
                              months_already_posted: e.months_already_posted || 0,
                              jv_description: e.jv_description || "",
                            },
                            schedule: [],
                          };
                          setPreview(explanation);
                          setShowCalcExplanation(true);
                        }}
                      >
                        <Calculator className="w-3 h-3" />Calc
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(events as any[]).filter(e => !filterContractId || String(e.contract_id) === filterContractId).length === 0 && (
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
    </DashboardLayout>
  );
}
