import { useState } from "react";
import { BookOpen, Download, ChevronRight, ExternalLink, FileText, Scale, Globe, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const PDF_URL = "/manus-storage/Leasing_Accounting_Standards_Paper_341bc92b.pdf";

const STANDARDS = [
  {
    id: "ias17",
    code: "IAS 17",
    name: "Leases (Superseded)",
    issuer: "IASB",
    jurisdiction: "Global (IFRS)",
    effectiveDate: "Superseded Jan 2019",
    status: "superseded",
    color: "bg-gray-500",
    model: "Dual (Operating / Finance)",
    balanceSheet: "Finance leases only",
    shortTermExemption: "N/A",
    lowValueExemption: "N/A",
    summary:
      "IAS 17 was the predecessor to IFRS 16, governing lease accounting under IFRS from 1982 until 2019. It established a binary classification model based on the transfer of substantially all risks and rewards of ownership. Finance leases were recognised on the balance sheet; operating leases were kept off-balance-sheet, creating the structural transparency problem that motivated global reform.",
  },
  {
    id: "ifrs16",
    code: "IFRS 16",
    name: "Leases",
    issuer: "IASB",
    jurisdiction: "Global (IFRS — 140+ countries)",
    effectiveDate: "1 January 2019",
    status: "current",
    color: "bg-blue-600",
    model: "Single (Right-of-Use)",
    balanceSheet: "All leases (with exemptions)",
    shortTermExemption: "Yes (≤ 12 months)",
    lowValueExemption: "Yes (≈ USD 5,000)",
    summary:
      "IFRS 16 introduced a single on-balance-sheet model for lessees, eliminating the operating/finance lease distinction. All leases (except short-term and low-value) must be recognised as a Right-of-Use (ROU) asset and a lease liability. The lease liability is measured at the present value of future lease payments, discounted at the interest rate implicit in the lease or the lessee's Incremental Borrowing Rate (IBR). Lessor accounting is largely unchanged from IAS 17.",
  },
  {
    id: "asc842",
    code: "ASC 842",
    name: "Leases",
    issuer: "FASB",
    jurisdiction: "United States (US GAAP)",
    effectiveDate: "2019 (public) / 2022 (private)",
    status: "current",
    color: "bg-red-600",
    model: "Dual (Operating / Finance — both on B/S)",
    balanceSheet: "All leases (with exemptions)",
    shortTermExemption: "Yes (≤ 12 months)",
    lowValueExemption: "No",
    summary:
      "ASC 842 requires all leases to be recognised on the balance sheet but retains the distinction between operating and finance leases for income statement purposes. Operating leases show a single straight-line lease cost (above EBITDA), while finance leases show separate depreciation and interest (below EBITDA). This distinction has significant implications for financial ratios. Lessor accounting uses three categories: sales-type, direct financing, and operating.",
  },
  {
    id: "gasb87",
    code: "GASB 87",
    name: "Leases",
    issuer: "GASB",
    jurisdiction: "USA — State & Local Government",
    effectiveDate: "15 June 2021",
    status: "current",
    color: "bg-green-700",
    model: "Single (Financing Arrangement)",
    balanceSheet: "All leases (with exemptions)",
    shortTermExemption: "Yes (≤ 12 months max possible)",
    lowValueExemption: "No",
    summary:
      "GASB 87 applies to US state and local government entities and adopts a single model treating all leases as financing arrangements. Lessees recognise a right-to-use lease asset (intangible) and a lease liability. Lessors retain the underlying asset on their balance sheet and recognise a lease receivable and a deferred inflow of resources — reflecting the government accounting model's use of deferred inflows rather than immediate revenue recognition.",
  },
  {
    id: "gasb96",
    code: "GASB 96",
    name: "Subscription-Based IT Arrangements",
    issuer: "GASB",
    jurisdiction: "USA — State & Local Government",
    effectiveDate: "15 June 2022",
    status: "current",
    color: "bg-teal-600",
    model: "Single (mirrors GASB 87)",
    balanceSheet: "All SBITAs (with exemptions)",
    shortTermExemption: "Yes",
    lowValueExemption: "No",
    summary:
      "GASB 96 extends the GASB 87 financing model to cloud computing and software-as-a-service arrangements (SBITAs). Government entities recognise a subscription asset (intangible) and a subscription liability for cloud software subscriptions such as Office 365, Adobe, and Zoom. This ensures consistent balance sheet treatment between physical asset leases and digital service subscriptions.",
  },
  {
    id: "aasb16",
    code: "AASB 16",
    name: "Leases",
    issuer: "AASB",
    jurisdiction: "Australia",
    effectiveDate: "1 January 2019 (NFP: 1 Jan 2020)",
    status: "current",
    color: "bg-yellow-600",
    model: "Single (Right-of-Use) — mirrors IFRS 16",
    balanceSheet: "All leases (with exemptions)",
    shortTermExemption: "Yes (≤ 12 months)",
    lowValueExemption: "Yes (≈ USD 5,000)",
    summary:
      "AASB 16 is the Australian equivalent of IFRS 16 and is substantially identical in its requirements. Key Australian-specific additions include guidance for not-for-profit (NFP) entities on peppercorn leases (leases at significantly below-market terms), where the ROU asset is measured at fair value at commencement. NFP entities may elect the cost model as a simplification.",
  },
  {
    id: "frs102",
    code: "FRS 102",
    name: "Section 20 — Leases (Revised 2024)",
    issuer: "FRC",
    jurisdiction: "United Kingdom & Ireland",
    effectiveDate: "1 January 2026",
    status: "upcoming",
    color: "bg-purple-600",
    model: "Single (Right-of-Use) from 2026; Dual pre-2026",
    balanceSheet: "All leases (with exemptions) from 2026",
    shortTermExemption: "Yes (≤ 12 months)",
    lowValueExemption: "Yes",
    summary:
      "The revised FRS 102 Section 20 (effective 1 January 2026) substantially aligns UK and Irish lease accounting with IFRS 16, introducing a right-of-use model for lessees. Prior to 2026, FRS 102 retained the IAS 17-style dual model. The revised standard includes simplifications for smaller entities, including a portfolio approach to IBR determination. FRS 105 (micro-entities) continues to permit off-balance-sheet treatment for operating leases.",
  },
  {
    id: "hkfrs16",
    code: "HKFRS 16",
    name: "Leases",
    issuer: "HKICPA",
    jurisdiction: "Hong Kong",
    effectiveDate: "1 January 2019",
    status: "current",
    color: "bg-red-700",
    model: "Single (Right-of-Use) — identical to IFRS 16",
    balanceSheet: "All leases (with exemptions)",
    shortTermExemption: "Yes (≤ 12 months)",
    lowValueExemption: "Yes (≈ USD 5,000)",
    summary:
      "HKFRS 16 is word-for-word identical to IFRS 16. Hong Kong maintains a policy of full convergence with IFRS Accounting Standards. Given Hong Kong's position as one of the world's most expensive commercial real estate markets, HKFRS 16 has had a particularly significant impact on listed companies with large retail or office footprints, materially increasing reported lease liabilities.",
  },
  {
    id: "indas116",
    code: "Ind AS 116",
    name: "Leases",
    issuer: "MCA India",
    jurisdiction: "India (Ind AS companies)",
    effectiveDate: "1 April 2019",
    status: "current",
    color: "bg-orange-600",
    model: "Single (Right-of-Use) — closely follows IFRS 16",
    balanceSheet: "All leases (with exemptions)",
    shortTermExemption: "Yes (≤ 12 months)",
    lowValueExemption: "Judgement-based (no fixed threshold)",
    summary:
      "Ind AS 116 is India's equivalent of IFRS 16, mandatory for all Ind AS companies from 1 April 2019. It closely follows IFRS 16 with minor differences, notably the absence of a fixed low-value asset threshold (left to judgement). Indian companies not applying Ind AS continue to apply AS 19 (based on IAS 17), retaining the operating/finance lease distinction.",
  },
  {
    id: "ipsas13",
    code: "IPSAS 13",
    name: "Leases",
    issuer: "IPSASB",
    jurisdiction: "Public Sector (International)",
    effectiveDate: "Current (under revision)",
    status: "current",
    color: "bg-slate-600",
    model: "Dual (Operating / Finance) — based on IAS 17",
    balanceSheet: "Finance leases only",
    shortTermExemption: "N/A",
    lowValueExemption: "N/A",
    summary:
      "IPSAS 13 applies to public sector entities adopting accrual-basis International Public Sector Accounting Standards. It is based on the older IAS 17 model, retaining the operating/finance lease distinction. The IPSASB is developing a new leases standard (ED 75) that would align public sector lease accounting with IFRS 16, but IPSAS 13 remains in force as of 2026.",
  },
  {
    id: "grap13",
    code: "GRAP 13",
    name: "Leases",
    issuer: "ASB South Africa",
    jurisdiction: "South Africa (Public Sector)",
    effectiveDate: "Current",
    status: "current",
    color: "bg-emerald-700",
    model: "Dual (Operating / Finance) — based on IPSAS 13",
    balanceSheet: "Finance leases only",
    shortTermExemption: "N/A",
    lowValueExemption: "N/A",
    summary:
      "GRAP 13 applies to South African public sector entities (departments, municipalities, public entities) and is based on IPSAS 13. It retains the operating/finance lease distinction with additional guidance for South African public sector contexts, including government-to-government leases and arrangements involving Crown/state-owned land.",
  },
];

const COMPARISON_DATA = [
  { feature: "Issuer", values: { ias17: "IASB", ifrs16: "IASB", asc842: "FASB", gasb87: "GASB", aasb16: "AASB", frs102: "FRC", hkfrs16: "HKICPA", indas116: "MCA India", ipsas13: "IPSASB", grap13: "ASB SA" } },
  { feature: "Lessee Model", values: { ias17: "Dual", ifrs16: "Single (ROU)", asc842: "Dual (both on B/S)", gasb87: "Single (financing)", aasb16: "Single (ROU)", frs102: "Single (ROU) 2026", hkfrs16: "Single (ROU)", indas116: "Single (ROU)", ipsas13: "Dual", grap13: "Dual" } },
  { feature: "Balance Sheet", values: { ias17: "Finance only", ifrs16: "All (w/ exemptions)", asc842: "All (w/ exemptions)", gasb87: "All (w/ exemptions)", aasb16: "All (w/ exemptions)", frs102: "All (w/ exemptions)", hkfrs16: "All (w/ exemptions)", indas116: "All (w/ exemptions)", ipsas13: "Finance only", grap13: "Finance only" } },
  { feature: "Short-term Exemption", values: { ias17: "N/A", ifrs16: "≤ 12 months", asc842: "≤ 12 months", gasb87: "≤ 12 months max", aasb16: "≤ 12 months", frs102: "≤ 12 months", hkfrs16: "≤ 12 months", indas116: "≤ 12 months", ipsas13: "N/A", grap13: "N/A" } },
  { feature: "Low-value Exemption", values: { ias17: "N/A", ifrs16: "≈ USD 5,000", asc842: "No", gasb87: "No", aasb16: "≈ USD 5,000", frs102: "Yes", hkfrs16: "≈ USD 5,000", indas116: "Judgement", ipsas13: "N/A", grap13: "N/A" } },
  { feature: "Lessor Model", values: { ias17: "Dual", ifrs16: "Dual", asc842: "Three-way", gasb87: "Deferred inflow", aasb16: "Dual", frs102: "Dual", hkfrs16: "Dual", indas116: "Dual", ipsas13: "Dual", grap13: "Dual" } },
];

const STANDARDS_COLS = ["ias17", "ifrs16", "asc842", "gasb87", "aasb16", "frs102", "hkfrs16", "indas116", "ipsas13", "grap13"];
const STANDARDS_LABELS: Record<string, string> = { ias17: "IAS 17", ifrs16: "IFRS 16", asc842: "ASC 842", gasb87: "GASB 87", aasb16: "AASB 16", frs102: "FRS 102", hkfrs16: "HKFRS 16", indas116: "Ind AS 116", ipsas13: "IPSAS 13", grap13: "GRAP 13" };

const SECTIONS = [
  { id: "abstract", title: "Abstract" },
  { id: "history", title: "1. Historical Context: IAS 17" },
  { id: "ifrs16", title: "2. IFRS 16 — Lessee Accounting" },
  { id: "ifrs16-lessor", title: "3. IFRS 16 — Lessor Accounting" },
  { id: "asc842", title: "4. ASC 842 (US GAAP)" },
  { id: "gasb87", title: "5. GASB 87 (US Government)" },
  { id: "other", title: "6. Other Standards" },
  { id: "modifications", title: "7. Modifications & Reassessments" },
  { id: "saleback", title: "8. Sale and Leaseback" },
  { id: "disclosures", title: "9. Disclosure Requirements" },
  { id: "transition", title: "10. Transition Approaches" },
  { id: "practical", title: "11. Practical Implications" },
  { id: "conclusion", title: "12. Conclusion" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "current") return <Badge className="bg-emerald-600 text-white text-xs">Current</Badge>;
  if (status === "superseded") return <Badge variant="secondary" className="text-xs">Superseded</Badge>;
  if (status === "upcoming") return <Badge className="bg-amber-600 text-white text-xs">Upcoming</Badge>;
  return null;
}

export default function AccountingStandardsPaper() {
  const [activeSection, setActiveSection] = useState("abstract");
  const [selectedStandard, setSelectedStandard] = useState<string | null>(null);

  const selected = STANDARDS.find((s) => s.id === selectedStandard);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Leasing Accounting Standards</h1>
            <p className="text-xs text-muted-foreground">Comprehensive reference paper — IFRS 16, ASC 842, GASB 87, AASB 16, FRS 102 &amp; more</p>
          </div>
        </div>
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
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-6 shrink-0">
          <TabsList className="h-10 bg-transparent border-none p-0 gap-4">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-0 text-sm">
              Standards Overview
            </TabsTrigger>
            <TabsTrigger value="comparison" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-0 text-sm">
              Comparison Table
            </TabsTrigger>
            <TabsTrigger value="paper" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-0 text-sm">
              Full Paper
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Standards Overview Tab ── */}
        <TabsContent value="overview" className="flex-1 overflow-hidden m-0">
          <div className="flex h-full overflow-hidden">
            {/* Standards grid */}
            <ScrollArea className="flex-1 p-6">
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
                        <div>
                          <span className="text-muted-foreground">Issuer</span>
                          <p className="font-medium">{std.issuer}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Effective</span>
                          <p className="font-medium">{std.effectiveDate}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Jurisdiction</span>
                          <p className="font-medium">{std.jurisdiction}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Lessee Model</span>
                          <p className="font-medium">{std.model}</p>
                        </div>
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

              {/* Key Concepts Section */}
              <div className="max-w-6xl mt-8">
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  Key Concepts Across Standards
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: "Right-of-Use (ROU) Asset", desc: "An asset representing the lessee's right to use an underlying asset for the lease term. Measured at cost (initial lease liability + prepayments + initial direct costs + restoration costs). Depreciated over the shorter of lease term and useful life." },
                    { title: "Lease Liability", desc: "The present value of lease payments not yet made, discounted at the interest rate implicit in the lease or the lessee's Incremental Borrowing Rate (IBR). Unwound using the effective interest method." },
                    { title: "Incremental Borrowing Rate (IBR)", desc: "The rate a lessee would pay to borrow funds to obtain an asset of similar value, in a similar economic environment, over a similar term. Determined by reference rate + credit spread + collateral adjustment." },
                    { title: "Finance vs. Operating Lease", desc: "A finance lease transfers substantially all risks and rewards of ownership to the lessee. An operating lease does not. This distinction remains relevant for lessors under all standards and for lessees under ASC 842, FRS 102 (pre-2026), IPSAS 13, and GRAP 13." },
                    { title: "Lease Modification", desc: "A change in scope or consideration not part of original terms. May be accounted for as a separate new lease (if additional ROU at stand-alone price) or a modification of the existing lease (remeasure liability, adjust ROU asset)." },
                    { title: "Sale and Leaseback", desc: "Transfer of an asset to a buyer-lessor with simultaneous leaseback. If the transfer qualifies as a sale (under IFRS 15 / ASC 606), gain/loss is recognised proportional to rights transferred. If not a sale, a financial liability is recognised." },
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
          </div>
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
                          <td key={col} className="px-3 py-2.5 text-muted-foreground">
                            {(row.values as Record<string, string>)[col] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* EBITDA Impact Table */}
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
                      { metric: "Balance Sheet Assets", ifrs16: "↑ ROU Asset", asc842f: "↑ Finance lease ROU", asc842o: "↑ Operating lease ROU", gasb87: "↑ Right-to-use asset" },
                      { metric: "Balance Sheet Liabilities", ifrs16: "↑ Lease Liability", asc842f: "↑ Finance lease liability", asc842o: "↑ Operating lease liability", gasb87: "↑ Lease Liability" },
                      { metric: "EBITDA", ifrs16: "↑ (op. lease cost removed)", asc842f: "↑ (depreciation below EBITDA)", asc842o: "No change (cost above EBITDA)", gasb87: "↑ (amortisation below EBITDA)" },
                      { metric: "Operating Cash Flow", ifrs16: "↑ (principal = financing)", asc842f: "↑ (principal = financing)", asc842o: "↓ (all payments = operating)", gasb87: "↑ (principal = financing)" },
                      { metric: "Leverage Ratio", ifrs16: "↑ (higher debt)", asc842f: "↑ (higher debt)", asc842o: "↑ (higher debt)", gasb87: "↑ (higher debt)" },
                      { metric: "Interest Coverage", ifrs16: "↓ (higher interest)", asc842f: "↓ (higher interest)", asc842o: "No change", gasb87: "↓ (higher interest)" },
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

        {/* ── Full Paper Tab ── */}
        <TabsContent value="paper" className="flex-1 overflow-hidden m-0">
          <div className="flex h-full overflow-hidden">
            {/* TOC Sidebar */}
            <div className="w-56 border-r shrink-0 flex flex-col">
              <div className="p-3 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contents</p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-0.5">
                  {SECTIONS.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveSection(sec.id);
                        document.getElementById(`section-${sec.id}`)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${activeSection === sec.id ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                    >
                      {sec.title}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-3 border-t">
                <a href={PDF_URL} target="_blank" rel="noopener noreferrer" download="Leasing_Accounting_Standards_Paper.pdf">
                  <Button size="sm" variant="outline" className="w-full gap-2 text-xs">
                    <Download className="w-3 h-3" />
                    Download PDF
                  </Button>
                </a>
              </div>
            </div>

            {/* Paper Content */}
            <ScrollArea className="flex-1">
              <div className="max-w-4xl mx-auto px-8 py-8 space-y-10 text-sm leading-relaxed">

                {/* Title */}
                <div className="text-center space-y-2 pb-6 border-b">
                  <h1 className="text-2xl font-bold">Leasing Accounting: A Comprehensive Guide to Global Standards</h1>
                  <p className="text-muted-foreground text-xs">Author: Manus AI &nbsp;|&nbsp; April 2026 &nbsp;|&nbsp; VodaLease Enterprise — Accounting &amp; Compliance Division</p>
                  <div className="flex justify-center gap-2 pt-2">
                    {["IFRS 16", "ASC 842", "GASB 87", "AASB 16", "FRS 102", "HKFRS 16", "Ind AS 116", "IPSAS 13", "GRAP 13", "IAS 17"].map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>

                {/* Abstract */}
                <section id="section-abstract">
                  <h2 className="text-lg font-bold mb-3">Abstract</h2>
                  <p className="text-muted-foreground">
                    Lease accounting has undergone a profound transformation over the past decade, driven by a global push for greater transparency and comparability in financial reporting. The introduction of IFRS 16, ASC 842, GASB 87, and their national equivalents has fundamentally altered how organisations recognise, measure, and disclose lease obligations. This paper provides a comprehensive examination of all major lease accounting standards in force globally, including IFRS 16, ASC 842, GASB 87, GASB 96, AASB 16, FRS 102 (revised), HKFRS 16, Ind AS 116, IPSAS 13, GRAP 13, and the superseded IAS 17. The paper analyses lessee and lessor accounting models, recognition and measurement mechanics, disclosure requirements, transition approaches, and the practical implications for a leasing enterprise operating across multiple jurisdictions.
                  </p>
                </section>

                <Separator />

                {/* Section 1 — History */}
                <section id="section-history">
                  <h2 className="text-lg font-bold mb-3">1. Historical Context: IAS 17 and the Case for Reform</h2>
                  <p className="mb-3">
                    IAS 17 <em>Leases</em>, originally issued in 1982 and substantially revised in 1997 and 2003, governed lease accounting under IFRS until its supersession by IFRS 16 on 1 January 2019. The standard established a binary classification model based on the concept of <strong>risks and rewards of ownership</strong>: finance leases (on-balance-sheet) versus operating leases (off-balance-sheet).
                  </p>
                  <p className="mb-3">
                    Research by the IASB and FASB estimated that, prior to reform, listed companies worldwide had approximately <strong>USD 3.3 trillion</strong> in operating lease commitments that were not reflected on balance sheets. This obscured the true leverage of organisations in capital-intensive sectors such as retail, aviation, and telecommunications. The G20 and the Financial Stability Board called for reform, ultimately producing IFRS 16 and ASC 842.
                  </p>
                  <div className="rounded-lg border overflow-hidden mt-4">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50 border-b"><th className="text-left px-4 py-2.5 font-semibold">IAS 17 Classification Indicator</th><th className="text-left px-4 py-2.5 font-semibold">Description</th></tr></thead>
                      <tbody>
                        {[
                          ["Transfer of ownership", "Lease transfers ownership to lessee by end of term"],
                          ["Bargain purchase option", "Lessee has option to purchase at below fair value"],
                          ["Lease term", "Lease term covers major part of economic life of asset"],
                          ["Present value test", "PV of minimum lease payments ≥ substantially all of fair value"],
                          ["Specialised nature", "Asset is so specialised only lessee can use it without major modification"],
                        ].map(([ind, desc], i) => (
                          <tr key={ind} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                            <td className="px-4 py-2 font-medium">{ind}</td>
                            <td className="px-4 py-2 text-muted-foreground">{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <Separator />

                {/* Section 2 — IFRS 16 Lessee */}
                <section id="section-ifrs16">
                  <h2 className="text-lg font-bold mb-3">2. IFRS 16 — Lessee Accounting</h2>
                  <p className="mb-3">
                    IFRS 16 <em>Leases</em> was issued by the IASB in January 2016, effective <strong>1 January 2019</strong>. It introduces a single on-balance-sheet model for lessees, eliminating the operating/finance lease distinction. All leases (except short-term ≤ 12 months and low-value ≈ USD 5,000) must be recognised as a <strong>Right-of-Use (ROU) asset</strong> and a <strong>lease liability</strong>.
                  </p>
                  <h3 className="font-semibold mt-4 mb-2">Initial Recognition and Measurement</h3>
                  <p className="mb-3">
                    At the commencement date, the lease liability is measured at the <strong>present value of lease payments not yet made</strong>, discounted at the interest rate implicit in the lease (IRIIL) or the lessee's <strong>Incremental Borrowing Rate (IBR)</strong>. The ROU asset equals the lease liability plus prepayments, initial direct costs, and estimated restoration costs.
                  </p>
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
                  <h3 className="font-semibold mt-4 mb-2">Incremental Borrowing Rate (IBR) Determination</h3>
                  <div className="rounded-lg border overflow-hidden mt-2">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50 border-b"><th className="text-left px-4 py-2.5 font-semibold">Factor</th><th className="text-left px-4 py-2.5 font-semibold">Description</th></tr></thead>
                      <tbody>
                        {[
                          ["Currency", "Rate for the currency in which lease payments are denominated"],
                          ["Term", "Matches the lease term including reasonably certain extension options"],
                          ["Security", "Reflects secured borrowing (ROU asset as implicit collateral)"],
                          ["Economic environment", "Jurisdiction and market conditions at commencement date"],
                          ["Lessee credit risk", "Lessee's creditworthiness and credit spread"],
                        ].map(([f, d], i) => (
                          <tr key={f} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                            <td className="px-4 py-2 font-medium">{f}</td>
                            <td className="px-4 py-2 text-muted-foreground">{d}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <Separator />

                {/* Section 3 — IFRS 16 Lessor */}
                <section id="section-ifrs16-lessor">
                  <h2 className="text-lg font-bold mb-3">3. IFRS 16 — Lessor Accounting</h2>
                  <p className="mb-3">
                    Lessor accounting under IFRS 16 is substantially unchanged from IAS 17. Lessors continue to classify each lease as a <strong>finance lease</strong> (risks and rewards substantially transferred) or an <strong>operating lease</strong> (risks and rewards not substantially transferred).
                  </p>
                  <p className="mb-3">
                    Under a <strong>finance lease</strong>, the lessor derecognises the underlying asset and recognises a <strong>net investment in the lease</strong> (receivable), recognising finance income over the lease term using the effective interest method. Under an <strong>operating lease</strong>, the lessor retains the asset on its balance sheet, continues to depreciate it, and recognises lease income on a straight-line basis.
                  </p>
                  <h3 className="font-semibold mt-4 mb-2">Finance Lease — Lessor Journal Entry (Equipment QAR 500,000, 5yr, 6%)</h3>
                  <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs space-y-1 border">
                    <p>Dr  Net Investment in Lease    500,000</p>
                    <p>    Cr  Equipment (Asset)                  500,000</p>
                    <p className="text-muted-foreground mt-2">// Year 1 — Finance income</p>
                    <p>Dr  Net Investment in Lease     30,000   (500,000 × 6%)</p>
                    <p>    Cr  Finance Income                      30,000</p>
                    <p className="text-muted-foreground mt-2">// Year 1 — Receipt</p>
                    <p>Dr  Cash                       120,000</p>
                    <p>    Cr  Net Investment in Lease            120,000</p>
                  </div>
                </section>

                <Separator />

                {/* Section 4 — ASC 842 */}
                <section id="section-asc842">
                  <h2 className="text-lg font-bold mb-3">4. ASC 842 — US GAAP Leases</h2>
                  <p className="mb-3">
                    ASC 842 was issued by FASB in February 2016, effective for public companies in <strong>2019</strong> and private companies in <strong>2022</strong>. Unlike IFRS 16, ASC 842 <strong>retains the dual lessee model</strong> — both operating and finance leases are on the balance sheet, but their income statement treatment differs significantly.
                  </p>
                  <div className="rounded-lg border overflow-hidden mt-4">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50 border-b"><th className="text-left px-4 py-2.5 font-semibold">Item</th><th className="text-left px-4 py-2.5 font-semibold">Finance Lease</th><th className="text-left px-4 py-2.5 font-semibold">Operating Lease</th></tr></thead>
                      <tbody>
                        {[
                          ["ROU Asset amortisation", "Separate amortisation expense", "Included in single lease cost"],
                          ["Interest on liability", "Separate interest expense", "Included in single lease cost"],
                          ["Total expense pattern", "Front-loaded (higher early)", "Straight-line over lease term"],
                          ["EBITDA impact", "Depreciation + interest below EBITDA", "Single lease cost above EBITDA"],
                          ["Cash flow classification", "Principal = financing; interest = operating/financing", "All payments = operating"],
                        ].map(([item, fin, op], i) => (
                          <tr key={item} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                            <td className="px-4 py-2 font-medium">{item}</td>
                            <td className="px-4 py-2 text-muted-foreground">{fin}</td>
                            <td className="px-4 py-2 text-muted-foreground">{op}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-muted-foreground">
                    <strong>Key difference from IFRS 16:</strong> ASC 842 does not provide a low-value asset exemption. It also has a three-category lessor model (sales-type, direct financing, operating) versus IFRS 16's two-category model (finance, operating).
                  </p>
                </section>

                <Separator />

                {/* Section 5 — GASB 87 */}
                <section id="section-gasb87">
                  <h2 className="text-lg font-bold mb-3">5. GASB 87 — US Government Leases</h2>
                  <p className="mb-3">
                    GASB 87 applies to US state and local government entities, effective for periods beginning after <strong>15 June 2021</strong>. It adopts a <strong>single financing model</strong> for all leases — no operating/finance distinction. Lessees recognise a right-to-use lease asset (intangible) and a lease liability. Lessors retain the underlying asset and recognise a <strong>lease receivable</strong> and a <strong>deferred inflow of resources</strong> (not immediate revenue).
                  </p>
                  <p className="mb-3">
                    GASB 96 (effective June 2022) extends this model to <strong>subscription-based IT arrangements (SBITAs)</strong> — cloud software such as Office 365, Adobe, and Zoom — ensuring consistent balance sheet treatment between physical asset leases and digital service subscriptions.
                  </p>
                </section>

                <Separator />

                {/* Section 6 — Other Standards */}
                <section id="section-other">
                  <h2 className="text-lg font-bold mb-3">6. Other Major Standards</h2>
                  <div className="space-y-4">
                    {[
                      { code: "AASB 16", detail: "Australian equivalent of IFRS 16, substantially identical. Adds guidance for not-for-profit entities on peppercorn leases (below-market rentals), where the ROU asset is measured at fair value at commencement." },
                      { code: "FRS 102 (Revised 2026)", detail: "UK/Ireland standard. Revised Section 20 (effective 1 January 2026) introduces a right-of-use model broadly consistent with IFRS 16. Prior to 2026, retained the IAS 17 dual model. Simplifications available for smaller entities." },
                      { code: "HKFRS 16", detail: "Word-for-word identical to IFRS 16. Hong Kong maintains full IFRS convergence. Significant impact on listed companies given Hong Kong's expensive commercial real estate market." },
                      { code: "Ind AS 116", detail: "India's equivalent of IFRS 16, mandatory from 1 April 2019. Closely follows IFRS 16 with no fixed low-value asset threshold (left to judgement). Indian companies not applying Ind AS continue to use AS 19 (IAS 17 model)." },
                      { code: "IPSAS 13", detail: "Applies to public sector entities adopting accrual-basis IPSAS. Based on IAS 17 — retains operating/finance lease distinction. IPSASB is developing a new standard (ED 75) to align with IFRS 16." },
                      { code: "GRAP 13", detail: "South African public sector standard based on IPSAS 13. Retains operating/finance lease distinction. Additional guidance for government-to-government leases and state-owned land arrangements." },
                    ].map((s) => (
                      <div key={s.code} className="flex gap-3">
                        <Badge variant="outline" className="shrink-0 h-fit mt-0.5 text-xs">{s.code}</Badge>
                        <p className="text-muted-foreground text-xs leading-relaxed">{s.detail}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <Separator />

                {/* Section 7 — Modifications */}
                <section id="section-modifications">
                  <h2 className="text-lg font-bold mb-3">7. Lease Modifications and Reassessments</h2>
                  <p className="mb-3">
                    A <strong>lease modification</strong> is a change in scope or consideration not part of the original terms. Under IFRS 16, if the modification adds the right to use additional assets at a stand-alone price, it is treated as a <strong>separate new lease</strong>. Otherwise, the lessee remeasures the lease liability using a revised discount rate and adjusts the ROU asset accordingly.
                  </p>
                  <p className="mb-3">
                    <strong>Reassessments</strong> are required when there is a change in the assessment of extension/termination options, residual value guarantees, or index/rate-linked payments. Reassessment uses a revised discount rate for option changes and the original discount rate for payment changes.
                  </p>
                </section>

                <Separator />

                {/* Section 8 — Sale and Leaseback */}
                <section id="section-saleback">
                  <h2 className="text-lg font-bold mb-3">8. Sale and Leaseback Transactions</h2>
                  <p className="mb-3">
                    A sale and leaseback occurs when an entity sells an asset to a buyer-lessor and simultaneously leases it back. Under IFRS 16, if the transfer qualifies as a sale (under IFRS 15), the seller-lessee recognises a ROU asset and lease liability, with gain/loss recognised only to the extent it relates to rights transferred to the buyer-lessor:
                  </p>
                  <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs border">
                    <p>Gain = (Fair Value − Carrying Amount) × (1 − PV of Lease Payments / Fair Value)</p>
                  </div>
                  <p className="mt-3 text-muted-foreground">
                    If the transfer is not a sale (seller-lessee retains control), the seller-lessee continues to recognise the asset and recognises a <strong>financial liability</strong> for proceeds received.
                  </p>
                </section>

                <Separator />

                {/* Section 9 — Disclosures */}
                <section id="section-disclosures">
                  <h2 className="text-lg font-bold mb-3">9. Disclosure Requirements</h2>
                  <p className="mb-3">IFRS 16 requires extensive disclosures for both lessees and lessors:</p>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50 border-b"><th className="text-left px-4 py-2.5 font-semibold">Party</th><th className="text-left px-4 py-2.5 font-semibold">Key Disclosures Required</th></tr></thead>
                      <tbody>
                        {[
                          ["Lessee", "Depreciation of ROU assets by class; interest expense on lease liabilities; short-term/low-value/variable lease expense; total cash outflow; additions to ROU assets; carrying amount of ROU assets; maturity analysis of lease liabilities (undiscounted); significant judgements and assumptions"],
                          ["Lessor (Finance)", "Maturity analysis of lease receivables; reconciliation of gross to net investment; unearned finance income; unguaranteed residual values; ECL provisions on lease receivables"],
                          ["Lessor (Operating)", "Maturity analysis of lease payments receivable; total lease income; depreciation of leased assets; initial direct costs"],
                        ].map(([party, disc], i) => (
                          <tr key={party} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                            <td className="px-4 py-2 font-medium align-top">{party}</td>
                            <td className="px-4 py-2 text-muted-foreground">{disc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <Separator />

                {/* Section 10 — Transition */}
                <section id="section-transition">
                  <h2 className="text-lg font-bold mb-3">10. Transition Approaches</h2>
                  <p className="mb-3">Both IFRS 16 and ASC 842 offer two transition methods:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-muted/20">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm mb-2">Full Retrospective</h3>
                        <p className="text-xs text-muted-foreground">Apply the standard to all prior periods presented as if it had always been in effect. Provides maximum comparability but requires significant effort to reconstruct historical data.</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/20">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm mb-2">Modified Retrospective</h3>
                        <p className="text-xs text-muted-foreground">Apply from the date of initial application without restating prior periods. Cumulative effect recognised as an adjustment to opening equity. Various practical expedients available to ease transition.</p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator />

                {/* Section 11 — Practical Implications */}
                <section id="section-practical">
                  <h2 className="text-lg font-bold mb-3">11. Practical Implications for a Leasing Enterprise</h2>
                  <p className="mb-3">
                    For a <strong>lessor</strong> organisation such as VodaLease Enterprise, the primary accounting considerations under IFRS 16 are: (1) classification of each lease as finance or operating; (2) measurement of net investment in finance leases including unguaranteed residual values; (3) straight-line income recognition for operating leases; (4) ECL impairment on finance lease receivables under IFRS 9; and (5) disclosure of portfolio maturity profiles and concentration risks.
                  </p>
                  <p className="mb-3">
                    For the company's own leased premises and equipment (as a lessee), IFRS 16 requires recognition of ROU assets and lease liabilities, with the IBR determined by reference to the relevant interbank rate (e.g., QIBOR, SAIBOR, EIBOR for Gulf-region leases) adjusted for the entity's credit spread and the specific lease term and currency.
                  </p>
                  <p className="mb-3">
                    Organisations with large lease portfolios may apply the <strong>portfolio approach</strong>, grouping leases with similar characteristics and applying a single IBR to the portfolio, provided the effect does not differ materially from individual lease accounting.
                  </p>
                </section>

                <Separator />

                {/* Section 12 — Conclusion */}
                <section id="section-conclusion">
                  <h2 className="text-lg font-bold mb-3">12. Conclusion</h2>
                  <p className="mb-3">
                    The global lease accounting reform has brought trillions of dollars of previously off-balance-sheet lease obligations onto corporate and government balance sheets. The key themes are: <strong>convergence with divergence</strong> (IFRS 16 and ASC 842 share a foundation but differ in the dual lessee model and low-value exemption); <strong>the lessor gap</strong> (lessor accounting remains largely unchanged); <strong>public sector lag</strong> (IPSAS 13 and GRAP 13 still use the IAS 17 model); and the <strong>judgement-intensive</strong> nature of lease term determination, IBR calculation, and modification accounting.
                  </p>
                  <p className="text-muted-foreground">
                    For a leasing enterprise operating across multiple jurisdictions, a deep understanding of all major standards — and the ability to apply them consistently across a diverse portfolio — is a fundamental competency. The standards examined in this paper provide the framework; disciplined and consistent application is the challenge.
                  </p>
                </section>

                <Separator />

                {/* References */}
                <section>
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    References
                  </h2>
                  <div className="space-y-2">
                    {[
                      { num: 1, title: "IFRS 16 Leases (2016)", issuer: "IASB", url: "https://www.ifrs.org/issued-standards/list-of-standards/ifrs-16-leases/" },
                      { num: 2, title: "IAS 17 Leases (superseded)", issuer: "IASB", url: "https://www.ifrs.org/issued-standards/list-of-standards/ias-17-leases/" },
                      { num: 3, title: "ASC 842 Leases", issuer: "FASB", url: "https://asc.fasb.org/842" },
                      { num: 4, title: "GASB Statement No. 87 Leases", issuer: "GASB", url: "https://gasb.org/page/pronouncement?pageId=/standards-and-guidance/pronouncements/summary-statement-no-87.html" },
                      { num: 5, title: "GASB Statement No. 96 SBITAs", issuer: "GASB", url: "https://gasb.org/page/pronouncement?pageId=/standards-and-guidance/pronouncements/summary-statement-no-96.html" },
                      { num: 6, title: "AASB 16 Leases", issuer: "AASB", url: "https://aasb.gov.au/admin/file/content105/c9/AASB16_02-16.pdf" },
                      { num: 7, title: "FRS 102 Section 20 (Revised 2024)", issuer: "FRC", url: "https://www.frc.org.uk/library/standards-codes-policy/accounting-and-reporting/uk-accounting-standards/frs-102/" },
                      { num: 8, title: "HKFRS 16 Leases", issuer: "HKICPA", url: "https://www.hkicpa.org.hk/en/Become-a-Hong-Kong-CPA/QP-Student-support-and-benefits/Prospective-CPA/A-closer-look-at-the-new-leases-standard" },
                      { num: 9, title: "IPSAS 13 Leases", issuer: "IPSASB", url: "https://www.ipsasb.org/publications/ipsas-13-leases" },
                      { num: 10, title: "GRAP 13 Leases", issuer: "ASB South Africa", url: "https://www.asb.co.za/wp-content/uploads/2023/08/GRAP-13-Leases-1-April-2025.pdf" },
                      { num: 11, title: "IFRS 16 Overview", issuer: "KPMG", url: "https://assets.kpmg.com/content/dam/kpmgsites/xx/pdf/ifrg/2024/leases-overview.pdf" },
                      { num: 12, title: "ASC 842 vs IFRS 16 Comparison", issuer: "KPMG", url: "https://kpmg.com/us/en/articles/2025/lease-accounting-ifrs-standards-us-gaap.html" },
                      { num: 13, title: "IFRS 16 Discount Rate Guide", issuer: "Grant Thornton", url: "https://www.grantthornton.global/en/insights/ifrs-16/ifrs-16---understanding-the-discount-rate/" },
                      { num: 14, title: "IFRS 16 In Practice 2023/2024", issuer: "BDO Global", url: "https://www.bdo.global/getmedia/4b4c5f48-af18-4caa-b598-630ba9b937cf/IFRS-16-In-Practice-2023-2024.pdf" },
                    ].map((ref) => (
                      <div key={ref.num} className="flex items-start gap-3 text-xs">
                        <span className="text-muted-foreground shrink-0 w-5 text-right">[{ref.num}]</span>
                        <div>
                          <span className="font-medium">{ref.title}</span>
                          <span className="text-muted-foreground"> — {ref.issuer} </span>
                          <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-0.5">
                            <ExternalLink className="w-2.5 h-2.5" />
                            Link
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
  );
}
