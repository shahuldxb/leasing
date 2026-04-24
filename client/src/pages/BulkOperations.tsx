import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileSpreadsheet, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const TEMPLATES = [
  { name: "Lease Register", file: "lease_register_template.xlsx", desc: "Import new leases with full IFRS 16 fields" },
  { name: "Amortisation Schedule", file: "amortisation_template.xlsx", desc: "Import pre-calculated amortisation schedules" },
  { name: "IBR Rates", file: "ibr_rates_template.xlsx", desc: "Bulk upload incremental borrowing rates" },
  { name: "Invoices", file: "invoices_template.xlsx", desc: "Import payables invoices in bulk" },
  { name: "Lessor Contacts", file: "lessor_contacts_template.xlsx", desc: "Import lessor contact information" },
];

export default function BulkOperations() {
  const [dragOver, setDragOver] = useState(false);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importType, setImportType] = useState("LEASE_REGISTER");
  const [parseResult, setParseResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: history = [], refetch } = trpc.accounting.bulk.operationLog.useQuery();
  const upload = trpc.accounting.bulk.massRemeasure.useMutation({
    onSuccess: (data: any) => {
      setParseResult(data);
      refetch();
      toast.success(`Imported ${data.successCount} records (${data.errorCount} errors)`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleFile = (file: File) => {
    setUploadFile(file);
    setParseResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const doUpload = () => {
    if (!uploadFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      // For now show a simulated result since massRemeasure takes different params
      setParseResult({ successCount: 0, errorCount: 0, totalRows: 0, errors: ["File import requires server-side parser — use the API endpoint directly"] });
      toast.info("File upload noted. Backend parser integration in progress.");
    };
    reader.readAsDataURL(uploadFile);
  };

  const statusIcon = (s: string) => {
    if (s === "COMPLETED") return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (s === "PARTIAL") return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <DashboardLayout>
      <ScreenHeader
  screenId="VFLBLKOPS0001P001"
  title="Bulk Operations"
  subtitle="Mass update and bulk action processing"

          screenType="bulk_operations"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />
    </DashboardLayout>
  );
}
