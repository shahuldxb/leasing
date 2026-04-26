import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScreenHeader } from "@/components/ScreenHeader";
import { toast } from "sonner";
import { Calculator, Download, ChevronDown, ChevronRight,
  TrendingDown, Banknote, BookOpen, Building2,
  ArrowDownRight, BarChart3, HelpCircle, Info, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

// ── Column header with tooltip helper ─────────────────────────────────────────
function ColHead({ label, tip }: { label: string; tip: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {label}
            <HelpCircle className="w-3 h-3 text-muted-foreground/60 shrink-0" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface ScheduleRow {
  schedule_id: number | null;
  contract_id: number;
  contract_ref: string;
  asset_description: string;
  currency: string;
  monthly_payment: number;
  ibr: number;
  term_months: number;
  commencement_date: string;
  expiry_date: string;
  ifrs16_classification: string;
  contract_status: string;
  lessor_name: string;
  period_date: string;
  period_year: number;
  period_month: number;
  month_name: string;
  opening_liability: number;
  interest_expense: number;
  payment: number;
  principal: number;
  closing_liability: number;
  rou_nbv: number;
  depreciation: number;
  cumulative_depr: number;
  gl_lease_liability: string;
  gl_rou_asset: string;
  gl_accum_depreciation: string;
  gl_interest_expense: string;
  gl_depreciation_expense: string;
  gl_cash_bank: string;
}

interface GLEntry {
  period_year: number;
  period_month: number;
  month_name: string;
  je_ref: string;
  description: string;
  account_code: string;
  account_name: string;
  total_debit: number;
  total_credit: number;
  lease_count: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (v: number, currency = "QAR") =>
  `${currency} ${(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtNum = (v: number) =>
  (v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CLASS_COLOUR: Record<string, string> = {
  Finance:   "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Operating: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  ShortTerm: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LowValue:  "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

// ── Group rows by contract ─────────────────────────────────────────────────────
function groupByContract(rows: ScheduleRow[]) {
  const map = new Map<number, { meta: ScheduleRow; rows: ScheduleRow[] }>();
  for (const r of rows) {
    if (!map.has(r.contract_id)) {
      map.set(r.contract_id, { meta: r, rows: [] });
    }
    map.get(r.contract_id)!.rows.push(r);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.meta.contract_ref.localeCompare(b.meta.contract_ref)
  );
}

// ── Yearly aggregation within a contract ──────────────────────────────────────
function aggregateYearly(rows: ScheduleRow[]) {
  const map = new Map<number, {
    year: number; months: ScheduleRow[];
    total_payment: number; total_interest: number; total_principal: number;
    total_depreciation: number; opening_liability: number; closing_liability: number;
    rou_nbv_end: number;
  }>();
  for (const r of rows) {
    if (!map.has(r.period_year)) {
      map.set(r.period_year, {
        year: r.period_year, months: [],
        total_payment: 0, total_interest: 0, total_principal: 0,
        total_depreciation: 0,
        opening_liability: r.opening_liability,
        closing_liability: r.closing_liability,
        rou_nbv_end: r.rou_nbv,
      });
    }
    const y = map.get(r.period_year)!;
    y.months.push(r);
    y.total_payment      += r.payment;
    y.total_interest     += r.interest_expense;
    y.total_principal    += r.principal;
    y.total_depreciation += r.depreciation;
    y.closing_liability   = r.closing_liability;
    y.rou_nbv_end         = r.rou_nbv;
  }
  return Array.from(map.values()).sort((a, b) => a.year - b.year);
}

// ── GL period grouping ─────────────────────────────────────────────────────────
function groupGLByPeriod(entries: GLEntry[]) {
  const map = new Map<string, { label: string; year: number; month: number; rows: GLEntry[] }>();
  for (const e of entries) {
    const key = `${e.period_year}-${String(e.period_month).padStart(2, "0")}`;
    if (!map.has(key)) {
      map.set(key, { label: `${e.month_name} ${e.period_year}`, year: e.period_year, month: e.period_month, rows: [] });
    }
    map.get(key)!.rows.push(e);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );
}

// ── Available years from data ──────────────────────────────────────────────────
function getYears(rows: ScheduleRow[]) {
  const s = new Set<number>();
  rows.forEach(r => s.add(r.period_year));
  return Array.from(s).sort();
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Amortisation() {
  const currentYear = new Date().getFullYear();
  const [year, setYear]         = useState<number>(currentYear);
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [expandedContracts, setExpandedContracts] = useState<Set<number>>(new Set());
  const [expandedPeriods, setExpandedPeriods]     = useState<Set<string>>(new Set());
  const [showGuide, setShowGuide]                 = useState(false);
  const [showBlackboard, setShowBlackboard]       = useState(false);

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: rawSchedule, isLoading: loadingSchedule } =
    trpc.lease.getAmortisationScheduleAll.useQuery({ year, viewMode });

  const { data: rawGL, isLoading: loadingGL } =
    trpc.lease.getConsolidatedGLEntries.useQuery({ year, viewMode });

  const scheduleRows: ScheduleRow[] = Array.isArray(rawSchedule) ? rawSchedule as ScheduleRow[] : [];
  const glEntries:   GLEntry[]      = Array.isArray(rawGL)       ? rawGL       as GLEntry[]      : [];

  const grouped    = useMemo(() => groupByContract(scheduleRows), [scheduleRows]);
  const glPeriods  = useMemo(() => groupGLByPeriod(glEntries),    [glEntries]);
  const availYears = useMemo(() => {
    const ys = getYears(scheduleRows);
    if (!ys.includes(currentYear)) ys.unshift(currentYear);
    return ys;
  }, [scheduleRows]);

  // ── KPI totals ────────────────────────────────────────────────────────────
  const totalPayment      = scheduleRows.reduce((s, r) => s + r.payment,          0);
  const totalInterest     = scheduleRows.reduce((s, r) => s + r.interest_expense, 0);
  const totalPrincipal    = scheduleRows.reduce((s, r) => s + r.principal,        0);
  const totalDepreciation = scheduleRows.reduce((s, r) => s + r.depreciation,     0);
  const leaseCount        = grouped.length;

  // ── Calculate amortisation mutation ─────────────────────────────────────
  const utils = trpc.useUtils();
  const calcMut = trpc.lease.calculateAmortisationAll.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Amortisation calculated: ${data.contracts_processed} leases, ${data.rows_inserted} schedule rows generated.`
      );
      utils.lease.getAmortisationScheduleAll.invalidate();
      utils.lease.getConsolidatedGLEntries.invalidate();
    },
    onError: (err) => toast.error(`Calculation failed: ${err.message}`),
  });

  const toggleContract = (id: number) => {
    setExpandedContracts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePeriod = (key: string) => {
    setExpandedPeriods(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const expandAll   = () => setExpandedContracts(new Set(grouped.map(g => g.meta.contract_id)));
  const collapseAll = () => setExpandedContracts(new Set());

  return (
    <DashboardLayout>
      <ScreenHeader
        screenId="VFLAMORT0001P001"
        screenType="amortisation"
        title="Amortisation Schedule — All Leases"
        subtitle="IFRS 16 consolidated amortisation schedule and GL accounting entries"
      />

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="px-6 pb-4">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
          {/* Year selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Financial Year</label>
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-32 border-[#e60000]/40 focus:border-[#e60000]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Years</SelectItem>
                {availYears.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monthly / Yearly toggle */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">View</label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["monthly", "yearly"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    viewMode === m
                      ? "bg-[#e60000] text-white"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Expand / Collapse all + Calculate */}
          <div className="ml-auto flex gap-2 items-end">
            <Button size="sm" variant="outline" onClick={() => setShowGuide(true)} className="flex items-center gap-1.5">
              <Info className="h-4 w-4" />
              How is this calculated?
            </Button>
            <Button size="sm" variant="outline" onClick={expandAll}>Expand All</Button>
            <Button size="sm" variant="outline" onClick={collapseAll}>Collapse All</Button>
            <Button
              size="sm"
              className="bg-[#e60000] hover:bg-[#cc0000] text-white flex items-center gap-1.5"
              onClick={() => calcMut.mutate()}
              disabled={calcMut.isPending}
            >
              <Calculator className="h-4 w-4" />
              {calcMut.isPending ? "Calculating…" : "Calculate Amortisation"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Leases",           value: leaseCount,        icon: Building2,     colour: "text-[#e60000]",    isCount: true },
          { label: "Total Payments",   value: totalPayment,      icon: Banknote,      colour: "text-blue-400",     isCount: false },
          { label: "Total Interest",   value: totalInterest,     icon: TrendingDown,  colour: "text-amber-400",    isCount: false },
          { label: "Total Principal",  value: totalPrincipal,    icon: ArrowDownRight,colour: "text-emerald-400",  isCount: false },
          { label: "Total Depreciation",value: totalDepreciation,icon: Calculator,    colour: "text-purple-400",   isCount: false },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <k.icon className={`w-4 h-4 ${k.colour}`} />
            </div>
            <div className={`text-lg font-bold ${k.colour}`}>
              {k.isCount ? k.value : fmtNum(k.value as number)}
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          GRID 1 — Amortisation Schedule (grouped by lease)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="px-6 pb-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#e60000]" />
            <span className="text-sm font-semibold">Amortisation Schedule</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {grouped.length} leases · {scheduleRows.length} periods
            </span>
          </div>

          {loadingSchedule ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <Calculator className="w-7 h-7 mx-auto mb-2 animate-pulse" />
              Loading schedule…
            </div>
          ) : grouped.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No amortisation data found for the selected period.
              <div className="text-xs mt-1">Click <strong>Calculate Amortisation</strong> to generate schedules for all active leases.</div>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-[520px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="bg-muted/10">
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Lease / Period</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Asset / Lessor</TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">
                      <ColHead label="Opening Liability" tip="The outstanding lease obligation at the start of the period — i.e. how much of the villa rent is still owed to the lessor under IFRS 16 at the beginning of this month/year." />
                    </TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">
                      <ColHead label="Interest" tip="The finance cost for this period. Under IFRS 16, even a simple villa lease is treated like a loan: the outstanding obligation earns interest at the IBR (Incremental Borrowing Rate). This is the cost of 'borrowing' the right to use the property." />
                    </TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">
                      <ColHead label="Payment" tip="The actual monthly rent paid to the lessor for this period. This is the cash that leaves your bank account." />
                    </TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">
                      <ColHead label="Principal" tip="The portion of the monthly rent that reduces the lease obligation. Payment = Interest + Principal. After paying interest, the remainder chips away at the outstanding liability — like paying down a mortgage." />
                    </TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">
                      <ColHead label="Closing Liability" tip="The outstanding lease obligation at the end of the period (Opening Liability minus Principal). This is what remains on the balance sheet as a liability after this month's payment." />
                    </TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">
                      <ColHead label="ROU NBV" tip="Right-of-Use Asset Net Book Value — the remaining value of your right to occupy the villa. It starts at the total lease value and reduces each month by the depreciation charge, similar to how a fixed asset depreciates." />
                    </TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">
                      <ColHead label="Depreciation" tip="The monthly portion of the Right-of-Use asset value charged to the P&L. The villa's usage right is spread evenly over the lease term (straight-line). This is an accounting charge, not a cash payment." />
                    </TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">
                      <ColHead label="Cumul. Depr." tip="Total depreciation charged from the lease start date up to this period. When this equals the original ROU asset value, the asset is fully depreciated." />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped.map(({ meta, rows }) => {
                    const isOpen = expandedContracts.has(meta.contract_id);
                    const currency = meta.currency || "QAR";

                    // Totals for this contract
                    const cTotalPayment   = rows.reduce((s, r) => s + r.payment,          0);
                    const cTotalInterest  = rows.reduce((s, r) => s + r.interest_expense, 0);
                    const cTotalPrincipal = rows.reduce((s, r) => s + r.principal,        0);
                    const cTotalDepr      = rows.reduce((s, r) => s + r.depreciation,     0);
                    const firstRow        = rows[0];
                    const lastRow         = rows[rows.length - 1];

                    // Yearly aggregation if needed
                    const displayRows = viewMode === "yearly" ? aggregateYearly(rows) : null;

                    return (
                      <React.Fragment key={`c-${meta.contract_id}`}>
                        {/* ── Contract group header row ───────────────── */}
                        <TableRow
                          className="cursor-pointer bg-muted/5 hover:bg-muted/15 transition-colors border-t-2 border-border/60"
                          onClick={() => toggleContract(meta.contract_id)}
                        >
                          <TableCell className="py-2.5 px-2">
                            {isOpen
                              ? <ChevronDown className="w-4 h-4 text-[#e60000]" />
                              : <ChevronRight className="w-4 h-4 text-[#e60000]" />}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#e60000] font-semibold text-sm">{meta.contract_ref}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${CLASS_COLOUR[meta.ifrs16_classification] ?? "bg-muted text-muted-foreground"}`}>
                                {meta.ifrs16_classification}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {meta.term_months} months
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="text-xs font-medium truncate max-w-[200px]">{meta.asset_description}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{meta.lessor_name}</div>
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-right font-mono">{fmtNum(firstRow?.opening_liability ?? 0)}</TableCell>
                          <TableCell className="py-2.5 text-xs text-right font-mono text-amber-400">{fmtNum(cTotalInterest)}</TableCell>
                          <TableCell className="py-2.5 text-xs text-right font-mono text-blue-400">{fmtNum(cTotalPayment)}</TableCell>
                          <TableCell className="py-2.5 text-xs text-right font-mono text-emerald-400">{fmtNum(cTotalPrincipal)}</TableCell>
                          <TableCell className="py-2.5 text-xs text-right font-mono">{fmtNum(lastRow?.closing_liability ?? 0)}</TableCell>
                          <TableCell className="py-2.5 text-xs text-right font-mono text-purple-400">{fmtNum(lastRow?.rou_nbv ?? 0)}</TableCell>
                          <TableCell className="py-2.5 text-xs text-right font-mono">{fmtNum(cTotalDepr)}</TableCell>
                          <TableCell className="py-2.5 text-xs text-right font-mono text-muted-foreground">{fmtNum(lastRow?.cumulative_depr ?? 0)}</TableCell>
                        </TableRow>

                        {/* ── Expanded: monthly rows ────────────────────── */}
                        {isOpen && viewMode === "monthly" && rows.map(r => (
                          <TableRow key={`r-${r.schedule_id ?? r.period_date}-${r.contract_id}`}
                            className="bg-muted/3 hover:bg-muted/8">
                            <TableCell className="py-1.5 px-2"></TableCell>
                            <TableCell className="py-1.5 pl-6 text-xs text-muted-foreground">
                              {r.month_name} {r.period_year}
                            </TableCell>
                            <TableCell className="py-1.5 text-xs text-muted-foreground">—</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono">{fmtNum(r.opening_liability)}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono text-amber-400">{fmtNum(r.interest_expense)}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono text-blue-400">{fmtNum(r.payment)}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono text-emerald-400">{fmtNum(r.principal)}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono">{fmtNum(r.closing_liability)}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono text-purple-400">{fmtNum(r.rou_nbv)}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono">{fmtNum(r.depreciation)}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono text-muted-foreground">{fmtNum(r.cumulative_depr)}</TableCell>
                          </TableRow>
                        ))}

                        {/* ── Expanded: yearly rows ─────────────────────── */}
                        {isOpen && viewMode === "yearly" && displayRows!.map(yr => (
                          <TableRow key={`yr-${meta.contract_id}-${yr.year}`}
                            className="bg-muted/3 hover:bg-muted/8">
                            <TableCell className="py-1.5 px-2"></TableCell>
                            <TableCell className="py-1.5 pl-6 text-xs font-semibold">{yr.year}</TableCell>
                            <TableCell className="py-1.5 text-xs text-muted-foreground">{yr.months.length} months</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono">{fmtNum(yr.opening_liability)}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono text-amber-400">{fmtNum(yr.total_interest)}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono text-blue-400">{fmtNum(yr.total_payment)}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono text-emerald-400">{fmtNum(yr.total_principal)}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono">{fmtNum(yr.closing_liability)}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono text-purple-400">{fmtNum(yr.rou_nbv_end)}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono">{fmtNum(yr.total_depreciation)}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono text-muted-foreground">—</TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {/* ── Grand totals row ─────────────────────────────────── */}
                  {scheduleRows.length > 0 && (
                    <TableRow className="bg-[#e60000]/10 border-t-2 border-[#e60000]/30 font-bold">
                      <TableCell></TableCell>
                      <TableCell className="py-2.5 text-sm text-[#e60000]">TOTAL</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{leaseCount} leases</TableCell>
                      <TableCell className="py-2.5 text-xs text-right font-mono">—</TableCell>
                      <TableCell className="py-2.5 text-xs text-right font-mono text-amber-400">{fmtNum(totalInterest)}</TableCell>
                      <TableCell className="py-2.5 text-xs text-right font-mono text-blue-400">{fmtNum(totalPayment)}</TableCell>
                      <TableCell className="py-2.5 text-xs text-right font-mono text-emerald-400">{fmtNum(totalPrincipal)}</TableCell>
                      <TableCell className="py-2.5 text-xs text-right font-mono">—</TableCell>
                      <TableCell className="py-2.5 text-xs text-right font-mono">—</TableCell>
                      <TableCell className="py-2.5 text-xs text-right font-mono">{fmtNum(totalDepreciation)}</TableCell>
                      <TableCell className="py-2.5 text-xs text-right font-mono">—</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          GRID 2 — Consolidated GL Accounting Entries
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="px-6 pb-8">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#e60000]" />
            <span className="text-sm font-semibold">Consolidated GL Accounting Entries</span>
            <span className="ml-2 text-xs text-muted-foreground">
              All leases · grouped by period
            </span>
            <span className="ml-auto text-xs text-muted-foreground italic">
              Debit = blue · Credit = emerald
            </span>
          </div>

          {loadingGL ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              <BookOpen className="w-6 h-6 mx-auto mb-2 animate-pulse" />
              Loading GL entries…
            </div>
          ) : glPeriods.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No GL entries found for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-[420px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="bg-muted/10">
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Period / JE</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Description</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Account Code</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Account Name</TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">Debit</TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">Credit</TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">Leases</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {glPeriods.map(period => {
                    const key     = `gl-${period.year}-${period.month}`;
                    const isOpen  = expandedPeriods.has(key);
                    const pDebit  = period.rows.reduce((s, r) => s + r.total_debit,  0);
                    const pCredit = period.rows.reduce((s, r) => s + r.total_credit, 0);

                    return (
                      <React.Fragment key={key}>
                        {/* ── Period group header ───────────────────────── */}
                        <TableRow
                          className="cursor-pointer bg-muted/5 hover:bg-muted/15 transition-colors border-t-2 border-border/60"
                          onClick={() => togglePeriod(key)}
                        >
                          <TableCell className="py-2.5 px-2">
                            {isOpen
                              ? <ChevronDown className="w-4 h-4 text-[#e60000]" />
                              : <ChevronRight className="w-4 h-4 text-[#e60000]" />}
                          </TableCell>
                          <TableCell className="py-2.5 font-semibold text-sm">{period.label}</TableCell>
                          <TableCell className="py-2.5 text-xs text-muted-foreground">{period.rows.length} entries</TableCell>
                          <TableCell className="py-2.5 text-xs text-muted-foreground">—</TableCell>
                          <TableCell className="py-2.5 text-xs text-muted-foreground">—</TableCell>
                          <TableCell className="py-2.5 text-xs text-right font-mono text-blue-400 font-semibold">{fmtNum(pDebit)}</TableCell>
                          <TableCell className="py-2.5 text-xs text-right font-mono text-emerald-400 font-semibold">{fmtNum(pCredit)}</TableCell>
                          <TableCell className="py-2.5 text-xs text-right text-muted-foreground">
                            {Math.max(...period.rows.map(r => r.lease_count))}
                          </TableCell>
                        </TableRow>

                        {/* ── Expanded: individual GL lines ─────────────── */}
                        {isOpen && period.rows.map((e, i) => (
                          <TableRow
                            key={`${key}-${i}`}
                            className={`hover:bg-muted/8 ${e.total_debit > 0 ? "bg-blue-500/3" : "bg-emerald-500/3"}`}
                          >
                            <TableCell className="py-1.5 px-2"></TableCell>
                            <TableCell className="py-1.5 pl-6">
                              <span className="text-[10px] font-mono bg-[#e60000]/15 text-[#e60000] px-1.5 py-0.5 rounded">
                                {e.je_ref}
                              </span>
                            </TableCell>
                            <TableCell className="py-1.5 text-xs text-muted-foreground">{e.description}</TableCell>
                            <TableCell className={`py-1.5 text-xs font-mono font-semibold ${e.total_debit > 0 ? "text-blue-400" : "text-emerald-400"}`}>
                              {e.account_code}
                            </TableCell>
                            <TableCell className="py-1.5 text-xs">{e.account_name}</TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono text-blue-400">
                              {e.total_debit > 0 ? fmtNum(e.total_debit) : "—"}
                            </TableCell>
                            <TableCell className="py-1.5 text-xs text-right font-mono text-emerald-400">
                              {e.total_credit > 0 ? fmtNum(e.total_credit) : "—"}
                            </TableCell>
                                <TableCell className="py-1.5 text-xs text-right text-muted-foreground">{e.lease_count}</TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {/* ── Grand totals row ──────────────────────────────── */}
                  {glEntries.length > 0 && (
                    <TableRow className="bg-[#e60000]/10 border-t-2 border-[#e60000]/30 font-bold">
                      <TableCell></TableCell>
                      <TableCell className="py-2.5 text-sm text-[#e60000]">TOTAL</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="py-2.5 text-xs text-right font-mono text-blue-400">
                        {fmtNum(glEntries.reduce((s, e) => s + e.total_debit,  0))}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-right font-mono text-emerald-400">
                        {fmtNum(glEntries.reduce((s, e) => s + e.total_credit, 0))}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
      {/* ── How is this calculated? Guide Modal ─────────────────────────── */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-[#e60000]" />
              How is the Amortisation Schedule Calculated?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              IFRS 16 Effective Interest Method — plain-English guide with a worked example
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 text-sm">

            {/* ── Step 1: Opening Liability ── */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-[#e60000] mb-2">Step 1 — Opening Liability (Present Value)</h3>
              <p className="text-muted-foreground mb-3">
                On Day 1, the lease is recognised on the balance sheet at its <strong>Present Value (PV)</strong> —
                what all future rent payments are worth <em>today</em>, discounted at the lease's IBR (Incremental Borrowing Rate).
                This is the <strong>Opening Liability</strong> shown in the first row.
              </p>
              <div className="bg-muted/40 rounded p-3 font-mono text-xs space-y-1">
                <div className="text-muted-foreground">Formula: PV = PMT × (1 − (1 + r)^−n) / r</div>
                <div className="text-muted-foreground">Where: PMT = monthly rent, r = IBR ÷ 12, n = term in months</div>
                <div className="mt-2 text-foreground font-semibold">Example (12,000/month × 36 months @ 5% IBR):</div>
                <div>r = 5% ÷ 12 = 0.4167% per month</div>
                <div>PV = 12,000 × (1 − (1.004167)^−36) / 0.004167</div>
                <div className="text-emerald-400 font-bold">Opening Liability = QAR 395,400</div>
              </div>
            </div>

            {/* ── Step 2: Monthly Interest ── */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-amber-400 mb-2">Step 2 — Interest (Finance Cost)</h3>
              <p className="text-muted-foreground mb-3">
                Each month, the outstanding liability "earns" interest at the IBR rate — just like a bank loan.
                This is the <strong>Interest</strong> column. It is a P&amp;L charge (finance cost) but <em>no cash moves</em>.
              </p>
              <div className="bg-muted/40 rounded p-3 font-mono text-xs space-y-1">
                <div className="text-muted-foreground">Formula: Interest = Opening Liability × (IBR ÷ 12)</div>
                <div className="mt-2 text-foreground font-semibold">Month 1 example:</div>
                <div>Interest = 395,400 × (5% ÷ 12)</div>
                <div className="text-amber-400 font-bold">Interest = QAR 1,648</div>
              </div>
            </div>

            {/* ── Step 3: Payment ── */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-blue-400 mb-2">Step 3 — Payment (Cash Out)</h3>
              <p className="text-muted-foreground mb-3">
                The <strong>Payment</strong> column is the actual monthly rent paid to the landlord — the cash that leaves your bank account.
                This is always the fixed monthly rent amount from the Lease Register.
              </p>
              <div className="bg-muted/40 rounded p-3 font-mono text-xs space-y-1">
                <div className="text-muted-foreground">Payment = monthly_payment from Lease Register</div>
                <div className="mt-2 text-foreground font-semibold">Month 1 example:</div>
                <div className="text-blue-400 font-bold">Payment = QAR 12,000</div>
              </div>
            </div>

            {/* ── Step 4: Principal ── */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-emerald-400 mb-2">Step 4 — Principal (Liability Reduction)</h3>
              <p className="text-muted-foreground mb-3">
                <strong>Principal</strong> is the portion of the payment that reduces the outstanding lease obligation.
                Think of it as "paying down the debt". It is calculated as Payment minus Interest.
              </p>
              <div className="bg-muted/40 rounded p-3 font-mono text-xs space-y-1">
                <div className="text-muted-foreground">Formula: Principal = Payment − Interest</div>
                <div className="mt-2 text-foreground font-semibold">Month 1 example:</div>
                <div>Principal = 12,000 − 1,648</div>
                <div className="text-emerald-400 font-bold">Principal = QAR 10,352</div>
              </div>
            </div>

            {/* ── Step 5: Closing Liability ── */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold mb-2">Step 5 — Closing Liability</h3>
              <p className="text-muted-foreground mb-3">
                The <strong>Closing Liability</strong> is what remains on the balance sheet after this month's payment.
                It becomes next month's Opening Liability. By the final month it reaches zero.
              </p>
              <div className="bg-muted/40 rounded p-3 font-mono text-xs space-y-1">
                <div className="text-muted-foreground">Formula: Closing = Opening − Principal</div>
                <div className="mt-2 text-foreground font-semibold">Month 1 example:</div>
                <div>Closing = 395,400 − 10,352</div>
                <div className="font-bold">Closing Liability = QAR 385,048</div>
              </div>
            </div>

            {/* ── Step 6: Depreciation ── */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-semibold text-purple-400 mb-2">Step 6 — Depreciation (ROU Asset)</h3>
              <p className="text-muted-foreground mb-3">
                On Day 1, a <strong>Right-of-Use (ROU) Asset</strong> equal to the Opening Liability is recognised.
                This asset is depreciated straight-line over the lease term. The <strong>Depreciation</strong> column
                is the monthly P&amp;L charge — it is non-cash (no money moves).
              </p>
              <div className="bg-muted/40 rounded p-3 font-mono text-xs space-y-1">
                <div className="text-muted-foreground">Formula: Depreciation = Opening Liability ÷ Term Months</div>
                <div className="mt-2 text-foreground font-semibold">Example:</div>
                <div>Depreciation = 395,400 ÷ 36</div>
                <div className="text-purple-400 font-bold">Monthly Depreciation = QAR 10,983</div>
              </div>
            </div>

            {/* ── Full Month 1 Summary ── */}
            <div className="rounded-lg border border-[#e60000]/30 bg-[#e60000]/5 p-4">
              <h3 className="font-semibold text-[#e60000] mb-3">Full Worked Example — Month 1 (Jan 2026)</h3>
              <p className="text-muted-foreground text-xs mb-3">Lease: 12,000/month × 36 months @ 5% IBR</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 font-semibold">Column</th>
                    <th className="text-right py-1.5 font-semibold">Amount (QAR)</th>
                    <th className="text-left py-1.5 pl-4 font-semibold">What it means</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr><td className="py-1.5">Opening Liability</td><td className="text-right font-mono">395,400</td><td className="pl-4 text-muted-foreground">PV of all future rents on Day 1</td></tr>
                  <tr><td className="py-1.5 text-amber-400">Interest</td><td className="text-right font-mono text-amber-400">1,648</td><td className="pl-4 text-muted-foreground">Finance cost (IBR × opening liability ÷ 12)</td></tr>
                  <tr><td className="py-1.5 text-blue-400">Payment</td><td className="text-right font-mono text-blue-400">12,000</td><td className="pl-4 text-muted-foreground">Cash paid to landlord this month</td></tr>
                  <tr><td className="py-1.5 text-emerald-400">Principal</td><td className="text-right font-mono text-emerald-400">10,352</td><td className="pl-4 text-muted-foreground">Debt reduction (Payment − Interest)</td></tr>
                  <tr><td className="py-1.5">Closing Liability</td><td className="text-right font-mono">385,048</td><td className="pl-4 text-muted-foreground">Remaining obligation (Opening − Principal)</td></tr>
                  <tr><td className="py-1.5 text-purple-400">Depreciation</td><td className="text-right font-mono text-purple-400">10,983</td><td className="pl-4 text-muted-foreground">ROU asset written off (non-cash P&amp;L)</td></tr>
                </tbody>
              </table>
              <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                <strong>P&amp;L impact this month:</strong> Interest (1,648) + Depreciation (10,983) = <strong className="text-foreground">QAR 12,631</strong> — slightly more than the cash paid (12,000) because interest is front-loaded.
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* ── Floating Blackboard Button ─────────────────────────────── */}
      <button
        onClick={() => setShowBlackboard(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
        style={{ background: "#1a1a2e", border: "2px solid #4ade80", color: "#4ade80", fontFamily: "'Courier New', monospace" }}
        title="Show blackboard calculation"
      >
        <span style={{ fontSize: "1.1rem" }}>&#x1F4D0;</span>
        Show Calculation
      </button>

      {/* ── Blackboard Calculation Modal ──────────────────────────── */}
      {showBlackboard && (() => {
        const ex = grouped[0]?.rows[0];
        if (!ex) return null;
        const PMT  = ex.monthly_payment;
        const IBR  = ex.ibr;
        const N    = ex.term_months;
        const r    = IBR / 12 / 100;
        const PV   = PMT * (1 - Math.pow(1 + r, -N)) / r;
        const INT  = PV * r;
        const PRIN = PMT - INT;
        const CL   = PV - PRIN;
        const DEPR = PV / N;
        const cur  = ex.currency || "QAR";
        const f    = (v: number) => `${cur} ${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const fp   = (v: number) => `${(v * 100).toFixed(4)}%`;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)" }}
            onClick={() => setShowBlackboard(false)}
          >
            <div
              className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-xl shadow-2xl"
              style={{
                background: "#1a2e1a",
                border: "3px solid #4ade80",
                fontFamily: "'Courier New', monospace",
                color: "#e2ffe2",
                boxShadow: "0 0 40px rgba(74,222,128,0.25), inset 0 0 60px rgba(0,0,0,0.4)",
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Chalk-dust texture overlay */}
              <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(74,222,128,0.03) 28px, rgba(74,222,128,0.03) 29px)" }} />

              {/* Header */}
              <div className="relative flex items-center justify-between px-6 pt-5 pb-3 border-b" style={{ borderColor: "rgba(74,222,128,0.3)" }}>
                <div>
                  <div className="text-lg font-bold" style={{ color: "#4ade80", textShadow: "0 0 8px rgba(74,222,128,0.5)" }}>IFRS 16 — Amortisation Calculation</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(74,222,128,0.6)" }}>Using: {ex.contract_ref} · Month 1 ({ex.month_name} {ex.period_year})</div>
                </div>
                <button onClick={() => setShowBlackboard(false)} style={{ color: "rgba(74,222,128,0.7)", fontSize: "1.4rem", lineHeight: 1 }}>&times;</button>
              </div>

              <div className="relative px-6 py-5 space-y-6">

                {/* Given values */}
                <div>
                  <div className="text-xs mb-2" style={{ color: "rgba(74,222,128,0.5)" }}>GIVEN (from Lease Register)</div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { lbl: "Monthly Rent (PMT)",  val: f(PMT) },
                      { lbl: "IBR (Annual %)",       val: `${IBR}%` },
                      { lbl: "Term (months)",        val: `${N} months` },
                    ].map(({ lbl, val }) => (
                      <div key={lbl} className="rounded p-2.5 text-center" style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)" }}>
                        <div className="text-[10px] mb-1" style={{ color: "rgba(74,222,128,0.55)" }}>{lbl}</div>
                        <div className="text-sm font-bold" style={{ color: "#86efac" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 1 */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold" style={{ color: "#fde68a" }}>STEP 1 — Monthly Interest Rate (r)</div>
                  <div className="text-sm pl-4" style={{ color: "#e2ffe2" }}>
                    r &nbsp;= &nbsp;IBR &divide; 12 &divide; 100
                  </div>
                  <div className="text-sm pl-4" style={{ color: "#86efac" }}>
                    r &nbsp;= &nbsp;{IBR}% &divide; 12 &divide; 100 &nbsp;= &nbsp;<span style={{ color: "#fde68a", fontWeight: "bold" }}>{fp(r)}</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold" style={{ color: "#fde68a" }}>STEP 2 — Opening Liability (Present Value of all future rents)</div>
                  <div className="text-sm pl-4" style={{ color: "#e2ffe2" }}>
                    <span style={{ color: "#93c5fd" }}>Opening Liability</span> &nbsp;= &nbsp;PMT &times; (1 &minus; (1 + r)<sup>&minus;N</sup>) &divide; r
                  </div>
                  <div className="text-sm pl-4" style={{ color: "#86efac" }}>
                    = &nbsp;{f(PMT)} &times; (1 &minus; (1 + {fp(r)})<sup>&minus;{N}</sup>) &divide; {fp(r)}
                  </div>
                  <div className="text-sm pl-4 font-bold" style={{ color: "#93c5fd" }}>
                    <span style={{ color: "#93c5fd" }}>Opening Liability</span> &nbsp;= &nbsp;<span style={{ color: "#fde68a" }}>{f(PV)}</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold" style={{ color: "#fde68a" }}>STEP 3 — Interest (Finance Cost for Month 1)</div>
                  <div className="text-sm pl-4" style={{ color: "#e2ffe2" }}>
                    <span style={{ color: "#fbbf24" }}>Interest</span> &nbsp;= &nbsp;<span style={{ color: "#93c5fd" }}>Opening Liability</span> &times; r
                  </div>
                  <div className="text-sm pl-4" style={{ color: "#86efac" }}>
                    = &nbsp;{f(PV)} &times; {fp(r)}
                  </div>
                  <div className="text-sm pl-4 font-bold">
                    <span style={{ color: "#fbbf24" }}>Interest</span> &nbsp;= &nbsp;<span style={{ color: "#fde68a" }}>{f(INT)}</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold" style={{ color: "#fde68a" }}>STEP 4 — Payment (Cash paid to landlord)</div>
                  <div className="text-sm pl-4" style={{ color: "#e2ffe2" }}>
                    <span style={{ color: "#60a5fa" }}>Payment</span> &nbsp;= &nbsp;Monthly Rent (fixed)
                  </div>
                  <div className="text-sm pl-4 font-bold">
                    <span style={{ color: "#60a5fa" }}>Payment</span> &nbsp;= &nbsp;<span style={{ color: "#fde68a" }}>{f(PMT)}</span>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold" style={{ color: "#fde68a" }}>STEP 5 — Principal (Liability Reduction)</div>
                  <div className="text-sm pl-4" style={{ color: "#e2ffe2" }}>
                    <span style={{ color: "#34d399" }}>Principal</span> &nbsp;= &nbsp;<span style={{ color: "#60a5fa" }}>Payment</span> &minus; <span style={{ color: "#fbbf24" }}>Interest</span>
                  </div>
                  <div className="text-sm pl-4" style={{ color: "#86efac" }}>
                    = &nbsp;{f(PMT)} &minus; {f(INT)}
                  </div>
                  <div className="text-sm pl-4 font-bold">
                    <span style={{ color: "#34d399" }}>Principal</span> &nbsp;= &nbsp;<span style={{ color: "#fde68a" }}>{f(PRIN)}</span>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold" style={{ color: "#fde68a" }}>STEP 6 — Closing Liability</div>
                  <div className="text-sm pl-4" style={{ color: "#e2ffe2" }}>
                    <span style={{ color: "#a78bfa" }}>Closing Liability</span> &nbsp;= &nbsp;<span style={{ color: "#93c5fd" }}>Opening Liability</span> &minus; <span style={{ color: "#34d399" }}>Principal</span>
                  </div>
                  <div className="text-sm pl-4" style={{ color: "#86efac" }}>
                    = &nbsp;{f(PV)} &minus; {f(PRIN)}
                  </div>
                  <div className="text-sm pl-4 font-bold">
                    <span style={{ color: "#a78bfa" }}>Closing Liability</span> &nbsp;= &nbsp;<span style={{ color: "#fde68a" }}>{f(CL)}</span>
                  </div>
                </div>

                {/* Step 7 */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold" style={{ color: "#fde68a" }}>STEP 7 — Depreciation (ROU Asset written off per month)</div>
                  <div className="text-sm pl-4" style={{ color: "#e2ffe2" }}>
                    <span style={{ color: "#c084fc" }}>Depreciation</span> &nbsp;= &nbsp;<span style={{ color: "#93c5fd" }}>Opening Liability</span> &divide; Term
                  </div>
                  <div className="text-sm pl-4" style={{ color: "#86efac" }}>
                    = &nbsp;{f(PV)} &divide; {N}
                  </div>
                  <div className="text-sm pl-4 font-bold">
                    <span style={{ color: "#c084fc" }}>Depreciation</span> &nbsp;= &nbsp;<span style={{ color: "#fde68a" }}>{f(DEPR)}</span>
                  </div>
                </div>

                {/* Summary row */}
                <div className="rounded-lg p-4 mt-2" style={{ background: "rgba(74,222,128,0.06)", border: "1px dashed rgba(74,222,128,0.35)" }}>
                  <div className="text-xs font-bold mb-3" style={{ color: "#4ade80" }}>MONTH 1 SUMMARY</div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                    {[
                      { lbl: "Opening Liability",  val: f(PV),   col: "#93c5fd" },
                      { lbl: "Interest",            val: f(INT),  col: "#fbbf24" },
                      { lbl: "Payment",             val: f(PMT),  col: "#60a5fa" },
                      { lbl: "Principal",           val: f(PRIN), col: "#34d399" },
                      { lbl: "Closing Liability",   val: f(CL),   col: "#a78bfa" },
                      { lbl: "Depreciation",        val: f(DEPR), col: "#c084fc" },
                    ].map(({ lbl, val, col }) => (
                      <div key={lbl} className="flex justify-between items-center">
                        <span style={{ color: "rgba(226,255,226,0.7)" }}>{lbl}</span>
                        <span className="font-bold" style={{ color: col }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 text-xs" style={{ borderTop: "1px solid rgba(74,222,128,0.2)", color: "rgba(74,222,128,0.6)" }}>
                    P&amp;L charge this month: Interest ({f(INT)}) + Depreciation ({f(DEPR)}) = <span style={{ color: "#fde68a", fontWeight: "bold" }}>{f(INT + DEPR)}</span>
                    &nbsp;&nbsp;·&nbsp;&nbsp; Cash paid: <span style={{ color: "#60a5fa" }}>{f(PMT)}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}
    </DashboardLayout>
  );
}
