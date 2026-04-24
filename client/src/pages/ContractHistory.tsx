import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { toast } from "sonner";

export default function ContractHistory() {
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const { data: contracts = [], isLoading } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 100 });

  const utils = trpc.useUtils();
  const submitForApprovalMut = trpc.lease.submitForApproval.useMutation({
    onSuccess: () => { utils.lease.getLeaseRegister.invalidate(); toast.success("Submitted for approval"); },
    onError: (e) => toast.error(e.message),
  });
  const rows: any[] = Array.isArray(contracts) ? contracts : (contracts as any)?.leases ?? [];

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLCNTHST0001P001"
  title="Contract Version History"
  subtitle="Full version history and change log for contracts"

          screenType="contract_history"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />
    </DashboardLayout>
  );
}
