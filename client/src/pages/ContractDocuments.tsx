import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Search, Eye, Download } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const MOCK_DOCS = [
  { id: 1, name: "Lease Agreement - Tower Site A.pdf", contract: "VFL-2025-0001", type: "Lease Agreement", uploaded: "2025-01-15", size: "2.4 MB", status: "Active" },
  { id: 2, name: "Insurance Certificate - 2025.pdf", contract: "VFL-2025-0001", type: "Insurance", uploaded: "2025-01-20", size: "0.8 MB", status: "Active" },
  { id: 3, name: "Maintenance SLA Agreement.pdf", contract: "VFL-2025-0002", type: "SLA", uploaded: "2025-02-01", size: "1.2 MB", status: "Active" },
];

export default function ContractDocuments() {
  const [search, setSearch] = useState("");
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const filtered = MOCK_DOCS.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.contract.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLCNTDOC0001P001"
  title="Contract Documents"
  subtitle="Document vault for lease contracts"

          screenType="contract_documents"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="grid gap-3">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e60000]/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#e60000]" />
                </div>
                <div>
                  <p className="font-medium text-sm">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.contract} · {doc.type} · {doc.size} · Uploaded {doc.uploaded}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{doc.status}</Badge>
                <Button size="sm" variant="ghost" onClick={() => toast.info("Preview coming soon")}><Eye className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => toast.info("Download coming soon")}><Download className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No documents found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
