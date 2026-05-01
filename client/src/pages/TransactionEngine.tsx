import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, XCircle, PlayCircle, ChevronRight, ChevronLeft,
  BookOpen, RefreshCw, Info, Zap, FileText, TrendingUp, ArrowLeftRight,
  DollarSign, RotateCcw, Calendar, BarChart3
} from "lucide-react";
import { toast } from "sonner";

// ─── Function definitions ─────────────────────────────────────────────────────
const FUNCTIONS = [
  {
    key: "INITIAL_RECOGNITION",
    label: "Initial Recognition",
    icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/30",
    description: "Recognise the ROU Asset and Lease Liability at lease commencement. PV of future payments discounted at IBR.",
    standard: "IFRS 16.22 — 16.28",
    params: ["contract_id"],
  },
  {
    key: "INTEREST_ACCRUAL",
    label: "Interest Accrual",
    icon: TrendingUp,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30",
    description: "Unwind the discount on the lease liability. Monthly interest = Liability × (IBR / 12).",
    standard: "IFRS 16.36(a)",
    params: ["contract_id", "period_year", "period_month"],
  },
  {
    key: "DEPRECIATION",
    label: "ROU Depreciation",
    icon: BarChart3,
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/30",
    description: "Straight-line depreciation of the ROU asset over the lease term.",
    standard: "IFRS 16.31",
    params: ["contract_id", "period_year", "period_month"],
  },
  {
    key: "LEASE_PAYMENT",
    label: "Lease Payment",
    icon: DollarSign,
    color: "text-green-500",
    bg: "bg-green-500/10 border-green-500/30",
    description: "Split monthly payment into principal reduction and interest. Dr Liability + Dr Finance Cost, Cr Cash.",
    standard: "IFRS 16.36(b)",
    params: ["contract_id", "period_year", "period_month"],
  },
  {
    key: "MODIFICATION",
    label: "Modification",
    icon: RefreshCw,
    color: "text-orange-500",
    bg: "bg-orange-500/10 border-orange-500/30",
    description: "Remeasure the lease liability and adjust the ROU asset when terms change (new payment or term).",
    standard: "IFRS 16.45 — 16.50",
    params: ["contract_id", "new_monthly_payment", "new_term_months"],
  },
  {
    key: "TERMINATION",
    label: "Termination",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/30",
    description: "Derecognise the remaining ROU asset and lease liability. Recognise gain or loss.",
    standard: "IFRS 16.46",
    params: ["contract_id", "remaining_liability", "remaining_rou"],
  },
  {
    key: "FX_REVALUATION",
    label: "FX Revaluation",
    icon: ArrowLeftRight,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10 border-cyan-500/30",
    description: "Revalue foreign-currency lease liability at the closing rate. Recognise FX gain or loss.",
    standard: "IAS 21 + IFRS 16",
    params: ["contract_id", "old_fx_rate", "new_fx_rate"],
  },
  {
    key: "PERIOD_CLOSE",
    label: "Period-End Close",
    icon: Calendar,
    color: "text-teal-500",
    bg: "bg-teal-500/10 border-teal-500/30",
    description: "Combined period-end entry: interest accrual + ROU depreciation in one consolidated JV.",
    standard: "IFRS 16.36",
    params: ["contract_id", "period_year", "period_month"],
  },
] as const;

type FnKey = typeof FUNCTIONS[number]["key"];

// ─── JV Lines Table ───────────────────────────────────────────────────────────
function JVLinesTable({ lines, onCalcClick }: { lines: any[]; onCalcClick: (line: any) => void }) {
  if (!lines.length) return <p className="text-muted-foreground text-sm py-4 text-center">No JV lines found.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground w-8">#</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Account</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Account Name</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-16">Dr/Cr</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-20">Calc</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line: any, idx: number) => (
            <tr key={idx} className={`border-t border-border ${idx % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
              <td className="px-3 py-2 text-muted-foreground">{line.line_seq}</td>
              <td className="px-3 py-2 font-mono text-xs">{line.account_code}</td>
              <td className="px-3 py-2 font-medium">{line.account_name}</td>
              <td className="px-3 py-2 text-center">
                <Badge variant={line.dr_cr === "DR" ? "default" : "secondary"} className={line.dr_cr === "DR" ? "bg-blue-600 text-white" : "bg-green-600 text-white"}>
                  {line.dr_cr}
                </Badge>
              </td>
              <td className="px-3 py-2 text-right font-mono font-semibold">
                {Number(line.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-3 py-2 text-muted-foreground text-xs">{line.description}</td>
              <td className="px-3 py-2 text-center">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onCalcClick(line)} title="Show calculation">
                  <Info className="h-3.5 w-3.5 text-amber-500" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-muted/50 border-t-2 border-border">
          <tr>
            <td colSpan={4} className="px-3 py-2 font-semibold text-right text-sm">Totals:</td>
            <td className="px-3 py-2 text-right font-mono font-bold">
              DR: {lines.filter(l => l.dr_cr === "DR").reduce((s, l) => s + Number(l.amount), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <br />
              CR: {lines.filter(l => l.dr_cr === "CR").reduce((s, l) => s + Number(l.amount), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Calculation Blackboard ───────────────────────────────────────────────────
function CalcBlackboard({ line, onClose }: { line: any; onClose: () => void }) {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 mt-3 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-amber-400 font-semibold text-sm flex items-center gap-1.5">
          <Zap className="h-4 w-4" /> Calculation Logic — {line.account_name} ({line.dr_cr})
        </span>
        <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={onClose}>✕ Close</Button>
      </div>
      <pre className="text-amber-200 text-xs font-mono whitespace-pre-wrap leading-relaxed bg-black/30 rounded-lg p-3">
        {line.calc_explanation ?? "No calculation explanation available."}
      </pre>
    </div>
  );
}

// ─── Result Summary ───────────────────────────────────────────────────────────
function ResultSummary({ fnKey, result }: { fnKey: FnKey; result: any }) {
  const items: { label: string; value: string }[] = [];
  const fmt = (v: any) => v != null ? Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

  if (fnKey === "INITIAL_RECOGNITION") {
    items.push({ label: "ROU Asset", value: fmt(result.rou_asset) });
    items.push({ label: "Lease Liability", value: fmt(result.lease_liability) });
  } else if (fnKey === "INTEREST_ACCRUAL") {
    items.push({ label: "Interest Expense", value: fmt(result.interest_expense) });
  } else if (fnKey === "DEPRECIATION") {
    items.push({ label: "Monthly Depreciation", value: fmt(result.monthly_depreciation) });
  } else if (fnKey === "LEASE_PAYMENT") {
    items.push({ label: "Total Payment", value: fmt(result.total_payment) });
    items.push({ label: "Interest Portion", value: fmt(result.interest_portion) });
    items.push({ label: "Principal Portion", value: fmt(result.principal_portion) });
  } else if (fnKey === "MODIFICATION") {
    items.push({ label: "Old Liability", value: fmt(result.old_liability) });
    items.push({ label: "New Liability", value: fmt(result.new_liability) });
    items.push({ label: "Adjustment", value: fmt(result.adjustment) });
  } else if (fnKey === "TERMINATION") {
    items.push({ label: "Liability Derecognised", value: fmt(result.liability_derecognised) });
    items.push({ label: "ROU Derecognised", value: fmt(result.rou_derecognised) });
    items.push({ label: "Gain / (Loss)", value: fmt(result.gain_loss) });
  } else if (fnKey === "FX_REVALUATION") {
    items.push({ label: "Old Base Amount", value: fmt(result.old_base_amount) });
    items.push({ label: "New Base Amount", value: fmt(result.new_base_amount) });
    items.push({ label: "FX Gain / (Loss)", value: fmt(result.fx_gain_loss) });
  } else if (fnKey === "PERIOD_CLOSE") {
    items.push({ label: "Interest Expense", value: fmt(result.interest_expense) });
    items.push({ label: "Depreciation", value: fmt(result.depreciation) });
    items.push({ label: "Total Expense", value: fmt(result.total_expense) });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
      {items.map(item => (
        <div key={item.label} className="rounded-lg bg-muted/40 px-4 py-3 border border-border">
          <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
          <p className="font-mono font-bold text-foreground">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TransactionEngine() {
  const [currentStep, setCurrentStep] = useState(0);
  const [contractId, setContractId] = useState<number | null>(null);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [newMonthlyPayment, setNewMonthlyPayment] = useState("");
  const [newTermMonths, setNewTermMonths] = useState("");
  const [remainingLiability, setRemainingLiability] = useState("");
  const [remainingRou, setRemainingRou] = useState("");
  const [oldFxRate, setOldFxRate] = useState("3.64");
  const [newFxRate, setNewFxRate] = useState("3.68");
  const [runResult, setRunResult] = useState<Record<FnKey, any>>({} as any);
  const [jvLines, setJvLines] = useState<Record<FnKey, any[]>>({} as any);
  const [calcLine, setCalcLine] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const fn = FUNCTIONS[currentStep];
  const FnIcon = fn.icon;

  // Queries
  const { data: contracts } = trpc.transactionEngine.getContracts.useQuery();
  const { data: scenarios, refetch: refetchScenarios } = trpc.transactionEngine.listScenarios.useQuery({});

  // Selected contract details
  const selectedContract = useMemo(
    () => contracts?.find(c => c.contract_id === contractId),
    [contracts, contractId]
  );

  // Mutations
  const runInitial   = trpc.transactionEngine.runInitialRecognition.useMutation();
  const runInterest  = trpc.transactionEngine.runInterestAccrual.useMutation();
  const runDep       = trpc.transactionEngine.runDepreciation.useMutation();
  const runPayment   = trpc.transactionEngine.runLeasePayment.useMutation();
  const runMod       = trpc.transactionEngine.runModification.useMutation();
  const runTerm      = trpc.transactionEngine.runTermination.useMutation();
  const runFX        = trpc.transactionEngine.runFXRevaluation.useMutation();
  const runClose     = trpc.transactionEngine.runPeriodClose.useMutation();
  const postJV       = trpc.transactionEngine.postJV.useMutation();
  const getJVLines   = trpc.transactionEngine.getJVLines.useQuery(
    { jv_id: runResult[fn.key]?.jv_id ?? 0 },
    { enabled: !!runResult[fn.key]?.jv_id }
  );

  // Auto-populate modification defaults from selected contract
  const handleContractChange = (val: string) => {
    const id = parseInt(val);
    setContractId(id);
    const c = contracts?.find(c => c.contract_id === id);
    if (c) {
      setNewMonthlyPayment(String(c.monthly_payment ?? ""));
      setNewTermMonths(String(c.term_months ?? ""));
      setRemainingLiability(String(c.lease_liability_commence ?? ""));
      setRemainingRou(String(c.rou_asset_value ?? ""));
    }
  };

  const handleRun = async () => {
    if (!contractId) { toast.error("Please select a contract first"); return; }
    setRunning(true);
    setCalcLine(null);
    try {
      let result: any;
      if (fn.key === "INITIAL_RECOGNITION") {
        result = await runInitial.mutateAsync({ contract_id: contractId });
      } else if (fn.key === "INTEREST_ACCRUAL") {
        result = await runInterest.mutateAsync({ contract_id: contractId, period_year: periodYear, period_month: periodMonth });
      } else if (fn.key === "DEPRECIATION") {
        result = await runDep.mutateAsync({ contract_id: contractId, period_year: periodYear, period_month: periodMonth });
      } else if (fn.key === "LEASE_PAYMENT") {
        result = await runPayment.mutateAsync({ contract_id: contractId, period_year: periodYear, period_month: periodMonth });
      } else if (fn.key === "MODIFICATION") {
        result = await runMod.mutateAsync({ contract_id: contractId, new_monthly_payment: parseFloat(newMonthlyPayment), new_term_months: parseInt(newTermMonths) });
      } else if (fn.key === "TERMINATION") {
        result = await runTerm.mutateAsync({ contract_id: contractId, remaining_liability: parseFloat(remainingLiability), remaining_rou: parseFloat(remainingRou) });
      } else if (fn.key === "FX_REVALUATION") {
        result = await runFX.mutateAsync({ contract_id: contractId, old_fx_rate: parseFloat(oldFxRate), new_fx_rate: parseFloat(newFxRate) });
      } else if (fn.key === "PERIOD_CLOSE") {
        result = await runClose.mutateAsync({ contract_id: contractId, period_year: periodYear, period_month: periodMonth });
      }
      setRunResult(prev => ({ ...prev, [fn.key]: result }));
      toast.success(`${fn.label} — JV ${result.jv_number} created`);
      await refetchScenarios();
    } catch (e: any) {
      toast.error(`${fn.label} failed: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handlePostJV = async () => {
    const jvId = runResult[fn.key]?.jv_id;
    if (!jvId) return;
    try {
      await postJV.mutateAsync({ jv_id: jvId });
      toast.success("JV posted to ledger");
      await refetchScenarios();
    } catch (e: any) {
      toast.error(`Post failed: ${e.message}`);
    }
  };

  const handleNext = () => {
    if (currentStep < FUNCTIONS.length - 1) {
      setCurrentStep(s => s + 1);
      setCalcLine(null);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
      setCalcLine(null);
    }
  };

  const currentResult = runResult[fn.key];
  const currentJVLines = getJVLines.data?.lines ?? [];
  const allPassed = FUNCTIONS.every(f => runResult[f.key]?.success);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full min-h-screen bg-background">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="border-b border-border px-6 py-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Transaction Engine — IFRS 16 Scenario Runner
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Step through each accounting function, run test scenarios, review JV entries, and post to the ledger.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {allPassed && (
                <Badge className="bg-green-600 text-white gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> All 8 Functions Passed
                </Badge>
              )}
              <Badge variant="outline" className="text-muted-foreground">
                Step {currentStep + 1} / {FUNCTIONS.length}
              </Badge>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5 mt-4">
            {FUNCTIONS.map((f, idx) => {
              const done = !!runResult[f.key];
              const active = idx === currentStep;
              return (
                <button
                  key={f.key}
                  onClick={() => { setCurrentStep(idx); setCalcLine(null); }}
                  className={`flex-1 h-2 rounded-full transition-all duration-200 ${
                    done ? "bg-green-500" : active ? "bg-amber-500" : "bg-muted"
                  }`}
                  title={f.label}
                />
              );
            })}
          </div>
          <div className="flex gap-1.5 mt-1">
            {FUNCTIONS.map((f, idx) => (
              <div key={f.key} className={`flex-1 text-center text-[9px] truncate ${idx === currentStep ? "text-amber-500 font-semibold" : "text-muted-foreground"}`}>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex flex-1 gap-0 overflow-hidden">
          {/* Left: Function step panel */}
          <div className="w-full max-w-2xl border-r border-border flex flex-col overflow-y-auto p-6 gap-5">
            {/* Function card */}
            <div className={`rounded-xl border p-5 ${fn.bg} transition-all duration-200`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2.5 bg-background/60 ${fn.color}`}>
                  <FnIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-lg text-foreground">{fn.label}</h2>
                    <Badge variant="outline" className="text-xs font-mono">{fn.standard}</Badge>
                    {currentResult && (
                      <Badge className="bg-green-600 text-white gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> PASS
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{fn.description}</p>
                </div>
              </div>
            </div>

            {/* Contract selector */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Contract</Label>
              <Select value={contractId?.toString() ?? ""} onValueChange={handleContractChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a contract…" />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.map(c => (
                    <SelectItem key={c.contract_id} value={String(c.contract_id)}>
                      {c.contract_ref} — {c.asset_type} ({c.currency} {Number(c.monthly_payment).toLocaleString()}/mo)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedContract && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { label: "IBR", value: `${(selectedContract.ibr * 100).toFixed(2)}%` },
                    { label: "Term", value: `${selectedContract.term_months}m` },
                    { label: "ROU Asset", value: Number(selectedContract.rou_asset_value).toLocaleString("en-US", { minimumFractionDigits: 0 }) },
                    { label: "Lease Liability", value: Number(selectedContract.lease_liability_commence).toLocaleString("en-US", { minimumFractionDigits: 0 }) },
                    { label: "Currency", value: selectedContract.currency },
                    { label: "Status", value: selectedContract.status },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg bg-muted/40 px-3 py-2 border border-border">
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className="font-semibold text-sm text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Period inputs (for functions that need them) */}
            {((fn.params as readonly string[]).includes("period_year") || (fn.params as readonly string[]).includes("period_month")) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Period Year</Label>
                  <Input type="number" value={periodYear} onChange={e => setPeriodYear(parseInt(e.target.value))} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Period Month</Label>
                  <Select value={String(periodMonth)} onValueChange={v => setPeriodMonth(parseInt(v))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i) => (
                        <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Modification params */}
            {fn.key === "MODIFICATION" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">New Monthly Payment</Label>
                  <Input type="number" value={newMonthlyPayment} onChange={e => setNewMonthlyPayment(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">New Term (months)</Label>
                  <Input type="number" value={newTermMonths} onChange={e => setNewTermMonths(e.target.value)} className="h-9" />
                </div>
              </div>
            )}

            {/* Termination params */}
            {fn.key === "TERMINATION" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Remaining Liability</Label>
                  <Input type="number" value={remainingLiability} onChange={e => setRemainingLiability(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Remaining ROU Asset</Label>
                  <Input type="number" value={remainingRou} onChange={e => setRemainingRou(e.target.value)} className="h-9" />
                </div>
              </div>
            )}

            {/* FX params */}
            {fn.key === "FX_REVALUATION" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Old FX Rate (to QAR)</Label>
                  <Input type="number" step="0.0001" value={oldFxRate} onChange={e => setOldFxRate(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">New FX Rate (to QAR)</Label>
                  <Input type="number" step="0.0001" value={newFxRate} onChange={e => setNewFxRate(e.target.value)} className="h-9" />
                </div>
              </div>
            )}

            {/* Run button */}
            <div className="flex gap-2">
              <Button
                onClick={handleRun}
                disabled={running || !contractId}
                className="flex-1 h-10 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                {running ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Running…</>
                ) : (
                  <><PlayCircle className="h-4 w-4 mr-2" /> Run Scenario</>
                )}
              </Button>
              {currentResult?.jv_id && (
                <Button
                  variant="outline"
                  onClick={handlePostJV}
                  disabled={postJV.isPending}
                  className="h-10 border-green-600 text-green-600 hover:bg-green-600/10"
                >
                  <FileText className="h-4 w-4 mr-1.5" /> Post JV
                </Button>
              )}
            </div>

            {/* Result summary */}
            {currentResult && (
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-green-400 text-sm">
                    Scenario Passed — JV {currentResult.jv_number}
                  </span>
                </div>
                <ResultSummary fnKey={fn.key} result={currentResult} />
              </div>
            )}

            {/* JV Lines */}
            {currentResult?.jv_id && (
              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  Journal Voucher Lines — {currentResult.jv_number}
                </h3>
                <JVLinesTable
                  lines={currentJVLines}
                  onCalcClick={line => setCalcLine(calcLine?.line_seq === line.line_seq ? null : line)}
                />
                {calcLine && <CalcBlackboard line={calcLine} onClose={() => setCalcLine(null)} />}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-2 border-t border-border">
              <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0} className="gap-1.5">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentStep === FUNCTIONS.length - 1}
                className="gap-1.5 bg-primary text-primary-foreground"
              >
                Next Function <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right: Scenario history log */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
                Scenario Run History
              </h3>
              <Button variant="ghost" size="sm" onClick={() => refetchScenarios()} className="h-7 text-xs gap-1">
                <RefreshCw className="h-3 w-3" /> Refresh
              </Button>
            </div>

            {/* Function summary cards */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {FUNCTIONS.map(f => {
                const Icon = f.icon;
                const done = !!runResult[f.key];
                const active = f.key === fn.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => { setCurrentStep(FUNCTIONS.findIndex(x => x.key === f.key)); setCalcLine(null); }}
                    className={`rounded-lg border p-3 text-left transition-all duration-150 ${
                      active ? "border-amber-500/60 bg-amber-500/10" :
                      done ? "border-green-500/40 bg-green-500/5" :
                      "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-3.5 w-3.5 ${f.color}`} />
                      <span className="text-xs font-semibold text-foreground">{f.label}</span>
                      {done && <CheckCircle2 className="h-3 w-3 text-green-500 ml-auto" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">{f.standard}</p>
                  </button>
                );
              })}
            </div>

            <Separator className="mb-4" />

            {/* Scenario log */}
            <div className="space-y-2">
              {(scenarios ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No scenarios run yet. Select a contract and run the first function.</p>
              )}
              {(scenarios ?? []).map((s: any) => {
                const fnDef = FUNCTIONS.find(f => f.key === s.function_type);
                const Icon = fnDef?.icon ?? Zap;
                return (
                  <div key={s.scenario_id} className={`rounded-lg border p-3 text-sm transition-all duration-150 ${
                    s.test_status === "PASS" ? "border-green-500/30 bg-green-500/5" :
                    s.test_status === "FAIL" ? "border-red-500/30 bg-red-500/5" :
                    "border-border bg-card"
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${fnDef?.color ?? "text-muted-foreground"}`} />
                        <span className="font-medium text-foreground text-xs">{s.scenario_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {s.jv_number && (
                          <Badge variant="outline" className="text-[10px] font-mono">{s.jv_number}</Badge>
                        )}
                        <Badge className={`text-[10px] ${s.test_status === "PASS" ? "bg-green-600" : s.test_status === "FAIL" ? "bg-red-600" : "bg-muted"} text-white`}>
                          {s.test_status}
                        </Badge>
                      </div>
                    </div>
                    {s.error_message && (
                      <p className="text-red-400 text-[10px] mt-1 font-mono">{s.error_message}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {s.run_by} · {s.run_at ? new Date(s.run_at).toLocaleString() : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
