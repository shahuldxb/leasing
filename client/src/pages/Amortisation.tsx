import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScreenHeader } from "@/components/ScreenHeader";
import { toast } from "sonner";
import {
  Calculator, Download, ChevronDown, ChevronRight,
  TrendingDown, DollarSign, Building2, Calendar,
  BookOpen, ArrowUpRight, ArrowDownRight, Banknote,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ScheduleRow {
  schedule_id: number | null;
  contract_id: number;
  period_no: number;
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

interface ContractHeader {
  contract_id: number;
  contract_ref: string;
  asset_description: string;
  asset_type: string;
  commencement_date: string;
  expiry_date: string;
  term_months: number;
  monthly_payment: number;
  currency: string;
  ibr: number;
  escalation_rate: number;
  deposit_amount: number;
  rou_asset_value: number | null;
  lease_liability_commence: number | null;
  ifrs16_classification: string;
  status: string;
  lessor_name: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (v: number, currency = "QAR") =>
  `${currency} ${(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtPct = (v: number) => `${((v ?? 0) * 100).toFixed(2)}%`;

const CLASSIFICATION_COLOUR: Record<string, string> = {
  Finance:   "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Operating: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  ShortTerm: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LowValue:  "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

// ── Accounting entries for a single period ─────────────────────────────────────
function buildJournalEntries(row: ScheduleRow, currency: string) {
  return [
    // 1. Lease payment (cash out)
    { ref: "JE-1", description: "Lease payment — cash disbursement",
      debit:  [{ account: row.gl_lease_liability, name: "Lease Liability",    amount: row.principal }],
      credit: [{ account: row.gl_cash_bank,        name: "Cash / Bank",        amount: row.payment   }],
      debitExtra: [{ account: row.gl_interest_expense, name: "Interest Expense", amount: row.interest_expense }],
    },
    // 2. ROU asset depreciation
    { ref: "JE-2", description: "ROU asset depreciation charge",
      debit:  [{ account: row.gl_depreciation_expense, name: "Depreciation Expense",   amount: row.depreciation }],
      credit: [{ account: row.gl_accum_depreciation,   name: "Accumulated Depreciation", amount: row.depreciation }],
      debitExtra: [],
    },
  ];
}

// ── Yearly aggregation ─────────────────────────────────────────────────────────
function aggregateYearly(rows: ScheduleRow[]) {
  const map = new Map<number, {
    year: number; months: ScheduleRow[];
    total_payment: number; total_interest: number; total_principal: number;
    total_depreciation: number; opening_liability: number; closing_liability: number;
    rou_nbv_start: number; rou_nbv_end: number;
  }>();
  for (const r of rows) {
    if (!map.has(r.period_year)) {
      map.set(r.period_year, {
        year: r.period_year, months: [],
        total_payment: 0, total_interest: 0, total_principal: 0,
        total_depreciation: 0,
        opening_liability: r.opening_liability, closing_liability: r.closing_liability,
        rou_nbv_start: r.rou_nbv + r.depreciation, rou_nbv_end: r.rou_nbv,
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

// ── Component ──────────────────────────────────────────────────────────────────
export default function Amortisation() {
  const [selectedId, setSelectedId]     = useState<number | null>(null);
  const [viewMode, setViewMode]         = useState<"monthly" | "yearly">("monthly");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Data
  const { data: leaseList } = trpc.lease.getLeaseListForAmortisation.useQuery();
  const leases: any[] = Array.isArray(leaseList) ? leaseList : [];

  const { data: scheduleData, isLoading } = trpc.lease.getAmortisationSchedule.useQuery(
    { contractId: selectedId! },
    { enabled: !!selectedId }
  );

  const header:   ContractHeader | null = (scheduleData as any)?.header   ?? null;
  const rawRows:  ScheduleRow[]         = (scheduleData as any)?.schedule ?? [];

  const yearlyRows = useMemo(() => aggregateYearly(rawRows), [rawRows]);

  const saveMut = trpc.lease.saveAmortisationSchedule.useMutation({
    onSuccess: () => toast.success("Schedule saved to database"),
    onError:   (e) => toast.error(e.message),
  });

  const toggleRow = (key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // KPI totals
  const totalPayment      = rawRows.reduce((s, r) => s + r.payment, 0);
  const totalInterest     = rawRows.reduce((s, r) => s + r.interest_expense, 0);
  const totalPrincipal    = rawRows.reduce((s, r) => s + r.principal, 0);
  const totalDepreciation = rawRows.reduce((s, r) => s + r.depreciation, 0);
  const currency          = header?.currency ?? "QAR";

  return (
    <DashboardLayout>
      <ScreenHeader
        screenId="VFLAMORT0001P001"
        screenType="amortisation"
        title="Amortisation Schedule"
        subtitle="IFRS 16 right-of-use asset amortisation & lease liability schedule"
      />

      {/* ── Lease Selector ─────────────────────────────────────────────────── */}
      <div className="px-6 pb-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[280px]">
              <label className="text-xs text-muted-foreground mb-1 block">Select Lease Contract</label>
              <Select
                value={selectedId ? String(selectedId) : ""}
                onValueChange={v => { setSelectedId(Number(v)); setExpandedRows(new Set()); }}
              >
                <SelectTrigger className="border-[#e60000]/40 focus:border-[#e60000]">
                  <SelectValue placeholder="Choose a lease to view its amortisation schedule…" />
                </SelectTrigger>
                <SelectContent>
                  {leases.map((l: any) => (
                    <SelectItem key={l.contract_id} value={String(l.contract_id)}>
                      <span className="text-[#e60000] font-mono mr-2">{l.contract_ref}</span>
                      {l.asset_description}
                      <span className="ml-2 text-muted-foreground text-xs">· {l.lessor_name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Monthly / Yearly toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("monthly")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === "monthly"
                    ? "bg-[#e60000] text-white"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setViewMode("yearly")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === "yearly"
                    ? "bg-[#e60000] text-white"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly
              </button>
            </div>

            {rawRows.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => saveMut.mutate({ contractId: selectedId!, schedule: rawRows.map(r => ({ period_date: new Date(r.period_date).toISOString().slice(0,10), opening_liability: r.opening_liability, interest_expense: r.interest_expense, payment: r.payment, principal: r.principal, closing_liability: r.closing_liability, rou_nbv: r.rou_nbv, depreciation: r.depreciation, cumulative_depr: r.cumulative_depr })) })}
                disabled={saveMut.isPending}
              >
                <Download className="w-4 h-4 mr-1" />
                {saveMut.isPending ? "Saving…" : "Save to DB"}
              </Button>
            )}
          </div>

          {/* Contract header strip */}
          {header && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
              <div className="bg-muted/20 rounded-lg px-3 py-2">
                <div className="text-muted-foreground mb-0.5">Ref</div>
                <div className="font-mono text-[#e60000] font-semibold">{header.contract_ref}</div>
              </div>
              <div className="bg-muted/20 rounded-lg px-3 py-2 col-span-2">
                <div className="text-muted-foreground mb-0.5">Asset</div>
                <div className="font-medium truncate">{header.asset_description}</div>
              </div>
              <div className="bg-muted/20 rounded-lg px-3 py-2">
                <div className="text-muted-foreground mb-0.5">Lessor</div>
                <div className="font-medium truncate">{header.lessor_name}</div>
              </div>
              <div className="bg-muted/20 rounded-lg px-3 py-2">
                <div className="text-muted-foreground mb-0.5">Term</div>
                <div className="font-medium">{header.term_months} months</div>
              </div>
              <div className="bg-muted/20 rounded-lg px-3 py-2">
                <div className="text-muted-foreground mb-0.5">IBR</div>
                <div className="font-medium">{fmtPct(header.ibr)}</div>
              </div>
              <div className="bg-muted/20 rounded-lg px-3 py-2">
                <div className="text-muted-foreground mb-0.5">Classification</div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${CLASSIFICATION_COLOUR[header.ifrs16_classification] ?? "bg-muted text-muted-foreground"}`}>
                  {header.ifrs16_classification}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      {rawRows.length > 0 && (
        <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Payments",      value: totalPayment,      icon: Banknote,      colour: "text-blue-400" },
            { label: "Total Interest",       value: totalInterest,     icon: TrendingDown,  colour: "text-amber-400" },
            { label: "Total Principal",      value: totalPrincipal,    icon: ArrowDownRight,colour: "text-emerald-400" },
            { label: "Total Depreciation",   value: totalDepreciation, icon: Calculator,    colour: "text-purple-400" },
          ].map(k => (
            <div key={k.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className={`w-4 h-4 ${k.colour}`} />
              </div>
              <div className={`text-lg font-bold ${k.colour}`}>
                {fmt(k.value, currency)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="px-6 py-12 text-center text-muted-foreground">
          <Calculator className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          Computing amortisation schedule…
        </div>
      )}

      {/* ── No lease selected ───────────────────────────────────────────────── */}
      {!selectedId && !isLoading && (
        <div className="px-6 py-16 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a lease contract above to view its IFRS 16 amortisation schedule.</p>
        </div>
      )}

      {/* ── MONTHLY VIEW ────────────────────────────────────────────────────── */}
      {viewMode === "monthly" && rawRows.length > 0 && (
        <div className="px-6 pb-8">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#e60000]" />
              <span className="text-sm font-semibold">Monthly Amortisation Schedule</span>
              <span className="ml-auto text-xs text-muted-foreground">{rawRows.length} periods</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10">
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Period</TableHead>
                    <TableHead className="text-xs text-right">Opening Liability</TableHead>
                    <TableHead className="text-xs text-right">Interest Expense</TableHead>
                    <TableHead className="text-xs text-right">Payment</TableHead>
                    <TableHead className="text-xs text-right">Principal</TableHead>
                    <TableHead className="text-xs text-right">Closing Liability</TableHead>
                    <TableHead className="text-xs text-right">ROU NBV</TableHead>
                    <TableHead className="text-xs text-right">Depreciation</TableHead>
                    <TableHead className="text-xs text-right">Cumul. Depr.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawRows.map((row) => {
                    const key = `m-${row.period_no}`;
                    const expanded = expandedRows.has(key);
                    const entries = buildJournalEntries(row, currency);
                    return (
                      <>
                        <TableRow
                          key={key}
                          className="cursor-pointer hover:bg-muted/10 transition-colors"
                          onClick={() => toggleRow(key)}
                        >
                          <TableCell className="py-2 px-2">
                            {expanded
                              ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                              : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                          </TableCell>
                          <TableCell className="py-2 text-xs text-muted-foreground">{row.period_no}</TableCell>
                          <TableCell className="py-2 text-xs font-medium">
                            {row.month_name} {row.period_year}
                          </TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono">{fmt(row.opening_liability, currency)}</TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono text-amber-400">{fmt(row.interest_expense, currency)}</TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono text-blue-400">{fmt(row.payment, currency)}</TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono text-emerald-400">{fmt(row.principal, currency)}</TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono">{fmt(row.closing_liability, currency)}</TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono text-purple-400">{fmt(row.rou_nbv, currency)}</TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono">{fmt(row.depreciation, currency)}</TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono text-muted-foreground">{fmt(row.cumulative_depr, currency)}</TableCell>
                        </TableRow>

                        {/* ── Accordion: Accounting Entries ─────────────────── */}
                        {expanded && (
                          <TableRow key={`${key}-acc`} className="bg-muted/5">
                            <TableCell colSpan={11} className="py-0 px-0">
                              <div className="px-6 py-4 border-t border-dashed border-border/50">
                                <div className="flex items-center gap-2 mb-3">
                                  <BookOpen className="w-3.5 h-3.5 text-[#e60000]" />
                                  <span className="text-xs font-semibold text-[#e60000]">
                                    Journal Entries — {row.month_name} {row.period_year}
                                  </span>
                                </div>
                                <div className="space-y-3">
                                  {entries.map(je => (
                                    <div key={je.ref} className="bg-card border border-border/60 rounded-lg overflow-hidden">
                                      <div className="px-3 py-2 bg-muted/20 border-b border-border/40 flex items-center gap-2">
                                        <span className="text-[10px] font-mono bg-[#e60000]/20 text-[#e60000] px-1.5 py-0.5 rounded">{je.ref}</span>
                                        <span className="text-xs text-muted-foreground">{je.description}</span>
                                      </div>
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="text-muted-foreground border-b border-border/30">
                                            <th className="text-left px-3 py-1.5 font-medium">Account Code</th>
                                            <th className="text-left px-3 py-1.5 font-medium">Account Name</th>
                                            <th className="text-right px-3 py-1.5 font-medium">Debit</th>
                                            <th className="text-right px-3 py-1.5 font-medium">Credit</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {/* Debit rows */}
                                          {je.debit.map((d, i) => (
                                            <tr key={`d-${i}`} className="border-b border-border/20">
                                              <td className="px-3 py-1.5 font-mono text-blue-400">{d.account}</td>
                                              <td className="px-3 py-1.5">{d.name}</td>
                                              <td className="px-3 py-1.5 text-right font-mono text-blue-400">{fmt(d.amount, currency)}</td>
                                              <td className="px-3 py-1.5 text-right text-muted-foreground">—</td>
                                            </tr>
                                          ))}
                                          {je.debitExtra.map((d, i) => (
                                            <tr key={`de-${i}`} className="border-b border-border/20">
                                              <td className="px-3 py-1.5 font-mono text-amber-400">{d.account}</td>
                                              <td className="px-3 py-1.5">{d.name}</td>
                                              <td className="px-3 py-1.5 text-right font-mono text-amber-400">{fmt(d.amount, currency)}</td>
                                              <td className="px-3 py-1.5 text-right text-muted-foreground">—</td>
                                            </tr>
                                          ))}
                                          {/* Credit rows */}
                                          {je.credit.map((c, i) => (
                                            <tr key={`c-${i}`}>
                                              <td className="px-3 py-1.5 font-mono text-emerald-400 pl-8">{c.account}</td>
                                              <td className="px-3 py-1.5 pl-8 italic">{c.name}</td>
                                              <td className="px-3 py-1.5 text-right text-muted-foreground">—</td>
                                              <td className="px-3 py-1.5 text-right font-mono text-emerald-400">{fmt(c.amount, currency)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* ── YEARLY VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === "yearly" && rawRows.length > 0 && (
        <div className="px-6 pb-8">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#e60000]" />
              <span className="text-sm font-semibold">Yearly Amortisation Summary</span>
              <span className="ml-auto text-xs text-muted-foreground">{yearlyRows.length} years</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10">
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="text-xs">Year</TableHead>
                    <TableHead className="text-xs text-right">Opening Liability</TableHead>
                    <TableHead className="text-xs text-right">Total Interest</TableHead>
                    <TableHead className="text-xs text-right">Total Payment</TableHead>
                    <TableHead className="text-xs text-right">Total Principal</TableHead>
                    <TableHead className="text-xs text-right">Closing Liability</TableHead>
                    <TableHead className="text-xs text-right">ROU NBV (End)</TableHead>
                    <TableHead className="text-xs text-right">Total Depreciation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearlyRows.map((yr) => {
                    const key = `y-${yr.year}`;
                    const expanded = expandedRows.has(key);
                    // Build yearly journal entries (sum of all months)
                    const yJE = [
                      { ref: "JE-1", description: `Lease payments — ${yr.year}`,
                        debit:  [{ account: "21100", name: "Lease Liability",    amount: yr.total_principal }],
                        credit: [{ account: "10100", name: "Cash / Bank",        amount: yr.total_payment   }],
                        debitExtra: [{ account: "67100", name: "Interest Expense", amount: yr.total_interest }],
                      },
                      { ref: "JE-2", description: `ROU asset depreciation — ${yr.year}`,
                        debit:  [{ account: "67200", name: "Depreciation Expense",     amount: yr.total_depreciation }],
                        credit: [{ account: "17900", name: "Accumulated Depreciation", amount: yr.total_depreciation }],
                        debitExtra: [],
                      },
                    ];
                    return (
                      <>
                        <TableRow
                          key={key}
                          className="cursor-pointer hover:bg-muted/10 transition-colors"
                          onClick={() => toggleRow(key)}
                        >
                          <TableCell className="py-2 px-2">
                            {expanded
                              ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                              : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                          </TableCell>
                          <TableCell className="py-2 text-sm font-bold">{yr.year}</TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono">{fmt(yr.opening_liability, currency)}</TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono text-amber-400">{fmt(yr.total_interest, currency)}</TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono text-blue-400">{fmt(yr.total_payment, currency)}</TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono text-emerald-400">{fmt(yr.total_principal, currency)}</TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono">{fmt(yr.closing_liability, currency)}</TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono text-purple-400">{fmt(yr.rou_nbv_end, currency)}</TableCell>
                          <TableCell className="py-2 text-xs text-right font-mono">{fmt(yr.total_depreciation, currency)}</TableCell>
                        </TableRow>

                        {/* ── Accordion: Yearly Accounting Entries ─────────── */}
                        {expanded && (
                          <TableRow key={`${key}-acc`} className="bg-muted/5">
                            <TableCell colSpan={9} className="py-0 px-0">
                              <div className="px-6 py-4 border-t border-dashed border-border/50">
                                <div className="flex items-center gap-2 mb-3">
                                  <BookOpen className="w-3.5 h-3.5 text-[#e60000]" />
                                  <span className="text-xs font-semibold text-[#e60000]">
                                    Consolidated Journal Entries — {yr.year}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-1">({yr.months.length} months)</span>
                                </div>
                                <div className="space-y-3">
                                  {yJE.map(je => (
                                    <div key={je.ref} className="bg-card border border-border/60 rounded-lg overflow-hidden">
                                      <div className="px-3 py-2 bg-muted/20 border-b border-border/40 flex items-center gap-2">
                                        <span className="text-[10px] font-mono bg-[#e60000]/20 text-[#e60000] px-1.5 py-0.5 rounded">{je.ref}</span>
                                        <span className="text-xs text-muted-foreground">{je.description}</span>
                                      </div>
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="text-muted-foreground border-b border-border/30">
                                            <th className="text-left px-3 py-1.5 font-medium">Account Code</th>
                                            <th className="text-left px-3 py-1.5 font-medium">Account Name</th>
                                            <th className="text-right px-3 py-1.5 font-medium">Debit</th>
                                            <th className="text-right px-3 py-1.5 font-medium">Credit</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {je.debit.map((d, i) => (
                                            <tr key={`d-${i}`} className="border-b border-border/20">
                                              <td className="px-3 py-1.5 font-mono text-blue-400">{d.account}</td>
                                              <td className="px-3 py-1.5">{d.name}</td>
                                              <td className="px-3 py-1.5 text-right font-mono text-blue-400">{fmt(d.amount, currency)}</td>
                                              <td className="px-3 py-1.5 text-right text-muted-foreground">—</td>
                                            </tr>
                                          ))}
                                          {je.debitExtra.map((d, i) => (
                                            <tr key={`de-${i}`} className="border-b border-border/20">
                                              <td className="px-3 py-1.5 font-mono text-amber-400">{d.account}</td>
                                              <td className="px-3 py-1.5">{d.name}</td>
                                              <td className="px-3 py-1.5 text-right font-mono text-amber-400">{fmt(d.amount, currency)}</td>
                                              <td className="px-3 py-1.5 text-right text-muted-foreground">—</td>
                                            </tr>
                                          ))}
                                          {je.credit.map((c, i) => (
                                            <tr key={`c-${i}`}>
                                              <td className="px-3 py-1.5 font-mono text-emerald-400 pl-8">{c.account}</td>
                                              <td className="px-3 py-1.5 pl-8 italic">{c.name}</td>
                                              <td className="px-3 py-1.5 text-right text-muted-foreground">—</td>
                                              <td className="px-3 py-1.5 text-right font-mono text-emerald-400">{fmt(c.amount, currency)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ))}
                                </div>

                                {/* Monthly breakdown inside yearly accordion */}
                                <div className="mt-4">
                                  <div className="text-xs text-muted-foreground mb-2 font-medium">Monthly Breakdown</div>
                                  <div className="overflow-x-auto rounded-lg border border-border/40">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="bg-muted/10 text-muted-foreground">
                                          <th className="text-left px-3 py-1.5">Month</th>
                                          <th className="text-right px-3 py-1.5">Payment</th>
                                          <th className="text-right px-3 py-1.5">Interest</th>
                                          <th className="text-right px-3 py-1.5">Principal</th>
                                          <th className="text-right px-3 py-1.5">Closing Liability</th>
                                          <th className="text-right px-3 py-1.5">Depreciation</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {yr.months.map(m => (
                                          <tr key={m.period_no} className="border-t border-border/20">
                                            <td className="px-3 py-1.5">{m.month_name}</td>
                                            <td className="px-3 py-1.5 text-right font-mono text-blue-400">{fmt(m.payment, currency)}</td>
                                            <td className="px-3 py-1.5 text-right font-mono text-amber-400">{fmt(m.interest_expense, currency)}</td>
                                            <td className="px-3 py-1.5 text-right font-mono text-emerald-400">{fmt(m.principal, currency)}</td>
                                            <td className="px-3 py-1.5 text-right font-mono">{fmt(m.closing_liability, currency)}</td>
                                            <td className="px-3 py-1.5 text-right font-mono">{fmt(m.depreciation, currency)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
