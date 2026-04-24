import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ScreenHeader from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { GenAIFillButton } from "@/components/GenAIFillButton";

export default function LeaseDataQuality() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ ruleName: "", ruleType: "Completeness", severity: "Warning", description: "" });
  const [aiRows, setAiRows] = useState<any[]>([]);
  const utils = trpc.useUtils();
  const actionMut = trpc.system.notifyOwner.useMutation({ onSuccess: () => { setShowForm(false); toast.success("Quality rule submitted"); }, onError: (e: any) => toast.error(e.message) });

  const rules = [
    { id: 1, name: "Missing Commencement Date", type: "Completeness", severity: "Error", affected: 3, status: "Open" },
    { id: 2, name: "Duplicate Contract Reference", type: "Uniqueness", severity: "Warning", affected: 1, status: "Open" },
    { id: 3, name: "Negative Rent Amount", type: "Validity", severity: "Error", affected: 0, status: "Resolved" },
    { id: 4, name: "Missing Lessor Contact", type: "Completeness", severity: "Warning", affected: 7, status: "Open" },
  ];

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <div>
              <h2 className="font-semibold text-lg">Add Quality Rule</h2>
              <p className="text-sm text-muted-foreground">Define a new data quality validation rule</p>
            </div>
            <div className="ml-auto"><GenAIFillButton
              formType="new_lease"
              onFill={(data) => setForm((f: any) => ({
                          ...f,
                          notes: data.notes ?? f.notes,
                        }))}
            /></div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div><Label>Rule Name *</Label><Input className="mt-1" value={form.ruleName} onChange={e => setForm((f: any) => ({ ...f, ruleName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Rule Type</Label>
                  <Select value={form.ruleType} onValueChange={v => setForm((f: any) => ({ ...f, ruleType: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Completeness","Uniqueness","Validity","Consistency","Timeliness"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Severity</Label>
                  <Select value={form.severity} onValueChange={v => setForm((f: any) => ({ ...f, severity: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Error","Warning","Info"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Description</Label><Input className="mt-1" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" disabled={actionMut.isPending}
                  onClick={() => actionMut.mutate({ title: "New Quality Rule: " + form.ruleName, content: JSON.stringify(form) })}>
                  {actionMut.isPending ? "Saving..." : "Add Rule"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
          screenId="VFLLEADQ0001P001"
          title="Lease Data Quality"
          subtitle="Abstraction quality scoring and duplicate detection"
          screenType="lease_data_quality"
          onAIData={(rows) => setAiRows(rows)}
          actions={<Button onClick={() => setShowForm(true)} className="bg-[#e60000] hover:bg-[#cc0000] text-white gap-2 h-9 px-3 text-sm rounded-lg"><Plus className="w-4 h-4" />Add</Button>}
        />
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Rule Name</TableHead><TableHead>Type</TableHead><TableHead>Severity</TableHead><TableHead>Affected Records</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell><Badge className={r.severity === "Error" ? "bg-red-500/20 text-red-400" : r.severity === "Warning" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}>{r.severity}</Badge></TableCell>
                  <TableCell>{r.affected}</TableCell>
                  <TableCell><Badge className={r.status === "Open" ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"}>{r.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
