import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { toast } from "sonner";

export default function ComplianceIFRS16() {
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const { data: kpis } = trpc.mis.getDashboardKPIs.useQuery();

  const utils = trpc.useUtils();
  const notifyMut = trpc.system.notifyOwner.useMutation({
    onSuccess: () => toast.success("IFRS 16 report sent to owner"),
    onError: (e) => toast.error(e.message),
  });
  const rows: any[] = kpis ? [kpis] : [];

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLCMPIFR0001P001"
  title="IFRS 16 Compliance"
  subtitle="Compliance checklist and disclosure requirements"

          screenType="compliance_ifrs16"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />
    </DashboardLayout>
  );
}
