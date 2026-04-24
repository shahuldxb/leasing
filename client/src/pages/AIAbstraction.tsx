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
import { ScreenHeader } from "@/components/ScreenHeader";

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
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
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
      <ScreenHeader
  screenId="VFLAIABT0001P001"
  title="AI Lease Abstraction"
  subtitle="GPT-4o OCR extraction from lease documents"

          screenType="ai_abstraction"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />
    </DashboardLayout>
  );
}
