import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useLocation } from "wouter";
import {
  BookOpen, Download, ChevronRight, ExternalLink, FileText,
  Scale, Globe, Calculator, ArrowRight, Info, ChevronDown,
  ChevronUp, Copy, CheckCheck, Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const PDF_URL = "/manus-storage/Leasing_Accounting_Standards_Paper_341bc92b.pdf";

// ─── Math helpers ────────────────────────────────────────────────────────────
function fmt(n: number, dp = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
function computePV(payment: number, ibrDecimal: number, months: number): number {
  const r = ibrDecimal / 12;
  if (r === 0) return payment * months;
  return parseFloat((payment * (1 - Math.pow(1 + r, -months)) / r).toFixed(2));
}
interface ScheduleRow {
  period: string; year: number; month: number;
  opening: number; interest: number; payment: number;
  principal: number; closing: number; depr: number; rouNBV: number;
}
function buildSchedule(payment: number, ibrDecimal: number, months: number, rouAsset: number, startDate: string): ScheduleRow[] {
  const r = ibrDecimal / 12;
  const depr = rouAsset / months;
  const rows: ScheduleRow[] = [];
  let opening = computePV(payment, ibrDecimal, months);
  let rouNBV = rouAsset;
  let cumDepr = 0;
  const sd = new Date(startDate);
  for (let i = 1; i <= months; i++) {
    const pd = new Date(sd);
    pd.setMonth(pd.getMonth() + i);
    const interest = parseFloat((opening * r).toFixed(2));
    const principal = parseFloat((payment - interest).toFixed(2));
    const closing = parseFloat(Math.max(0, opening - principal).toFixed(2));
    cumDepr = parseFloat((cumDepr + depr).toFixed(2));
    rouNBV = parseFloat(Math.max(0, rouAsset - cumDepr).toFixed(2));
    rows.push({
      period: pd.toISOString().split("T")[0],
      year: pd.getFullYear(),
      month: pd.getMonth() + 1,
      opening: parseFloat(opening.toFixed(2)),
      interest,
      payment,
      principal,
      closing,
      depr: parseFloat(depr.toFixed(2)),
      rouNBV,
    });
    opening = closing;
  }
  return rows;
}
function aggregateYearly(rows: ScheduleRow[]) {
  const map = new Map<number, { year: number; interest: number; payment: number; principal: number; depr: number; closing: number; rouNBV: number }>();
  for (const r of rows) {
    const e = map.get(r.year) ?? { year: r.year, interest: 0, payment: 0, principal: 0, depr: 0, closing: 0, rouNBV: 0 };
    e.interest += r.interest; e.payment += r.payment; e.principal += r.principal; e.depr += r.depr;
    e.closing = r.closing; e.rouNBV = r.rouNBV;
    map.set(r.year, e);
  }
  return Array.from(map.values());
}

// GL entries per standard
interface GLLine { dr?: boolean; account: string; amount: number; note?: string; }
interface GLEntry { title: string; lines: GLLine[]; }
function getGLEntries(row: ScheduleRow, standard: string, currency: string): GLEntry[] {
  const isASC842Op = standard === "asc842_op";
  const isGASB = standard === "gasb87";
  if (isASC842Op) {
    // Operating lease: single straight-line cost, no split
    return [
      {
        title: "Lease Cost (straight-line)",
        lines: [
          { dr: true,  account: "Operating Lease Cost",      amount: row.payment },
          { dr: false, account: "Operating Lease Liability",  amount: row.principal },
          { dr: false, account: "Cash / Accrued Rent",        amount: row.interest },
        ],
      },
    ];
  }
  if (isGASB) {
    return [
      {
        title: "Interest on Lease Liability",
        lines: [
          { dr: true,  account: "Interest Expense",           amount: row.interest },
          { dr: false, account: "Lease Liability",             amount: row.interest },
        ],
      },
      {
        title: "Lease Payment",
        lines: [
          { dr: true,  account: "Lease Liability",             amount: row.payment },
          { dr: false, account: "Cash",                        amount: row.payment },
        ],
      },
      {
        title: "Amortisation of Right-to-Use Asset",
        lines: [
          { dr: true,  account: "Amortisation Expense",        amount: row.depr },
          { dr: false, account: "Acc. Amortisation — RtU Asset", amount: row.depr },
        ],
      },
    ];
  }
  // IFRS 16 / ASC 842 Finance / AASB 16 / HKFRS 16 / Ind AS 116
  return [
    {
      title: "Interest Expense (Effective Interest Method)",
      lines: [
        { dr: true,  account: "Finance Cost / Interest Expense", amount: row.interest },
        { dr: false, account: "Lease Liability",                  amount: row.interest },
      ],
    },
    {
      title: "Lease Payment",
      lines: [
        { dr: true,  account: "Lease Liability",                  amount: row.payment },
        { dr: false, account: "Cash / Bank",                      amount: row.payment },
      ],
    },
    {
      title: "Depreciation of Right-of-Use Asset",
      lines: [
        { dr: true,  account: "Depreciation Expense",             amount: row.depr },
        { dr: false, account: "Acc. Depreciation — ROU Asset",    amount: row.depr },
      ],
    },
  ];
}

// ─── Data ────────────────────────────────────────────────────────────────────
const STANDARDS = [
  { id: "ias17",    code: "IAS 17",      name: "Leases (Superseded)",             issuer: "IASB",         jurisdiction: "Global (IFRS)", effectiveDate: "Superseded Jan 2019", status: "superseded", color: "bg-gray-500",    model: "Dual (Operating / Finance)",              balanceSheet: "Finance leases only",     shortTermExemption: "N/A",           lowValueExemption: "N/A",                         summary: "IAS 17 was the predecessor to IFRS 16, governing lease accounting under IFRS from 1982 until 2019. It established a binary classification model based on the transfer of substantially all risks and rewards of ownership. Finance leases were recognised on the balance sheet; operating leases were kept off-balance-sheet, creating the structural transparency problem that motivated global reform." },
  { id: "ifrs16",   code: "IFRS 16",     name: "Leases",                          issuer: "IASB",         jurisdiction: "Global (IFRS — 140+ countries)", effectiveDate: "1 January 2019",  status: "current",    color: "bg-blue-600",    model: "Single (Right-of-Use)",                   balanceSheet: "All leases (with exemptions)", shortTermExemption: "Yes (≤ 12 months)", lowValueExemption: "Yes (≈ USD 5,000)",          summary: "IFRS 16 introduced a single on-balance-sheet model for lessees, eliminating the operating/finance lease distinction. All leases (except short-term and low-value) must be recognised as a Right-of-Use (ROU) asset and a lease liability. The lease liability is measured at the present value of future lease payments, discounted at the interest rate implicit in the lease or the lessee's Incremental Borrowing Rate (IBR). Lessor accounting is largely unchanged from IAS 17." },
  { id: "asc842",   code: "ASC 842",     name: "Leases",                          issuer: "FASB",         jurisdiction: "United States (US GAAP)", effectiveDate: "2019 (public) / 2022 (private)", status: "current", color: "bg-red-600", model: "Dual (Operating / Finance — both on B/S)", balanceSheet: "All leases (with exemptions)", shortTermExemption: "Yes (≤ 12 months)", lowValueExemption: "No",                         summary: "ASC 842 requires all leases to be recognised on the balance sheet but retains the distinction between operating and finance leases for income statement purposes. Operating leases show a single straight-line lease cost (above EBITDA), while finance leases show separate depreciation and interest (below EBITDA). This distinction has significant implications for financial ratios. Lessor accounting uses three categories: sales-type, direct financing, and operating." },
  { id: "gasb87",   code: "GASB 87",     name: "Leases",                          issuer: "GASB",         jurisdiction: "USA — State & Local Government", effectiveDate: "15 June 2021", status: "current",    color: "bg-green-700",   model: "Single (Financing Arrangement)",          balanceSheet: "All leases (with exemptions)", shortTermExemption: "Yes (≤ 12 months max)", lowValueExemption: "No",                       summary: "GASB 87 applies to US state and local government entities and adopts a single model treating all leases as financing arrangements. Lessees recognise a right-to-use lease asset (intangible) and a lease liability. Lessors retain the underlying asset on their balance sheet and recognise a lease receivable and a deferred inflow of resources — reflecting the government accounting model's use of deferred inflows rather than immediate revenue recognition." },
  { id: "gasb96",   code: "GASB 96",     name: "Subscription-Based IT Arrangements", issuer: "GASB",     jurisdiction: "USA — State & Local Government", effectiveDate: "15 June 2022", status: "current",    color: "bg-teal-600",    model: "Single (mirrors GASB 87)",                balanceSheet: "All SBITAs (with exemptions)", shortTermExemption: "Yes",           lowValueExemption: "No",                         summary: "GASB 96 extends the GASB 87 financing model to cloud computing and software-as-a-service arrangements (SBITAs). Government entities recognise a subscription asset (intangible) and a subscription liability for cloud software subscriptions such as Office 365, Adobe, and Zoom. This ensures consistent balance sheet treatment between physical asset leases and digital service subscriptions." },
  { id: "aasb16",   code: "AASB 16",     name: "Leases",                          issuer: "AASB",         jurisdiction: "Australia", effectiveDate: "1 January 2019 (NFP: 1 Jan 2020)", status: "current", color: "bg-yellow-600", model: "Single (Right-of-Use) — mirrors IFRS 16", balanceSheet: "All leases (with exemptions)", shortTermExemption: "Yes (≤ 12 months)", lowValueExemption: "Yes (≈ USD 5,000)",          summary: "AASB 16 is the Australian equivalent of IFRS 16 and is substantially identical in its requirements. Key Australian-specific additions include guidance for not-for-profit (NFP) entities on peppercorn leases (leases at significantly below-market terms), where the ROU asset is measured at fair value at commencement. NFP entities may elect the cost model as a simplification." },
  { id: "frs102",   code: "FRS 102",     name: "Section 20 — Leases (Revised 2024)", issuer: "FRC",       jurisdiction: "United Kingdom & Ireland", effectiveDate: "1 January 2026", status: "upcoming",   color: "bg-purple-600",  model: "Single (Right-of-Use) from 2026; Dual pre-2026", balanceSheet: "All leases (with exemptions) from 2026", shortTermExemption: "Yes (≤ 12 months)", lowValueExemption: "Yes",              summary: "The revised FRS 102 Section 20 (effective 1 January 2026) substantially aligns UK and Irish lease accounting with IFRS 16, introducing a right-of-use model for lessees. Prior to 2026, FRS 102 retained the IAS 17-style dual model. The revised standard includes simplifications for smaller entities, including a portfolio approach to IBR determination. FRS 105 (micro-entities) continues to permit off-balance-sheet treatment for operating leases." },
  { id: "hkfrs16",  code: "HKFRS 16",    name: "Leases",                          issuer: "HKICPA",       jurisdiction: "Hong Kong", effectiveDate: "1 January 2019", status: "current",    color: "bg-red-700",     model: "Single (Right-of-Use) — identical to IFRS 16", balanceSheet: "All leases (with exemptions)", shortTermExemption: "Yes (≤ 12 months)", lowValueExemption: "Yes (≈ USD 5,000)",        summary: "HKFRS 16 is word-for-word identical to IFRS 16. Hong Kong maintains a policy of full convergence with IFRS Accounting Standards. Given Hong Kong's position as one of the world's most expensive commercial real estate markets, HKFRS 16 has had a particularly significant impact on listed companies with large retail or office footprints, materially increasing reported lease liabilities." },
  { id: "indas116", code: "Ind AS 116",  name: "Leases",                          issuer: "MCA India",    jurisdiction: "India (Ind AS companies)", effectiveDate: "1 April 2019", status: "current",    color: "bg-orange-600",  model: "Single (Right-of-Use) — closely follows IFRS 16", balanceSheet: "All leases (with exemptions)", shortTermExemption: "Yes (≤ 12 months)", lowValueExemption: "Judgement-based (no fixed threshold)", summary: "Ind AS 116 is India's equivalent of IFRS 16, mandatory for all Ind AS companies from 1 April 2019. It closely follows IFRS 16 with minor differences, notably the absence of a fixed low-value asset threshold (left to judgement). Indian companies not applying Ind AS continue to apply AS 19 (based on IAS 17), retaining the operating/finance lease distinction." },
  { id: "ipsas13",  code: "IPSAS 13",    name: "Leases",                          issuer: "IPSASB",       jurisdiction: "Public Sector (International)", effectiveDate: "Current (under revision)", status: "current", color: "bg-slate-600", model: "Dual (Operating / Finance) — based on IAS 17", balanceSheet: "Finance leases only", shortTermExemption: "N/A",           lowValueExemption: "N/A",                         summary: "IPSAS 13 applies to public sector entities adopting accrual-basis International Public Sector Accounting Standards. It is based on the older IAS 17 model, retaining the operating/finance lease distinction. The IPSASB is developing a new leases standard (ED 75) that would align public sector lease accounting with IFRS 16, but IPSAS 13 remains in force as of 2026." },
  { id: "grap13",   code: "GRAP 13",     name: "Leases",                          issuer: "ASB South Africa", jurisdiction: "South Africa (Public Sector)", effectiveDate: "Current", status: "current", color: "bg-emerald-700", model: "Dual (Operating / Finance) — based on IPSAS 13", balanceSheet: "Finance leases only", shortTermExemption: "N/A",           lowValueExemption: "N/A",                         summary: "GRAP 13 applies to South African public sector entities (departments, municipalities, public entities) and is based on IPSAS 13. It retains the operating/finance lease distinction with additional guidance for South African public sector contexts, including government-to-government leases and arrangements involving Crown/state-owned land." },
];

const COMPARISON_DATA = [
  { feature: "Issuer",               values: { ias17: "IASB", ifrs16: "IASB", asc842: "FASB", gasb87: "GASB", aasb16: "AASB", frs102: "FRC", hkfrs16: "HKICPA", indas116: "MCA India", ipsas13: "IPSASB", grap13: "ASB SA" } },
  { feature: "Lessee Model",         values: { ias17: "Dual", ifrs16: "Single (ROU)", asc842: "Dual (both on B/S)", gasb87: "Single (financing)", aasb16: "Single (ROU)", frs102: "Single (ROU) 2026", hkfrs16: "Single (ROU)", indas116: "Single (ROU)", ipsas13: "Dual", grap13: "Dual" } },
  { feature: "Balance Sheet",        values: { ias17: "Finance only", ifrs16: "All (w/ exemptions)", asc842: "All (w/ exemptions)", gasb87: "All (w/ exemptions)", aasb16: "All (w/ exemptions)", frs102: "All (w/ exemptions)", hkfrs16: "All (w/ exemptions)", indas116: "All (w/ exemptions)", ipsas13: "Finance only", grap13: "Finance only" } },
  { feature: "Short-term Exemption", values: { ias17: "N/A", ifrs16: "≤ 12 months", asc842: "≤ 12 months", gasb87: "≤ 12 months max", aasb16: "≤ 12 months", frs102: "≤ 12 months", hkfrs16: "≤ 12 months", indas116: "≤ 12 months", ipsas13: "N/A", grap13: "N/A" } },
  { feature: "Low-value Exemption",  values: { ias17: "N/A", ifrs16: "≈ USD 5,000", asc842: "No", gasb87: "No", aasb16: "≈ USD 5,000", frs102: "Yes", hkfrs16: "≈ USD 5,000", indas116: "Judgement", ipsas13: "N/A", grap13: "N/A" } },
  { feature: "Lessor Model",         values: { ias17: "Dual", ifrs16: "Dual", asc842: "Three-way", gasb87: "Deferred inflow", aasb16: "Dual", frs102: "Dual", hkfrs16: "Dual", indas116: "Dual", ipsas13: "Dual", grap13: "Dual" } },
];
const STANDARDS_COLS = ["ias17","ifrs16","asc842","gasb87","aasb16","frs102","hkfrs16","indas116","ipsas13","grap13"];
const STANDARDS_LABELS: Record<string,string> = { ias17:"IAS 17", ifrs16:"IFRS 16", asc842:"ASC 842", gasb87:"GASB 87", aasb16:"AASB 16", frs102:"FRS 102", hkfrs16:"HKFRS 16", indas116:"Ind AS 116", ipsas13:"IPSAS 13", grap13:"GRAP 13" };

const SECTIONS = [
  { id: "abstract",       title: "Abstract" },
  { id: "history",        title: "1. Historical Context: IAS 17" },
  { id: "ifrs16",         title: "2. IFRS 16 — Lessee Accounting" },
  { id: "ifrs16-lessor",  title: "3. IFRS 16 — Lessor Accounting" },
  { id: "asc842",         title: "4. ASC 842 (US GAAP)" },
  { id: "gasb87",         title: "5. GASB 87 (US Government)" },
  { id: "other",          title: "6. Other Standards" },
  { id: "modifications",  title: "7. Modifications & Reassessments" },
  { id: "saleback",       title: "8. Sale and Leaseback" },
  { id: "disclosures",    title: "9. Disclosure Requirements" },
  { id: "transition",     title: "10. Transition Approaches" },
  { id: "practical",      title: "11. Practical Implications" },
  { id: "conclusion",     title: "12. Conclusion" },
];

// IBR reference rates by currency
const IBR_REFS: Record<string, { rate: string; benchmark: string }> = {
  QAR: { rate: "5.50", benchmark: "QIBOR" },
  USD: { rate: "5.25", benchmark: "SOFR" },
  EUR: { rate: "3.75", benchmark: "EURIBOR" },
  GBP: { rate: "5.00", benchmark: "SONIA" },
  SAR: { rate: "5.75", benchmark: "SAIBOR" },
  AED: { rate: "5.40", benchmark: "EIBOR" },
  AUD: { rate: "4.35", benchmark: "BBSW" },
  INR: { rate: "6.50", benchmark: "MIBOR" },
  HKD: { rate: "5.25", benchmark: "HIBOR" },
  ZAR: { rate: "8.25", benchmark: "JIBAR" },
};

const GENERATOR_STANDARDS = [
  { value: "ifrs16",    label: "IFRS 16 / AASB 16 / HKFRS 16 / Ind AS 116" },
  { value: "asc842_fi", label: "ASC 842 — Finance Lease" },
  { value: "asc842_op", label: "ASC 842 — Operating Lease" },
  { value: "gasb87",    label: "GASB 87 (Government)" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "current")    return <Badge className="bg-emerald-600 text-white text-xs">Current</Badge>;
  if (status === "superseded") return <Badge variant="secondary" className="text-xs">Superseded</Badge>;
  if (status === "upcoming")   return <Badge className="bg-amber-600 text-white text-xs">Upcoming</Badge>;
  return null;
}

// ─── IBR Calculator ──────────────────────────────────────────────────────────
function IBRCalculator() {
  const [, navigate] = useLocation();
  const [currency, setCurrency]       = useState("QAR");
  const [termYears, setTermYears]     = useState("5");
  const [refRate, setRefRate]         = useState("5.50");
  const [creditSpread, setCreditSpread] = useState("1.50");
  const [collateral, setCollateral]   = useState("0.25");
  const [copied, setCopied]           = useState(false);

  const ref = IBR_REFS[currency] ?? { rate: "5.00", benchmark: "—" };

  // Auto-fill reference rate when currency changes
  const handleCurrencyChange = (v: string) => {
    setCurrency(v);
    setRefRate(IBR_REFS[v]?.rate ?? "5.00");
  };

  const ibr = useMemo(() => {
    const r = parseFloat(refRate || "0");
    const cs = parseFloat(creditSpread || "0");
    const col = parseFloat(collateral || "0");
    return parseFloat((r + cs - col).toFixed(3));
  }, [refRate, creditSpread, collateral]);

  const ibrDecimal = ibr / 100;
  const termMonths = Math.round(parseFloat(termYears || "1") * 12);

  // Sample PV for 100,000/yr payment
  const samplePayment = 100000 / 12;
  const samplePV = computePV(samplePayment, ibrDecimal, termMonths);

  const handleCopy = () => {
    navigator.clipboard.writeText(ibr.toFixed(3));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenIBRLibrary = () => {
    const params = new URLSearchParams({
      prefill: "1",
      currency,
      tenor: String(termMonths),
      rate: ibr.toFixed(3),
      source: `${ref.benchmark} ${refRate}% + credit spread ${creditSpread}% − collateral ${collateral}%`,
    });
    navigate(`/accounting/ibr?${params.toString()}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-500" /> IBR Calculator
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Compute the Incremental Borrowing Rate (IBR) per IFRS 16 paragraph 26 and pre-fill the IBR Library.
          IBR = Reference Rate + Credit Spread − Collateral Adjustment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Inputs */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Currency</Label>
                <Select value={currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(IBR_REFS).map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Lease Term (years)</Label>
                <Input className="mt-1 h-8 text-xs" type="number" min="0.5" step="0.5" value={termYears} onChange={e => setTermYears(e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="text-xs flex items-center gap-1">
                Reference Rate (%) <span className="text-muted-foreground">— {ref.benchmark}</span>
              </Label>
              <Input className="mt-1 h-8 text-xs" type="number" step="0.01" value={refRate} onChange={e => setRefRate(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-0.5">Current {ref.benchmark} benchmark: {ref.rate}%</p>
            </div>

            <div>
              <Label className="text-xs">Credit Spread (%)</Label>
              <Input className="mt-1 h-8 text-xs" type="number" step="0.01" value={creditSpread} onChange={e => setCreditSpread(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-0.5">Entity-specific credit risk above benchmark</p>
            </div>

            <div>
              <Label className="text-xs">Collateral Adjustment (%)</Label>
              <Input className="mt-1 h-8 text-xs" type="number" step="0.01" value={collateral} onChange={e => setCollateral(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-0.5">Reduction for secured borrowing (ROU asset as collateral)</p>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <div className="space-y-4">
          <Card className="bg-blue-600/10 border-blue-500/30">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-1">Computed IBR</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-blue-400">{ibr.toFixed(3)}%</span>
                <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={handleCopy}>
                  {copied ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className="mt-3 font-mono text-xs bg-muted/30 rounded p-3 space-y-1">
                <p className="text-muted-foreground">IBR = Reference Rate + Credit Spread − Collateral</p>
                <p className="text-foreground">
                  = {refRate || 0}% + {creditSpread || 0}% − {collateral || 0}%
                  = <span className="text-blue-400 font-bold">{ibr.toFixed(3)}%</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <p className="text-xs font-medium">Illustrative PV (sample payment {currency} 100,000/yr)</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-muted/30 rounded p-2">
                  <p className="text-muted-foreground">Monthly Payment</p>
                  <p className="font-semibold">{currency} {fmt(samplePayment)}</p>
                </div>
                <div className="bg-muted/30 rounded p-2">
                  <p className="text-muted-foreground">Term</p>
                  <p className="font-semibold">{termYears} yrs ({termMonths} months)</p>
                </div>
                <div className="bg-muted/30 rounded p-2 col-span-2">
                  <p className="text-muted-foreground">Present Value (Lease Liability)</p>
                  <p className="font-bold text-base text-blue-400">{currency} {fmt(samplePV)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenIBRLibrary}>
            <ArrowRight className="w-4 h-4" />
            Open IBR Library with these values pre-filled
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Opens the IBR Library page with currency, tenor, rate, and source pre-populated for saving.
          </p>
        </div>
      </div>

      {/* IBR Factors Reference Table */}
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-muted-foreground" /> IFRS 16 IBR Determination Factors
        </h3>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-muted/50 border-b"><th className="text-left px-4 py-2.5 font-semibold">Factor</th><th className="text-left px-4 py-2.5 font-semibold">Description</th><th className="text-left px-4 py-2.5 font-semibold">Impact on IBR</th></tr></thead>
            <tbody>
              {[
                ["Currency",             "Rate for the currency of lease payments",                          "Determines base benchmark (SOFR, EURIBOR, QIBOR, etc.)"],
                ["Term",                 "Matches lease term incl. reasonably certain extension options",    "Longer term → higher rate (upward-sloping yield curve)"],
                ["Security / Collateral","Secured borrowing with ROU asset as implicit collateral",          "Reduces rate vs. unsecured borrowing"],
                ["Economic Environment", "Jurisdiction and market conditions at commencement date",          "Country risk premium may apply"],
                ["Lessee Credit Risk",   "Lessee's creditworthiness and credit spread",                     "Higher credit risk → higher spread → higher IBR"],
                ["Lease Commencement",   "Rate determined at commencement date, not reporting date",         "Rate locked at commencement; reassessed on modification"],
              ].map(([f, d, i], idx) => (
                <tr key={f} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="px-4 py-2 font-medium">{f}</td>
                  <td className="px-4 py-2 text-muted-foreground">{d}</td>
                  <td className="px-4 py-2 text-muted-foreground">{i}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Benchmark rates table */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Reference Benchmark Rates by Currency (Indicative — April 2026)</h3>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-muted/50 border-b"><th className="text-left px-4 py-2.5 font-semibold">Currency</th><th className="text-left px-4 py-2.5 font-semibold">Benchmark</th><th className="text-left px-4 py-2.5 font-semibold">Indicative Rate</th><th className="text-left px-4 py-2.5 font-semibold">Jurisdiction</th></tr></thead>
            <tbody>
              {[
                ["QAR","QIBOR","5.50%","Qatar"],
                ["USD","SOFR","5.25%","United States"],
                ["EUR","EURIBOR","3.75%","Eurozone"],
                ["GBP","SONIA","5.00%","United Kingdom"],
                ["SAR","SAIBOR","5.75%","Saudi Arabia"],
                ["AED","EIBOR","5.40%","UAE"],
                ["AUD","BBSW","4.35%","Australia"],
                ["INR","MIBOR","6.50%","India"],
                ["HKD","HIBOR","5.25%","Hong Kong"],
                ["ZAR","JIBAR","8.25%","South Africa"],
              ].map(([cur, bench, rate, jur], idx) => (
                <tr key={cur} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="px-4 py-2 font-medium">{cur}</td>
                  <td className="px-4 py-2 text-muted-foreground">{bench}</td>
                  <td className="px-4 py-2 font-semibold text-blue-400">{rate}</td>
                  <td className="px-4 py-2 text-muted-foreground">{jur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">* Indicative rates only. Always verify current benchmark rates from official central bank or market data sources before use in financial statements.</p>
      </div>
    </div>
  );
}

// ─── Journal Entry Generator ─────────────────────────────────────────────────
function JournalEntryGenerator() {
  const [standard, setStandard]       = useState("ifrs16");
  const [currency, setCurrency]       = useState("QAR");
  const [leaseAmount, setLeaseAmount] = useState("500000");
  const [termYears, setTermYears]     = useState("5");
  const [ibr, setIbr]                 = useState("6.50");
  const [startDate, setStartDate]     = useState(() => new Date().toISOString().split("T")[0]);
  const [viewMode, setViewMode]       = useState<"monthly" | "yearly">("yearly");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [explainRow, setExplainRow]   = useState<ScheduleRow | null>(null);
  const [generated, setGenerated]     = useState(false);
  const [schedule, setSchedule]       = useState<ScheduleRow[]>([]);
  const [leaseLiability, setLeaseLiability] = useState(0);
  const [rouAsset, setRouAsset]       = useState(0);

  const termMonths = Math.round(parseFloat(termYears || "1") * 12);
  const ibrDecimal = parseFloat(ibr || "0") / 100;
  const isOperating = standard === "asc842_op";

  const handleGenerate = () => {
    const amt = parseFloat(leaseAmount || "0");
    if (amt <= 0 || termMonths <= 0 || ibrDecimal < 0) {
      toast.error("Please enter valid lease amount, term, and IBR.");
      return;
    }
    const monthlyPayment = amt / termMonths;
    const pv = computePV(monthlyPayment, ibrDecimal, termMonths);
    const rou = pv; // ROU = lease liability at commencement (simplified)
    const sched = buildSchedule(monthlyPayment, ibrDecimal, termMonths, rou, startDate);
    setLeaseLiability(pv);
    setRouAsset(rou);
    setSchedule(sched);
    setGenerated(true);
    setExpandedRows({});
    toast.success("Schedule generated successfully");
  };

  const yearlyRows = useMemo(() => aggregateYearly(schedule), [schedule]);
  const displayRows = viewMode === "yearly" ? [] : schedule;

  const toggleRow = (key: string) => setExpandedRows(p => ({ ...p, [key]: !p[key] }));

  // For operating lease: straight-line cost
  const straightLineCost = useMemo(() => {
    if (!isOperating || schedule.length === 0) return 0;
    const total = schedule.reduce((s, r) => s + r.payment, 0);
    return total / schedule.length;
  }, [schedule, isOperating]);

  const standardLabel = GENERATOR_STANDARDS.find(s => s.value === standard)?.label ?? standard;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" /> Journal Entry Generator
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter lease parameters to generate a full amortisation schedule and journal entries under any supported standard.
        </p>
      </div>

      {/* Input panel */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Label className="text-xs">Accounting Standard</Label>
              <Select value={standard} onValueChange={setStandard}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GENERATOR_STANDARDS.map(s => <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["QAR","USD","EUR","GBP","SAR","AED","AUD","INR","HKD","ZAR"].map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Total Lease Value ({currency})</Label>
              <Input className="mt-1 h-8 text-xs" type="number" value={leaseAmount} onChange={e => setLeaseAmount(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Term (years)</Label>
              <Input className="mt-1 h-8 text-xs" type="number" min="0.5" step="0.5" value={termYears} onChange={e => setTermYears(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">IBR (% p.a.)</Label>
              <Input className="mt-1 h-8 text-xs" type="number" step="0.01" value={ibr} onChange={e => setIbr(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Commencement Date</Label>
              <Input className="mt-1 h-8 text-xs" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleGenerate}>
              <Calculator className="w-4 h-4" /> Generate Schedule &amp; Journal Entries
            </Button>
            {generated && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-muted-foreground">View:</span>
                <Button size="sm" variant={viewMode === "yearly" ? "default" : "outline"} className="h-7 text-xs" onClick={() => setViewMode("yearly")}>Yearly</Button>
                <Button size="sm" variant={viewMode === "monthly" ? "default" : "outline"} className="h-7 text-xs" onClick={() => setViewMode("monthly")}>Monthly</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {generated && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Lease Liability (PV)", value: `${currency} ${fmt(leaseLiability)}`, color: "text-blue-400" },
              { label: isOperating ? "ROU Asset (Operating)" : "ROU Asset (Cost)", value: `${currency} ${fmt(rouAsset)}`, color: "text-purple-400" },
              { label: "Monthly Payment", value: `${currency} ${fmt(parseFloat(leaseAmount) / termMonths)}`, color: "text-green-400" },
              { label: "Total Interest Cost", value: `${currency} ${fmt(schedule.reduce((s, r) => s + r.interest, 0))}`, color: "text-amber-400" },
            ].map(c => (
              <Card key={c.label} className="bg-muted/20">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className={`text-base font-bold mt-1 ${c.color}`}>{c.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Commencement Journal Entry */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Commencement Date Journal Entry</h3>
            <div className="bg-muted/30 rounded-lg border p-4 font-mono text-xs space-y-1">
              <p className="text-muted-foreground mb-2">// {startDate} — Initial recognition under {standardLabel}</p>
              {isOperating ? (
                <>
                  <p>Dr  Right-of-Use Asset (Operating)   {currency} {fmt(rouAsset)}</p>
                  <p>    Cr  Operating Lease Liability              {currency} {fmt(leaseLiability)}</p>
                </>
              ) : standard === "gasb87" ? (
                <>
                  <p>Dr  Right-to-Use Asset (Intangible)  {currency} {fmt(rouAsset)}</p>
                  <p>    Cr  Lease Liability                        {currency} {fmt(leaseLiability)}</p>
                </>
              ) : (
                <>
                  <p>Dr  Right-of-Use Asset               {currency} {fmt(rouAsset)}</p>
                  <p>    Cr  Lease Liability                        {currency} {fmt(leaseLiability)}</p>
                </>
              )}
              <p className="text-muted-foreground mt-2">// PV = {currency} {fmt(parseFloat(leaseAmount) / termMonths)} × annuity({ibr}%, {termMonths} months)</p>
              <p className="text-muted-foreground">// Monthly payment = {currency} {fmt(parseFloat(leaseAmount))} ÷ {termMonths} = {currency} {fmt(parseFloat(leaseAmount) / termMonths)}</p>
            </div>
          </div>

          {/* Amortisation Schedule */}
          <div>
            <h3 className="text-sm font-semibold mb-2">
              {viewMode === "yearly" ? "Yearly" : "Monthly"} Amortisation Schedule — {standardLabel}
            </h3>

            {viewMode === "yearly" ? (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-3 py-2.5 font-semibold w-8"></th>
                      <th className="text-left px-3 py-2.5 font-semibold">Year</th>
                      <th className="text-right px-3 py-2.5 font-semibold">Interest</th>
                      <th className="text-right px-3 py-2.5 font-semibold">Payment</th>
                      <th className="text-right px-3 py-2.5 font-semibold">Principal</th>
                      <th className="text-right px-3 py-2.5 font-semibold">Depreciation</th>
                      <th className="text-right px-3 py-2.5 font-semibold">Closing Liability</th>
                      <th className="text-right px-3 py-2.5 font-semibold">ROU NBV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyRows.map((row, i) => {
                      const key = `y-${row.year}`;
                      const open = expandedRows[key];
                      const monthsInYear = schedule.filter(r => r.year === row.year);
                      return (
                        <>
                          <tr key={key} className={`${i % 2 === 0 ? "bg-background" : "bg-muted/20"} cursor-pointer hover:bg-muted/40`} onClick={() => toggleRow(key)}>
                            <td className="px-3 py-2 text-muted-foreground">{open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</td>
                            <td className="px-3 py-2 font-semibold">{row.year}</td>
                            <td className="px-3 py-2 text-right text-amber-400">{fmt(row.interest)}</td>
                            <td className="px-3 py-2 text-right">{fmt(row.payment)}</td>
                            <td className="px-3 py-2 text-right text-green-400">{fmt(row.principal)}</td>
                            <td className="px-3 py-2 text-right text-purple-400">{fmt(row.depr)}</td>
                            <td className="px-3 py-2 text-right text-blue-400">{fmt(row.closing)}</td>
                            <td className="px-3 py-2 text-right">{fmt(row.rouNBV)}</td>
                          </tr>
                          {open && monthsInYear.map((mr, mi) => {
                            const glEntries = getGLEntries(mr, standard, currency);
                            return (
                              <tr key={`m-${mr.period}`} className="bg-muted/5 border-l-2 border-blue-500/30">
                                <td className="px-3 py-1.5"></td>
                                <td className="px-3 py-1.5 text-muted-foreground pl-6">{mr.period}</td>
                                <td className="px-3 py-1.5 text-right text-xs text-amber-300">{fmt(mr.interest)}</td>
                                <td className="px-3 py-1.5 text-right text-xs">{fmt(mr.payment)}</td>
                                <td className="px-3 py-1.5 text-right text-xs text-green-300">{fmt(mr.principal)}</td>
                                <td className="px-3 py-1.5 text-right text-xs text-purple-300">{fmt(mr.depr)}</td>
                                <td className="px-3 py-1.5 text-right text-xs text-blue-300">{fmt(mr.closing)}</td>
                                <td className="px-3 py-1.5 text-right text-xs">
                                  <div className="flex items-center justify-end gap-1">
                                    {fmt(mr.rouNBV)}
                                    <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground" onClick={e => { e.stopPropagation(); setExplainRow(mr); }}>
                                      <Info className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {/* Yearly GL entries */}
                          {open && (
                            <tr className="bg-muted/10">
                              <td colSpan={8} className="px-6 py-3">
                                <p className="text-xs font-semibold mb-2 text-muted-foreground">Consolidated GL Entries — Year {row.year}</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {getGLEntries({ ...monthsInYear[0], interest: row.interest, payment: row.payment, principal: row.principal, depr: row.depr }, standard, currency).map((entry, ei) => (
                                    <div key={ei} className="bg-muted/30 rounded p-3 font-mono text-xs space-y-1">
                                      <p className="text-muted-foreground font-sans font-medium mb-1">{entry.title}</p>
                                      {entry.lines.map((line, li) => (
                                        <p key={li} className={line.dr ? "text-green-400" : "text-red-400 pl-4"}>
                                          {line.dr ? "Dr" : "Cr"}  {line.account.padEnd(30, " ")}  {currency} {fmt(line.amount)}
                                        </p>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                    {/* Totals */}
                    <tr className="border-t-2 bg-muted/40 font-semibold">
                      <td className="px-3 py-2.5"></td>
                      <td className="px-3 py-2.5">Total</td>
                      <td className="px-3 py-2.5 text-right text-amber-400">{fmt(schedule.reduce((s, r) => s + r.interest, 0))}</td>
                      <td className="px-3 py-2.5 text-right">{fmt(schedule.reduce((s, r) => s + r.payment, 0))}</td>
                      <td className="px-3 py-2.5 text-right text-green-400">{fmt(schedule.reduce((s, r) => s + r.principal, 0))}</td>
                      <td className="px-3 py-2.5 text-right text-purple-400">{fmt(schedule.reduce((s, r) => s + r.depr, 0))}</td>
                      <td className="px-3 py-2.5 text-right text-blue-400">—</td>
                      <td className="px-3 py-2.5 text-right">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-3 py-2.5 font-semibold">Period</th>
                      <th className="text-right px-3 py-2.5 font-semibold">Opening</th>
                      <th className="text-right px-3 py-2.5 font-semibold">Interest</th>
                      <th className="text-right px-3 py-2.5 font-semibold">Payment</th>
                      <th className="text-right px-3 py-2.5 font-semibold">Principal</th>
                      <th className="text-right px-3 py-2.5 font-semibold">Closing</th>
                      <th className="text-right px-3 py-2.5 font-semibold">Depreciation</th>
                      <th className="text-right px-3 py-2.5 font-semibold">ROU NBV</th>
                      <th className="px-3 py-2.5 font-semibold w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row, i) => {
                      const key = `m-${row.period}`;
                      const open = expandedRows[key];
                      return (
                        <>
                          <tr key={key} className={`${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                            <td className="px-3 py-1.5">{row.period}</td>
                            <td className="px-3 py-1.5 text-right">{fmt(row.opening)}</td>
                            <td className="px-3 py-1.5 text-right text-amber-400">{fmt(row.interest)}</td>
                            <td className="px-3 py-1.5 text-right">{fmt(row.payment)}</td>
                            <td className="px-3 py-1.5 text-right text-green-400">{fmt(row.principal)}</td>
                            <td className="px-3 py-1.5 text-right text-blue-400">{fmt(row.closing)}</td>
                            <td className="px-3 py-1.5 text-right text-purple-400">{fmt(row.depr)}</td>
                            <td className="px-3 py-1.5 text-right">{fmt(row.rouNBV)}</td>
                            <td className="px-3 py-1.5">
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground" onClick={() => setExplainRow(row)} title="Explain calculation">
                                  <Info className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground" onClick={() => toggleRow(key)} title="Show GL entries">
                                  {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {open && (
                            <tr className="bg-muted/10">
                              <td colSpan={9} className="px-6 py-3">
                                <p className="text-xs font-semibold mb-2 text-muted-foreground">Journal Entries — {row.period}</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {getGLEntries(row, standard, currency).map((entry, ei) => (
                                    <div key={ei} className="bg-muted/30 rounded p-3 font-mono text-xs space-y-1">
                                      <p className="text-muted-foreground font-sans font-medium mb-1">{entry.title}</p>
                                      {entry.lines.map((line, li) => (
                                        <p key={li} className={line.dr ? "text-green-400" : "text-red-400 pl-4"}>
                                          {line.dr ? "Dr" : "Cr"}  {line.account}  {currency} {fmt(line.amount)}
                                        </p>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Standard-specific notes */}
          <Card className="bg-muted/20">
            <CardContent className="p-4">
              <p className="text-xs font-semibold mb-2">Standard-Specific Notes — {standardLabel}</p>
              <div className="text-xs text-muted-foreground space-y-1">
                {standard === "ifrs16" && <>
                  <p>• <strong>IFRS 16 §26:</strong> Lease liability = PV of future payments discounted at IBR or rate implicit in lease.</p>
                  <p>• <strong>IFRS 16 §31:</strong> ROU asset = lease liability + prepayments + initial direct costs + restoration costs.</p>
                  <p>• <strong>IFRS 16 §36:</strong> ROU asset depreciated on straight-line basis over shorter of lease term and useful life.</p>
                  <p>• <strong>IFRS 16 §44:</strong> Finance cost recognised using effective interest method (unwinding of discount).</p>
                </>}
                {standard === "asc842_fi" && <>
                  <p>• <strong>ASC 842-20-30:</strong> Finance lease ROU asset and liability recognised at PV of lease payments.</p>
                  <p>• <strong>ASC 842-20-25:</strong> Amortisation of ROU asset and interest on liability recognised separately (front-loaded expense).</p>
                  <p>• <strong>ASC 842-20-45:</strong> Principal payments classified as financing activities; interest may be operating or financing.</p>
                </>}
                {standard === "asc842_op" && <>
                  <p>• <strong>ASC 842-20-25-6:</strong> Single operating lease cost recognised on straight-line basis over lease term.</p>
                  <p>• <strong>ASC 842-20-45:</strong> All cash payments classified as operating activities in the statement of cash flows.</p>
                  <p>• <strong>EBITDA impact:</strong> Operating lease cost appears above EBITDA — no EBITDA uplift unlike finance leases.</p>
                  <p>• <strong>Note:</strong> ROU asset and liability still recognised on balance sheet; only income statement treatment differs from finance lease.</p>
                </>}
                {standard === "gasb87" && <>
                  <p>• <strong>GASB 87 §16:</strong> Lessee recognises intangible right-to-use lease asset and corresponding lease liability.</p>
                  <p>• <strong>GASB 87 §22:</strong> Lease liability measured at PV of future lease payments; amortised using effective interest method.</p>
                  <p>• <strong>GASB 87 §19:</strong> Right-to-use asset amortised over shorter of lease term and useful life of underlying asset.</p>
                  <p>• <strong>Lessor:</strong> Retains underlying asset; recognises lease receivable and deferred inflow of resources (not immediate revenue).</p>
                </>}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Calculation Explain Modal */}
      {explainRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setExplainRow(null)}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-500" /> Calculation Explanation — {explainRow.period}
            </h3>
            <div className="font-mono text-sm space-y-2 bg-muted/30 rounded-lg p-4">
              <p className="text-muted-foreground">Opening Liability</p>
              <p className="text-foreground font-bold">{currency} {fmt(explainRow.opening)}</p>
              <hr className="border-border" />
              <p className="text-muted-foreground">Monthly IBR Rate = {ibr}% ÷ 12 = {(parseFloat(ibr) / 12).toFixed(4)}%</p>
              <p className="text-muted-foreground">Interest Expense = Opening × Monthly Rate</p>
              <p className="text-foreground">{currency} {fmt(explainRow.opening)} × {(ibrDecimal / 12).toFixed(6)} = <span className="text-amber-400 font-bold">{currency} {fmt(explainRow.interest)}</span></p>
              <hr className="border-border" />
              <p className="text-muted-foreground">Principal Repaid = Payment − Interest</p>
              <p className="text-foreground">{currency} {fmt(explainRow.payment)} − {currency} {fmt(explainRow.interest)} = <span className="text-green-400 font-bold">{currency} {fmt(explainRow.principal)}</span></p>
              <hr className="border-border" />
              <p className="text-muted-foreground">Closing Liability = Opening − Principal</p>
              <p className="text-foreground">{currency} {fmt(explainRow.opening)} − {currency} {fmt(explainRow.principal)} = <span className="text-blue-400 font-bold">{currency} {fmt(explainRow.closing)}</span></p>
              <hr className="border-border" />
              <p className="text-muted-foreground">ROU Depreciation = ROU Asset ÷ Term Months</p>
              <p className="text-foreground">{currency} {fmt(rouAsset)} ÷ {termMonths} = <span className="text-purple-400 font-bold">{currency} {fmt(explainRow.depr)}</span></p>
              <p className="text-muted-foreground mt-1">ROU NBV (closing) = <span className="text-purple-400 font-bold">{currency} {fmt(explainRow.rouNBV)}</span></p>
            </div>
            <Button className="mt-4 w-full" variant="outline" onClick={() => setExplainRow(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AccountingStandardsPaper() {
  const [activeSection, setActiveSection] = useState("abstract");
  const [selectedStandard, setSelectedStandard] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background">
        <ScreenHeader
          screenId="VFCMP-STDPAPER-001" screenType="accounting_standards_paper"
          title="Leasing Accounting Standards"
          subtitle="Reference paper, IBR calculator & journal entry generator — IFRS 16, ASC 842, GASB 87 & more"
          icon={<Scale className="w-6 h-6 text-blue-400" />}
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs gap-1">
                <Globe className="w-3 h-3" /> 10 Standards Covered
              </Badge>
              <a href={PDF_URL} target="_blank" rel="noopener noreferrer" download="Leasing_Accounting_Standards_Paper.pdf">
                <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </a>
            </div>
          }
        />

      <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-6 shrink-0">
          <TabsList className="h-10 bg-transparent border-none p-0 gap-4">
            <TabsTrigger value="overview"   className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-0 text-sm">Standards Overview</TabsTrigger>
            <TabsTrigger value="comparison" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-0 text-sm">Comparison Table</TabsTrigger>
            <TabsTrigger value="ibr"        className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-0 text-sm">IBR Calculator</TabsTrigger>
            <TabsTrigger value="generator"  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-0 text-sm">Journal Entry Generator</TabsTrigger>
            <TabsTrigger value="paper"      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-0 text-sm">Full Paper</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Standards Overview Tab ── */}
        <TabsContent value="overview" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl">
              {STANDARDS.map((std) => (
                <Card
                  key={std.id}
                  className={`cursor-pointer transition-all hover:shadow-md border ${selectedStandard === std.id ? "ring-2 ring-blue-500" : ""}`}
                  onClick={() => setSelectedStandard(selectedStandard === std.id ? null : std.id)}
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${std.color} shrink-0 mt-0.5`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{std.code}</span>
                            <StatusBadge status={std.status} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{std.name}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div><span className="text-muted-foreground">Issuer</span><p className="font-medium">{std.issuer}</p></div>
                      <div><span className="text-muted-foreground">Effective</span><p className="font-medium">{std.effectiveDate}</p></div>
                      <div className="col-span-2"><span className="text-muted-foreground">Jurisdiction</span><p className="font-medium">{std.jurisdiction}</p></div>
                      <div className="col-span-2"><span className="text-muted-foreground">Lessee Model</span><p className="font-medium">{std.model}</p></div>
                    </div>
                    {selectedStandard === std.id && (
                      <div className="pt-2 border-t mt-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">{std.summary}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-blue-500 pt-1">
                      <ChevronRight className="w-3 h-3" />
                      {selectedStandard === std.id ? "Click to collapse" : "Click to expand summary"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="max-w-6xl mt-8">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" />Key Concepts Across Standards</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Right-of-Use (ROU) Asset", desc: "An asset representing the lessee's right to use an underlying asset for the lease term. Measured at cost (initial lease liability + prepayments + initial direct costs + restoration costs). Depreciated over the shorter of lease term and useful life." },
                  { title: "Lease Liability", desc: "The present value of lease payments not yet made, discounted at the interest rate implicit in the lease or the lessee's Incremental Borrowing Rate (IBR). Unwound using the effective interest method." },
                  { title: "Incremental Borrowing Rate (IBR)", desc: "The rate a lessee would pay to borrow funds to obtain an asset of similar value, in a similar economic environment, over a similar term. Determined by reference rate + credit spread + collateral adjustment." },
                  { title: "Finance vs. Operating Lease", desc: "A finance lease transfers substantially all risks and rewards of ownership to the lessee. An operating lease does not. This distinction remains relevant for lessors under all standards and for lessees under ASC 842, FRS 102 (pre-2026), IPSAS 13, and GRAP 13." },
                  { title: "Lease Modification", desc: "A change in scope or consideration not part of original terms. May be accounted for as a separate new lease (if additional ROU at stand-alone price) or a modification of the existing lease (remeasure liability, adjust ROU asset)." },
                  { title: "Sale and Leaseback", desc: "Transfer of an asset to a buyer-lessor with simultaneous leaseback. If the transfer qualifies as a sale (under IFRS 15 / ASC 606), gain/loss is recognised proportional to rights transferred to the buyer-lessor." },
                ].map((concept) => (
                  <Card key={concept.title} className="bg-muted/30">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold mb-1.5">{concept.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{concept.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── Comparison Table Tab ── */}
        <TabsContent value="comparison" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-6">
              <h2 className="text-base font-semibold mb-1">Cross-Standard Comparison</h2>
              <p className="text-xs text-muted-foreground mb-4">Key dimensions compared across all 10 major lease accounting standards</p>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-semibold w-36 sticky left-0 bg-muted/50">Feature</th>
                      {STANDARDS_COLS.map((col) => {
                        const std = STANDARDS.find((s) => s.id === col)!;
                        return (
                          <th key={col} className="text-left px-3 py-3 font-semibold min-w-28">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${std.color} shrink-0`} />
                              {STANDARDS_LABELS[col]}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_DATA.map((row, i) => (
                      <tr key={row.feature} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="px-4 py-2.5 font-medium sticky left-0 bg-inherit border-r">{row.feature}</td>
                        {STANDARDS_COLS.map((col) => (
                          <td key={col} className="px-3 py-2.5 text-muted-foreground">{(row.values as Record<string, string>)[col] ?? "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 className="text-base font-semibold mt-8 mb-1">EBITDA &amp; Financial Ratio Impact (Lessee)</h2>
              <p className="text-xs text-muted-foreground mb-4">How each standard affects key financial metrics for lessees</p>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-semibold">Metric</th>
                      <th className="text-left px-4 py-3 font-semibold">IFRS 16 / AASB 16 / HKFRS 16 / Ind AS 116</th>
                      <th className="text-left px-4 py-3 font-semibold">ASC 842 — Finance Lease</th>
                      <th className="text-left px-4 py-3 font-semibold">ASC 842 — Operating Lease</th>
                      <th className="text-left px-4 py-3 font-semibold">GASB 87</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { metric: "Balance Sheet Assets",    ifrs16: "↑ ROU Asset",             asc842f: "↑ Finance lease ROU",     asc842o: "↑ Operating lease ROU",   gasb87: "↑ Right-to-use asset" },
                      { metric: "Balance Sheet Liabilities", ifrs16: "↑ Lease Liability",     asc842f: "↑ Finance lease liability", asc842o: "↑ Operating lease liability", gasb87: "↑ Lease Liability" },
                      { metric: "EBITDA",                  ifrs16: "↑ (op. lease cost removed)", asc842f: "↑ (depreciation below EBITDA)", asc842o: "No change (cost above EBITDA)", gasb87: "↑ (amortisation below EBITDA)" },
                      { metric: "Operating Cash Flow",     ifrs16: "↑ (principal = financing)", asc842f: "↑ (principal = financing)", asc842o: "↓ (all payments = operating)", gasb87: "↑ (principal = financing)" },
                      { metric: "Leverage Ratio",          ifrs16: "↑ (higher debt)",         asc842f: "↑ (higher debt)",         asc842o: "↑ (higher debt)",         gasb87: "↑ (higher debt)" },
                      { metric: "Interest Coverage",       ifrs16: "↓ (higher interest)",     asc842f: "↓ (higher interest)",     asc842o: "No change",               gasb87: "↓ (higher interest)" },
                    ].map((row, i) => (
                      <tr key={row.metric} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="px-4 py-2.5 font-medium">{row.metric}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{row.ifrs16}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{row.asc842f}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{row.asc842o}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{row.gasb87}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── IBR Calculator Tab ── */}
        <TabsContent value="ibr" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-6"><IBRCalculator /></div>
          </ScrollArea>
        </TabsContent>

        {/* ── Journal Entry Generator Tab ── */}
        <TabsContent value="generator" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-6"><JournalEntryGenerator /></div>
          </ScrollArea>
        </TabsContent>

        {/* ── Full Paper Tab ── */}
        <TabsContent value="paper" className="flex-1 overflow-hidden m-0">
          <div className="flex h-full overflow-hidden">
            <div className="w-56 border-r shrink-0 flex flex-col">
              <div className="p-3 border-b"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contents</p></div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  {SECTIONS.map((sec) => (
                    <button key={sec.id} onClick={() => { setActiveSection(sec.id); document.getElementById(`section-${sec.id}`)?.scrollIntoView({ behavior: "smooth" }); }}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${activeSection === sec.id ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                      {sec.title}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-3 border-t">
                <a href={PDF_URL} target="_blank" rel="noopener noreferrer" download="Leasing_Accounting_Standards_Paper.pdf">
                  <Button size="sm" variant="outline" className="w-full gap-2 text-xs"><Download className="w-3 h-3" />Download PDF</Button>
                </a>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="max-w-4xl mx-auto px-8 py-8 space-y-10 text-sm leading-relaxed">
                <div className="text-center space-y-2 pb-6 border-b">
                  <h1 className="text-2xl font-bold">Leasing Accounting: A Comprehensive Guide to Global Standards</h1>
                  <p className="text-muted-foreground text-xs">Author: Manus AI &nbsp;|&nbsp; April 2026 &nbsp;|&nbsp; VodaLease Enterprise — Accounting &amp; Compliance Division</p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {["IFRS 16","ASC 842","GASB 87","AASB 16","FRS 102","HKFRS 16","Ind AS 116","IPSAS 13","GRAP 13","IAS 17"].map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                  </div>
                </div>

                <section id="section-abstract">
                  <h2 className="text-lg font-bold mb-3">Abstract</h2>
                  <p className="text-muted-foreground">Lease accounting has undergone a profound transformation over the past decade, driven by a global push for greater transparency and comparability in financial reporting. The introduction of IFRS 16, ASC 842, GASB 87, and their national equivalents has fundamentally altered how organisations recognise, measure, and disclose lease obligations. This paper provides a comprehensive examination of all major lease accounting standards in force globally, including IFRS 16, ASC 842, GASB 87, GASB 96, AASB 16, FRS 102 (revised), HKFRS 16, Ind AS 116, IPSAS 13, GRAP 13, and the superseded IAS 17. The paper analyses lessee and lessor accounting models, recognition and measurement mechanics, disclosure requirements, transition approaches, and the practical implications for a leasing enterprise operating across multiple jurisdictions.</p>
                </section>
                <Separator />
                <section id="section-history">
                  <h2 className="text-lg font-bold mb-3">1. Historical Context: IAS 17 and the Case for Reform</h2>
                  <p className="mb-3">IAS 17 <em>Leases</em>, originally issued in 1982 and substantially revised in 1997 and 2003, governed lease accounting under IFRS until its supersession by IFRS 16 on 1 January 2019. The standard established a binary classification model based on the concept of <strong>risks and rewards of ownership</strong>: finance leases (on-balance-sheet) versus operating leases (off-balance-sheet).</p>
                  <p className="mb-3">Research by the IASB and FASB estimated that, prior to reform, listed companies worldwide had approximately <strong>USD 3.3 trillion</strong> in operating lease commitments that were not reflected on balance sheets. This obscured the true leverage of organisations in capital-intensive sectors such as retail, aviation, and telecommunications. The G20 and the Financial Stability Board called for reform, ultimately producing IFRS 16 and ASC 842.</p>
                  <div className="rounded-lg border overflow-hidden mt-4">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50 border-b"><th className="text-left px-4 py-2.5 font-semibold">IAS 17 Classification Indicator</th><th className="text-left px-4 py-2.5 font-semibold">Description</th></tr></thead>
                      <tbody>
                        {[["Transfer of ownership","Lease transfers ownership to lessee by end of term"],["Bargain purchase option","Lessee has option to purchase at below fair value"],["Lease term","Lease term covers major part of economic life of asset"],["Present value test","PV of minimum lease payments ≥ substantially all of fair value"],["Specialised nature","Asset is so specialised only lessee can use it without major modification"]].map(([ind,desc],i) => (
                          <tr key={ind} className={i%2===0?"bg-background":"bg-muted/20"}><td className="px-4 py-2 font-medium">{ind}</td><td className="px-4 py-2 text-muted-foreground">{desc}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                <Separator />
                <section id="section-ifrs16">
                  <h2 className="text-lg font-bold mb-3">2. IFRS 16 — Lessee Accounting</h2>
                  <p className="mb-3">IFRS 16 <em>Leases</em> was issued by the IASB in January 2016, effective <strong>1 January 2019</strong>. It introduces a single on-balance-sheet model for lessees, eliminating the operating/finance lease distinction. All leases (except short-term ≤ 12 months and low-value ≈ USD 5,000) must be recognised as a <strong>Right-of-Use (ROU) asset</strong> and a <strong>lease liability</strong>.</p>
                  <h3 className="font-semibold mt-4 mb-2">Journal Entry Example — 5-Year Office Lease (IBR 5%, QAR 100,000/yr)</h3>
                  <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs space-y-1 border">
                    <p className="text-muted-foreground">// PV = 100,000 × annuity(5%, 5yr) = 100,000 × 4.3295 = QAR 432,948</p>
                    <p>Dr  Right-of-Use Asset         432,948</p>
                    <p>    Cr  Lease Liability                    432,948</p>
                    <p className="text-muted-foreground mt-2">// Year 1 — Interest (effective interest method)</p>
                    <p>Dr  Finance Cost               21,647   (432,948 × 5%)</p>
                    <p>    Cr  Lease Liability                     21,647</p>
                    <p className="text-muted-foreground mt-2">// Year 1 — Payment</p>
                    <p>Dr  Lease Liability            100,000</p>
                    <p>    Cr  Cash                               100,000</p>
                    <p className="text-muted-foreground mt-2">// Year 1 — Depreciation</p>
                    <p>Dr  Depreciation Expense        86,590   (432,948 ÷ 5)</p>
                    <p>    Cr  Accumulated Depreciation           86,590</p>
                  </div>
                </section>
                <Separator />
                <section id="section-ifrs16-lessor">
                  <h2 className="text-lg font-bold mb-3">3. IFRS 16 — Lessor Accounting</h2>
                  <p className="mb-3">Lessor accounting under IFRS 16 is substantially unchanged from IAS 17. Lessors continue to classify each lease as a <strong>finance lease</strong> (risks and rewards substantially transferred) or an <strong>operating lease</strong>. Under a finance lease, the lessor derecognises the underlying asset and recognises a <strong>net investment in the lease</strong> (receivable), recognising finance income over the lease term using the effective interest method.</p>
                  <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs space-y-1 border">
                    <p className="text-muted-foreground">// Finance Lease — Lessor (Equipment QAR 500,000, 5yr, 6%)</p>
                    <p>Dr  Net Investment in Lease    500,000</p>
                    <p>    Cr  Equipment (Asset)                  500,000</p>
                    <p className="text-muted-foreground mt-2">// Year 1 — Finance income</p>
                    <p>Dr  Net Investment in Lease     30,000   (500,000 × 6%)</p>
                    <p>    Cr  Finance Income                      30,000</p>
                  </div>
                </section>
                <Separator />
                <section id="section-asc842">
                  <h2 className="text-lg font-bold mb-3">4. ASC 842 — US GAAP Leases</h2>
                  <p className="mb-3">ASC 842 was issued by FASB in February 2016, effective for public companies in <strong>2019</strong> and private companies in <strong>2022</strong>. Unlike IFRS 16, ASC 842 <strong>retains the dual lessee model</strong> — both operating and finance leases are on the balance sheet, but their income statement treatment differs significantly.</p>
                  <div className="rounded-lg border overflow-hidden mt-4">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50 border-b"><th className="text-left px-4 py-2.5 font-semibold">Item</th><th className="text-left px-4 py-2.5 font-semibold">Finance Lease</th><th className="text-left px-4 py-2.5 font-semibold">Operating Lease</th></tr></thead>
                      <tbody>
                        {[["ROU Asset amortisation","Separate amortisation expense","Included in single lease cost"],["Interest on liability","Separate interest expense","Included in single lease cost"],["Total expense pattern","Front-loaded (higher early)","Straight-line over lease term"],["EBITDA impact","Depreciation + interest below EBITDA","Single lease cost above EBITDA"],["Cash flow classification","Principal = financing; interest = operating/financing","All payments = operating"]].map(([item,fin,op],i) => (
                          <tr key={item} className={i%2===0?"bg-background":"bg-muted/20"}><td className="px-4 py-2 font-medium">{item}</td><td className="px-4 py-2 text-muted-foreground">{fin}</td><td className="px-4 py-2 text-muted-foreground">{op}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                <Separator />
                <section id="section-gasb87">
                  <h2 className="text-lg font-bold mb-3">5. GASB 87 — US Government Leases</h2>
                  <p className="mb-3">GASB 87 applies to US state and local government entities, effective for periods beginning after <strong>15 June 2021</strong>. It adopts a <strong>single financing model</strong> for all leases — no operating/finance distinction. Lessees recognise a right-to-use lease asset (intangible) and a lease liability. Lessors retain the underlying asset and recognise a <strong>lease receivable</strong> and a <strong>deferred inflow of resources</strong>.</p>
                  <p className="mb-3">GASB 96 (effective June 2022) extends this model to <strong>subscription-based IT arrangements (SBITAs)</strong> — cloud software such as Office 365, Adobe, and Zoom.</p>
                </section>
                <Separator />
                <section id="section-other">
                  <h2 className="text-lg font-bold mb-3">6. Other Major Standards</h2>
                  <div className="space-y-4">
                    {[
                      { code: "AASB 16",          detail: "Australian equivalent of IFRS 16, substantially identical. Adds guidance for not-for-profit entities on peppercorn leases (below-market rentals), where the ROU asset is measured at fair value at commencement." },
                      { code: "FRS 102 (Rev. 2026)", detail: "UK/Ireland standard. Revised Section 20 (effective 1 January 2026) introduces a right-of-use model broadly consistent with IFRS 16. Prior to 2026, retained the IAS 17 dual model. Simplifications available for smaller entities." },
                      { code: "HKFRS 16",          detail: "Word-for-word identical to IFRS 16. Hong Kong maintains full IFRS convergence. Significant impact on listed companies given Hong Kong's expensive commercial real estate market." },
                      { code: "Ind AS 116",         detail: "India's equivalent of IFRS 16, mandatory from 1 April 2019. Closely follows IFRS 16 with no fixed low-value asset threshold (left to judgement). Indian companies not applying Ind AS continue to use AS 19 (IAS 17 model)." },
                      { code: "IPSAS 13",           detail: "Applies to public sector entities adopting accrual-basis IPSAS. Based on IAS 17 — retains operating/finance lease distinction. IPSASB is developing a new standard (ED 75) to align with IFRS 16." },
                      { code: "GRAP 13",            detail: "South African public sector standard based on IPSAS 13. Retains operating/finance lease distinction. Additional guidance for government-to-government leases and state-owned land arrangements." },
                    ].map((s) => (
                      <div key={s.code} className="flex gap-3">
                        <Badge variant="outline" className="shrink-0 h-fit mt-0.5 text-xs">{s.code}</Badge>
                        <p className="text-muted-foreground text-xs leading-relaxed">{s.detail}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <Separator />
                <section id="section-modifications">
                  <h2 className="text-lg font-bold mb-3">7. Lease Modifications and Reassessments</h2>
                  <p className="mb-3">A <strong>lease modification</strong> is a change in scope or consideration not part of the original terms. Under IFRS 16, if the modification adds the right to use additional assets at a stand-alone price, it is treated as a <strong>separate new lease</strong>. Otherwise, the lessee remeasures the lease liability using a revised discount rate and adjusts the ROU asset accordingly.</p>
                  <p className="mb-3"><strong>Reassessments</strong> are required when there is a change in the assessment of extension/termination options, residual value guarantees, or index/rate-linked payments. Reassessment uses a revised discount rate for option changes and the original discount rate for payment changes.</p>
                </section>
                <Separator />
                <section id="section-saleback">
                  <h2 className="text-lg font-bold mb-3">8. Sale and Leaseback Transactions</h2>
                  <p className="mb-3">A sale and leaseback occurs when an entity sells an asset to a buyer-lessor and simultaneously leases it back. Under IFRS 16, if the transfer qualifies as a sale (under IFRS 15), the seller-lessee recognises a ROU asset and lease liability, with gain/loss recognised only to the extent it relates to rights transferred to the buyer-lessor:</p>
                  <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs border">
                    <p>Gain = (Fair Value − Carrying Amount) × (1 − PV of Lease Payments / Fair Value)</p>
                  </div>
                </section>
                <Separator />
                <section id="section-disclosures">
                  <h2 className="text-lg font-bold mb-3">9. Disclosure Requirements</h2>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50 border-b"><th className="text-left px-4 py-2.5 font-semibold">Party</th><th className="text-left px-4 py-2.5 font-semibold">Key Disclosures Required</th></tr></thead>
                      <tbody>
                        {[["Lessee","Depreciation of ROU assets by class; interest expense on lease liabilities; short-term/low-value/variable lease expense; total cash outflow; additions to ROU assets; carrying amount of ROU assets; maturity analysis of lease liabilities (undiscounted); significant judgements and assumptions"],["Lessor (Finance)","Maturity analysis of lease receivables; reconciliation of gross to net investment; unearned finance income; unguaranteed residual values; ECL provisions on lease receivables"],["Lessor (Operating)","Maturity analysis of lease payments receivable; total lease income; depreciation of leased assets; initial direct costs"]].map(([party,disc],i) => (
                          <tr key={party} className={i%2===0?"bg-background":"bg-muted/20"}><td className="px-4 py-2 font-medium align-top">{party}</td><td className="px-4 py-2 text-muted-foreground">{disc}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                <Separator />
                <section id="section-transition">
                  <h2 className="text-lg font-bold mb-3">10. Transition Approaches</h2>
                  <p className="mb-3">Both IFRS 16 and ASC 842 offer two transition methods:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-muted/20"><CardContent className="p-4"><h3 className="font-semibold text-sm mb-2">Full Retrospective</h3><p className="text-xs text-muted-foreground">Apply the standard to all prior periods presented as if it had always been in effect. Provides maximum comparability but requires significant effort to reconstruct historical data.</p></CardContent></Card>
                    <Card className="bg-muted/20"><CardContent className="p-4"><h3 className="font-semibold text-sm mb-2">Modified Retrospective</h3><p className="text-xs text-muted-foreground">Apply from the date of initial application without restating prior periods. Cumulative effect recognised as an adjustment to opening equity. Various practical expedients available to ease transition.</p></CardContent></Card>
                  </div>
                </section>
                <Separator />
                <section id="section-practical">
                  <h2 className="text-lg font-bold mb-3">11. Practical Implications for a Leasing Enterprise</h2>
                  <p className="mb-3">For a <strong>lessor</strong> organisation such as VodaLease Enterprise, the primary accounting considerations under IFRS 16 are: (1) classification of each lease as finance or operating; (2) measurement of net investment in finance leases including unguaranteed residual values; (3) straight-line income recognition for operating leases; (4) ECL impairment on finance lease receivables under IFRS 9; and (5) disclosure of portfolio maturity profiles and concentration risks.</p>
                  <p className="mb-3">For the company's own leased premises and equipment (as a lessee), IFRS 16 requires recognition of ROU assets and lease liabilities, with the IBR determined by reference to the relevant interbank rate (e.g., QIBOR, SAIBOR, EIBOR for Gulf-region leases) adjusted for the entity's credit spread and the specific lease term and currency.</p>
                </section>
                <Separator />
                <section id="section-conclusion">
                  <h2 className="text-lg font-bold mb-3">12. Conclusion</h2>
                  <p className="mb-3">The global lease accounting reform has brought trillions of dollars of previously off-balance-sheet lease obligations onto corporate and government balance sheets. The key themes are: <strong>convergence with divergence</strong> (IFRS 16 and ASC 842 share a foundation but differ in the dual lessee model and low-value exemption); <strong>the lessor gap</strong> (lessor accounting remains largely unchanged); <strong>public sector lag</strong> (IPSAS 13 and GRAP 13 still use the IAS 17 model); and the <strong>judgement-intensive</strong> nature of lease term determination, IBR calculation, and modification accounting.</p>
                  <p className="text-muted-foreground">For a leasing enterprise operating across multiple jurisdictions, a deep understanding of all major standards — and the ability to apply them consistently across a diverse portfolio — is a fundamental competency.</p>
                </section>
                <Separator />
                <section>
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" />References</h2>
                  <div className="space-y-2">
                    {[
                      { num:1,  title:"IFRS 16 Leases (2016)",                  issuer:"IASB",          url:"https://www.ifrs.org/issued-standards/list-of-standards/ifrs-16-leases/" },
                      { num:2,  title:"IAS 17 Leases (superseded)",             issuer:"IASB",          url:"https://www.ifrs.org/issued-standards/list-of-standards/ias-17-leases/" },
                      { num:3,  title:"ASC 842 Leases",                         issuer:"FASB",          url:"https://asc.fasb.org/842" },
                      { num:4,  title:"GASB Statement No. 87 Leases",           issuer:"GASB",          url:"https://gasb.org/page/pronouncement?pageId=/standards-and-guidance/pronouncements/summary-statement-no-87.html" },
                      { num:5,  title:"GASB Statement No. 96 SBITAs",           issuer:"GASB",          url:"https://gasb.org/page/pronouncement?pageId=/standards-and-guidance/pronouncements/summary-statement-no-96.html" },
                      { num:6,  title:"AASB 16 Leases",                         issuer:"AASB",          url:"https://aasb.gov.au/admin/file/content105/c9/AASB16_02-16.pdf" },
                      { num:7,  title:"FRS 102 Section 20 (Revised 2024)",      issuer:"FRC",           url:"https://www.frc.org.uk/library/standards-codes-policy/accounting-and-reporting/uk-accounting-standards/frs-102/" },
                      { num:8,  title:"HKFRS 16 Leases",                        issuer:"HKICPA",        url:"https://www.hkicpa.org.hk" },
                      { num:9,  title:"IPSAS 13 Leases",                        issuer:"IPSASB",        url:"https://www.ipsasb.org/publications/ipsas-13-leases" },
                      { num:10, title:"GRAP 13 Leases",                         issuer:"ASB South Africa", url:"https://www.asb.co.za" },
                      { num:11, title:"IFRS 16 Overview",                       issuer:"KPMG",          url:"https://assets.kpmg.com/content/dam/kpmgsites/xx/pdf/ifrg/2024/leases-overview.pdf" },
                      { num:12, title:"ASC 842 vs IFRS 16 Comparison",          issuer:"KPMG",          url:"https://kpmg.com/us/en/articles/2025/lease-accounting-ifrs-standards-us-gaap.html" },
                      { num:13, title:"IFRS 16 Discount Rate Guide",            issuer:"Grant Thornton", url:"https://www.grantthornton.global/en/insights/ifrs-16/ifrs-16---understanding-the-discount-rate/" },
                      { num:14, title:"IFRS 16 In Practice 2023/2024",          issuer:"BDO Global",    url:"https://www.bdo.global/getmedia/4b4c5f48-af18-4caa-b598-630ba9b937cf/IFRS-16-In-Practice-2023-2024.pdf" },
                    ].map(ref => (
                      <div key={ref.num} className="flex items-start gap-3 text-xs">
                        <span className="text-muted-foreground shrink-0 w-5 text-right">[{ref.num}]</span>
                        <div>
                          <span className="font-medium">{ref.title}</span>
                          <span className="text-muted-foreground"> — {ref.issuer} </span>
                          <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-0.5">
                            <ExternalLink className="w-2.5 h-2.5" />Link
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <div className="pt-4 pb-8 text-center text-xs text-muted-foreground border-t">
                  <p>Prepared by Manus AI for VodaLease Enterprise — Accounting &amp; Compliance Division</p>
                  <p className="mt-1">This paper is a technical reference document and does not constitute professional accounting or legal advice.</p>
                </div>
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
