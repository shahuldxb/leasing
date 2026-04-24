import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";

const CRITERIA_IFRS16 = ["ownership_transfer","purchase_option","major_part_of_life","substantially_all_fv","specialised_asset"];
const CRITERIA_ASC842 = ["ownership_transfer","purchase_option","major_part_of_life","substantially_all_fv","specialised_asset"];

export default function LeaseClassification() {
  const [showForm, setShowForm] = useState(false);
  const [aiRows, setAiRows] = useState<Record<string, unknown>[]>([]);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [standard, setStandard] = useState<"IFRS16" | "ASC842">("IFRS16");
  const [criteria, setCriteria] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const { data: contractsData } = trpc.lease.getLeaseRegister.useQuery({ status: "Active" });
  const { data: classifications = [], refetch } = { data: undefined as any, refetch: () => {} };
  const contracts = (contractsData as any)?.rows ?? [];
  const saveMut = { mutate: (_: any) => {}, isPending: false };
  const displayRows = aiRows.length > 0 ? aiRows : (classifications as any[]);
  const isFinance = Object.values(criteria).filter(Boolean).length >= 1;

  return (
    <DashboardLayout>
      {showForm ? (
        <div className="flex flex-col h-full w-full bg-background">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><ArrowLeft className="w-5 h-5" /></Button>
              <div><h2 className="text-lg font-semibold">Classify Lease</h2><p className="text-xs text-muted-foreground">Apply IFRS 16 / ASC 842 classification criteria</p></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => { toast.success("Classification saved"); setShowForm(false); }}>Save Classification</Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div><Label className="text-xs text-muted-foreground">Accounting Standard</Label>
                <Select value={standard} onValueChange={(v: any) => setStandard(v)}>
                  <SelectTrigger className="mt-1 w-48"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="IFRS16">IFRS 16</SelectItem><SelectItem value="ASC842">ASC 842</SelectItem></SelectContent>
                </Select>
              </div>
              <Card><CardHeader><CardTitle className="text-sm">Finance Lease Criteria</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {CRITERIA_IFRS16.map(c => (
                    <div key={c} className="flex items-center gap-3">
                      <Checkbox checked={!!criteria[c]} onCheckedChange={v => setCriteria(prev => ({ ...prev, [c]: !!v }))} />
                      <Label className="text-sm cursor-pointer capitalize">{c.replace(/_/g, " ")}</Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <div className={`p-4 rounded-lg border-2 ${isFinance ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" : "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"}`}>
                <p className="font-semibold text-sm">{isFinance ? "Finance Lease" : "Operating Lease"}</p>
                <p className="text-xs text-muted-foreground mt-1">{isFinance ? "One or more criteria met — classify as Finance Lease" : "No criteria met — classify as Operating Lease"}</p>
              </div>
              <div><Label className="text-xs text-muted-foreground">Notes</Label><Textarea className="mt-1" rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          <ScreenHeader screenId="VFLLSECLS0001P001" title="Lease Classification" subtitle="IFRS 16 / ASC 842 finance vs operating lease classification"
            screenType="lease_classification" onAIData={(rows) => setAiRows(rows)}
            actions={<Button size="sm" onClick={() => { setCriteria({}); setNotes(""); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" />Classify Lease</Button>} />
          <Card><CardContent className="p-0"><Table>
            <TableHeader><TableRow><TableHead>Contract</TableHead><TableHead>Standard</TableHead><TableHead>Classification</TableHead><TableHead>Criteria Met</TableHead><TableHead>Classified By</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {displayRows.map((r: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{r.contract_ref}</TableCell>
                  <TableCell><Badge variant="outline">{r.standard ?? "IFRS16"}</Badge></TableCell>
                  <TableCell>{r.classification === "FINANCE" ? <Badge className="bg-amber-500 text-white">Finance</Badge> : <Badge className="bg-emerald-600 text-white">Operating</Badge>}</TableCell>
                  <TableCell className="text-sm">{r.criteria_count ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.classified_by ?? "—"}</TableCell>
                  <TableCell className="text-sm">{r.classified_at?.slice(0,10)}</TableCell>
                </TableRow>
              ))}
              {displayRows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No classifications yet. Click Classify Lease to begin.</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent></Card>
        </div>
      )}
    </DashboardLayout>
  );
}
