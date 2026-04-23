import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, BarChart3, Download } from "lucide-react";
import { toast } from "sonner";

const LEASE_OPTIONS = [
  { id: "VF-2024-001", label: "VF-2024-001 — Vodafone HQ Floor 12", lessor: "Al Futtaim Properties", property: "Vodafone HQ, DIFC, Floor 12", area_sqm: 2480, rent_pa: 2220000, rent_psm: 895, term_years: 5, break_option: "Year 3", renewal_option: "2 × 3 years", ibr: 4.75, rou_asset: 9840000, liability: 9320000, deposit: 555000, fit_out_contribution: 1200000, service_charge: 185000, parking_spaces: 25, green_rating: "LEED Gold" },
  { id: "VF-2024-003", label: "VF-2024-003 — Vodafone HQ Floor 13", lessor: "Al Futtaim Properties", property: "Vodafone HQ, DIFC, Floor 13", area_sqm: 2350, rent_pa: 2100000, rent_psm: 894, term_years: 5, break_option: "Year 3", renewal_option: "2 × 3 years", ibr: 4.75, rou_asset: 9320000, liability: 8840000, deposit: 525000, fit_out_contribution: 1100000, service_charge: 175000, parking_spaces: 23, green_rating: "LEED Gold" },
  { id: "VF-2023-041", label: "VF-2023-041 — Vodafone Abu Dhabi", lessor: "TECOM Investments", property: "Vodafone Abu Dhabi, Twofour54", area_sqm: 1680, rent_pa: 1500000, rent_psm: 893, term_years: 3, break_option: "None", renewal_option: "1 × 3 years", ibr: 4.50, rou_asset: 4200000, liability: 3980000, deposit: 375000, fit_out_contribution: 800000, service_charge: 120000, parking_spaces: 15, green_rating: "BREEAM Very Good" },
  { id: "LOI-2026-001", label: "LOI-2026-001 — DIFC Gate Village (Proposed)", lessor: "DIFC Authority", property: "DIFC Gate Village, Unit 12", area_sqm: 1850, rent_pa: 2775000, rent_psm: 1500, term_years: 5, break_option: "Year 3", renewal_option: "1 × 5 years", ibr: 4.75, rou_asset: 12320000, liability: 11680000, deposit: 693750, fit_out_contribution: 0, service_charge: 230000, parking_spaces: 18, green_rating: "LEED Platinum" },
];

type Lease = typeof LEASE_OPTIONS[0];

function compare(a: number, b: number, lowerIsBetter = true): "better" | "worse" | "equal" {
  if (a === b) return "equal";
  if (lowerIsBetter) return a < b ? "better" : "worse";
  return a > b ? "better" : "worse";
}

const ROWS: { label: string; key: keyof Lease; format: (v: unknown) => string; lowerIsBetter?: boolean; higherIsBetter?: boolean }[] = [
  { label: "Lessor", key: "lessor", format: v => String(v) },
  { label: "Property", key: "property", format: v => String(v) },
  { label: "Area (sqm)", key: "area_sqm", format: v => (v as number).toLocaleString() + " sqm", higherIsBetter: true },
  { label: "Annual Rent (AED)", key: "rent_pa", format: v => "AED " + (v as number).toLocaleString(), lowerIsBetter: true },
  { label: "Rent per sqm (AED)", key: "rent_psm", format: v => "AED " + (v as number).toLocaleString(), lowerIsBetter: true },
  { label: "Lease Term", key: "term_years", format: v => v + " years", higherIsBetter: true },
  { label: "Break Option", key: "break_option", format: v => String(v) },
  { label: "Renewal Option", key: "renewal_option", format: v => String(v) },
  { label: "IBR", key: "ibr", format: v => (v as number).toFixed(2) + "%", lowerIsBetter: true },
  { label: "ROU Asset (AED)", key: "rou_asset", format: v => "AED " + ((v as number) / 1000000).toFixed(2) + "M", lowerIsBetter: true },
  { label: "Lease Liability (AED)", key: "liability", format: v => "AED " + ((v as number) / 1000000).toFixed(2) + "M", lowerIsBetter: true },
  { label: "Security Deposit", key: "deposit", format: v => "AED " + (v as number).toLocaleString(), lowerIsBetter: true },
  { label: "Fit-Out Contribution", key: "fit_out_contribution", format: v => "AED " + (v as number).toLocaleString(), higherIsBetter: true },
  { label: "Service Charge p.a.", key: "service_charge", format: v => "AED " + (v as number).toLocaleString(), lowerIsBetter: true },
  { label: "Parking Spaces", key: "parking_spaces", format: v => String(v), higherIsBetter: true },
  { label: "Green Rating", key: "green_rating", format: v => String(v) },
];

export default function LeaseComparison() {
  const [leaseA, setLeaseA] = useState(LEASE_OPTIONS[0].id);
  const [leaseB, setLeaseB] = useState(LEASE_OPTIONS[3].id);

  const a = LEASE_OPTIONS.find(l => l.id === leaseA)!;
  const b = LEASE_OPTIONS.find(l => l.id === leaseB)!;

  function CellIndicator({ result }: { result: "better" | "worse" | "equal" }) {
    if (result === "better") return <TrendingUp className="w-3.5 h-3.5 text-green-400 inline ml-1" />;
    if (result === "worse") return <TrendingDown className="w-3.5 h-3.5 text-red-400 inline ml-1" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground inline ml-1" />;
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lease Comparison & Benchmarking</h1>
            <p className="text-sm text-muted-foreground mt-1">Side-by-side comparison of lease terms, financial metrics, and IFRS 16 impact</p>
          </div>
          <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => toast.info("Exporting comparison report...")}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Lease A</p>
            <Select value={leaseA} onValueChange={setLeaseA}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEASE_OPTIONS.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Lease B</p>
            <Select value={leaseB} onValueChange={setLeaseB}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEASE_OPTIONS.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { lease: a, label: "Lease A", id: leaseA },
            { lease: b, label: "Lease B", id: leaseB },
          ].map(({ lease, label }) => {
            const other = label === "Lease A" ? b : a;
            const betterCount = ROWS.filter(r => {
              const av = lease[r.key] as number;
              const bv = other[r.key] as number;
              if (typeof av !== "number") return false;
              if (r.lowerIsBetter) return av < bv;
              if (r.higherIsBetter) return av > bv;
              return false;
            }).length;
            return (
              <Card key={label} className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Badge className="text-xs mb-2 bg-muted/30 text-muted-foreground border border-border">{label}</Badge>
                  <p className="text-sm font-semibold">{lease.id}</p>
                  <p className="text-xs text-muted-foreground mb-3">{lease.property}</p>
                  <div className="flex items-center justify-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-400" />
                    <span className="text-2xl font-bold text-green-400">{betterCount}</span>
                    <span className="text-xs text-muted-foreground">metrics favourable</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison table */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Detailed Comparison</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left text-xs font-semibold p-3 w-40">Metric</th>
                    <th className="text-left text-xs font-semibold p-3">Lease A — {a.id}</th>
                    <th className="text-left text-xs font-semibold p-3">Lease B — {b.id}</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => {
                    const av = a[row.key];
                    const bv = b[row.key];
                    let aResult: "better" | "worse" | "equal" = "equal";
                    let bResult: "better" | "worse" | "equal" = "equal";
                    if (typeof av === "number" && typeof bv === "number") {
                      if (row.lowerIsBetter) {
                        aResult = compare(av, bv, true);
                        bResult = compare(bv, av, true);
                      } else if (row.higherIsBetter) {
                        aResult = compare(av, bv, false);
                        bResult = compare(bv, av, false);
                      }
                    }
                    return (
                      <tr key={row.key} className={`border-b border-border ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                        <td className="p-3 text-xs font-medium text-muted-foreground">{row.label}</td>
                        <td className={`p-3 text-sm ${aResult === "better" ? "text-green-400" : aResult === "worse" ? "text-red-400" : ""}`}>
                          {row.format(av)}
                          {typeof av === "number" && typeof bv === "number" && av !== bv && <CellIndicator result={aResult} />}
                        </td>
                        <td className={`p-3 text-sm ${bResult === "better" ? "text-green-400" : bResult === "worse" ? "text-red-400" : ""}`}>
                          {row.format(bv)}
                          {typeof av === "number" && typeof bv === "number" && av !== bv && <CellIndicator result={bResult} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-green-400" /> Favourable</div>
          <div className="flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5 text-red-400" /> Unfavourable</div>
          <div className="flex items-center gap-1"><Minus className="w-3.5 h-3.5 text-muted-foreground" /> Equal / Not comparable</div>
        </div>
      </div>
    </DashboardLayout>
  );
}
