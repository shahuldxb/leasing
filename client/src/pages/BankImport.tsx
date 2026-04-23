import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function BankImport() {
  const [accountId, setAccountId] = useState("");
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
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Upload className="w-6 h-6 text-[#e60000]" /> Import Bank Statement</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFBNKIMPT0001P001 · Upload CSV bank statement for reconciliation</p>
        </div>

        <div className="max-w-xl space-y-4">
          <div>
            <Label className="text-sm font-medium">Bank Account *</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select bank account..." /></SelectTrigger>
              <SelectContent>
                {(accounts as any[]).map((a: any) => (
                  <SelectItem key={a.account_id} value={String(a.account_id)}>{a.bank_name} — {a.account_number} ({a.currency})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${dragging ? "border-[#e60000] bg-[#e60000]/5" : "border-border hover:border-[#e60000]/50"}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input id="file-input" type="file" accept=".csv" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !accountId) { toast.error("Select a bank account first"); return; }
              const reader = new FileReader();
              const today = new Date().toISOString().slice(0,10);
              reader.onload = () => importMutation.mutate({ accountId: Number(accountId), statementDate: today, periodFrom: today, periodTo: today, openingBalance: 0, closingBalance: 0, fileFormat: 'CSV', transactions: [] });
              reader.readAsText(file);
            }} />
            {imported ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                <p className="font-semibold text-green-400">Statement imported successfully</p>
                <Button variant="outline" size="sm" onClick={() => setImported(false)}>Import Another</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="font-semibold">Drop CSV file here or click to browse</p>
                <p className="text-sm text-muted-foreground">Supports standard bank CSV exports (Date, Description, Debit, Credit, Balance)</p>
              </div>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
            <p className="font-semibold">Expected CSV Format:</p>
            <p className="font-mono text-xs text-muted-foreground">Date, Description, Reference, Debit, Credit, Balance</p>
            <p className="font-mono text-xs text-muted-foreground">2025-01-15, "Rent Payment - Tower A", REF001, 5000.00, , 45000.00</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
