import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sparkles, FileText, CheckCircle, AlertCircle, Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const SAMPLE_LEASE = `LEASE AGREEMENT
This Lease Agreement is entered into on January 15, 2025, between:
LESSOR: Barwa Real Estate Company Q.S.C., a company incorporated in Qatar with CR No. 12345, having its registered office at Barwa Tower, West Bay, Doha, Qatar (Landlord)
LESSEE: Vodafone Qatar P.Q.S.C., a company incorporated in Qatar (Tenant)
PREMISES: Office Suite 2401-2410, Level 24, Barwa Tower, West Bay, Doha, Qatar
Total Area: 4,500 square feet
LEASE TERM: 3 years commencing February 1, 2025 and expiring January 31, 2028
RENT: QAR 45,000 per month (QAR 540,000 per annum), payable monthly in advance on the 1st of each month.
RENT REVIEW: Rent shall be reviewed annually in line with the Qatar Real Estate Regulatory Authority index. Any increase shall not exceed 20% of the current rent.
SECURITY DEPOSIT: QAR 135,000 (equivalent to 3 months rent), payable by bank guarantee from Qatar National Bank.
RENEWAL OPTION: Tenant has the option to renew for a further 2-year term by giving 90 days written notice prior to expiry.
BREAK CLAUSE: Either party may terminate this Agreement after 18 months by giving 3 months written notice.
GOVERNING LAW: This Agreement shall be governed by the laws of the State of Qatar.
SERVICE CHARGES: QAR 8,000 per month payable by Tenant.
PERMITTED USE: The premises shall be used solely for general office purposes.`;

const SAMPLE_QATAR_RECORD: Record<string, unknown> = {
  lessor_name: "Barwa Real Estate Company Q.S.C.",
  lessee_name: "Vodafone Qatar P.Q.S.C.",
  asset_description: "Office Suite 2401-2410, Level 24, Barwa Tower, West Bay, Doha",
  commencement_date: "2025-02-01",
  expiry_date: "2028-01-31",
  monthly_rent: 45000,
  currency: "QAR",
  security_deposit: 135000,
  break_clause_months: 18,
  renewal_option_years: 2,
  notice_period_days: 90,
  confidence_score: 94,
};

export default function AIAbstraction() {
  const [leaseText, setLeaseText] = useState("");
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [result, setResult] = useState<any>(null);
  const [view, setView] = useState<"input" | "result">("input");

  const handleAltKeys = useCallback((e: KeyboardEvent) => {
    if (e.altKey && e.key === "1") { e.preventDefault(); setView("input"); setAiRecord(null); }
    if (e.altKey && e.key === "F2") { e.preventDefault(); setAiRecord(SAMPLE_QATAR_RECORD); }
  }, []);
  useEffect(() => {
    window.addEventListener("keydown", handleAltKeys);
    return () => window.removeEventListener("keydown", handleAltKeys);
  }, [handleAltKeys]);

  const abstract = trpc.aiAbstraction.abstract.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setView("result");
      toast.success(`Abstraction complete — ${data.confidence_score}% confidence`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const fmt = (n: any) => n != null ? `QAR ${Number(n).toLocaleString("en-QA", { maximumFractionDigits: 0 })}` : "—";

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast.success("Copied to clipboard");
  };

  const fields = result ? [
    { label: "Lessor", value: result.lessor_name },
    { label: "Lessee", value: result.lessee_name },
    { label: "Asset / Premises", value: result.asset_description },
    { label: "Commencement", value: result.commencement_date },
    { label: "Expiry", value: result.expiry_date },
    { label: "Monthly Rent", value: fmt(result.monthly_rent) },
    { label: "Currency", value: result.currency },
    { label: "Security Deposit", value: fmt(result.security_deposit) },
    { label: "Renewal Option", value: result.renewal_option_years ? `${result.renewal_option_years} yr(s)` : "—" },
    { label: "Break Clause", value: result.break_clause_months ? `${result.break_clause_months} months` : "—" },
    { label: "Notice Period", value: result.notice_period_days ? `${result.notice_period_days} days` : "—" },
    { label: "Confidence", value: `${result.confidence_score}%` },
  ] : [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
          screenId="VFLAIABT0001P001"
          title="AI Lease Abstraction"
          subtitle="GPT-4o OCR extraction from lease documents"
          screenType="ai_abstraction"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
          actions={view === "result" ? (
            <Button variant="outline" size="sm" onClick={() => { setView("input"); setResult(null); }} className="gap-2">
              <RotateCcw className="w-4 h-4" /> New Abstraction
            </Button>
          ) : undefined}
        />

        {aiRecord && (
          <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Sample Record (Qatar)</h3>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setAiRecord(null)}>✕ Close</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {Object.entries(aiRecord).map(([k, v]) => (
                <div key={k} className="space-y-0.5">
                  <p className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, " ")}</p>
                  <p className="font-medium text-xs">{String(v)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "input" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Paste Lease Document Text
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Lease Agreement Text</Label>
                    <Textarea
                      className="min-h-[320px] font-mono text-xs resize-none"
                      placeholder="Paste your lease agreement text here..."
                      value={leaseText}
                      onChange={e => setLeaseText(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2 flex-1"
                      onClick={() => abstract.mutate({ leaseText })}
                      disabled={!leaseText.trim() || abstract.isPending}
                    >
                      <Sparkles className="w-4 h-4" />
                      {abstract.isPending ? "Extracting..." : "Extract with AI"}
                    </Button>
                    <Button variant="outline" onClick={() => setLeaseText(SAMPLE_LEASE)}>Load Sample</Button>
                  </div>
                  {abstract.isPending && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Analysing lease document...</p>
                      <Progress value={65} className="h-1" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3"><CardTitle className="text-sm">What AI Extracts</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {["Lessor & Lessee names","Commencement & expiry dates","Monthly rent & currency","Security deposit amount","Renewal options","Break clauses","Notice periods","Permitted use","Governing law"].map(item => (
                      <li key={item} className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-400 shrink-0" />{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-amber-500/10 border-amber-500/30">
                <CardContent className="pt-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300">Always review AI-extracted data before saving to the lease register.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {view === "result" && result && (
          <div className="space-y-6">
            <div className={`rounded-xl p-4 flex items-center gap-4 ${result.confidence_score >= 80 ? "bg-green-500/10 border border-green-500/30" : "bg-amber-500/10 border border-amber-500/30"}`}>
              <CheckCircle className={`w-6 h-6 ${result.confidence_score >= 80 ? "text-green-400" : "text-amber-400"}`} />
              <div className="flex-1">
                <p className="font-semibold text-sm">Abstraction Complete</p>
                <p className="text-xs text-muted-foreground">Confidence score: {result.confidence_score}%</p>
              </div>
              <Badge className={result.confidence_score >= 80 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}>
                {result.confidence_score >= 80 ? "High Confidence" : "Review Required"}
              </Badge>
            </div>
            <Card className="bg-card border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Extracted Lease Data</CardTitle>
                <Button variant="outline" size="sm" onClick={copyJSON} className="gap-2"><Copy className="w-3 h-3" /> Copy JSON</Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {fields.map(f => (
                    <div key={f.label} className="space-y-1">
                      <p className="text-xs text-muted-foreground">{f.label}</p>
                      <p className="text-sm font-medium">{f.value ?? "—"}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {result.raw_notes && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Additional Notes</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.raw_notes}</p></CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
