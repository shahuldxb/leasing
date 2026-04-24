import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Calculator } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { toast } from "sonner";

export default function Amortisation() {
  const [leaseId, setLeaseId] = useState("");
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: leases = [] } = trpc.lease.getLeaseRegister.useQuery({ page: 1, pageSize: 100 });
  const { data: schedule, isLoading } = trpc.lease.getAmortisationSchedule.useQuery(
    { contractId: selectedId! },
    { enabled: !!selectedId }
  );

  const utils = trpc.useUtils();
  const saveMut = trpc.lease.saveAmortisationSchedule.useMutation({
    onSuccess: () => { toast.success("Schedule saved to database"); },
    onError: (e) => toast.error(e.message),
  });

  const rows: any[] = Array.isArray((schedule as any)?.schedule) ? (schedule as any).schedule : [];

  const fmtCcy = (v: number) => v?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00";

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLAMORT0001P001"
          screenType="amortisation"
          onAIData={(rows) => setAiRows(rows)}
  title="Amortisation Schedule"
  subtitle="IFRS 16 right-of-use asset amortisation schedule"
/>
    </DashboardLayout>
  );
}
