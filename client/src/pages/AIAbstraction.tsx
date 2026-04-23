import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sparkles, FileText, CheckCircle, AlertCircle, Copy, Download } from "lucide-react";
import { toast } from "sonner";

const SAMPLE_LEASE = `LEASE AGREEMENT

This Lease Agreement ("Agreement") is entered into on January 15, 2025, between:

LESSOR: Emaar Properties PJSC, a company incorporated in the UAE with commercial license no. 12345, having its registered office at Emaar Square, Downtown Dubai, UAE ("Landlord")

LESSEE: Vodafone UAE LLC, a company incorporated in the UAE ("Tenant")

PREMISES: Office Suite 2401-2410, Level 24, Emaar Square Tower 3, Downtown Dubai, Dubai, UAE
Total Area: 4,500 square feet

LEASE TERM: 3 years commencing February 1, 2025 and expiring January 31, 2028

RENT: AED 45,000 per month (AED 540,000 per annum), payable monthly in advance on the 1st of each month.

RENT REVIEW: Rent shall be reviewed annually in line with the RERA Rental Index. Any increase shall not exceed 20% of the current rent.

SECURITY DEPOSIT: AED 135,000 (equivalent to 3 months' rent), payable by bank guarantee from Emirates NBD.

RENEWAL OPTION: Tenant has the option to renew for a further 2-year term by giving 90 days' written notice prior to expiry.

BREAK CLAUSE: Either party may terminate this Agreement after 18 months by giving 3 months' written notice.

GOVERNING LAW: This Agreement shall be governed by the laws of the Emirate of Dubai and the UAE.

SERVICE CHARGES: AED 8,000 per month payable by Tenant.

PERMITTED USE: The premises shall be used solely for general office purposes.`;

export default function AIAbstraction() {
  const [leaseText, setLeaseText] = useState("");
  const [result, setResult] = useState<any>(null);

  const abstract = trpc.aiAbstraction.abstract.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success(`Abstraction complete — ${data.confidence_score}% confidence`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const fmt = (n: any) => n != null ? `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}` : "—";

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast.success("Copied to clipboard");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            AI Lease Abstraction
          </h1>
          <p className="text-muted-foreground text-sm">Paste lease document text and let AI extract all IFRS 16 data fields automatically</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Lease Document Text
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Paste lease agreement text below</Label>
                <Textarea
                  value={leaseText}
                  onChange={e => setLeaseText(e.target.value)}
                  rows={18}
                  placeholder="Paste the full text of the lease agreement here..."
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => abstract.mutate({ leaseText, documentType: "LEASE_AGREEMENT" })}
                  disabled={abstract.isPending || !leaseText.trim()}
                  className="flex-1"
                >
                  {abstract.isPending ? (
                    <><Sparkles className="w-4 h-4 mr-2 animate-pulse" />Abstracting...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Abstract with AI</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setLeaseText(SAMPLE_LEASE)}>
                  Load Sample
                </Button>
              </div>
              {abstract.isPending && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">AI is reading the lease document...</p>
                  <Progress value={undefined} className="animate-pulse" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Result */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {result ? (
                  result.confidence_score >= 80 ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />
                ) : null}
                Extracted Data
                {result && (
                  <Badge variant={result.confidence_score >= 80 ? "default" : "secondary"} className="ml-auto">
                    {result.confidence_score}% confidence
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Abstraction results will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: "Lessor", value: result.lessor_name },
                      { label: "Lessee", value: result.lessee_name },
                      { label: "Asset", value: result.asset_description },
                      { label: "Asset Type", value: result.asset_type },
                      { label: "Commencement", value: result.commencement_date },
                      { label: "Expiry", value: result.expiry_date },
                      { label: "Term (months)", value: result.lease_term_months },
                      { label: "Monthly Payment", value: fmt(result.monthly_payment) },
                      { label: "Currency", value: result.currency },
                      { label: "Payment Frequency", value: result.payment_frequency },
                      { label: "IBR Rate", value: result.ibr_rate ? `${(result.ibr_rate * 100).toFixed(2)}%` : "—" },
                      { label: "Classification", value: result.classification },
                      { label: "Security Deposit", value: fmt(result.security_deposit) },
                      { label: "Governing Law", value: result.governing_law },
                    ].map(f => (
                      <div key={f.label} className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">{f.label}</p>
                        <p className="font-medium text-sm">{f.value ?? "—"}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Options & Clauses</p>
                    <div className="flex flex-wrap gap-2">
                      {result.has_renewal_option && <Badge variant="outline" className="text-xs text-emerald-600">Renewal Option</Badge>}
                      {result.has_break_clause && <Badge variant="outline" className="text-xs text-amber-600">Break Clause</Badge>}
                      {result.break_clause_date && <Badge variant="outline" className="text-xs">{result.break_clause_date}</Badge>}
                      {result.rent_review_frequency && <Badge variant="outline" className="text-xs">Rent Review: {result.rent_review_frequency}</Badge>}
                    </div>
                  </div>

                  {result.key_obligations?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Key Obligations</p>
                      <ul className="space-y-1">
                        {result.key_obligations.map((o: string, i: number) => (
                          <li key={i} className="text-xs flex items-start gap-1">
                            <span className="text-primary mt-0.5">•</span>{o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={copyJSON}><Copy className="w-3.5 h-3.5 mr-1" />Copy JSON</Button>
                    <Button size="sm" onClick={() => toast.info("Import to lease register coming soon")}>
                      <Download className="w-3.5 h-3.5 mr-1" />Import to Register
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
