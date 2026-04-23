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

const TEMPLATES = [
  { name: "Lease Register", file: "lease_register_template.xlsx", desc: "Import new leases with full IFRS 16 fields" },
  { name: "Amortisation Schedule", file: "amortisation_template.xlsx", desc: "Import pre-calculated amortisation schedules" },
  { name: "IBR Rates", file: "ibr_rates_template.xlsx", desc: "Bulk upload incremental borrowing rates" },
  { name: "Invoices", file: "invoices_template.xlsx", desc: "Import payables invoices in bulk" },
  { name: "Lessor Contacts", file: "lessor_contacts_template.xlsx", desc: "Import lessor contact information" },
];

export default function BulkOperations() {
  const [dragOver, setDragOver] = useState(false);
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
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bulk Operations</h1>
          <p className="text-muted-foreground text-sm">Import and export large datasets via Excel/CSV — lease registers, amortisation schedules, invoices</p>
        </div>

        <Tabs defaultValue="import">
          <TabsList>
            <TabsTrigger value="import">Import Data</TabsTrigger>
            <TabsTrigger value="templates">Download Templates</TabsTrigger>
            <TabsTrigger value="history">Import History</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-4 space-y-4">
            {/* Import type */}
            <Card>
              <CardHeader><CardTitle className="text-base">1. Select Import Type</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { value: "LEASE_REGISTER", label: "Lease Register" },
                    { value: "AMORTISATION", label: "Amortisation" },
                    { value: "IBR_RATES", label: "IBR Rates" },
                    { value: "INVOICES", label: "Invoices" },
                    { value: "LESSOR_CONTACTS", label: "Lessor Contacts" },
                  ].map(t => (
                    <button
                      key={t.value}
                      onClick={() => setImportType(t.value)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${importType === t.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Drop zone */}
            <Card>
              <CardHeader><CardTitle className="text-base">2. Upload File</CardTitle></CardHeader>
              <CardContent>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  {uploadFile ? (
                    <div>
                      <p className="font-semibold text-primary">{uploadFile.name}</p>
                      <p className="text-sm text-muted-foreground">{(uploadFile.size / 1024).toFixed(1)} KB — ready to import</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Drop your Excel or CSV file here</p>
                      <p className="text-sm text-muted-foreground mt-1">or click to browse — .xlsx, .xls, .csv supported</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </div>
                {uploadFile && (
                  <Button className="mt-4 w-full" onClick={doUpload} disabled={upload.isPending}>
                    {upload.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processing...</> : <><Upload className="w-4 h-4 mr-2" />Import {importType.replace("_", " ")}</>}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Parse result */}
            {parseResult && (
              <Card className={parseResult.errorCount === 0 ? "border-emerald-300" : "border-amber-300"}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {parseResult.errorCount === 0 ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
                    Import Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center"><p className="text-2xl font-bold text-emerald-600">{parseResult.successCount}</p><p className="text-sm text-muted-foreground">Imported</p></div>
                    <div className="text-center"><p className="text-2xl font-bold text-red-600">{parseResult.errorCount}</p><p className="text-sm text-muted-foreground">Errors</p></div>
                    <div className="text-center"><p className="text-2xl font-bold">{parseResult.totalRows}</p><p className="text-sm text-muted-foreground">Total Rows</p></div>
                  </div>
                  {parseResult.errors?.length > 0 && (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {parseResult.errors.map((e: string, i: number) => (
                        <p key={i} className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">{e}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Download Import Templates</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {TEMPLATES.map(t => (
                    <div key={t.file} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-sm text-muted-foreground">{t.desc}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => toast.info("Template download coming soon")}>
                        <Download className="w-4 h-4 mr-2" />Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Import History</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Imported</TableHead>
                      <TableHead>Errors</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(history as any[]).map((h: any) => (
                      <TableRow key={h.import_id}>
                        <TableCell className="text-sm">{h.created_at?.slice(0, 16)?.replace("T", " ")}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{h.import_type}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{h.filename}</TableCell>
                        <TableCell className="text-sm">{h.total_rows}</TableCell>
                        <TableCell className="text-sm text-emerald-600 font-bold">{h.success_count}</TableCell>
                        <TableCell className="text-sm text-red-600">{h.error_count}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {statusIcon(h.status)}
                            <span className="text-sm">{h.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{h.imported_by_name}</TableCell>
                      </TableRow>
                    ))}
                    {(history as any[]).length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No import history</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
