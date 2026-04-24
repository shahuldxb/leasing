import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function BankImport() {
  const [accountId, setAccountId] = useState("");
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [dragging, setDragging] = useState(false);
  const [imported, setImported] = useState(false);

  const { data: accounts = [] } = trpc.bankRecon.listAccounts.useQuery({});
  const importMutation = trpc.bankRecon.importStatement.useMutation({
    onSuccess: (d: any) => { toast.success(`Imported ${d?.rows_imported ?? 0} transactions`); setImported(true); },
    onError: (e) => toast.error(e.message),
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!accountId) { toast.error("Please select a bank account first"); return; }
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const today = new Date().toISOString().slice(0,10);
      importMutation.mutate({ accountId: Number(accountId), statementDate: today, periodFrom: today, periodTo: today, openingBalance: 0, closingBalance: 0, fileFormat: 'CSV', transactions: [] });
    };
    reader.readAsText(file);
  };

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLBNKIMP0001P001"
  title="Bank Statement Import"
  subtitle="Upload and parse bank statement files"

          screenType="bank_import"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />
    </DashboardLayout>
  );
}
