import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function ComplianceIFRS16() {
  const { data: kpis } = trpc.mis.getDashboardKPIs.useQuery();
  const rows: any[] = kpis ? [kpis] : [];

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLCMPIFR0001P001"
  title="IFRS 16 Compliance"
  subtitle="Compliance checklist and disclosure requirements"
/>
    </DashboardLayout>
  );
}
