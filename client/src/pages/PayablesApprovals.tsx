import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function PayablesApprovals() {
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const { data: invoicesData, refetch } = trpc.payables.getInvoiceRegister.useQuery({ page: 1, pageSize: 100, status: "Pending" });
  const invoices: any[] = (invoicesData as any)?.rows ?? [];
  const rows: any[] = invoices;

  const approveMutation = trpc.payables.approveInvoice.useMutation({
    onSuccess: (d: any) => { toast.success(`Invoice ${d?.new_status ?? "updated"}`); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLPAYAPP0001P001"
  title="Payables Approvals"
  subtitle="Invoice approval queue and maker/checker"

          screenType="payables_approvals"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />
    </DashboardLayout>
  );
}
