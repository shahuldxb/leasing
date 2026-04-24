import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function BankHistory() {
  const { data } = trpc.bankRecon.getHistory.useQuery({ pageNumber: 1, pageSize: 50 });
  const rows: any[] = Array.isArray(data) ? data : (data as any)?.sessions ?? [];
  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLBNKHST0001P001"
  title="Bank Statement History"
  subtitle="Imported bank statement archive"
/>
    </DashboardLayout>
  );
}
