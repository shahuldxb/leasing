import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, Play } from "lucide-react";
import { toast } from "sonner";

const REPORT_TEMPLATES = [
  { id: "lease_register", name: "Lease Register Report", description: "Full list of all active leases with key terms" },
  { id: "amortisation_summary", name: "Amortisation Summary", description: "IFRS 16 amortisation schedule summary by period" },
  { id: "ifrs16_disclosure", name: "IFRS 16 Disclosure Pack", description: "Full IFRS 16 note disclosure for financial statements" },
  { id: "maturity_analysis", name: "Lease Maturity Analysis", description: "Undiscounted future lease payments by maturity band" },
  { id: "payment_forecast", name: "Payment Forecast Report", description: "12-month forward-looking payment schedule" },
  { id: "rou_movement", name: "ROU Asset Movement", description: "Right-of-use asset additions, depreciation, and NBV" },
  { id: "lease_liability", name: "Lease Liability Roll-forward", description: "Opening balance, additions, payments, and closing balance" },
  { id: "insurance_register", name: "Insurance Policy Register", description: "All active insurance policies with renewal dates" },
  { id: "cheque_register", name: "Cheque Register Report", description: "All issued cheques with status and clearance details" },
  { id: "bank_recon_summary", name: "Bank Reconciliation Summary", description: "Reconciliation status per bank account" },
];

export default function MISReports() {
  const [selectedReport, setSelectedReport] = useState("");
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0,10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0,10));
  const [format, setFormat] = useState("PDF");

  const handleGenerate = () => {
    if (!selectedReport) { toast.error("Please select a report"); return; }
    toast.success(`Generating ${format} report...`);
    setTimeout(() => toast.info("Report ready for download (feature in progress)"), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-[#e60000]" /> Custom Report Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFMISREPT0001P001 · Generate and export standard and custom reports</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">Report Parameters</h3>
            <div>
              <Label className="text-sm font-medium">Report Template *</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select report..." /></SelectTrigger>
                <SelectContent>{REPORT_TEMPLATES.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-sm font-medium">From Date</Label><Input type="date" className="mt-1" value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
            <div><Label className="text-sm font-medium">To Date</Label><Input type="date" className="mt-1" value={toDate} onChange={e => setToDate(e.target.value)} /></div>
            <div>
              <Label className="text-sm font-medium">Export Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["PDF","Excel","CSV"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={handleGenerate}>
                <Play className="w-4 h-4 mr-2" /> Generate
              </Button>
              <Button variant="outline" onClick={() => toast.info("Schedule coming soon")}><Download className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-semibold">Available Reports</h3>
            {REPORT_TEMPLATES.map(r => (
              <div key={r.id}
                className={`bg-card border rounded-xl p-4 cursor-pointer transition-colors ${selectedReport === r.id ? "border-[#e60000]" : "border-border hover:border-[#e60000]/50"}`}
                onClick={() => setSelectedReport(r.id)}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{r.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                  </div>
                  {selectedReport === r.id && <div className="w-2 h-2 bg-[#e60000] rounded-full mt-1.5 flex-shrink-0" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
